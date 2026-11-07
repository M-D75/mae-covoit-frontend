-- An in-app inbox is independent from device push delivery and permissions.
begin;
alter table public.scheduled_notification
    add column if not exists inbox_at timestamptz,
    add column if not exists read_at timestamptz;
-- Restore recent past notifications, including those with no registered device.
-- Future reminders and canceled records must never appear in the inbox.
update public.scheduled_notification
set inbox_at=coalesce(sent_at,scheduled_at)
where inbox_at is null and status in ('sent','no_token','failed')
  and scheduled_at<=now() and scheduled_at>=now()-interval '30 days';
create index if not exists scheduled_notification_inbox_idx
    on public.scheduled_notification(recipient_user_id,inbox_at desc,id desc)
    where inbox_at is not null;
-- Access remains server-only. The HTTP endpoints filter by authenticated user.
alter table public.scheduled_notification enable row level security;
revoke all on public.scheduled_notification from anon,authenticated;
grant all on public.scheduled_notification to service_role;
commit;
