-- TEST first. No legacy RAM history is imported: it has no reliable trip scope.
begin;
create schema if not exists messaging_private;
revoke all on schema messaging_private from public, anon, authenticated;
create table if not exists messaging_private.conversation (
    id uuid primary key default gen_random_uuid(),
    trip_id bigint not null,
    driver_id uuid not null references auth.users(id) on delete cascade,
    passenger_id uuid not null references auth.users(id) on delete cascade,
    created_at timestamptz not null default now(),
    unique(trip_id, driver_id, passenger_id),
    check(driver_id <> passenger_id)
);
create table if not exists messaging_private.message (
    id bigint generated always as identity primary key,
    conversation_id uuid not null references messaging_private.conversation(id) on delete cascade,
    sender_id uuid not null references auth.users(id) on delete cascade,
    recipient_id uuid not null references auth.users(id) on delete cascade,
    client_id uuid not null,
    body text not null check(char_length(btrim(body)) between 1 and 2000),
    created_at timestamptz not null default now(),
    expires_at timestamptz not null default now() + interval '15 days',
    read_at timestamptz,
    unique(sender_id,client_id),
    check(sender_id <> recipient_id),
    check(expires_at = created_at + interval '15 days')
);
create index if not exists trip_chat_page_idx on messaging_private.message(conversation_id,id desc);
create index if not exists trip_chat_unread_idx on messaging_private.message(recipient_id,expires_at) where read_at is null;
create index if not exists trip_chat_expiry_idx on messaging_private.message(expires_at);
create table if not exists messaging_private.abuse_report (
    id uuid primary key default gen_random_uuid(),
    reporter_id uuid not null,
    request_id uuid not null,
    trip_id bigint not null,
    driver_id uuid not null,
    passenger_id uuid not null,
    reason text not null check(reason in ('harassment','unsafe','spam','other')),
    details text not null check(char_length(details) <= 1000),
    evidence jsonb not null,
    created_at timestamptz not null default now(),
    retain_until timestamptz not null default now() + interval '15 days',
    unique(reporter_id,request_id)
);
alter table messaging_private.conversation enable row level security;
alter table messaging_private.message enable row level security;
alter table messaging_private.abuse_report enable row level security;
revoke all on all tables in schema messaging_private from public,anon,authenticated;
revoke all on all sequences in schema messaging_private from public,anon,authenticated;

-- Determines the current relationship from the actual trip and booking, never
-- from a client role, names, account IDs, recipient list or prior unrelated trip.
create or replace function messaging_private.live_pair(p_actor uuid,p_trip bigint,p_peer uuid)
returns table(driver_id uuid,passenger_id uuid,can_send boolean)
language sql stable security definer set search_path = '' as $$
    select distinct t.driver_id,a.user_id,
        t.cancellation_pending_at is null and now() < t.departure_time + interval '24 hours'
    from public.trip t join public.booking b on b.trip_id=t.id
    join public.account a on a.id=b.passenger_account_id
    where t.id=p_trip and t.driver_id<>a.user_id
      and ((t.driver_id=p_actor and a.user_id=p_peer) or (t.driver_id=p_peer and a.user_id=p_actor))
      and not coalesce(b.is_refused,false) and not coalesce(b.passenger_no_show,false)
      and coalesce(b.payment_status,'') not in ('canceled','cancelled','failed','expired','refunded','refund_pending')
    limit 1
$$;
create or replace function messaging_private.message_json(m messaging_private.message)
returns jsonb language sql stable set search_path = '' as $$
 select jsonb_build_object('id',m.id::text,'clientId',m.client_id,'from',m.sender_id,'to',m.recipient_id,
 'text',m.body,'createdAt',m.created_at,'expiresAt',m.expires_at,'readAt',m.read_at)
$$;

-- Only the authenticated backend service role can supply p_actor.
create or replace function public.trip_chat_operation(p_actor uuid,p_operation text,p_trip bigint default null,p_peer uuid default null,p_payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
 c messaging_private.conversation; m messaging_private.message; r messaging_private.abuse_report;
 pair record; peer record; result jsonb; page jsonb; selected_ids bigint[];
 message_text text; nonce uuid; cursor_id bigint; allowed boolean := false;
begin
 if p_operation='purge' then
   delete from public.scheduled_notification where scheduled_at < now()-interval '15 days';
   delete from messaging_private.message where expires_at<=now();
   delete from messaging_private.abuse_report where retain_until<=now();
   delete from messaging_private.conversation c0 where c0.created_at<now()-interval '15 days'
     and not exists(select 1 from messaging_private.message m0 where m0.conversation_id=c0.id);
   return jsonb_build_object('purged',true);
 end if;
 if p_actor is null then raise exception 'CHAT_FORBIDDEN'; end if;
 if p_operation='unread' then
   select coalesce(jsonb_agg(row_to_json(q)),'[]'::jsonb) into result from (
     select c0.trip_id::text as "tripId",case when c0.driver_id=p_actor then c0.passenger_id else c0.driver_id end as "peerId",count(*)::int as count
     from messaging_private.message m0 join messaging_private.conversation c0 on c0.id=m0.conversation_id
     where m0.recipient_id=p_actor and m0.expires_at>now() and m0.read_at is null
     group by c0.trip_id,c0.driver_id,c0.passenger_id
   )q;
   return jsonb_build_object('conversations',result);
 end if;
 if p_operation='contacts' then
   -- Existing participants may still read/report unexpired history after a cancellation.
   if not exists(select 1 from public.trip t where t.id=p_trip and (t.driver_id=p_actor or exists(
       select 1 from public.booking b join public.account a on a.id=b.passenger_account_id where b.trip_id=t.id and a.user_id=p_actor)))
      and not exists(select 1 from messaging_private.conversation c0 join messaging_private.message m0 on m0.conversation_id=c0.id
       where c0.trip_id=p_trip and p_actor in (c0.driver_id,c0.passenger_id) and m0.expires_at>now()) then raise exception 'CHAT_FORBIDDEN'; end if;
   result := '[]'::jsonb;
   for peer in
     select distinct candidate.user_id from (
       select case when t.driver_id=p_actor then a.user_id else t.driver_id end as user_id
       from public.trip t join public.booking b on b.trip_id=t.id join public.account a on a.id=b.passenger_account_id
       where t.id=p_trip and p_actor in(t.driver_id,a.user_id) and t.driver_id<>a.user_id
         and not coalesce(b.is_refused,false) and not coalesce(b.passenger_no_show,false)
         and coalesce(b.payment_status,'') not in ('canceled','cancelled','failed','expired','refunded','refund_pending')
       union select case when c0.driver_id=p_actor then c0.passenger_id else c0.driver_id end
       from messaging_private.conversation c0 join messaging_private.message m0 on m0.conversation_id=c0.id
       where c0.trip_id=p_trip and p_actor in(c0.driver_id,c0.passenger_id) and m0.expires_at>now()
     )candidate where candidate.user_id is not null and candidate.user_id<>p_actor
   loop
     select exists(select 1 from messaging_private.live_pair(p_actor,p_trip,peer.user_id) l where l.can_send) into allowed;
     result := result || jsonb_build_array(jsonb_build_object('userId',peer.user_id,
       'username',coalesce((select a.username from public.account a where a.user_id=peer.user_id limit 1),'Participant'),
       'avatar',(select a.avatar from public.account a where a.user_id=peer.user_id limit 1),'canSend',allowed,
       'unread',(select count(*) from messaging_private.message m0 join messaging_private.conversation c0 on c0.id=m0.conversation_id
          where c0.trip_id=p_trip and m0.recipient_id=p_actor and m0.sender_id=peer.user_id and m0.read_at is null and m0.expires_at>now())));
   end loop;
   return jsonb_build_object('contacts',result);
 end if;
 if p_trip is null or p_peer is null or p_peer=p_actor then raise exception 'CHAT_FORBIDDEN'; end if;
 select * into c from messaging_private.conversation c0 where c0.trip_id=p_trip
   and ((c0.driver_id=p_actor and c0.passenger_id=p_peer) or (c0.driver_id=p_peer and c0.passenger_id=p_actor));
 select * into pair from messaging_private.live_pair(p_actor,p_trip,p_peer);
 if c.id is null then
   if pair.driver_id is null then raise exception 'CHAT_FORBIDDEN'; end if;
   insert into messaging_private.conversation(trip_id,driver_id,passenger_id) values(p_trip,pair.driver_id,pair.passenger_id)
   on conflict(trip_id,driver_id,passenger_id) do update set trip_id=excluded.trip_id returning * into c;
 end if;
 allowed := coalesce(pair.can_send,false);
 if p_operation='history' then
   if p_payload->>'before' is not null then
     if (p_payload->>'before') !~ '^[0-9]{1,18}$' then raise exception 'CHAT_INVALID'; end if;
     cursor_id := (p_payload->>'before')::bigint;
   end if;
   select coalesce(jsonb_agg(messaging_private.message_json(q) order by q.id),'[]'::jsonb) into page from (
      select m0.* from messaging_private.message m0 where m0.conversation_id=c.id and m0.expires_at>now()
       and (cursor_id is null or m0.id<cursor_id) order by m0.id desc limit 50
   )q;
   return jsonb_build_object('tripId',p_trip::text,'peerId',p_peer,'messages',page,'canSend',allowed,
     'nextCursor',case when jsonb_array_length(page)=50 then page->0->>'id' else null end);
 elsif p_operation='send' then
   message_text := p_payload->>'text'; nonce := (p_payload->>'clientId')::uuid;
   if nonce is null or message_text is null or char_length(btrim(message_text)) not between 1 and 2000 then raise exception 'CHAT_INVALID'; end if;
   perform pg_advisory_xact_lock(hashtextextended(p_actor::text,31));
   select * into m from messaging_private.message m0 where m0.sender_id=p_actor and m0.client_id=nonce;
   if m.id is not null then
      if m.conversation_id<>c.id or m.body<>message_text then raise exception 'CHAT_NONCE_CONFLICT'; end if;
      if m.expires_at<=now() then raise exception 'CHAT_EXPIRED'; end if;
      return jsonb_build_object('message',messaging_private.message_json(m),'created',false);
   end if;
   if not allowed then raise exception 'CHAT_SEND_CLOSED'; end if;
   if (select count(*) from messaging_private.message m0 where m0.sender_id=p_actor and m0.created_at>now()-interval '10 seconds')>=10 then raise exception 'CHAT_RATE_LIMITED'; end if;
   insert into messaging_private.message(conversation_id,sender_id,recipient_id,client_id,body)
    values(c.id,p_actor,p_peer,nonce,message_text) returning * into m;
   return jsonb_build_object('message',messaging_private.message_json(m),'created',true);
 elsif p_operation in ('read','report') then
   if jsonb_typeof(p_payload->'messageIds') is distinct from 'array' or jsonb_array_length(p_payload->'messageIds') not between 1 and 100 then raise exception 'CHAT_INVALID'; end if;
   if exists(select 1 from jsonb_array_elements_text(p_payload->'messageIds') v where v !~ '^[0-9]{1,18}$') then raise exception 'CHAT_INVALID'; end if;
   select array_agg(v::bigint) into selected_ids from jsonb_array_elements_text(p_payload->'messageIds')v;
   if p_operation='read' then
     with changed as(update messaging_private.message m0 set read_at=now() where m0.conversation_id=c.id and m0.id=any(selected_ids)
       and m0.recipient_id=p_actor and m0.expires_at>now() and m0.read_at is null returning m0.id)
     select coalesce(jsonb_agg(id::text),'[]'::jsonb) into result from changed;
     return jsonb_build_object('messageIds',result);
   end if;
   perform pg_advisory_xact_lock(hashtextextended(p_actor::text,31));
   nonce := (p_payload->>'requestId')::uuid;
   if nonce is null or p_payload->>'reason' is null or p_payload->>'reason' not in ('harassment','unsafe','spam','other')
      or char_length(coalesce(p_payload->>'details',''))>1000 or cardinality(selected_ids)>50 then raise exception 'CHAT_INVALID'; end if;
   select * into r from messaging_private.abuse_report r0 where r0.reporter_id=p_actor and r0.request_id=nonce;
   if r.id is not null then
      if r.trip_id<>p_trip or p_peer not in(r.driver_id,r.passenger_id) then raise exception 'CHAT_NONCE_CONFLICT'; end if;
      return jsonb_build_object('reportId',r.id,'retainUntil',r.retain_until);
   end if;
   select coalesce(jsonb_agg(messaging_private.message_json(q) order by q.id),'[]'::jsonb) into page from (
     select m0.* from messaging_private.message m0 where m0.conversation_id=c.id and m0.id=any(selected_ids) and m0.expires_at>now() order by m0.id limit 50
   )q;
   if jsonb_array_length(page)=0 then raise exception 'CHAT_EXPIRED'; end if;
   if (select count(*) from messaging_private.abuse_report r0 where r0.reporter_id=p_actor and r0.created_at>now()-interval '1 day')>=5 then raise exception 'CHAT_RATE_LIMITED'; end if;
   insert into messaging_private.abuse_report(reporter_id,request_id,trip_id,driver_id,passenger_id,reason,details,evidence,retain_until)
     values(p_actor,nonce,p_trip,c.driver_id,c.passenger_id,p_payload->>'reason',coalesce(p_payload->>'details',''),page,(select min((v->>'expiresAt')::timestamptz) from jsonb_array_elements(page)v))
     returning * into r;
   return jsonb_build_object('reportId',r.id,'retainUntil',r.retain_until);
 end if;
 raise exception 'CHAT_INVALID';
end;
$$;
revoke all on function messaging_private.live_pair(uuid,bigint,uuid) from public,anon,authenticated;
revoke all on function messaging_private.message_json(messaging_private.message) from public,anon,authenticated;
revoke all on function public.trip_chat_operation(uuid,text,bigint,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.trip_chat_operation(uuid,text,bigint,uuid,jsonb) to service_role;
comment on function public.trip_chat_operation(uuid,text,bigint,uuid,jsonb) is 'Server-only text chat; 15 days per message; reports expire with earliest attached message, never extend retention. Hourly backend purge required.';
alter table public.scheduled_notification add column if not exists event_key text;
alter table public.scheduled_notification drop constraint if exists scheduled_notification_status_check;
alter table public.scheduled_notification add constraint scheduled_notification_status_check check(status in('scheduled','processing','sent','failed','no_token','canceled'));
-- Legacy client-authored reminders lack a verifiable trip key: cancel them.
update public.scheduled_notification set status='canceled' where status='scheduled' and event_key is null;
create unique index if not exists scheduled_notification_event_uidx on public.scheduled_notification(recipient_user_id,event_key);
-- A device token belongs to the most recently registered account only.
delete from public.device_token d using (select user_id,row_number() over(partition by token order by updated_at desc,user_id) n from public.device_token) old
 where old.user_id=d.user_id and old.n>1;
create unique index if not exists device_token_token_uidx on public.device_token(token);
commit;
