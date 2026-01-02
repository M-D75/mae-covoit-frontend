-- Migration 002 : colonnes paiement différé sur booking
alter table public.booking
    add column if not exists payment_intent_id text,
    add column if not exists payment_status text,
    add column if not exists payment_capture_after timestamptz;
