-- First production barrier for tables still queried directly by the app.
-- Reads stay compatible with the current frontend; critical writes are either
-- owner-scoped or reserved to the service-role backend.

-- These one-to-one relations are assumed throughout server.js (`maybeSingle`).
-- If this migration reports duplicates, resolve them before enabling payment.
create unique index if not exists account_user_id_uidx
    on public.account (user_id)
    where user_id is not null;

create unique index if not exists settings_account_id_uidx
    on public.settings (account_id)
    where account_id is not null;

create unique index if not exists strip_transfer_transfer_id_uidx
    on public.strip_transfer (transfer_id)
    where transfer_id is not null;

-- Booking lifecycle and payment state must only go through server.js/RPCs.
alter table public.booking enable row level security;
revoke insert, update, delete on public.booking from anon, authenticated;
grant select on public.booking to authenticated;

drop policy if exists "Authenticated users can read bookings" on public.booking;
create policy "Authenticated users can read bookings"
    on public.booking
    for select
    to authenticated
    using (true);

-- A user may keep editing their non-financial account fields (for example the
-- avatar), but cannot delete an account through the Data API.
alter table public.account enable row level security;
revoke insert, delete on public.account from anon, authenticated;
grant select, update on public.account to authenticated;

drop policy if exists "Authenticated users can read accounts" on public.account;
create policy "Authenticated users can read accounts"
    on public.account
    for select
    to authenticated
    using (true);

drop policy if exists "Users can update their own account" on public.account;
create policy "Users can update their own account"
    on public.account
    for update
    to authenticated
    using (user_id = (select auth.uid()))
    with check (user_id = (select auth.uid()));

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
        'identity'
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

drop trigger if exists guard_account_financial_fields_trigger on public.account;
create trigger guard_account_financial_fields_trigger
before update on public.account
for each row execute function public.guard_account_financial_fields();

-- Trip publication remains client-side for now, but only the authenticated
-- driver can create or mutate their own rows.
alter table public.trip enable row level security;
revoke update, delete on public.trip from anon, authenticated;
grant select, insert on public.trip to authenticated;

drop policy if exists "Authenticated users can read trips" on public.trip;
create policy "Authenticated users can read trips"
    on public.trip
    for select
    to authenticated
    using (true);

drop policy if exists "Drivers can insert their own trips" on public.trip;
create policy "Drivers can insert their own trips"
    on public.trip
    for insert
    to authenticated
    with check (driver_id = (select auth.uid()));

-- Cars use auth.users UUIDs as driver_id and can be owner-scoped directly.
alter table public.car enable row level security;
grant select, insert, update, delete on public.car to authenticated;

drop policy if exists "Authenticated users can read cars" on public.car;
create policy "Authenticated users can read cars"
    on public.car
    for select
    to authenticated
    using (true);

drop policy if exists "Drivers can insert their own cars" on public.car;
create policy "Drivers can insert their own cars"
    on public.car
    for insert
    to authenticated
    with check (driver_id = (select auth.uid()));

drop policy if exists "Drivers can update their own cars" on public.car;
create policy "Drivers can update their own cars"
    on public.car
    for update
    to authenticated
    using (driver_id = (select auth.uid()))
    with check (driver_id = (select auth.uid()));

drop policy if exists "Drivers can delete their own cars" on public.car;
create policy "Drivers can delete their own cars"
    on public.car
    for delete
    to authenticated
    using (driver_id = (select auth.uid()));

revoke all on function public.guard_account_financial_fields() from public;
grant execute on function public.guard_account_financial_fields() to service_role;
