-- Prevent a booking from racing with account deletion.
alter table public.account
    add column if not exists deletion_pending_at timestamptz;

-- The frontend may update ordinary profile fields directly, but it must not
-- clear the deletion barrier while the backend is canceling reservations.
create or replace function public.guard_account_financial_fields()
returns trigger
language plpgsql
set search_path = public
as $$
declare
    field_name text;
begin
    if current_user not in ('anon', 'authenticated') then
        return new;
    end if;

    foreach field_name in array array[
        'credit',
        'gain',
        'customer_id',
        'provider_id',
        'identity',
        'deletion_pending_at'
    ] loop
        if (to_jsonb(new) -> field_name) is distinct from (to_jsonb(old) -> field_name) then
            raise exception using
                errcode = '42501',
                message = 'ACCOUNT_FINANCIAL_FIELDS_SERVER_ONLY';
        end if;
    end loop;
    return new;
end;
$$;

create or replace function public.guard_booking_account_deletion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    if exists (
        select 1
        from public.trip
        join public.account driver on driver.user_id = trip.driver_id
        join public.account passenger on passenger.id = new.passenger_account_id
        where trip.id = new.trip_id
          and (
              trip.cancellation_pending_at is not null
              or driver.deletion_pending_at is not null
              or passenger.deletion_pending_at is not null
          )
    ) then
        raise exception using errcode = '55000', message = 'ACCOUNT_DELETION_PENDING';
    end if;
    return new;
end;
$$;

drop trigger if exists guard_booking_account_deletion_trigger on public.booking;
create trigger guard_booking_account_deletion_trigger
before insert or update of trip_id, passenger_account_id on public.booking
for each row execute function public.guard_booking_account_deletion();

revoke all on function public.guard_booking_account_deletion() from public, anon, authenticated;
grant execute on function public.guard_booking_account_deletion() to service_role;
