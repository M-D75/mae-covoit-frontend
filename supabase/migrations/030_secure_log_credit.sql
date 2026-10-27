-- Apply manually to Covia-Dev (ziaqkswbsjgnmmajnfyp), NOT production.
-- Standalone hardening; the unfinished version-control migration 029 is NOT
-- a prerequisite. No data is removed and no balance is modified.
begin;

alter table public.log_credit enable row level security;
revoke all privileges on table public.log_credit from public, anon, authenticated;

-- Table REVOKE does not remove separate column grants. Cover those as well,
-- including legacy grants or grants on columns added before this migration.
do $$
declare
    columns_sql text;
    policy_row record;
    identity_sequence regclass;
begin
    select string_agg(format('%I', attname), ', ' order by attnum)
    into columns_sql
    from pg_attribute
    where attrelid = 'public.log_credit'::regclass
      and attnum > 0 and not attisdropped;
    execute format('revoke all privileges (%s) on table public.log_credit from public, anon, authenticated', columns_sql);

    for policy_row in
        select policyname from pg_policies
        where schemaname = 'public' and tablename = 'log_credit'
    loop
        execute format('drop policy %I on public.log_credit', policy_row.policyname);
    end loop;

    identity_sequence := pg_get_serial_sequence('public.log_credit', 'id')::regclass;
    if identity_sequence is null then
        raise exception 'log_credit.id identity sequence missing; transaction rolled back';
    end if;
    execute format('revoke all privileges on sequence %s from public, anon, authenticated', identity_sequence);
    execute format('grant usage, select, update on sequence %s to service_role', identity_sequence);
end $$;

grant select, insert, update, delete on table public.log_credit to service_role;
create policy "Server manages log_credit"
    on public.log_credit for all to service_role
    using (true) with check (true);

commit;
