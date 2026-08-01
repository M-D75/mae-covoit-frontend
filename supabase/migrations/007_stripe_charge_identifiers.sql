alter table public.strip_charge
    add column if not exists stripe_charge_id text,
    add column if not exists payment_intent_id text,
    add column if not exists balance_transaction_id text;

create unique index if not exists strip_charge_stripe_charge_id_idx
    on public.strip_charge (stripe_charge_id);

create unique index if not exists strip_charge_payment_intent_id_idx
    on public.strip_charge (payment_intent_id);
