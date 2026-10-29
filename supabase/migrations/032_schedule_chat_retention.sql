-- Optional database-side scheduler, TEST first; requires pg_cron already enabled
-- by the project owner. Never install/enable an extension silently.
begin;
do $$
begin
 if not exists(select 1 from pg_extension where extname='pg_cron') then
   raise exception 'Enable pg_cron in TEST first, or use the documented hourly backend purge with uptime monitoring';
 end if;
 perform cron.schedule('covia-chat-retention','7 * * * *',
   $job$select public.trip_chat_operation(null,'purge');$job$);
end;
$$;
commit;
