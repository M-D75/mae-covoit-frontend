-- A public road alert can be created outside a booked or published trip.
-- Legacy installations created road_alert.trip_id as NOT NULL and sometimes
-- kept a NO ACTION foreign key, both of which contradict that workflow.

alter table public.road_alert
    alter column trip_id drop not null;

do $$
declare
    foreign_key record;
begin
    for foreign_key in
        select constraint_row.conname
        from pg_constraint as constraint_row
        join pg_attribute as attribute_row
          on attribute_row.attrelid = constraint_row.conrelid
         and attribute_row.attnum = any(constraint_row.conkey)
        where constraint_row.conrelid = 'public.road_alert'::regclass
          and constraint_row.contype = 'f'
          and array_length(constraint_row.conkey, 1) = 1
          and attribute_row.attname = 'trip_id'
    loop
        execute format(
            'alter table public.road_alert drop constraint %I',
            foreign_key.conname
        );
    end loop;
end;
$$;

alter table public.road_alert
    add constraint road_alert_trip_id_fkey
    foreign key (trip_id)
    references public.trip(id)
    on delete set null;

comment on column public.road_alert.trip_id is
    'Optional trip context. NULL means the alert came from the standalone public map.';
