create table if not exists public.stripe_credit_topup (
    id bigint generated always as identity primary key,
    payment_intent_id text not null unique,
    account_id bigint not null references public.account(id) on delete cascade,
    amount integer not null check (amount > 0),
    status text not null default 'pending',
    applied_at timestamptz,
    inserted_at timestamptz not null default timezone('utc', now())
);

alter table public.stripe_credit_topup enable row level security;

revoke all on public.stripe_credit_topup from anon, authenticated;
grant all on public.stripe_credit_topup to service_role;

create or replace function public.apply_stripe_credit_topup(
    target_payment_intent_id text,
    target_account_id bigint,
    target_amount integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
    topup public.stripe_credit_topup%rowtype;
    updated_rows integer;
begin
    if target_amount <= 0 then
        raise exception 'Invalid top-up amount';
    end if;

    select *
    into topup
    from public.stripe_credit_topup
    where payment_intent_id = target_payment_intent_id
      and account_id = target_account_id
      and amount = target_amount
    for update;

    if not found then
        raise exception 'Unknown top-up';
    end if;

    if topup.applied_at is not null then
        return false;
    end if;

    update public.account
    set credit = coalesce(credit, 0) + (target_amount::numeric / 100)
    where id = target_account_id;

    get diagnostics updated_rows = row_count;
    if updated_rows <> 1 then
        raise exception 'Top-up account not found';
    end if;

    update public.stripe_credit_topup
    set status = 'succeeded',
        applied_at = timezone('utc', now())
    where id = topup.id;

    return true;
end;
$$;

revoke all on function public.apply_stripe_credit_topup(text, bigint, integer) from public, anon, authenticated;
grant execute on function public.apply_stripe_credit_topup(text, bigint, integer) to service_role;
