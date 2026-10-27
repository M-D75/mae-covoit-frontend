-- Read-only checks: execute on Covia-Dev after migration 030.
select n.nspname as schema_name, c.relname, c.relrowsecurity as rls_enabled
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where c.oid = 'public.log_credit'::regclass;

select role_name,
    has_table_privilege(role_name, 'public.log_credit', 'SELECT') as can_select,
    has_table_privilege(role_name, 'public.log_credit', 'INSERT') as can_insert,
    has_table_privilege(role_name, 'public.log_credit', 'UPDATE') as can_update,
    has_table_privilege(role_name, 'public.log_credit', 'DELETE') as can_delete,
    has_any_column_privilege(role_name, 'public.log_credit', 'SELECT') as can_select_any_column,
    has_any_column_privilege(role_name, 'public.log_credit', 'INSERT') as can_insert_any_column,
    has_sequence_privilege(role_name, pg_get_serial_sequence('public.log_credit', 'id'), 'USAGE') as can_use_sequence,
    has_sequence_privilege(role_name, pg_get_serial_sequence('public.log_credit', 'id'), 'SELECT') as can_read_sequence,
    has_sequence_privilege(role_name, pg_get_serial_sequence('public.log_credit', 'id'), 'UPDATE') as can_set_sequence
from (values ('anon'::text), ('authenticated'::text), ('service_role'::text)) as roles(role_name);

select policyname, roles, cmd, qual, with_check
from pg_policies where schemaname = 'public' and tablename = 'log_credit';
