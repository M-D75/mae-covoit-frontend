-- The production road_alert table predates these migrations and uses UUID
-- primary keys. Keep moderation IDs as text so the private audit also remains
-- compatible with any older numeric development database.

alter table private.road_alert_audit
    alter column road_alert_id type text
    using road_alert_id::text;

create or replace function public.create_or_replace_road_alert(
    target_user_id uuid,
    target_alert_type text,
    target_lat double precision,
    target_lng double precision,
    target_trip_id bigint default null
)
returns public.road_alert
language plpgsql
security definer
set search_path = ''
as $$
declare
    selected_account public.account%rowtype;
    latest_created_at timestamptz;
    replaced_alert_id uuid;
    created_alert public.road_alert%rowtype;
begin
    if target_user_id is null then
        raise exception using errcode = '28000', message = 'AUTH_REQUIRED';
    end if;
    if target_alert_type not in ('traffic', 'danger', 'works', 'weather', 'obstacle') then
        raise exception using errcode = '22023', message = 'INVALID_ROAD_ALERT_TYPE';
    end if;
    if target_lat is null or target_lat < -90 or target_lat > 90
       or target_lng is null or target_lng < -180 or target_lng > 180 then
        raise exception using errcode = '22023', message = 'INVALID_ROAD_ALERT_LOCATION';
    end if;

    perform pg_advisory_xact_lock(hashtextextended(target_user_id::text, 0));

    select * into selected_account
    from public.account
    where user_id = target_user_id
    for update;
    if not found then
        raise exception using errcode = 'P0002', message = 'ACCOUNT_NOT_FOUND';
    end if;
    if selected_account.deletion_pending_at is not null then
        raise exception using errcode = '55000', message = 'ACCOUNT_DELETION_PENDING';
    end if;

    select created_at into latest_created_at
    from public.road_alert
    where account_id = selected_account.id
    order by created_at desc, id desc
    limit 1;
    if latest_created_at > timezone('utc', now()) - interval '2 minutes' then
        raise exception using errcode = '55000', message = 'ROAD_ALERT_RATE_LIMITED';
    end if;

    if target_trip_id is not null and not exists (
        select 1
        from public.trip
        where id = target_trip_id
          and (
              driver_id = target_user_id
              or exists (
                  select 1
                  from public.booking
                  where booking.trip_id = target_trip_id
                    and booking.passenger_account_id = selected_account.id
                    and booking.is_accepted = true
                    and booking.is_refused = false
              )
          )
    ) then
        raise exception using errcode = '42501', message = 'ROAD_ALERT_TRIP_FORBIDDEN';
    end if;

    select id into replaced_alert_id
    from public.road_alert
    where account_id = selected_account.id
      and status = 'active'
    order by created_at desc, id desc
    limit 1;

    update public.road_alert
    set status = 'superseded',
        superseded_at = timezone('utc', now())
    where account_id = selected_account.id
      and status = 'active';

    insert into public.road_alert (
        trip_id,
        account_id,
        alert_type,
        lat,
        lng,
        created_at,
        expires_at,
        status,
        confirm_count,
        invalidate_count
    ) values (
        target_trip_id,
        selected_account.id,
        target_alert_type,
        target_lat,
        target_lng,
        timezone('utc', now()),
        timezone('utc', now()) + interval '1 hour',
        'active',
        0,
        0
    )
    returning * into created_alert;

    insert into private.road_alert_audit (
        road_alert_id,
        reporter_user_id,
        reporter_account_id,
        event_type,
        details
    ) values (
        created_alert.id::text,
        target_user_id,
        selected_account.id,
        'created',
        jsonb_build_object(
            'alertType', target_alert_type,
            'lat', target_lat,
            'lng', target_lng,
            'tripId', target_trip_id,
            'replacesAlertId', replaced_alert_id::text
        )
    );

    return created_alert;
end;
$$;

drop function if exists public.vote_road_alert(uuid, bigint, text);

create or replace function public.vote_road_alert(
    target_user_id uuid,
    target_road_alert_id uuid,
    target_vote_type text
)
returns public.road_alert
language plpgsql
security definer
set search_path = ''
as $$
declare
    selected_account public.account%rowtype;
    selected_alert public.road_alert%rowtype;
    confirm_total integer;
    invalidate_total integer;
begin
    if target_vote_type not in ('confirm', 'invalidate') then
        raise exception using errcode = '22023', message = 'INVALID_ROAD_ALERT_VOTE';
    end if;

    select * into selected_account
    from public.account
    where user_id = target_user_id;
    if not found then
        raise exception using errcode = 'P0002', message = 'ACCOUNT_NOT_FOUND';
    end if;

    select * into selected_alert
    from public.road_alert
    where id = target_road_alert_id
    for update;
    if not found or selected_alert.status <> 'active'
       or selected_alert.expires_at <= timezone('utc', now()) then
        raise exception using errcode = 'P0002', message = 'ROAD_ALERT_NOT_FOUND';
    end if;
    if selected_alert.account_id = selected_account.id then
        raise exception using errcode = '42501', message = 'ROAD_ALERT_OWNER_CANNOT_VOTE';
    end if;

    insert into public.road_alert_vote (
        road_alert_id,
        account_id,
        vote_type,
        created_at,
        updated_at
    ) values (
        target_road_alert_id,
        selected_account.id,
        target_vote_type,
        timezone('utc', now()),
        timezone('utc', now())
    )
    on conflict (road_alert_id, account_id)
    do update set
        vote_type = excluded.vote_type,
        updated_at = timezone('utc', now());

    select
        count(*) filter (where vote_type = 'confirm'),
        count(*) filter (where vote_type = 'invalidate')
    into confirm_total, invalidate_total
    from public.road_alert_vote
    where road_alert_id = target_road_alert_id;

    update public.road_alert
    set confirm_count = confirm_total,
        invalidate_count = invalidate_total,
        expires_at = case
            when target_vote_type = 'confirm'
                then greatest(expires_at, timezone('utc', now()) + interval '1 hour')
            else expires_at
        end
    where id = target_road_alert_id
    returning * into selected_alert;

    insert into private.road_alert_audit (
        road_alert_id,
        reporter_user_id,
        reporter_account_id,
        event_type,
        details
    ) values (
        selected_alert.id::text,
        target_user_id,
        selected_account.id,
        'vote_' || target_vote_type,
        jsonb_build_object('voteType', target_vote_type)
    );

    return selected_alert;
end;
$$;

revoke all on function public.create_or_replace_road_alert(uuid, text, double precision, double precision, bigint)
    from public, anon, authenticated;
revoke all on function public.vote_road_alert(uuid, uuid, text)
    from public, anon, authenticated;
grant execute on function public.create_or_replace_road_alert(uuid, text, double precision, double precision, bigint)
    to service_role;
grant execute on function public.vote_road_alert(uuid, uuid, text)
    to service_role;
