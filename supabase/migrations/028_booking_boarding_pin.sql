-- Apply manually in Supabase SQL editor AFTER migration 024 (025–027 geography
-- are independent). Backend and frontend deployment follows this migration.
begin;
create schema if not exists boarding_private;
revoke all on schema boarding_private from public, anon, authenticated;
create table if not exists boarding_private.pin (
    booking_id bigint primary key references public.booking(id) on delete cascade,
    booking_ids bigint[] not null,
    proof text not null,
    sealed text not null,
    attempts integer not null default 0 check (attempts between 0 and 5),
    confirmed_at timestamptz,
    expires_at timestamptz not null
);
alter table boarding_private.pin enable row level security;
revoke all on boarding_private.pin from public, anon, authenticated;

-- Both operations are service-only. The HTTP server supplies its verified JWT
-- subject, never an actor ID from the body. Lock order matches booking transitions.
create or replace function public.boarding_pin_operation(
    target_booking_id bigint, target_actor uuid, target_action text,
    target_proof text default null, target_sealed text default null
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
    seed public.booking%rowtype;
    ids bigint[];
    departure timestamptz;
    owner_id uuid;
    passenger_user uuid;
    pin boarding_private.pin%rowtype;
    all_confirmed boolean;
begin
    if target_action is null or target_action not in ('issue', 'confirm', 'status') or target_actor is null then
        return jsonb_build_object('error', 'BOARDING_FORBIDDEN');
    end if;
    select * into seed from public.booking where id = target_booking_id;
    if not found then return jsonb_build_object('error', 'BOARDING_NOT_FOUND'); end if;
    select driver_id, departure_time into owner_id, departure from public.trip where id = seed.trip_id;
    select user_id into passenger_user from public.account where id = seed.passenger_account_id;
    if (target_action = 'issue' and (target_actor is distinct from passenger_user or target_actor = owner_id))
       or (target_action = 'confirm' and target_actor is distinct from owner_id) then
        return jsonb_build_object('error', 'BOARDING_FORBIDDEN');
    end if;
    if target_action = 'status' and target_actor is distinct from owner_id and target_actor is distinct from passenger_user then
        return jsonb_build_object('error', 'BOARDING_FORBIDDEN');
    end if;
    select array_agg(id order by id) into ids from public.booking b
    where b.trip_id = seed.trip_id and b.passenger_account_id = seed.passenger_account_id
      and case when seed.reservation_request_id is not null then b.reservation_request_id = seed.reservation_request_id
               when seed.payment_intent_id is not null then b.reservation_request_id is null and b.payment_intent_id = seed.payment_intent_id
               else b.id = seed.id end;
    perform 1 from public.booking where id = any(ids) order by id for update;
    if exists(select 1 from public.booking where id = any(ids) and
        (not coalesce(is_accepted, false) or coalesce(is_refused, false) or coalesce(passenger_no_show, false)
         or payment_status in ('payment_preparing', 'canceled', 'wallet_released'))) then
        return jsonb_build_object('error', 'BOARDING_INVALID');
    end if;
    select bool_and(coalesce(in_car, false)) into all_confirmed from public.booking where id = any(ids);
    -- Includes historical confirmed bookings. Reconnect/retry needs no new PIN,
    -- even after expiry; financial recovery still uses its existing idempotence.
    if all_confirmed then return jsonb_build_object('confirmed', true, 'bookingIds', ids); end if;
    if target_action = 'status' then return jsonb_build_object('confirmed', false, 'bookingIds', ids); end if;
    if departure is null or clock_timestamp() > departure + interval '1 hour' then
        return jsonb_build_object('error', 'BOARDING_EXPIRED');
    end if;
    if target_action = 'issue' then
        if target_proof is null or target_proof !~ '^[a-f0-9]{64}$' or target_sealed is null then
            return jsonb_build_object('error', 'BOARDING_UNAVAILABLE');
        end if;
        insert into boarding_private.pin(booking_id, booking_ids, proof, sealed, expires_at)
        values(ids[1], ids, target_proof, target_sealed, departure + interval '1 hour')
        on conflict (booking_id) do nothing;
    end if;
    select * into pin from boarding_private.pin where booking_id = ids[1] for update;
    if not found then return jsonb_build_object('error', 'BOARDING_NOT_ISSUED'); end if;
    if pin.booking_ids is distinct from ids then return jsonb_build_object('error', 'BOARDING_GROUP_CHANGED'); end if;
    if clock_timestamp() > pin.expires_at then return jsonb_build_object('error', 'BOARDING_EXPIRED'); end if;
    if pin.attempts >= 5 then return jsonb_build_object('error', 'BOARDING_LOCKED'); end if;
    if target_action = 'issue' then
        return jsonb_build_object('confirmed', false, 'sealed', pin.sealed, 'expiresAt', pin.expires_at);
    end if;
    if clock_timestamp() < departure - interval '30 minutes' then
        return jsonb_build_object('error', 'BOARDING_TOO_EARLY');
    end if;
    if target_proof is distinct from pin.proof then
        -- Return an error value: raising would roll back the attempt counter.
        update boarding_private.pin set attempts = attempts + 1 where booking_id = ids[1];
        return jsonb_build_object('error', case when pin.attempts + 1 >= 5 then 'BOARDING_LOCKED' else 'BOARDING_WRONG_CODE' end);
    end if;
    update boarding_private.pin set confirmed_at = clock_timestamp() where booking_id = ids[1];
    update public.booking set in_car = true where id = any(ids);
    return jsonb_build_object('confirmed', true, 'bookingIds', ids);
end $$;
revoke all on function public.boarding_pin_operation(bigint, uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.boarding_pin_operation(bigint, uuid, text, text, text) to service_role;

-- Guard every write path, including the old presence RPC and wallet capture.
create or replace function boarding_private.guard_confirmation()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
    if coalesce(new.in_car, false) and (tg_op = 'INSERT' or not coalesce(old.in_car, false)) then
        if not exists(select 1 from boarding_private.pin p where p.confirmed_at is not null and new.id = any(p.booking_ids)) then
            raise exception using errcode = '42501', message = 'BOARDING_PIN_REQUIRED';
        end if;
    end if;
    return new;
end $$;
revoke all on function boarding_private.guard_confirmation() from public, anon, authenticated;
drop trigger if exists boarding_pin_required on public.booking;
create trigger boarding_pin_required before insert or update of in_car on public.booking
for each row execute function boarding_private.guard_confirmation();
commit;
