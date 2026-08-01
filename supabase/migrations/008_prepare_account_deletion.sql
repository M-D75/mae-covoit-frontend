-- Keep this migration valid on both the legacy schema and a fresh install.
-- Migration 009 also declares the column because every migration must remain
-- safe to replay independently.
alter table public.booking
    add column if not exists reserved_unit_price numeric;

create or replace function public.prepare_account_deletion(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    -- Refund wallet reservations made by passengers on trips published by the
    -- account being deleted. Bookings are marked first so retries are safe.
    with released as (
        update public.booking
        set payment_status = 'wallet_released'
        from public.trip
        where trip.id = booking.trip_id
          and trip.driver_id = target_user_id
          and booking.payment_status = 'wallet_reserved'
        returning
            booking.passenger_account_id,
            coalesce(booking.reserved_unit_price, trip.price) as price
    ),
    refunds as (
        select
            released.passenger_account_id,
            sum(coalesce(released.price, 0)) as amount
        from released
        group by released.passenger_account_id
    )
    update public.account
    set credit = coalesce(account.credit, 0) + refunds.amount
    from refunds
    where account.id = refunds.passenger_account_id;
end;
$$;

revoke all on function public.prepare_account_deletion(uuid) from public, anon, authenticated;
grant execute on function public.prepare_account_deletion(uuid) to service_role;
