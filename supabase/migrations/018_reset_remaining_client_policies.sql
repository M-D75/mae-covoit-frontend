-- Rebuild the remaining frontend-facing policies after enabling RLS.
--
-- Older Supabase environments may contain policies whose names are unknown to
-- this repository. PostgreSQL keeps those policies when a new named policy is
-- added, which can create cycles such as account -> settings -> account.
do $$
declare
    policy_row record;
begin
    for policy_row in
        select schemaname, tablename, policyname
        from pg_policies
        where schemaname = 'public'
          and tablename in ('account', 'settings', 'car', 'stripe_pending_capture')
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

-- Public profile information is readable by signed-in users. Only the owner
-- can update ordinary fields; the financial-field trigger remains in force.
alter table public.account enable row level security;
revoke insert, delete on public.account from anon, authenticated;
grant select, update on public.account to authenticated;

create policy "Authenticated users can read accounts"
    on public.account
    for select
    to authenticated
    using (true);

create policy "Users can update their own account"
    on public.account
    for update
    to authenticated
    using (user_id = (select auth.uid()))
    with check (user_id = (select auth.uid()));

-- Preferences belong to the account linked to the authenticated user.
alter table public.settings enable row level security;
revoke insert, delete on public.settings from anon, authenticated;
grant select, update on public.settings to authenticated;

create policy "Authenticated users can read settings"
    on public.settings
    for select
    to authenticated
    using (true);

create policy "Users can update their own settings"
    on public.settings
    for update
    to authenticated
    using (
        exists (
            select 1
            from public.account
            where account.id = settings.account_id
              and account.user_id = (select auth.uid())
        )
    )
    with check (
        exists (
            select 1
            from public.account
            where account.id = settings.account_id
              and account.user_id = (select auth.uid())
        )
    );

-- Cars are visible to signed-in users and mutable only by their driver.
alter table public.car enable row level security;
grant select, insert, update, delete on public.car to authenticated;

create policy "Authenticated users can read cars"
    on public.car
    for select
    to authenticated
    using (true);

create policy "Drivers can insert their own cars"
    on public.car
    for insert
    to authenticated
    with check (driver_id = (select auth.uid()));

create policy "Drivers can update their own cars"
    on public.car
    for update
    to authenticated
    using (driver_id = (select auth.uid()))
    with check (driver_id = (select auth.uid()));

create policy "Drivers can delete their own cars"
    on public.car
    for delete
    to authenticated
    using (driver_id = (select auth.uid()));

-- The frontend only needs to display its own outstanding card authorizations.
alter table public.stripe_pending_capture enable row level security;
revoke all on public.stripe_pending_capture from anon, authenticated;
grant select on public.stripe_pending_capture to authenticated;
grant all on public.stripe_pending_capture to service_role;

create policy "Passengers can read their pending captures"
    on public.stripe_pending_capture
    for select
    to authenticated
    using (
        exists (
            select 1
            from public.account
            where account.id = stripe_pending_capture.passenger_account_id
              and account.user_id = (select auth.uid())
        )
    );
