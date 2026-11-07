-- Reviews unlock after estimated arrival, using the same legacy fallback as
-- the app. An actual end-of-trip confirmation does not currently exist.
begin;
create or replace function public.trip_rating_available_at(departure_at timestamptz, trip_route jsonb)
returns timestamptz
language sql
immutable
set search_path = ''
as $$
    select departure_at + make_interval(secs => greatest(600::double precision,
        coalesce(max(case when item #>> '{infosGoogle,duration}' ~ '^\d+(\.\d+)?s$'
            then rtrim(item #>> '{infosGoogle,duration}', 's')::double precision end), 14400)))
    from jsonb_array_elements(case when jsonb_typeof(trip_route) = 'array'
        then trip_route else jsonb_build_array(trip_route) end) as routes(item);
$$;
revoke all on function public.trip_rating_available_at(timestamptz,jsonb) from public,anon,authenticated;
grant execute on function public.trip_rating_available_at(timestamptz,jsonb) to service_role;

create or replace function public.submit_trip_rating(
    target_user_id uuid,
    target_trip_id bigint,
    target_good_indices integer[],
    target_bad_indices integer[]
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    rater_account_id bigint;
    driver_account_id bigint;
    current_rating jsonb;
    item_index integer;
begin
    select id into rater_account_id
    from public.account
    where user_id = target_user_id;
    if not found then
        raise exception using errcode = 'P0002', message = 'RATER_ACCOUNT_NOT_FOUND';
    end if;

    select driver.id, coalesce(to_jsonb(settings.rating), '{"good":[],"bad":[]}'::jsonb)
    into driver_account_id, current_rating
    from public.trip
    join public.account driver on driver.user_id = trip.driver_id
    join public.settings on settings.account_id = driver.id
    where trip.id = target_trip_id
      and trip.cancellation_pending_at is null
      and public.trip_rating_available_at(trip.departure_time, to_jsonb(trip.route)) <= now()
    for update of settings;
    if not found then
        raise exception using errcode = 'P0002', message = 'RATABLE_TRIP_NOT_FOUND';
    end if;
    if driver_account_id = rater_account_id then
        raise exception using errcode = '42501', message = 'SELF_RATING_FORBIDDEN';
    end if;

    if not exists (
        select 1 from public.booking
        where trip_id = target_trip_id
          and passenger_account_id = rater_account_id
          and coalesce(is_accepted, false)
          and not coalesce(is_refused, false)
          and not coalesce(passenger_no_show, false)
          and coalesce(in_car, false)
    ) then
        raise exception using errcode = '42501', message = 'COMPLETED_BOOKING_REQUIRED';
    end if;

    insert into public.trip_rating (
        trip_id,
        rater_account_id,
        driver_account_id,
        good_indices,
        bad_indices
    ) values (
        target_trip_id,
        rater_account_id,
        driver_account_id,
        coalesce(target_good_indices, '{}'),
        coalesce(target_bad_indices, '{}')
    );

    foreach item_index in array coalesce(target_good_indices, '{}') loop
        if item_index < 0 or item_index >= jsonb_array_length(current_rating -> 'good') then
            raise exception using errcode = '22023', message = 'INVALID_RATING_INDEX';
        end if;
        current_rating := jsonb_set(
            current_rating,
            array['good', item_index::text],
            to_jsonb(coalesce((current_rating #>> array['good', item_index::text])::integer, 0) + 1)
        );
    end loop;

    foreach item_index in array coalesce(target_bad_indices, '{}') loop
        if item_index < 0 or item_index >= jsonb_array_length(current_rating -> 'bad') then
            raise exception using errcode = '22023', message = 'INVALID_RATING_INDEX';
        end if;
        current_rating := jsonb_set(
            current_rating,
            array['bad', item_index::text],
            to_jsonb(coalesce((current_rating #>> array['bad', item_index::text])::integer, 0) + 1)
        );
    end loop;

    update public.settings
    set rating = current_rating
    where account_id = driver_account_id;

    return jsonb_build_object(
        'tripId', target_trip_id,
        'driverAccountId', driver_account_id,
        'rating', current_rating
    );
end;
$$;


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
    has_confirmed_before boolean;
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

    -- Alert row lock serializes retries and votes by different accounts.
    -- Historical confirmations also prevent confirm/invalidate/confirm from
    -- repeatedly extending the alert using just one account.
    select exists (
        select 1 from private.road_alert_audit
        where road_alert_id = target_road_alert_id::text
          and reporter_account_id = selected_account.id
          and event_type = 'vote_confirm'
    ) or exists (
        select 1 from public.road_alert_vote
        where road_alert_id = target_road_alert_id
          and account_id = selected_account.id and vote_type = 'confirm'
    ) into has_confirmed_before;

    if exists (
        select 1 from public.road_alert_vote
        where road_alert_id = target_road_alert_id
          and account_id = selected_account.id and vote_type = target_vote_type
    ) then
        return selected_alert;
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
            when target_vote_type = 'confirm' and not has_confirmed_before
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


revoke all on function public.submit_trip_rating(uuid,bigint,integer[],integer[]) from public,anon,authenticated,service_role;
revoke all on function public.vote_road_alert(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.vote_road_alert(uuid,uuid,text) to service_role;
commit;
