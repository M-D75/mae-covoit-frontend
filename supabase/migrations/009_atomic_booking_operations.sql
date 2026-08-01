-- Atomic booking primitives used exclusively by the trusted backend.
-- One booking row represents one reserved seat; reservation_request_id groups
-- all seats created by the same user action.
alter table public.booking
    add column if not exists reservation_request_id uuid,
    add column if not exists payment_preparing_at timestamptz,
    add column if not exists reserved_unit_price numeric;

alter table public.stripe_pending_capture
    add column if not exists reservation_request_id uuid;

alter table public.trip
    add column if not exists cancellation_pending_at timestamptz;

update public.strip_charge
set transfered = false
where transfered is null;

alter table public.strip_charge
    alter column transfered set default false,
    alter column transfered set not null;

create index if not exists booking_reservation_request_idx
    on public.booking (reservation_request_id);

create unique index if not exists stripe_pending_capture_reservation_request_uidx
    on public.stripe_pending_capture (reservation_request_id)
    where reservation_request_id is not null;

create index if not exists booking_active_trip_idx
    on public.booking (trip_id)
    where coalesce(is_refused, false) = false
      and coalesce(passenger_no_show, false) = false;

do $$
begin
    if not exists (
        select 1 from pg_constraint
        where conname = 'booking_accept_refuse_exclusive'
          and conrelid = 'public.booking'::regclass
    ) then
        alter table public.booking
            add constraint booking_accept_refuse_exclusive
            check (not (coalesce(is_accepted, false) and coalesce(is_refused, false)))
            not valid;
    end if;
end
$$;

/**
 * Reserve one or more seats in a single database transaction.
 *
 * Scenario: two passengers request the last seat simultaneously. The trip row
 * lock serializes both calls, so only the first reservation can succeed.
 * Replaying the same request UUID returns the original reservation and never
 * debits the wallet twice.
 */
create or replace function public.create_booking_reservation(
    target_user_id uuid,
    target_trip_id bigint,
    target_seats integer,
    target_request_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    passenger public.account%rowtype;
    selected_trip public.trip%rowtype;
    booking_ids bigint[];
    existing_status text;
    existing_payment_intent text;
    active_seats integer;
    auto_accepted boolean := false;
    driver_account_id bigint;
    total_amount numeric;
    payment_mode text;
begin
    if target_request_id is null then
        raise exception using errcode = '22023', message = 'REQUEST_ID_REQUIRED';
    end if;
    if target_seats < 1 or target_seats > 8 then
        raise exception using errcode = '22023', message = 'INVALID_SEAT_COUNT';
    end if;

    -- Serializes retries carrying the same idempotency key.
    perform pg_advisory_xact_lock(hashtextextended(target_request_id::text, 0));

    select
        array_agg(booking.id order by booking.id),
        min(booking.payment_status),
        min(booking.payment_intent_id)
    into booking_ids, existing_status, existing_payment_intent
    from public.booking
    join public.account on account.id = booking.passenger_account_id
    where booking.reservation_request_id = target_request_id
      and account.user_id = target_user_id
      and booking.trip_id = target_trip_id;

    if booking_ids is not null then
        select * into selected_trip
        from public.trip
        where id = target_trip_id;

        select * into passenger
        from public.account
        where user_id = target_user_id;

        select id into driver_account_id
        from public.account
        where user_id = selected_trip.driver_id;
        if not found then
            raise exception using errcode = 'P0002', message = 'DRIVER_ACCOUNT_NOT_FOUND';
        end if;

        select sum(coalesce(reserved_unit_price, selected_trip.price))
        into total_amount
        from public.booking
        where id = any(booking_ids);

        return jsonb_build_object(
            'requestId', target_request_id,
            'tripId', target_trip_id,
            'bookingIds', to_jsonb(booking_ids),
            'passengerAccountId', passenger.id,
            'driverUserId', selected_trip.driver_id,
            'driverAccountId', driver_account_id,
            'accepted', coalesce((
                select bool_and(coalesce(is_accepted, false))
                from public.booking
                where id = any(booking_ids)
            ), false),
            'paymentMode', case when existing_status like 'wallet_%' then 'wallet' else 'card_deferred' end,
            'paymentStatus', existing_status,
            'paymentIntentId', existing_payment_intent,
            'amount', total_amount,
            'amountCents', round(total_amount * 100)::integer,
            'credit', passenger.credit,
            'replayed', true
        );
    end if;

    -- Lock the trip before counting seats to prevent overbooking races.
    select * into selected_trip
    from public.trip
    where id = target_trip_id
    for update;

    if not found then
        raise exception using errcode = 'P0002', message = 'TRIP_NOT_FOUND';
    end if;
    if selected_trip.driver_id = target_user_id then
        raise exception using errcode = '22023', message = 'DRIVER_CANNOT_BOOK_OWN_TRIP';
    end if;
    if selected_trip.departure_time <= now() then
        raise exception using errcode = '22023', message = 'TRIP_ALREADY_STARTED';
    end if;
    if selected_trip.cancellation_pending_at is not null then
        raise exception using errcode = '55000', message = 'TRIP_CANCELLATION_PENDING';
    end if;
    if selected_trip.price is null or selected_trip.price <= 0 then
        raise exception using errcode = '22023', message = 'INVALID_TRIP_PRICE';
    end if;
    if selected_trip.max_seats is null or selected_trip.max_seats <= 0 then
        raise exception using errcode = '22023', message = 'INVALID_TRIP_CAPACITY';
    end if;

    select * into passenger
    from public.account
    where user_id = target_user_id
    for update;

    if not found then
        raise exception using errcode = 'P0002', message = 'PASSENGER_ACCOUNT_NOT_FOUND';
    end if;

    if exists (
        select 1
        from public.booking
        where trip_id = target_trip_id
          and passenger_account_id = passenger.id
          and coalesce(is_refused, false) = false
          and coalesce(passenger_no_show, false) = false
    ) then
        raise exception using errcode = '23505', message = 'ACTIVE_BOOKING_ALREADY_EXISTS';
    end if;

    select count(*)::integer into active_seats
    from public.booking
    where trip_id = target_trip_id
      and coalesce(is_refused, false) = false
      and coalesce(passenger_no_show, false) = false;

    if active_seats + target_seats > selected_trip.max_seats then
        raise exception using errcode = '23514', message = 'NOT_ENOUGH_SEATS';
    end if;

    select driver.id, coalesce(settings.auto_accept_trip, false)
    into driver_account_id, auto_accepted
    from public.account driver
    left join public.settings on settings.account_id = driver.id
    where driver.user_id = selected_trip.driver_id
    limit 1;

    if not found then
        raise exception using errcode = 'P0002', message = 'DRIVER_ACCOUNT_NOT_FOUND';
    end if;

    auto_accepted := coalesce(auto_accepted, false);
    total_amount := selected_trip.price * target_seats;
    payment_mode := case
        when coalesce(passenger.credit, 0) >= total_amount then 'wallet'
        else 'card_deferred'
    end;

    if payment_mode = 'wallet' then
        update public.account
        set credit = coalesce(credit, 0) - total_amount
        where id = passenger.id;
        passenger.credit := coalesce(passenger.credit, 0) - total_amount;
    end if;

    with inserted as (
        insert into public.booking (
            trip_id,
            passenger_account_id,
            is_accepted,
            is_refused,
            payment_status,
            reservation_request_id,
            payment_preparing_at,
            reserved_unit_price
        )
        select
            target_trip_id,
            passenger.id,
            auto_accepted,
            false,
            case when payment_mode = 'wallet' then 'wallet_reserved' else 'payment_preparing' end,
            target_request_id,
            case when payment_mode = 'card_deferred' then timezone('utc', now()) else null end,
            selected_trip.price
        from generate_series(1, target_seats)
        returning id
    )
    select array_agg(id order by id) into booking_ids from inserted;

    return jsonb_build_object(
        'requestId', target_request_id,
        'tripId', target_trip_id,
        'bookingIds', to_jsonb(booking_ids),
        'passengerAccountId', passenger.id,
        'driverUserId', selected_trip.driver_id,
        'driverAccountId', driver_account_id,
        'accepted', auto_accepted,
        'paymentMode', payment_mode,
        'paymentStatus', case when payment_mode = 'wallet' then 'wallet_reserved' else 'payment_preparing' end,
        'paymentIntentId', null,
        'amount', total_amount,
        'amountCents', round(total_amount * 100)::integer,
        'credit', passenger.credit,
        'replayed', false
    );
end;
$$;

/**
 * Persist a Stripe authorization and all related booking states atomically.
 * Stripe itself is external, but Supabase never sees a half-written local
 * payment record.
 */
create or replace function public.finalize_card_booking_authorization(
    target_user_id uuid,
    target_request_id uuid,
    target_payment_intent_id text,
    target_driver_account_id text,
    target_trip_id bigint,
    target_booking_ids bigint[],
    target_amount integer,
    target_capture_after timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    passenger_id bigint;
    pending public.stripe_pending_capture%rowtype;
    matching_count integer;
begin
    if target_payment_intent_id is null or target_payment_intent_id = '' then
        raise exception using errcode = '22023', message = 'PAYMENT_INTENT_REQUIRED';
    end if;

    perform 1
    from public.booking
    where id = any(target_booking_ids)
    order by id
    for update;

    select id into passenger_id
    from public.account
    where user_id = target_user_id;
    if not found then
        raise exception using errcode = 'P0002', message = 'PASSENGER_ACCOUNT_NOT_FOUND';
    end if;

    select count(*)::integer into matching_count
    from public.booking
    where id = any(target_booking_ids)
      and passenger_account_id = passenger_id
      and trip_id = target_trip_id
      and reservation_request_id = target_request_id
      and payment_status in ('payment_preparing', 'requires_capture')
      and coalesce(is_refused, false) = false
      and coalesce(passenger_no_show, false) = false;

    if matching_count <> cardinality(target_booking_ids) then
        raise exception using errcode = '22023', message = 'INVALID_BOOKING_GROUP';
    end if;
    if target_amount <> (
        select round(sum(reserved_unit_price) * 100)::integer
        from public.booking
        where id = any(target_booking_ids)
    ) then
        raise exception using errcode = '22023', message = 'INVALID_BOOKING_AMOUNT';
    end if;

    insert into public.stripe_pending_capture (
        payment_intent_id,
        passenger_account_id,
        driver_account_id,
        trip_id,
        booking_ids,
        reservation_request_id,
        amount,
        capture_after,
        status
    ) values (
        target_payment_intent_id,
        passenger_id,
        target_driver_account_id,
        target_trip_id,
        to_jsonb(target_booking_ids),
        target_request_id,
        target_amount,
        target_capture_after,
        'requires_capture'
    )
    on conflict (payment_intent_id) do update
    set booking_ids = excluded.booking_ids,
        reservation_request_id = excluded.reservation_request_id,
        capture_after = excluded.capture_after
    where stripe_pending_capture.passenger_account_id = excluded.passenger_account_id
      and stripe_pending_capture.driver_account_id = excluded.driver_account_id
      and stripe_pending_capture.trip_id = excluded.trip_id
      and stripe_pending_capture.amount = excluded.amount
      and stripe_pending_capture.status = 'requires_capture'
    returning * into pending;

    if not found then
        raise exception using errcode = '55000', message = 'AUTHORIZATION_CONFLICT';
    end if;

    update public.booking
    set payment_intent_id = target_payment_intent_id,
        payment_status = 'requires_capture',
        payment_capture_after = target_capture_after,
        payment_preparing_at = null
    where id = any(target_booking_ids);

    return to_jsonb(pending);
end;
$$;

/** Mark wallet funds as consumed after passenger presence is confirmed. */
create or replace function public.capture_wallet_bookings(target_booking_ids bigint[])
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
    matching_count integer;
    captured_count integer;
    updated_count integer;
begin
    if target_booking_ids is null or cardinality(target_booking_ids) = 0 then
        return 0;
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
        return captured_count;
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

    update public.booking
    set payment_status = 'wallet_captured',
        in_car = true
    where id = any(target_booking_ids)
      and payment_status = 'wallet_reserved'
      and coalesce(is_accepted, false) = true
      and coalesce(is_refused, false) = false
      and coalesce(passenger_no_show, false) = false;

    get diagnostics updated_count = row_count;
    return updated_count;
end;
$$;

/** Delete abandoned pre-authorizations; no wallet was debited for these rows. */
create or replace function public.expire_stale_booking_preparations()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
    deleted_count integer;
begin
    delete from public.booking
    where payment_status = 'payment_preparing'
      and payment_preparing_at < timezone('utc', now()) - interval '20 minutes';
    get diagnostics deleted_count = row_count;
    return deleted_count;
end;
$$;

/** Remove an unfinished card reservation after Stripe authorization failed. */
create or replace function public.rollback_booking_reservation(
    target_user_id uuid,
    target_request_id uuid
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
    deleted_count integer;
begin
    delete from public.booking
    using public.account
    where booking.passenger_account_id = account.id
      and account.user_id = target_user_id
      and booking.reservation_request_id = target_request_id
      and booking.payment_status = 'payment_preparing';

    get diagnostics deleted_count = row_count;
    return deleted_count;
end;
$$;

/**
 * Release wallet reservations exactly once and compute refunds from trip.price.
 * The caller never supplies a monetary amount.
 */
create or replace function public.release_wallet_bookings(target_booking_ids bigint[])
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    released_count integer := 0;
    released_amount numeric := 0;
begin
    if target_booking_ids is null or cardinality(target_booking_ids) = 0 then
        return jsonb_build_object('releasedCount', 0, 'releasedAmount', 0);
    end if;

    with released as (
        update public.booking
        set payment_status = 'wallet_released',
            is_accepted = false,
            is_refused = true
        from public.trip
        where booking.id = any(target_booking_ids)
          and trip.id = booking.trip_id
          and booking.payment_status = 'wallet_reserved'
        returning booking.passenger_account_id, coalesce(booking.reserved_unit_price, trip.price) as price
    ), refunds as (
        select passenger_account_id, sum(coalesce(price, 0)) as amount
        from released
        group by passenger_account_id
    ), credited as (
        update public.account
        set credit = coalesce(account.credit, 0) + refunds.amount
        from refunds
        where account.id = refunds.passenger_account_id
        returning refunds.amount
    )
    select
        coalesce((select count(*) from released), 0)::integer,
        coalesce((select sum(amount) from credited), 0)
    into released_count, released_amount;

    return jsonb_build_object(
        'releasedCount', released_count,
        'releasedAmount', released_amount
    );
end;
$$;

/**
 * Apply one booking-group state transition while holding row locks.
 * External Stripe work happens afterwards; a failed request can safely retry
 * from the durable state without allowing a conflicting presence/no-show.
 */
create or replace function public.transition_booking_group(
    target_booking_ids bigint[],
    target_action text
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
    matched_count integer;
    updated_count integer;
begin
    if target_booking_ids is null or cardinality(target_booking_ids) = 0 then
        raise exception using errcode = '22023', message = 'BOOKINGS_REQUIRED';
    end if;
    if target_action is null or target_action not in ('accept', 'refuse', 'no_show', 'cancel', 'presence') then
        raise exception using errcode = '22023', message = 'INVALID_BOOKING_ACTION';
    end if;

    -- Lock in a stable order to prevent concurrent actions from interleaving.
    perform 1
    from public.booking
    where id = any(target_booking_ids)
    order by id
    for update;

    select count(*)::integer into matched_count
    from public.booking
    where id = any(target_booking_ids);
    if matched_count <> cardinality(target_booking_ids) then
        raise exception using errcode = 'P0002', message = 'BOOKING_NOT_FOUND';
    end if;

    if target_action = 'accept' then
        if exists (
            select 1 from public.booking
            where id = any(target_booking_ids)
              and (
                  coalesce(is_refused, false)
                  or coalesce(passenger_no_show, false)
                  or coalesce(in_car, false)
                  or payment_status in ('canceled', 'captured', 'wallet_released', 'wallet_captured')
              )
        ) then
            raise exception using errcode = '55000', message = 'BOOKING_TRANSITION_CONFLICT';
        end if;

        update public.booking
        set is_accepted = true,
            is_refused = false
        where id = any(target_booking_ids);
    elsif target_action = 'presence' then
        if exists (
            select 1 from public.booking
            where id = any(target_booking_ids)
              and (
                  not coalesce(is_accepted, false)
                  or coalesce(is_refused, false)
                  or coalesce(passenger_no_show, false)
                  or payment_status = 'payment_preparing'
                  or payment_status in ('canceled', 'wallet_released')
              )
        ) then
            raise exception using errcode = '55000', message = 'BOOKING_TRANSITION_CONFLICT';
        end if;

        update public.booking
        set in_car = true
        where id = any(target_booking_ids);
    else
        -- A captured/present passenger needs a dedicated refund workflow; a
        -- normal cancel/refuse must never erase that accounting trail.
        if exists (
            select 1 from public.booking
            where id = any(target_booking_ids)
              and (
                  coalesce(in_car, false)
                  or payment_status in ('captured', 'wallet_captured')
              )
        ) then
            raise exception using errcode = '55000', message = 'CAPTURED_BOOKING_REQUIRES_REFUND';
        end if;

        update public.booking
        set is_accepted = false,
            is_refused = true,
            passenger_no_show = case when target_action = 'no_show' then true else passenger_no_show end,
            passenger_no_show_at = case
                when target_action = 'no_show' then coalesce(passenger_no_show_at, timezone('utc', now()))
                else passenger_no_show_at
            end
        where id = any(target_booking_ids);
    end if;

    get diagnostics updated_count = row_count;
    return updated_count;
end;
$$;

/** Persist capture, charge ledger and booking states in one transaction. */
create or replace function public.finalize_captured_booking_payment(
    target_payment_intent_id text,
    target_balance_transaction_id text,
    target_stripe_charge_id text,
    target_captured_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    pending public.stripe_pending_capture%rowtype;
    updated_count integer;
begin
    if target_balance_transaction_id is null or target_stripe_charge_id is null then
        raise exception using errcode = '22023', message = 'STRIPE_CHARGE_REQUIRED';
    end if;

    select * into pending
    from public.stripe_pending_capture
    where payment_intent_id = target_payment_intent_id
    for update;
    if not found then
        raise exception using errcode = 'P0002', message = 'PAYMENT_RECORD_MISSING';
    end if;
    if pending.status = 'canceled' then
        raise exception using errcode = '55000', message = 'PAYMENT_CANCELED';
    end if;

    insert into public.strip_charge (
        charge_id,
        balance_transaction_id,
        stripe_charge_id,
        payment_intent_id,
        account_id
    ) values (
        target_balance_transaction_id,
        target_balance_transaction_id,
        target_stripe_charge_id,
        target_payment_intent_id,
        pending.passenger_account_id
    )
    on conflict (payment_intent_id) do update
    set charge_id = excluded.charge_id,
        balance_transaction_id = excluded.balance_transaction_id,
        stripe_charge_id = excluded.stripe_charge_id
    where strip_charge.account_id = excluded.account_id;
    if not found then
        raise exception using errcode = '55000', message = 'CAPTURE_LEDGER_CONFLICT';
    end if;

    update public.booking
    set payment_status = 'captured'
    where id in (
        select value::bigint
        from jsonb_array_elements_text(pending.booking_ids) as ids(value)
    );
    get diagnostics updated_count = row_count;
    if updated_count <> jsonb_array_length(pending.booking_ids) then
        raise exception using errcode = '55000', message = 'CAPTURE_FINALIZATION_CONFLICT';
    end if;

    update public.stripe_pending_capture
    set status = 'captured',
        captured_at = coalesce(captured_at, target_captured_at, timezone('utc', now())),
        charge_id = target_balance_transaction_id
    where id = pending.id
    returning * into pending;

    return to_jsonb(pending);
end;
$$;

revoke all on function public.create_booking_reservation(uuid, bigint, integer, uuid)
    from public, anon, authenticated;
grant execute on function public.create_booking_reservation(uuid, bigint, integer, uuid)
    to service_role;

revoke all on function public.rollback_booking_reservation(uuid, uuid)
    from public, anon, authenticated;
grant execute on function public.rollback_booking_reservation(uuid, uuid)
    to service_role;

revoke all on function public.release_wallet_bookings(bigint[])
    from public, anon, authenticated;
grant execute on function public.release_wallet_bookings(bigint[])
    to service_role;

revoke all on function public.finalize_card_booking_authorization(
    uuid, uuid, text, text, bigint, bigint[], integer, timestamptz
) from public, anon, authenticated;
grant execute on function public.finalize_card_booking_authorization(
    uuid, uuid, text, text, bigint, bigint[], integer, timestamptz
) to service_role;

revoke all on function public.capture_wallet_bookings(bigint[])
    from public, anon, authenticated;
grant execute on function public.capture_wallet_bookings(bigint[])
    to service_role;

revoke all on function public.expire_stale_booking_preparations()
    from public, anon, authenticated;
grant execute on function public.expire_stale_booking_preparations()
    to service_role;

revoke all on function public.transition_booking_group(bigint[], text)
    from public, anon, authenticated;
grant execute on function public.transition_booking_group(bigint[], text)
    to service_role;

revoke all on function public.finalize_captured_booking_payment(text, text, text, timestamptz)
    from public, anon, authenticated;
grant execute on function public.finalize_captured_booking_payment(text, text, text, timestamptz)
    to service_role;
