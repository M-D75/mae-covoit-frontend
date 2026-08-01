-- Keep account deletion deterministic across environments.
-- Direct user-owned rows are deleted with auth.users, and rows owned by an
-- account are deleted with public.account.
do $$
declare
    fk record;
    definition text;
begin
    for fk in
        select
            c.conrelid::regclass as table_name,
            c.conname as constraint_name,
            pg_get_constraintdef(c.oid) as constraint_definition
        from pg_constraint c
        where c.contype = 'f'
          and c.confrelid in ('auth.users'::regclass, 'public.account'::regclass)
          and c.connamespace = 'public'::regnamespace
          and c.confdeltype in ('a', 'r')
    loop
        definition := regexp_replace(
            fk.constraint_definition,
            '\s+ON DELETE\s+(NO ACTION|RESTRICT|CASCADE|SET NULL|SET DEFAULT)',
            '',
            'i'
        );

        execute format(
            'alter table %s drop constraint %I',
            fk.table_name,
            fk.constraint_name
        );
        execute format(
            'alter table %s add constraint %I %s on delete cascade',
            fk.table_name,
            fk.constraint_name,
            definition
        );
    end loop;
end
$$;
