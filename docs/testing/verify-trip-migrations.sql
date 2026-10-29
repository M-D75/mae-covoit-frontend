-- READ ONLY. Covia-Dev only: ziaqkswbsjgnmmajnfyp. No user/message/PIN content.
select name, to_regclass(name) is not null as present
from (values ('messaging_private.conversation'),('messaging_private.message'),('messaging_private.abuse_report'),('boarding_private.pin'),('public.log_credit'),('public.client_release_policy')) as objects(name);
select name,to_regprocedure(name) is not null as present
from (values ('public.trip_chat_operation(uuid,text,bigint,uuid,jsonb)'),('public.boarding_pin_operation(bigint,uuid,text,text,text)')) as functions(name);
select n.nspname,c.relname,c.relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace
where c.relkind in ('r','p') and (n.nspname in ('messaging_private','boarding_private') or (n.nspname='public' and c.relname='log_credit'));
select role_name,
 case when to_regnamespace('messaging_private') is not null then has_schema_privilege(role_name,'messaging_private','USAGE') end as private_schema_usage,
 case when to_regprocedure('public.trip_chat_operation(uuid,text,bigint,uuid,jsonb)') is not null then has_function_privilege(role_name,'public.trip_chat_operation(uuid,text,bigint,uuid,jsonb)','EXECUTE') end as chat_execute,
 case when to_regprocedure('public.boarding_pin_operation(bigint,uuid,text,text,text)') is not null then has_function_privilege(role_name,'public.boarding_pin_operation(bigint,uuid,text,text,text)','EXECUTE') end as pin_execute,
 case when to_regclass('public.log_credit') is not null then has_table_privilege(role_name,'public.log_credit','SELECT') end as credit_table_select,
 case when to_regclass('public.log_credit') is not null then has_any_column_privilege(role_name,'public.log_credit','SELECT') end as credit_column_select
from (values ('anon'),('authenticated'),('service_role')) as roles(role_name);
select exists(select 1 from pg_extension where extname='pg_cron') as pg_cron_installed,to_regclass('cron.job') is not null as scheduler_catalog_available;
-- Only if pg_cron is installed, inspect the scheduler (does NOT execute purge):
-- select jobname,schedule,active from cron.job where jobname='covia-chat-retention';
-- For the full log_credit grant/sequence check, also run verify-log-credit.sql.
