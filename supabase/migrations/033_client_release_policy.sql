-- TEST first. No published release or minimum is invented by this migration.
begin;
create table if not exists public.client_release_policy(
 platform text primary key check(platform in('android','ios','web','legacy')),
 mode text not null default 'observe' check(mode in('observe','enforce')),
 minimum_build text not null default '0' check(minimum_build ~ '^[0-9]{1,9}(\.[0-9]{1,9}){0,2}$'),
 minimum_bundle integer not null default 0 check(minimum_bundle>=0),
 minimum_protocol integer not null default 0 check(minimum_protocol>=0),
 minimum_socket_protocol integer not null default 0 check(minimum_socket_protocol>=0),
 latest_build text not null default '0' check(latest_build ~ '^[0-9]{1,9}(\.[0-9]{1,9}){0,2}$'),
 latest_bundle integer not null default 0 check(latest_bundle>=minimum_bundle),
 latest_protocol integer not null default 0 check(latest_protocol>=minimum_protocol and latest_protocol>=minimum_socket_protocol),
 latest_version text check(latest_version is null or latest_version ~ '^[0-9]+\.[0-9]+\.[0-9]+$'),
 incompatibility_reason text,
 published_at timestamptz,
 verified_at timestamptz,
 update_url text,
 updated_at timestamptz not null default now(),
 check(verified_at is null or verified_at<=now()),
 check(verified_at is null or (published_at is not null and verified_at>=published_at)),
 check(update_url is null or (platform='android' and update_url='https://play.google.com/store/apps/details?id=com.maecovoit.app')
   or (platform='ios' and update_url ~ '^https://apps\.apple\.com/([a-z]{2}/)?app/[^?#[:space:]]*id[0-9]+$')
   or (platform='web' and update_url ~ '^https://[^[:space:]]+$')),
 check(mode<>'enforce' or (minimum_build='0' and minimum_protocol=0 and minimum_bundle=0 and minimum_socket_protocol=0)
   or (published_at is not null and verified_at is not null and latest_version is not null and char_length(btrim(coalesce(incompatibility_reason,'')))>=10 and (platform='legacy' or update_url is not null)))
);
alter table public.client_release_policy enable row level security;
revoke all on public.client_release_policy from public,anon,authenticated;
grant select on public.client_release_policy to service_role;
insert into public.client_release_policy(platform) values('android'),('ios'),('web'),('legacy') on conflict do nothing;
create or replace function public.client_build_parts(value text) returns bigint[] language sql immutable set search_path='' as $$
 select case when coalesce(value,'') ~ '^[0-9]{1,9}(\.[0-9]{1,9}){0,2}$'
 then array[split_part(value,'.',1)::bigint,coalesce(nullif(split_part(value,'.',2),''),'0')::bigint,coalesce(nullif(split_part(value,'.',3),''),'0')::bigint]
 else array[0,0,0]::bigint[] end
$$;
create or replace function public.guard_trip_release_compatibility() returns trigger
language plpgsql security definer set search_path='' as $$
declare h jsonb; p public.client_release_policy; identity_platform text;
begin
 if coalesce(auth.role(),'')<>'authenticated' then return new; end if;
 h:=coalesce(nullif(current_setting('request.headers',true),''),'{}')::jsonb;
 identity_platform:=h->>'x-covia-platform';
 if identity_platform is null or identity_platform not in('android','ios','web') then identity_platform:='legacy'; end if;
 select * into p from public.client_release_policy where platform=identity_platform;
 if not found then raise exception 'RELEASE_POLICY_UNAVAILABLE'; end if;
 if p.mode='enforce' and p.verified_at<=now() and p.published_at<=now() and (
   public.client_build_parts(h->>'x-covia-build')<public.client_build_parts(p.minimum_build)
   or public.client_build_parts(h->>'x-covia-bundle')<array[p.minimum_bundle,0,0]::bigint[]
   or public.client_build_parts(h->>'x-covia-protocol')<array[p.minimum_protocol,0,0]::bigint[]
 ) then raise exception using message='APP_UPDATE_REQUIRED',hint='Mettez à jour Covia avant de publier un trajet.'; end if;
 return new;
end $$;
revoke all on function public.client_build_parts(text) from public,anon,authenticated;
revoke all on function public.guard_trip_release_compatibility() from public,anon,authenticated;
create or replace function public.validate_client_release_order() returns trigger language plpgsql set search_path='' as $$
begin
 if public.client_build_parts(new.minimum_build)>public.client_build_parts(new.latest_build) then raise exception 'MINIMUM_EXCEEDS_PUBLISHED_BUILD'; end if;
 if new.mode='enforce' and (new.minimum_build<>'0' or new.minimum_protocol>0 or new.minimum_bundle>0 or new.minimum_socket_protocol>0)
   and (new.published_at>now() or new.verified_at>now()) then raise exception 'RELEASE_NOT_YET_PUBLISHED'; end if;
 return new;
end $$;
revoke all on function public.validate_client_release_order() from public,anon,authenticated;
drop trigger if exists client_release_build_order on public.client_release_policy;
create constraint trigger client_release_build_order after insert or update on public.client_release_policy
 deferrable initially deferred for each row execute function public.validate_client_release_order();
-- Retire only the obsolete WIP trigger, if a TEST project had applied 029.
drop trigger if exists trip_client_version_required on public.trip;
drop trigger if exists trip_release_compatibility on public.trip;
create trigger trip_release_compatibility before insert on public.trip for each row execute function public.guard_trip_release_compatibility();
commit;
