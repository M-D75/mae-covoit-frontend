-- Migration 001 : table stripe_pending_capture
create table if not exists public.stripe_pending_capture (
    id bigint generated always as identity primary key,
    payment_intent_id text not null unique,
    passenger_account_id bigint references public.account(id),
    driver_account_id text not null,
    trip_id bigint not null,
    booking_ids jsonb not null default '[]'::jsonb,
    amount integer not null,
    capture_after timestamptz not null,
    status text not null default 'requires_capture',
    charge_id text,
    captured_at timestamptz,
    canceled_at timestamptz,
    inserted_at timestamptz not null default timezone('utc', now())
);
