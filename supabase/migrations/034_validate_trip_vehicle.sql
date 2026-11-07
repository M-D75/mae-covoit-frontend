begin;

-- Enforce this invariant for old clients too. Existing rows are not rewritten.
create or replace function public.validate_trip_vehicle()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    vehicle public.car%rowtype;
begin
    select * into vehicle from public.car where id = new.car_id for share;
    if not found or vehicle.driver_id is distinct from new.driver_id then
        raise exception using errcode = '23514', message = 'TRIP_VEHICLE_OWNER_MISMATCH';
    end if;
    if new.max_seats is null or new.max_seats < 1
       or vehicle.seats is null or new.max_seats > vehicle.seats then
        raise exception using errcode = '23514', message = 'TRIP_VEHICLE_CAPACITY_EXCEEDED';
    end if;
    return new;
end;
$$;
revoke all on function public.validate_trip_vehicle() from public, anon, authenticated;
drop trigger if exists trip_validate_vehicle on public.trip;
create trigger trip_validate_vehicle
before insert or update of car_id, driver_id, max_seats on public.trip
for each row execute function public.validate_trip_vehicle();

commit;
