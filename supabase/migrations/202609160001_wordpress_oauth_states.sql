-- Session-bound, expiring, single-use state for OWNER WordPress OAuth.
create table if not exists public.wordpress_oauth_states (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.app_users(id) on delete cascade,
  native_session_hash text not null check (native_session_hash ~ '^[0-9a-f]{64}$'),
  state_hash text not null unique check (state_hash ~ '^[0-9a-f]{64}$'),
  code_hash text unique check (code_hash is null or code_hash ~ '^[0-9a-f]{64}$'),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists wordpress_oauth_states_expiry_idx on public.wordpress_oauth_states(expires_at);
alter table public.wordpress_oauth_states enable row level security;
revoke all on public.wordpress_oauth_states from anon, authenticated;
grant select,insert,update,delete on public.wordpress_oauth_states to service_role;

create or replace function public.melsou_create_wordpress_oauth_state(
  p_owner_user_id uuid,
  p_native_session_hash text,
  p_state_hash text,
  p_expires_at timestamptz
) returns boolean language plpgsql security definer set search_path=pg_catalog,public as $$
begin
  if p_owner_user_id is null or p_native_session_hash !~ '^[0-9a-f]{64}$' or p_state_hash !~ '^[0-9a-f]{64}$' then return false; end if;
  if p_expires_at is null then return false; end if;
  if p_expires_at <= now() or p_expires_at > now() + interval '15 minutes' then return false; end if;
  if not exists (
    select 1 from public.native_sessions s
    join public.profiles p on p.user_id=s.user_id
    where s.user_id=p_owner_user_id and s.token_hash=p_native_session_hash
      and s.expires_at>now() and p.role='OWNER'
  ) then return false; end if;
  -- Retain consumed/expired rows for 24 hours as replay tombstones. OAuth
  -- authorization codes are short-lived, so this safely exceeds their useful
  -- lifetime without allowing unbounded table growth.
  delete from public.wordpress_oauth_states
  where coalesce(consumed_at,expires_at) < now() - interval '24 hours';
  insert into public.wordpress_oauth_states(owner_user_id,native_session_hash,state_hash,expires_at)
  values(p_owner_user_id,p_native_session_hash,p_state_hash,p_expires_at);
  return true;
exception when unique_violation then
  return false;
end $$;

create or replace function public.melsou_consume_wordpress_oauth_state(
  p_owner_user_id uuid,
  p_native_session_hash text,
  p_state_hash text,
  p_code_hash text
) returns boolean language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_id uuid;
begin
  if p_owner_user_id is null or p_native_session_hash !~ '^[0-9a-f]{64}$' or p_state_hash !~ '^[0-9a-f]{64}$' or p_code_hash is null or p_code_hash !~ '^[0-9a-f]{64}$' then return false; end if;
  update public.wordpress_oauth_states set consumed_at=now(),code_hash=p_code_hash
  where owner_user_id=p_owner_user_id and native_session_hash=p_native_session_hash
    and state_hash=p_state_hash and consumed_at is null and expires_at>now()
    and not exists(select 1 from public.wordpress_oauth_states where code_hash=p_code_hash)
  returning id into v_id;
  return v_id is not null;
exception when unique_violation then
  return false;
end $$;

revoke all on function public.melsou_create_wordpress_oauth_state(uuid,text,text,timestamptz) from public,anon,authenticated;
revoke all on function public.melsou_consume_wordpress_oauth_state(uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.melsou_create_wordpress_oauth_state(uuid,text,text,timestamptz) to service_role;
grant execute on function public.melsou_consume_wordpress_oauth_state(uuid,text,text,text) to service_role;
