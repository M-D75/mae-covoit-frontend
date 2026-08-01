-- Push tokens and scheduled notifications must survive a Node.js restart.
create table if not exists public.device_token (
    user_id uuid primary key references auth.users(id) on delete cascade,
    token text not null,
    updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.scheduled_notification (
    id bigint generated always as identity primary key,
    sender_user_id uuid references auth.users(id) on delete set null,
    recipient_user_id uuid not null references auth.users(id) on delete cascade,
    scheduled_at timestamptz not null,
    title text not null,
    body text not null,
    data jsonb not null default '{}'::jsonb,
    status text not null default 'scheduled'
        check (status in ('scheduled', 'processing', 'sent', 'failed', 'no_token')),
    last_error text,
    created_at timestamptz not null default timezone('utc', now()),
    sent_at timestamptz
);

create index if not exists scheduled_notification_due_idx
    on public.scheduled_notification (scheduled_at)
    where status = 'scheduled';

alter table public.device_token enable row level security;
alter table public.scheduled_notification enable row level security;

revoke all on public.device_token from anon, authenticated;
revoke all on public.scheduled_notification from anon, authenticated;
grant all on public.device_token to service_role;
grant all on public.scheduled_notification to service_role;
