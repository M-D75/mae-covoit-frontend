begin;
-- Optional civil title is persisted separately from financial/verified identity.
alter table public.account add column if not exists salutation text;
commit;
