-- Admin refunds are retriable and remember any related Connect reversal.
alter table public.stripe_refund
    add column if not exists request_id uuid,
    add column if not exists transfer_reversal_id text;

create unique index if not exists stripe_refund_request_id_uidx
    on public.stripe_refund (request_id);

create unique index if not exists stripe_refund_refund_id_uidx
    on public.stripe_refund (refund_id);
