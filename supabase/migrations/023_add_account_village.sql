-- /account/profile inserts this optional field from the completion form.
-- Older databases may not contain it (PostgREST reports PGRST204).
begin;

alter table public.account add column if not exists village text;

-- Also repairs a stale API cache when the column already exists.
notify pgrst, 'reload schema';

commit;
