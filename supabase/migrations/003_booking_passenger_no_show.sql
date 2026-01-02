alter table public.booking
    add column if not exists passenger_no_show boolean not null default false;

alter table public.booking
    add column if not exists passenger_no_show_at timestamptz null;

create index if not exists booking_passenger_no_show_idx
    on public.booking (passenger_no_show)
    where passenger_no_show = true;
