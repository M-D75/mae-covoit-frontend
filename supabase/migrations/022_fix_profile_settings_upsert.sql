-- PostgREST's ON CONFLICT (account_id) cannot infer the partial index from
-- migration 010. Use a full unique index; PostgreSQL still allows multiple
-- NULL values, so this preserves the existing uniqueness semantics.
-- Build the replacement before dropping the old index, in one transaction.
begin;

create unique index settings_account_id_upsert_uidx
    on public.settings (account_id);

drop index if exists public.settings_account_id_uidx;
alter index public.settings_account_id_upsert_uidx
    rename to settings_account_id_uidx;

commit;
