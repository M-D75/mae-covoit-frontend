-- Private moderation inbox. A report does not notify the reported driver or
-- automatically alter a booking, rating or payment. Review through SQL/admin.
begin;
create schema if not exists private;
create table if not exists private.trip_report (
    id uuid primary key default gen_random_uuid(),
    trip_id bigint references public.trip(id) on delete set null,
    reported_trip_id bigint not null,
    reporter_account_id bigint not null references public.account(id) on delete cascade,
    reason text not null check (reason in ('unsafe_driving','inappropriate_behavior','misleading_trip','other')),
    details text not null check (char_length(btrim(details)) between 10 and 2000),
    created_at timestamptz not null default now(),
    status text not null default 'open' check (status in ('open','reviewed','dismissed')),
    reviewed_at timestamptz,
    staff_notes text,
    unique (reported_trip_id, reporter_account_id)
);
alter table private.trip_report enable row level security;
revoke all on private.trip_report from public,anon,authenticated;
grant usage on schema private to service_role;
grant select,insert,update,delete on private.trip_report to service_role;
create index if not exists trip_report_open_idx on private.trip_report(created_at) where status='open';

create or replace function public.submit_trip_report(
    target_user_id uuid, target_trip_id bigint, target_reason text, target_details text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    actor public.account%rowtype;
    driver_user_id uuid;
    report private.trip_report%rowtype;
begin
    if target_user_id is null then
        raise exception using errcode='28000',message='AUTH_REQUIRED';
    end if;
    if target_reason is null or target_reason not in ('unsafe_driving','inappropriate_behavior','misleading_trip','other')
       or target_details is null or char_length(btrim(target_details)) not between 10 and 2000 then
        raise exception using errcode='22023',message='INVALID_TRIP_REPORT';
    end if;
    -- Serialize concurrent retries and the per-account throttle.
    select * into actor from public.account where user_id=target_user_id for update;
    if not found then raise exception using errcode='P0002',message='ACCOUNT_NOT_FOUND';end if;
    if actor.deletion_pending_at is not null then
        raise exception using errcode='55000',message='ACCOUNT_DELETION_PENDING';
    end if;
    select driver_id into driver_user_id from public.trip where id=target_trip_id for share;
    if not found then raise exception using errcode='P0002',message='TRIP_NOT_FOUND';end if;
    if driver_user_id=target_user_id then
        raise exception using errcode='42501',message='TRIP_REPORT_SELF_FORBIDDEN';
    end if;
    select * into report from private.trip_report
    where reported_trip_id=target_trip_id and reporter_account_id=actor.id;
    if found then
        return jsonb_build_object('reportId',report.id,'tripId',report.reported_trip_id,'alreadyReported',true);
    end if;
    if exists(select 1 from private.trip_report where reporter_account_id=actor.id and created_at>now()-interval '2 minutes') then
        raise exception using errcode='55000',message='TRIP_REPORT_RATE_LIMITED';
    end if;
    insert into private.trip_report(trip_id,reported_trip_id,reporter_account_id,reason,details)
    values(target_trip_id,target_trip_id,actor.id,target_reason,btrim(target_details)) returning * into report;
    return jsonb_build_object('reportId',report.id,'tripId',report.reported_trip_id,'alreadyReported',false);
end;
$$;
revoke all on function public.submit_trip_report(uuid,bigint,text,text) from public,anon,authenticated;
grant execute on function public.submit_trip_report(uuid,bigint,text,text) to service_role;
commit;
