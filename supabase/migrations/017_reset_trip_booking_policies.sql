-- Remove legacy RLS policies left on `trip` and `booking`.
--
-- PostgreSQL combines permissive policies. A legacy trip policy querying
-- booking, together with a booking policy querying trip, causes error 42P17:
-- "infinite recursion detected in policy for relation booking".
-- Rebuilding the complete policy set is safer than relying on historical
-- policy names that differ between environments.
do $$
declare
    policy_row record;
begin
    for policy_row in
        select schemaname, tablename, policyname
        from pg_policies
        where schemaname = 'public'
          and tablename in ('trip', 'booking')
    loop
        execute format(
            'drop policy if exists %I on %I.%I',
            policy_row.policyname,
            policy_row.schemaname,
            policy_row.tablename
        );
    end loop;
end;
$$;

-- Booking state and payment data remain read-only from the frontend. All
-- mutations continue to go through backend RPCs using the service role.
alter table public.booking enable row level security;
revoke insert, update, delete on public.booking from anon, authenticated;
grant select on public.booking to authenticated;

create policy "Authenticated users can read bookings"
    on public.booking
    for select
    to authenticated
    using (true);

-- A trip can be viewed by an authenticated user and published only by the
-- authenticated driver identified by trip.driver_id.
alter table public.trip enable row level security;
revoke update, delete on public.trip from anon, authenticated;
grant select, insert on public.trip to authenticated;

create policy "Authenticated users can read trips"
    on public.trip
    for select
    to authenticated
    using (true);

create policy "Drivers can insert their own trips"
    on public.trip
    for insert
    to authenticated
    with check (driver_id = (select auth.uid()));
