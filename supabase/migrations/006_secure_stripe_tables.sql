-- Stripe operational tables must never be writable through the public Data API.
alter table public.stripe_pending_capture enable row level security;

revoke all on public.stripe_pending_capture from anon, authenticated;
grant select on public.stripe_pending_capture to authenticated;
grant all on public.stripe_pending_capture to service_role;

drop policy if exists "Passengers can read their pending captures"
    on public.stripe_pending_capture;
create policy "Passengers can read their pending captures"
    on public.stripe_pending_capture
    for select
    to authenticated
    using (
        exists (
            select 1
            from public.account
            where account.id = stripe_pending_capture.passenger_account_id
              and account.user_id = (select auth.uid())
        )
    );

do $$
declare
    table_name text;
begin
    foreach table_name in array array[
        'strip_charge',
        'strip_transfer',
        'stripe_refund',
        'stripe_credit_topup'
    ]
    loop
        if to_regclass(format('public.%I', table_name)) is not null then
            execute format('alter table public.%I enable row level security', table_name);
            execute format('revoke all on public.%I from anon, authenticated', table_name);
            execute format('grant all on public.%I to service_role', table_name);
        end if;
    end loop;
end
$$;
