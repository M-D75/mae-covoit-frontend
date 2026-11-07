-- Full account rows are private. A fixed, read-only public projection replaces
-- every cross-account read used by the app, including nested trip/booking data.
begin;
do $$declare p record;begin
    for p in select policyname from pg_policies where schemaname='public' and tablename='account'
    loop execute format('drop policy if exists %I on public.account',p.policyname);end loop;
end;$$;
alter table public.account enable row level security;
revoke all on public.account from anon;
revoke insert,delete,truncate,references,trigger on public.account from authenticated;
grant select,update on public.account to authenticated;
create policy "Owners can read their private account" on public.account for select to authenticated
    using (user_id=(select auth.uid()));
create policy "Owners can update their private account" on public.account for update to authenticated
    using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));

-- This view intentionally executes as its migration owner, exposing only this
-- whitelist across accounts. It is never security_invoker and never writable
-- by client roles. Do not add e-mail, phone, money or payment identifiers here.
create or replace view public.public_profile with (security_barrier=true) as
select a.id,a.user_id,a.username,a.firstname,a.lastname,a.avatar,a.village,a.identity,
       jsonb_build_object('prefer',(select s.prefer from public.settings s where s.account_id=a.id limit 1)) as settings
from public.account a;
revoke all on public.public_profile from public,anon,authenticated;
grant select on public.public_profile to authenticated,service_role;

-- Explicit PostgREST relationships keep many-to-one embeds as objects and
-- preserve the frontend alias "account" without exposing the private row.
create or replace function public.public_profile(public.trip)
returns setof public.public_profile rows 1 language sql stable set search_path='' as $$
    select p.* from public.public_profile p where p.user_id=$1.driver_id;
$$;
create or replace function public.public_profile(public.booking)
returns setof public.public_profile rows 1 language sql stable set search_path='' as $$
    select p.* from public.public_profile p where p.id=$1.passenger_account_id;
$$;
revoke all on function public.public_profile(public.trip) from public,anon;
revoke all on function public.public_profile(public.booking) from public,anon;
grant execute on function public.public_profile(public.trip) to authenticated,service_role;
grant execute on function public.public_profile(public.booking) to authenticated,service_role;
notify pgrst,'reload schema';
commit;
