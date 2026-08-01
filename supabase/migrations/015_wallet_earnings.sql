-- Wallet bookings represent real value because credits can be bought through
-- Stripe. Capture therefore creates an immutable driver earning exactly once.
alter table public.account
    add column if not exists gain numeric not null default 0;
update public.account set gain = 0 where gain is null;
alter table public.account
    alter column gain set default 0,
    alter column gain set not null;

create table if not exists public.wallet_earning (
    id bigint generated always as identity primary key,
    group_key text not null unique,
    reservation_request_id uuid,
    trip_id bigint not null references public.trip(id) on delete restrict,
    passenger_account_id bigint not null references public.account(id) on delete restrict,
    driver_account_id bigint not null references public.account(id) on delete restrict,
    gross_amount numeric not null check (gross_amount >= 0),
    payout_amount numeric not null check (payout_amount >= 0),
    created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.wallet_earning_conversion (
    id bigint generated always as identity primary key,
    request_id uuid not null unique,
    account_id bigint not null references public.account(id) on delete restrict,
    amount numeric not null check (amount > 0),
    created_at timestamptz not null default timezone('utc', now())
);

alter table public.wallet_earning enable row level security;
alter table public.wallet_earning_conversion enable row level security;
revoke all on public.wallet_earning, public.wallet_earning_conversion from anon, authenticated;
grant all on public.wallet_earning, public.wallet_earning_conversion to service_role;

-- Remove the pre-ledger overload from migration 009. Keeping it callable
-- would let an older server consume credits without recording driver income.
drop function if exists public.capture_wallet_bookings(bigint[]);

-- Historical wallet captures predate the configurable payout setting and used
-- the legacy 59% rule. Backfill only missing groups, so replaying the migration
-- never credits a driver twice.
with earning_groups as (
    select
        coalesce(
            'request:' || booking.trip_id::text || ':' || booking.passenger_account_id::text || ':' || booking.reservation_request_id::text,
            'legacy:' || booking.trip_id::text || ':' || booking.passenger_account_id::text
        ) as group_key,
        (array_agg(booking.reservation_request_id))[1] as reservation_request_id,
        booking.trip_id,
        booking.passenger_account_id,
        driver.id as driver_account_id,
        sum(coalesce(booking.reserved_unit_price, trip.price)) as gross_amount
    from public.booking
    join public.trip on trip.id = booking.trip_id
    join public.account driver on driver.user_id = trip.driver_id
    where booking.payment_status = 'wallet_captured'
    group by
        coalesce(
            'request:' || booking.trip_id::text || ':' || booking.passenger_account_id::text || ':' || booking.reservation_request_id::text,
            'legacy:' || booking.trip_id::text || ':' || booking.passenger_account_id::text
        ),
        booking.trip_id,
        booking.passenger_account_id,
        driver.id
), inserted as (
    insert into public.wallet_earning (
        group_key,
        reservation_request_id,
        trip_id,
        passenger_account_id,
        driver_account_id,
        gross_amount,
        payout_amount
    )
    select
        group_key,
        reservation_request_id,
        trip_id,
        passenger_account_id,
        driver_account_id,
        gross_amount,
        round(gross_amount * 0.59, 2)
    from earning_groups
    on conflict (group_key) do nothing
    returning driver_account_id, payout_amount
), totals as (
    select driver_account_id, sum(payout_amount) as amount
    from inserted
    group by driver_account_id
)
update public.account
set gain = coalesce(account.gain, 0) + totals.amount
from totals
where account.id = totals.driver_account_id;

/**
 * Finalize wallet seats and credit the driver ledger in one transaction.
 * Replaying an already captured group returns without crediting it twice.
 */
create or replace function public.capture_wallet_bookings(
    target_booking_ids bigint[],
    target_payout_rate numeric
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    matching_count integer;
    captured_count integer;
    updated_count integer;
    expected_groups integer;
    inserted_groups integer;
    earning_amount numeric;
begin
    if target_booking_ids is null or cardinality(target_booking_ids) = 0 then
        return jsonb_build_object('capturedCount', 0, 'earningAmount', 0, 'replayed', false);
    end if;
    if target_payout_rate <= 0 or target_payout_rate > 1 then
        raise exception using errcode = '22023', message = 'INVALID_PAYOUT_RATE';
    end if;

    perform 1
    from public.booking
    where id = any(target_booking_ids)
    order by id
    for update;

    select count(*)::integer into captured_count
    from public.booking
    where id = any(target_booking_ids)
      and payment_status = 'wallet_captured'
      and coalesce(in_car, false) = true;
    if captured_count = cardinality(target_booking_ids) then
        return jsonb_build_object(
            'capturedCount', captured_count,
            'earningAmount', 0,
            'replayed', true
        );
    end if;
    if captured_count > 0 then
        raise exception using errcode = '55000', message = 'WALLET_CAPTURE_CONFLICT';
    end if;

    select count(*)::integer into matching_count
    from public.booking
    where id = any(target_booking_ids)
      and payment_status = 'wallet_reserved'
      and coalesce(is_accepted, false) = true
      and coalesce(is_refused, false) = false
      and coalesce(passenger_no_show, false) = false;
    if matching_count <> cardinality(target_booking_ids) then
        raise exception using errcode = '55000', message = 'WALLET_CAPTURE_CONFLICT';
    end if;

    select count(distinct coalesce(
        'request:' || trip_id::text || ':' || passenger_account_id::text || ':' || reservation_request_id::text,
        'legacy:' || trip_id::text || ':' || passenger_account_id::text
    ))::integer
    into expected_groups
    from public.booking
    where id = any(target_booking_ids);

    with earning_groups as (
        select
            coalesce(
                'request:' || booking.trip_id::text || ':' || booking.passenger_account_id::text || ':' || booking.reservation_request_id::text,
                'legacy:' || booking.trip_id::text || ':' || booking.passenger_account_id::text
            ) as group_key,
            (array_agg(booking.reservation_request_id))[1] as reservation_request_id,
            booking.trip_id,
            booking.passenger_account_id,
            driver.id as driver_account_id,
            sum(coalesce(booking.reserved_unit_price, trip.price)) as gross_amount
        from public.booking
        join public.trip on trip.id = booking.trip_id
        join public.account driver on driver.user_id = trip.driver_id
        where booking.id = any(target_booking_ids)
        group by
            coalesce(
                'request:' || booking.trip_id::text || ':' || booking.passenger_account_id::text || ':' || booking.reservation_request_id::text,
                'legacy:' || booking.trip_id::text || ':' || booking.passenger_account_id::text
            ),
            booking.trip_id,
            booking.passenger_account_id,
            driver.id
    ), inserted as (
        insert into public.wallet_earning (
            group_key,
            reservation_request_id,
            trip_id,
            passenger_account_id,
            driver_account_id,
            gross_amount,
            payout_amount
        )
        select
            group_key,
            reservation_request_id,
            trip_id,
            passenger_account_id,
            driver_account_id,
            gross_amount,
            round(gross_amount * target_payout_rate, 2)
        from earning_groups
        on conflict (group_key) do nothing
        returning driver_account_id, payout_amount
    ), totals as (
        select driver_account_id, sum(payout_amount) as amount
        from inserted
        group by driver_account_id
    ), credited as (
        update public.account
        set gain = coalesce(account.gain, 0) + totals.amount
        from totals
        where account.id = totals.driver_account_id
        returning totals.amount
    )
    select
        coalesce((select count(*) from inserted), 0)::integer,
        coalesce((select sum(amount) from credited), 0)
    into inserted_groups, earning_amount;

    if inserted_groups <> expected_groups then
        raise exception using errcode = '55000', message = 'WALLET_EARNING_CONFLICT';
    end if;

    update public.booking
    set payment_status = 'wallet_captured',
        in_car = true
    where id = any(target_booking_ids)
      and payment_status = 'wallet_reserved';
    get diagnostics updated_count = row_count;
    if updated_count <> cardinality(target_booking_ids) then
        raise exception using errcode = '55000', message = 'WALLET_CAPTURE_CONFLICT';
    end if;

    return jsonb_build_object(
        'capturedCount', updated_count,
        'earningAmount', earning_amount,
        'replayed', false
    );
end;
$$;

/** Move available driver wallet earnings to passenger credits idempotently. */
create or replace function public.convert_wallet_earnings_to_credit(
    target_user_id uuid,
    target_amount numeric,
    target_request_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    selected_account public.account%rowtype;
    existing public.wallet_earning_conversion%rowtype;
begin
    if target_request_id is null or target_amount is null or target_amount <= 0 then
        raise exception using errcode = '22023', message = 'INVALID_WALLET_CONVERSION';
    end if;
    target_amount := round(target_amount, 2);
    perform pg_advisory_xact_lock(hashtextextended(target_request_id::text, 0));

    select * into existing
    from public.wallet_earning_conversion
    where request_id = target_request_id;
    if found then
        if existing.amount <> target_amount then
            raise exception using errcode = '55000', message = 'WALLET_CONVERSION_CONFLICT';
        end if;
        select * into selected_account from public.account where id = existing.account_id;
        if not found or selected_account.user_id <> target_user_id then
            raise exception using errcode = '42501', message = 'WALLET_CONVERSION_FORBIDDEN';
        end if;
        return jsonb_build_object(
            'credit', selected_account.credit,
            'gain', selected_account.gain,
            'amount', existing.amount,
            'replayed', true
        );
    end if;

    select * into selected_account
    from public.account
    where user_id = target_user_id
    for update;
    if not found then
        raise exception using errcode = 'P0002', message = 'ACCOUNT_NOT_FOUND';
    end if;
    if coalesce(selected_account.gain, 0) < target_amount then
        raise exception using errcode = '23514', message = 'INSUFFICIENT_WALLET_EARNINGS';
    end if;

    insert into public.wallet_earning_conversion (request_id, account_id, amount)
    values (target_request_id, selected_account.id, target_amount);

    update public.account
    set gain = coalesce(gain, 0) - target_amount,
        credit = coalesce(credit, 0) + target_amount
    where id = selected_account.id
    returning * into selected_account;

    return jsonb_build_object(
        'credit', selected_account.credit,
        'gain', selected_account.gain,
        'amount', target_amount,
        'replayed', false
    );
end;
$$;

revoke all on function public.capture_wallet_bookings(bigint[], numeric)
    from public, anon, authenticated;
grant execute on function public.capture_wallet_bookings(bigint[], numeric)
    to service_role;

revoke all on function public.convert_wallet_earnings_to_credit(uuid, numeric, uuid)
    from public, anon, authenticated;
grant execute on function public.convert_wallet_earnings_to_credit(uuid, numeric, uuid)
    to service_role;
