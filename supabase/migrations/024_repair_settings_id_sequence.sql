-- Imported settings IDs can leave the identity/serial sequence behind.
-- ON CONFLICT (account_id) does not cover a collision on settings_pkey.
begin;

lock table public.settings in share row exclusive mode;

do $$
declare
    sequence_name text := pg_get_serial_sequence('public.settings', 'id');
    highest_id bigint;
    sequence_value bigint;
begin
    if sequence_name is null then
        raise exception 'settings.id has no owned serial/identity sequence; inspect its default before repairing it';
    end if;

    select max(id) into highest_id from public.settings;
    execute format('select last_value from %s', sequence_name::regclass)
        into sequence_value;

    -- Never rewind a sequence already ahead of the existing rows.
    perform setval(sequence_name::regclass,
        greatest(coalesce(highest_id, sequence_value), sequence_value), true);
end;
$$;

commit;
