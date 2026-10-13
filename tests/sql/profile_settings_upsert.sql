-- Run only in a disposable empty PostgreSQL database:
-- psql -v ON_ERROR_STOP=1 -f tests/sql/profile_settings_upsert.sql
create table public.settings (
    account_id bigint,
    auto_accept_trip boolean default true
);
create unique index settings_account_id_uidx
    on public.settings (account_id) where account_id is not null;
insert into public.settings values (1, false), (null, true), (null, true);

-- Reproduce the failure with the index shipped in migration 010.
do $$
begin
    begin
        insert into public.settings (account_id) values (2)
            on conflict (account_id) do nothing;
        raise exception 'Expected the partial index to reject ON CONFLICT';
    exception when invalid_column_reference then
        raise notice 'Reproduced the original failure (42P10)';
    end;
end;
$$;

\ir ../../supabase/migrations/022_fix_profile_settings_upsert.sql
-- Reapplying the repair must also be safe.
\ir ../../supabase/migrations/022_fix_profile_settings_upsert.sql

insert into public.settings (account_id) values (2)
    on conflict (account_id) do nothing;
insert into public.settings (account_id) values (1), (2)
    on conflict (account_id) do nothing;

do $$
begin
    if (select count(*) from public.settings where account_id = 2) <> 1 then
        raise exception 'Retries must create exactly one preferences row';
    end if;
    if (select auto_accept_trip from public.settings where account_id = 1) then
        raise exception 'Existing preferences must remain unchanged';
    end if;
    if (select count(*) from public.settings where account_id is null) <> 2 then
        raise exception 'Existing NULL rows must remain unchanged';
    end if;
end;
$$;
