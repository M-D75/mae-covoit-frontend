-- Final cross-flow invariants: account deletion versus Stripe top-ups, and
-- storage of the visible 1-to-5 trip score.

-- One captured Stripe balance transaction can fund at most one driver
-- transfer. Resolve any legacy duplicate before applying this index.
create unique index if not exists strip_transfer_charge_id_uidx
    on public.strip_transfer (charge_id)
    where charge_id is not null;

create or replace function public.guard_topup_account_deletion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    deletion_started_at timestamptz;
begin
    -- This row lock serializes top-up tracking with DELETE /account's barrier.
    select deletion_pending_at into deletion_started_at
    from public.account
    where id = new.account_id
    for update;
    if not found then
        raise exception using errcode = 'P0002', message = 'TOPUP_ACCOUNT_NOT_FOUND';
    end if;
    if deletion_started_at is not null then
        raise exception using errcode = '55000', message = 'ACCOUNT_DELETION_PENDING';
    end if;
    return new;
end;
$$;

drop trigger if exists guard_topup_account_deletion_trigger on public.stripe_credit_topup;
create trigger guard_topup_account_deletion_trigger
before insert or update of account_id on public.stripe_credit_topup
for each row execute function public.guard_topup_account_deletion();

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
    selected_account public.account%rowtype;
begin
    if target_amount <= 0 then
        raise exception using errcode = '22023', message = 'INVALID_TOPUP_AMOUNT';
    end if;

    select * into selected_account
    from public.account
    where id = target_account_id
    for update;
    if not found then
        raise exception using errcode = 'P0002', message = 'TOPUP_ACCOUNT_NOT_FOUND';
    end if;
    if selected_account.deletion_pending_at is not null then
        raise exception using errcode = '55000', message = 'ACCOUNT_DELETION_PENDING';
    end if;

    select * into topup
    from public.stripe_credit_topup
    where payment_intent_id = target_payment_intent_id
      and account_id = target_account_id
      and amount = target_amount
    for update;
    if not found then
        raise exception using errcode = 'P0002', message = 'UNKNOWN_TOPUP';
    end if;
    if topup.applied_at is not null then
        return false;
    end if;

    update public.account
    set credit = coalesce(credit, 0) + (target_amount::numeric / 100)
    where id = target_account_id;

    update public.stripe_credit_topup
    set status = 'succeeded',
        applied_at = timezone('utc', now())
    where id = topup.id;
    return true;
end;
$$;

revoke all on function public.guard_topup_account_deletion() from public, anon, authenticated;
grant execute on function public.guard_topup_account_deletion() to service_role;
revoke all on function public.apply_stripe_credit_topup(text, bigint, integer)
    from public, anon, authenticated;
grant execute on function public.apply_stripe_credit_topup(text, bigint, integer)
    to service_role;

-- `IF NOT EXISTS` does not repair a nullable column created by an interrupted
-- deployment. Backfill it before enforcing the final invariant.
alter table public.trip_rating
    add column if not exists score smallint;
update public.trip_rating
set score = 3
where score is null;
alter table public.trip_rating
    alter column score set default 3,
    alter column score set not null;
alter table public.trip_rating
    drop constraint if exists trip_rating_score_check;
alter table public.trip_rating
    add constraint trip_rating_score_check check (score between 1 and 5);

create or replace function public.get_trip_rating_summary(
    target_driver_account_id bigint
)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
    select jsonb_build_object(
        'reviewCount', count(*),
        'averageScore', coalesce(round(avg(score), 2), 0),
        'satisfaction', coalesce(round((avg(score) / 5) * 100), 0)
    )
    from public.trip_rating
    where driver_account_id = target_driver_account_id;
$$;

revoke all on function public.get_trip_rating_summary(bigint)
    from public, anon, authenticated;
grant execute on function public.get_trip_rating_summary(bigint)
    to service_role;

-- Reuse the audited rating transaction from migration 012, then attach the
-- star score in the same database transaction.
create or replace function public.submit_trip_rating(
    target_user_id uuid,
    target_trip_id bigint,
    target_good_indices integer[],
    target_bad_indices integer[],
    target_score integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    result jsonb;
begin
    if target_score is null or target_score < 1 or target_score > 5 then
        raise exception using errcode = '22023', message = 'INVALID_RATING_SCORE';
    end if;

    result := public.submit_trip_rating(
        target_user_id,
        target_trip_id,
        target_good_indices,
        target_bad_indices
    );

    update public.trip_rating
    set score = target_score
    where trip_id = target_trip_id
      and rater_account_id = (
          select id from public.account where user_id = target_user_id
      );

    return result || jsonb_build_object('score', target_score);
end;
$$;

revoke all on function public.submit_trip_rating(uuid, bigint, integer[], integer[])
    from public, anon, authenticated, service_role;
revoke all on function public.submit_trip_rating(uuid, bigint, integer[], integer[], integer)
    from public, anon, authenticated;
grant execute on function public.submit_trip_rating(uuid, bigint, integer[], integer[], integer)
    to service_role;

-- Enforce cent precision for new publications without making deployment fail
-- on a legacy row that still needs manual cleanup. Validate the constraint in
-- staging after auditing existing prices.
alter table public.trip
    drop constraint if exists trip_price_money_check;
alter table public.trip
    add constraint trip_price_money_check
    check (price is not null and price > 0 and price::numeric = round(price::numeric, 2)) not valid;
