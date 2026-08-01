-- One authenticated passenger can rate a trip only once. Aggregate counters
-- remain in settings for frontend compatibility but are updated atomically.
create table if not exists public.trip_rating (
    id bigint generated always as identity primary key,
    trip_id bigint not null references public.trip(id) on delete cascade,
    rater_account_id bigint not null references public.account(id) on delete cascade,
    driver_account_id bigint not null references public.account(id) on delete cascade,
    good_indices integer[] not null default '{}',
    bad_indices integer[] not null default '{}',
    created_at timestamptz not null default timezone('utc', now()),
    unique (trip_id, rater_account_id)
);

alter table public.trip_rating enable row level security;
revoke all on public.trip_rating from anon, authenticated;
grant all on public.trip_rating to service_role;

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
      and trip.departure_time <= timezone('utc', now())
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

revoke all on function public.submit_trip_rating(uuid, bigint, integer[], integer[])
    from public, anon, authenticated;
grant execute on function public.submit_trip_rating(uuid, bigint, integer[], integer[])
    to service_role;

-- Owners may update preferences, but rating counters are server-only.
alter table public.settings enable row level security;
revoke insert, delete on public.settings from anon, authenticated;
grant select, update on public.settings to authenticated;

drop policy if exists "Authenticated users can read settings" on public.settings;
create policy "Authenticated users can read settings"
    on public.settings
    for select
    to authenticated
    using (true);

drop policy if exists "Users can update their own settings" on public.settings;
create policy "Users can update their own settings"
    on public.settings
    for update
    to authenticated
    using (
        exists (
            select 1 from public.account
            where account.id = settings.account_id
              and account.user_id = (select auth.uid())
        )
    )
    with check (
        exists (
            select 1 from public.account
            where account.id = settings.account_id
              and account.user_id = (select auth.uid())
        )
    );

create or replace function public.guard_settings_rating()
returns trigger
language plpgsql
set search_path = public
as $$
begin
    if current_user in ('anon', 'authenticated')
       and new.rating is distinct from old.rating then
        raise exception using errcode = '42501', message = 'RATING_SERVER_ONLY';
    end if;
    return new;
end;
$$;

drop trigger if exists guard_settings_rating_trigger on public.settings;
create trigger guard_settings_rating_trigger
before update on public.settings
for each row execute function public.guard_settings_rating();

revoke all on function public.guard_settings_rating() from public;
grant execute on function public.guard_settings_rating() to service_role;
