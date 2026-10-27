-- PREPARED, NOT EXECUTED. Run only in Covia-Dev SQL Editor:
-- project ziaqkswbsjgnmmajnfyp. NEVER run on uowqusyfvjvxvtqbuxlx.
-- Creates ONE fresh trip and ONE real wallet reservation for the selected test
-- accounts through the existing atomic business RPC. No PIN bypass, no fake
-- captured status, no credit top-up, no copied booking reset, no Stripe call.
-- Existing test credit must suffice; otherwise the entire transaction aborts.
-- Review first. Execute once, near the time of the interactive test.
begin;
do $$
declare
    driver_uid uuid := '3196a1d2-d0a0-4238-a300-647e9aac08f7';
    passenger_uid uuid := '2efc018a-c89b-4aea-9c93-666557a9efa1';
    source public.trip%rowtype;
    new_trip_id bigint;
    reservation jsonb;
    booking_ids bigint[];
begin
    -- These IDs were read from the specifically selected accounts in Covia-Dev.
    if not exists(select 1 from public.account where id = 6 and user_id = driver_uid)
       or not exists(select 1 from public.account where id = 3 and user_id = passenger_uid) then
        raise exception 'Selected test accounts do not match; nothing created';
    end if;
    select * into source from public.trip where id = 341 and driver_id = driver_uid
        and village_departure_id = 70 and village_arrival_id = 48;
    if not found or source.route is null or source.price is null or source.price <= 0 then
        raise exception 'Expected stored Tsingoni-Mamoudzou route and valid price missing';
    end if;
    insert into public.trip(village_departure_id, village_arrival_id, driver_id,
        departure_time, max_seats, price, route, car_id)
    values(70, 48, driver_uid, now() + interval '10 minutes', 1, source.price, source.route, source.car_id)
    returning id into new_trip_id;
    reservation := public.create_booking_reservation(passenger_uid, new_trip_id, 1, gen_random_uuid());
    if reservation->>'paymentMode' is distinct from 'wallet' or reservation->>'paymentStatus' is distinct from 'wallet_reserved' then
        raise exception 'Insufficient existing test credit: rolled back, no card authorization prepared';
    end if;
    select array_agg(value::bigint) into booking_ids from jsonb_array_elements_text(reservation->'bookingIds');
    if cardinality(booking_ids) is distinct from 1 then raise exception 'Unexpected booking group; rolled back'; end if;
    perform public.transition_booking_group(booking_ids, 'accept');
    raise notice 'Test trip: %, test booking: %, departure in 10 minutes. PIN still required; no capture performed.', new_trip_id, booking_ids;
end $$;
commit;
