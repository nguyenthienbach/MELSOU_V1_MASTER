-- Product Owner source-of-truth update: native username/password auth and private web voice.
-- Apply after 202609080001_backend_completion.sql.

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  identity_kind text not null check (identity_kind in ('NATIVE','GOOGLE','LINKED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
insert into public.app_users(id,auth_user_id,identity_kind)
select id,id,'GOOGLE' from auth.users on conflict(id) do update set auth_user_id=excluded.auth_user_id;

alter table public.profiles add column if not exists username text, add column if not exists email text,
  add column if not exists email_verified_at timestamptz, add column if not exists username_changed_at timestamptz;
update public.profiles p set email=lower(u.email),email_verified_at=coalesce(u.email_confirmed_at,u.confirmed_at)
  from auth.users u where p.user_id=u.id and p.email is null;
create unique index if not exists profiles_username_unique on public.profiles(lower(username)) where username is not null;
create unique index if not exists profiles_email_unique on public.profiles(lower(email)) where email is not null;

alter table public.profiles drop constraint if exists profiles_user_id_fkey;
alter table public.profiles add constraint profiles_user_id_fkey foreign key(user_id) references public.app_users(id) on delete cascade;
alter table public.projects drop constraint if exists projects_owner_user_id_fkey;
alter table public.projects add constraint projects_owner_user_id_fkey foreign key(owner_user_id) references public.app_users(id) on delete set null;
alter table public.orders drop constraint if exists orders_customer_id_fkey;
alter table public.orders add constraint orders_customer_id_fkey foreign key(customer_id) references public.app_users(id) on delete restrict;
alter table public.audit_logs drop constraint if exists audit_logs_actor_id_fkey;
alter table public.audit_logs add constraint audit_logs_actor_id_fkey foreign key(actor_id) references public.app_users(id) on delete set null;
alter table public.project_duo_members drop constraint if exists project_duo_members_user_id_fkey;
alter table public.project_duo_members add constraint project_duo_members_user_id_fkey foreign key(user_id) references public.app_users(id) on delete cascade;
alter table public.project_duo_invites drop constraint if exists project_duo_invites_created_by_fkey;
alter table public.project_duo_invites add constraint project_duo_invites_created_by_fkey foreign key(created_by) references public.app_users(id) on delete restrict;
alter table public.project_duo_invites drop constraint if exists project_duo_invites_accepted_by_fkey;
alter table public.project_duo_invites add constraint project_duo_invites_accepted_by_fkey foreign key(accepted_by) references public.app_users(id) on delete set null;
alter table public.project_slot_locks drop constraint if exists project_slot_locks_holder_user_id_fkey;
alter table public.project_slot_locks add constraint project_slot_locks_holder_user_id_fkey foreign key(holder_user_id) references public.app_users(id) on delete cascade;
alter table public.project_checkpoints drop constraint if exists project_checkpoints_created_by_fkey;
alter table public.project_checkpoints add constraint project_checkpoints_created_by_fkey foreign key(created_by) references public.app_users(id) on delete set null;
alter table public.guest_claimed_projects drop constraint if exists guest_claimed_projects_owner_user_id_fkey;
alter table public.guest_claimed_projects add constraint guest_claimed_projects_owner_user_id_fkey foreign key(owner_user_id) references public.app_users(id) on delete cascade;
alter table public.quotes drop constraint if exists quotes_owner_user_id_fkey;
alter table public.quotes add constraint quotes_owner_user_id_fkey foreign key(owner_user_id) references public.app_users(id) on delete cascade;
alter table public.carts drop constraint if exists carts_customer_id_fkey;
alter table public.carts add constraint carts_customer_id_fkey foreign key(customer_id) references public.app_users(id) on delete cascade;
alter table public.customer_addresses drop constraint if exists customer_addresses_customer_id_fkey;
alter table public.customer_addresses add constraint customer_addresses_customer_id_fkey foreign key(customer_id) references public.app_users(id) on delete cascade;
alter table public.blog_posts drop constraint if exists blog_posts_author_id_fkey;
alter table public.blog_posts add constraint blog_posts_author_id_fkey foreign key(author_id) references public.app_users(id) on delete restrict;

create or replace function public.melsou_handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.app_users(id,auth_user_id,identity_kind) values(new.id,new.id,'GOOGLE')
    on conflict(id) do update set auth_user_id=excluded.auth_user_id,identity_kind=case when public.app_users.identity_kind='NATIVE' then 'LINKED' else public.app_users.identity_kind end,updated_at=now();
  insert into public.profiles(user_id,display_name,email,email_verified_at)
    values(new.id,coalesce(new.raw_user_meta_data->>'full_name',new.email),lower(new.email),coalesce(new.email_confirmed_at,new.confirmed_at))
    on conflict(user_id) do update set email=coalesce(public.profiles.email,excluded.email),email_verified_at=coalesce(public.profiles.email_verified_at,excluded.email_verified_at),updated_at=now();
  return new;
end $$;

create or replace function public.melsou_handle_deleted_auth_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if exists(select 1 from public.native_credentials where user_id=old.id) then
    update public.app_users set auth_user_id=null,identity_kind='NATIVE',updated_at=now() where id=old.id;
  else
    delete from public.app_users where id=old.id;
  end if;
  return old;
end $$;
drop trigger if exists on_auth_user_deleted on auth.users;
create trigger on_auth_user_deleted after delete on auth.users for each row execute procedure public.melsou_handle_deleted_auth_user();

create table if not exists public.native_credentials (
  user_id uuid primary key references public.app_users(id) on delete cascade,
  password_hash text not null check (password_hash ~ '^[0-9a-f]{64}$'),
  password_salt text not null check (password_salt ~ '^[0-9a-f]{32}$'),
  password_iterations integer not null check (password_iterations between 100000 and 2000000),
  failed_attempts integer not null default 0 check (failed_attempts between 0 and 100),
  locked_until timestamptz,
  password_changed_at timestamptz not null default now(),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.native_sessions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.app_users(id) on delete cascade,
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  expires_at timestamptz not null, last_seen_at timestamptz not null default now(), revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists native_sessions_active_idx on public.native_sessions(token_hash,expires_at) where revoked_at is null;
create table if not exists public.auth_email_challenges (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.app_users(id) on delete cascade,
  purpose text not null check (purpose in ('LINK_EMAIL','RECOVER_PASSWORD')), email text not null,
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'), expires_at timestamptz not null,
  consumed_at timestamptz, created_at timestamptz not null default now()
);
create index if not exists auth_email_challenges_active_idx on public.auth_email_challenges(user_id,purpose,expires_at) where consumed_at is null;

create table if not exists public.voice_assets (
  id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id) on delete cascade,
  owner_user_id uuid references public.app_users(id) on delete cascade, guest_session_hash text references public.guest_sessions(session_hash) on delete restrict,
  duration_ms integer not null check (duration_ms between 500 and 600000), mime_type text not null check (mime_type in ('audio/webm','audio/ogg','audio/mp4','audio/wav')),
  file_size bigint not null check (file_size>0), checksum text not null check (checksum ~ '^[0-9a-f]{64}$'), storage_key text not null unique,
  status text not null default 'DRAFT' check (status in ('DRAFT','READY','SUPERSEDED','CANCELLED','CLEANING','DELETED')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check ((owner_user_id is not null) <> (guest_session_hash is not null))
);
create index if not exists voice_assets_project_status_idx on public.voice_assets(project_id,status,created_at desc);
create unique index if not exists voice_assets_active_checksum_unique on public.voice_assets(project_id,checksum) where status in ('DRAFT','READY');
create unique index if not exists voice_assets_one_draft_per_project on public.voice_assets(project_id) where status='DRAFT';
create table if not exists public.order_voice_selections (
  order_id uuid primary key references public.orders(id) on delete cascade,
  voice_mode text not null check (voice_mode in ('RECORD_ON_WEB','RECORD_AT_HOME')),
  voice_asset_id uuid references public.voice_assets(id) on delete restrict,
  duration_ms integer, mime_type text, file_size bigint, checksum text, storage_key text,
  created_at timestamptz not null default now(),
  check ((voice_mode='RECORD_ON_WEB' and voice_asset_id is not null and storage_key is not null) or (voice_mode='RECORD_AT_HOME' and voice_asset_id is null and storage_key is null))
);
create table if not exists public.voice_cleanup_jobs (
  id uuid primary key default gen_random_uuid(), voice_asset_id uuid not null unique references public.voice_assets(id) on delete cascade,
  status text not null default 'QUEUED' check (status in ('QUEUED','RUNNING','FAILED','SUCCESS','DEAD_LETTER')),
  attempts integer not null default 0, max_attempts integer not null default 5, last_error text,
  previous_status text not null check (previous_status in ('SUPERSEDED','CANCELLED')),
  next_attempt_at timestamptz, started_at timestamptz, completed_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (max_attempts>=1 and attempts between 0 and max_attempts)
);
create index if not exists voice_cleanup_retry_idx on public.voice_cleanup_jobs(status,next_attempt_at,created_at) where status in ('QUEUED','FAILED');

create or replace function public.melsou_protect_order_voice_selection()
returns trigger language plpgsql set search_path = public as $$
begin raise exception 'ORDER_VOICE_SELECTION_IMMUTABLE'; end $$;
drop trigger if exists protect_order_voice_selection on public.order_voice_selections;
create trigger protect_order_voice_selection before update or delete on public.order_voice_selections for each row execute procedure public.melsou_protect_order_voice_selection();

create or replace function public.melsou_register_native(p_username text,p_password_hash text,p_password_salt text,p_password_iterations integer)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_user uuid := gen_random_uuid();
begin
  if p_username !~ '^[a-z0-9][a-z0-9._-]{2,31}$' or p_password_hash !~ '^[0-9a-f]{64}$' or p_password_salt !~ '^[0-9a-f]{32}$' or p_password_iterations<100000 then raise exception 'INVALID_NATIVE_REGISTRATION'; end if;
  perform pg_advisory_xact_lock(hashtextextended('username:'||p_username,0));
  if exists(select 1 from public.profiles where lower(username)=p_username) then raise exception 'USERNAME_TAKEN'; end if;
  insert into public.app_users(id,identity_kind) values(v_user,'NATIVE');
  insert into public.profiles(user_id,username,display_name) values(v_user,p_username,p_username);
  insert into public.native_credentials(user_id,password_hash,password_salt,password_iterations) values(v_user,p_password_hash,p_password_salt,p_password_iterations);
  insert into public.audit_logs(actor_id,action,resource_type,resource_id) values(v_user,'NATIVE_ACCOUNT_CREATED','profile',v_user::text);
  return jsonb_build_object('id',v_user,'username',p_username,'role','CUSTOMER');
end $$;

create or replace function public.melsou_native_login_failure(p_user_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_failed integer; v_locked timestamptz;
begin
  update public.native_credentials set failed_attempts=least(failed_attempts+1,100),
    locked_until=case when failed_attempts+1>=5 then now()+interval '15 minutes' else locked_until end,updated_at=now()
    where user_id=p_user_id returning failed_attempts,locked_until into v_failed,v_locked;
  return jsonb_build_object('failed_attempts',v_failed,'locked_until',v_locked);
end $$;

create or replace function public.melsou_native_login_success(p_user_id uuid,p_token_hash text,p_expires_at timestamptz)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_session uuid;
begin
  if p_token_hash !~ '^[0-9a-f]{64}$' or p_expires_at<=now() or p_expires_at>now()+interval '31 days' then raise exception 'INVALID_SESSION'; end if;
  update public.native_credentials set failed_attempts=0,locked_until=null,updated_at=now() where user_id=p_user_id;
  insert into public.native_sessions(user_id,token_hash,expires_at) values(p_user_id,p_token_hash,p_expires_at) returning id into v_session;
  delete from public.native_sessions where user_id=p_user_id and (expires_at<=now() or revoked_at is not null or id not in (select id from public.native_sessions where user_id=p_user_id and revoked_at is null order by created_at desc limit 10));
  return jsonb_build_object('session_id',v_session,'expires_at',p_expires_at);
end $$;

create or replace function public.melsou_native_session_user(p_token_hash text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_session public.native_sessions; v_profile public.profiles;
begin
  select * into v_session from public.native_sessions where token_hash=p_token_hash and revoked_at is null and expires_at>now() for update;
  if not found then return null; end if;
  update public.native_sessions set last_seen_at=now() where id=v_session.id;
  select * into v_profile from public.profiles where user_id=v_session.user_id;
  return jsonb_build_object('id',v_profile.user_id,'username',v_profile.username,'email',v_profile.email,'email_verified',v_profile.email_verified_at is not null,'role',v_profile.role,'provider','NATIVE');
end $$;

create or replace function public.melsou_revoke_native_session(p_token_hash text)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_count integer;
begin update public.native_sessions set revoked_at=coalesce(revoked_at,now()) where token_hash=p_token_hash and revoked_at is null; get diagnostics v_count=row_count; return v_count>0; end $$;

create or replace function public.melsou_change_username(p_user_id uuid,p_username text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_profile public.profiles;
begin
  if p_username !~ '^[a-z0-9][a-z0-9._-]{2,31}$' then raise exception 'INVALID_USERNAME'; end if;
  perform pg_advisory_xact_lock(hashtextextended('username:'||p_username,0));
  select * into v_profile from public.profiles where user_id=p_user_id for update;
  if not found then raise exception 'PROFILE_NOT_FOUND'; end if;
  if v_profile.username_changed_at is not null and v_profile.username_changed_at>now()-interval '30 days' then raise exception 'USERNAME_CHANGE_COOLDOWN'; end if;
  if exists(select 1 from public.profiles where lower(username)=p_username and user_id<>p_user_id) then raise exception 'USERNAME_TAKEN'; end if;
  update public.profiles set username=p_username,username_changed_at=now(),updated_at=now() where user_id=p_user_id;
  insert into public.audit_logs(actor_id,action,resource_type,resource_id) values(p_user_id,'USERNAME_CHANGED','profile',p_user_id::text);
  return jsonb_build_object('username',p_username,'username_changed_at',now());
end $$;

create or replace function public.melsou_create_email_challenge(p_user_id uuid,p_email text,p_purpose text,p_token_hash text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_profile public.profiles; v_expiry timestamptz := now()+interval '30 minutes';
begin
  if p_purpose not in ('LINK_EMAIL','RECOVER_PASSWORD') or p_token_hash !~ '^[0-9a-f]{64}$' or p_email<>lower(p_email) then raise exception 'INVALID_EMAIL_CHALLENGE'; end if;
  select * into v_profile from public.profiles where user_id=p_user_id for update; if not found then raise exception 'PROFILE_NOT_FOUND'; end if;
  if p_purpose='LINK_EMAIL' and exists(select 1 from public.profiles where lower(email)=p_email and user_id<>p_user_id) then raise exception 'EMAIL_ALREADY_LINKED'; end if;
  if p_purpose='RECOVER_PASSWORD' and (v_profile.email is distinct from p_email or v_profile.email_verified_at is null) then raise exception 'RECOVERY_EMAIL_REQUIRED'; end if;
  update public.auth_email_challenges set consumed_at=now() where user_id=p_user_id and purpose=p_purpose and consumed_at is null;
  insert into public.auth_email_challenges(user_id,purpose,email,token_hash,expires_at) values(p_user_id,p_purpose,p_email,p_token_hash,v_expiry);
  return jsonb_build_object('expires_at',v_expiry);
end $$;

create or replace function public.melsou_verify_linked_email(p_user_id uuid,p_token_hash text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_challenge public.auth_email_challenges;
begin
  select * into v_challenge from public.auth_email_challenges where user_id=p_user_id and purpose='LINK_EMAIL' and token_hash=p_token_hash and consumed_at is null and expires_at>now() for update;
  if not found then raise exception 'EMAIL_VERIFICATION_INVALID'; end if;
  if exists(select 1 from public.profiles where lower(email)=v_challenge.email and user_id<>p_user_id) then raise exception 'EMAIL_ALREADY_LINKED'; end if;
  update public.profiles set email=v_challenge.email,email_verified_at=now(),updated_at=now() where user_id=p_user_id;
  update public.auth_email_challenges set consumed_at=now() where id=v_challenge.id;
  insert into public.audit_logs(actor_id,action,resource_type,resource_id) values(p_user_id,'EMAIL_LINK_VERIFIED','profile',p_user_id::text);
  return jsonb_build_object('email',v_challenge.email,'email_verified',true);
end $$;

create or replace function public.melsou_recover_native_password(p_token_hash text,p_password_hash text,p_password_salt text,p_password_iterations integer)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_challenge public.auth_email_challenges;
begin
  select * into v_challenge from public.auth_email_challenges where purpose='RECOVER_PASSWORD' and token_hash=p_token_hash and consumed_at is null and expires_at>now() for update;
  if not found then raise exception 'RECOVERY_TOKEN_INVALID'; end if;
  update public.native_credentials set password_hash=p_password_hash,password_salt=p_password_salt,password_iterations=p_password_iterations,
    password_changed_at=now(),failed_attempts=0,locked_until=null,updated_at=now() where user_id=v_challenge.user_id;
  if not found then raise exception 'NATIVE_CREDENTIAL_NOT_FOUND'; end if;
  update public.auth_email_challenges set consumed_at=now() where id=v_challenge.id;
  update public.native_sessions set revoked_at=coalesce(revoked_at,now()) where user_id=v_challenge.user_id and revoked_at is null;
  insert into public.audit_logs(actor_id,action,resource_type,resource_id) values(v_challenge.user_id,'PASSWORD_RECOVERED','profile',v_challenge.user_id::text);
  return jsonb_build_object('reset',true);
end $$;

create or replace function public.melsou_update_native_password(p_user_id uuid,p_expected_password_hash text,p_password_hash text,p_password_salt text,p_password_iterations integer)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  update public.native_credentials set password_hash=p_password_hash,password_salt=p_password_salt,password_iterations=p_password_iterations,
    password_changed_at=now(),failed_attempts=0,locked_until=null,updated_at=now() where user_id=p_user_id and password_hash=p_expected_password_hash;
  if not found then raise exception 'CREDENTIAL_CHANGED_RETRY'; end if;
  update public.native_sessions set revoked_at=coalesce(revoked_at,now()) where user_id=p_user_id and revoked_at is null;
  insert into public.audit_logs(actor_id,action,resource_type,resource_id) values(p_user_id,'PASSWORD_CHANGED','profile',p_user_id::text);
  return true;
end $$;

create or replace function public.melsou_cleanup_auth_state()
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_sessions integer; v_challenges integer;
begin
  delete from public.native_sessions where expires_at<now()-interval '7 days' or revoked_at<now()-interval '7 days'; get diagnostics v_sessions=row_count;
  delete from public.auth_email_challenges where expires_at<now()-interval '7 days' or consumed_at<now()-interval '7 days'; get diagnostics v_challenges=row_count;
  return jsonb_build_object('sessions',v_sessions,'challenges',v_challenges);
end $$;

create or replace function public.melsou_propagate_claimed_voice()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.owner_user_id is null and new.owner_user_id is not null and old.guest_session_hash is not null then
    update public.voice_assets set owner_user_id=new.owner_user_id,guest_session_hash=null,updated_at=now()
      where project_id=new.id and guest_session_hash=old.guest_session_hash;
  end if;
  return new;
end $$;
drop trigger if exists propagate_claimed_voice on public.projects;
create trigger propagate_claimed_voice after update of owner_user_id on public.projects for each row execute procedure public.melsou_propagate_claimed_voice();

create or replace function public.melsou_commit_voice(p_project_id uuid,p_actor_user_id uuid,p_guest_session_hash text,p_expected_revision integer,p_voice_mode text,p_voice_asset_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_project public.projects; v_asset public.voice_assets; v_old_id uuid; v_voice jsonb; v_revision integer;
begin
  select * into v_project from public.projects where id=p_project_id and trashed_at is null and (
    owner_user_id=p_actor_user_id or (owner_user_id is null and guest_session_hash=p_guest_session_hash) or
    exists(select 1 from public.project_duo_members where project_id=p_project_id and user_id=p_actor_user_id and active)
  ) for update;
  if not found then raise exception 'PROJECT_EDITOR_REQUIRED'; end if;
  if v_project.document->'voice'->>'mode'=p_voice_mode and (v_project.document->'voice'->>'asset_id') is not distinct from p_voice_asset_id::text then
    return jsonb_build_object('project_id',v_project.id,'revision',v_project.revision,'voice',v_project.document->'voice','duplicate',true);
  end if;
  if v_project.revision<>p_expected_revision then return jsonb_build_object('conflict',true,'revision',v_project.revision); end if;
  v_old_id := nullif(v_project.document->'voice'->>'asset_id','')::uuid;
  if p_voice_mode='RECORD_ON_WEB' then
    select * into v_asset from public.voice_assets where id=p_voice_asset_id and project_id=p_project_id and status in ('DRAFT','READY') and (
      owner_user_id=p_actor_user_id or (owner_user_id is null and guest_session_hash=p_guest_session_hash)
    ) for update;
    if not found then raise exception 'VOICE_ASSET_NOT_FOUND'; end if;
    update public.voice_assets set status='READY',updated_at=now() where id=v_asset.id;
    v_voice := jsonb_build_object('mode','RECORD_ON_WEB','asset_id',v_asset.id,'duration_ms',v_asset.duration_ms,'mime_type',v_asset.mime_type,'size',v_asset.file_size,'checksum',v_asset.checksum);
  elsif p_voice_mode='RECORD_AT_HOME' then
    if p_voice_asset_id is not null then raise exception 'VOICE_ASSET_NOT_ALLOWED'; end if;
    v_voice := jsonb_build_object('mode','RECORD_AT_HOME','asset_id',null);
  else raise exception 'INVALID_VOICE_MODE'; end if;
  update public.projects set document=jsonb_set(document,'{voice}',v_voice,true),revision=revision+1,last_activity_at=now(),updated_at=now()
    where id=p_project_id returning revision into v_revision;
  if v_old_id is not null and v_old_id is distinct from p_voice_asset_id then
    update public.voice_assets set status='SUPERSEDED',updated_at=now() where id=v_old_id and project_id=p_project_id and status='READY';
    insert into public.voice_cleanup_jobs(voice_asset_id,previous_status) values(v_old_id,'SUPERSEDED') on conflict(voice_asset_id) do update set status=case when public.voice_cleanup_jobs.status='SUCCESS' then 'QUEUED' else public.voice_cleanup_jobs.status end,previous_status='SUPERSEDED',updated_at=now();
  end if;
  return jsonb_build_object('project_id',p_project_id,'revision',v_revision,'voice',v_voice,'duplicate',false);
end $$;

create or replace function public.melsou_request_voice_cleanup(p_project_id uuid,p_actor_user_id uuid,p_guest_session_hash text,p_voice_asset_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_count integer;
begin
  update public.voice_assets a set status='CANCELLED',updated_at=now() where a.id=p_voice_asset_id and a.project_id=p_project_id and a.status='DRAFT' and (
    a.owner_user_id=p_actor_user_id or (a.owner_user_id is null and a.guest_session_hash=p_guest_session_hash)
  ) and exists(select 1 from public.projects p where p.id=p_project_id and p.trashed_at is null and (p.owner_user_id=p_actor_user_id or (p.owner_user_id is null and p.guest_session_hash=p_guest_session_hash)));
  get diagnostics v_count=row_count;
  if v_count>0 then insert into public.voice_cleanup_jobs(voice_asset_id,previous_status) values(p_voice_asset_id,'CANCELLED') on conflict(voice_asset_id) do nothing; end if;
  return v_count>0;
end $$;

create or replace function public.melsou_enqueue_stale_voice_drafts()
returns integer language plpgsql security definer set search_path = public as $$
declare v_count integer;
begin
  with stale as (
    update public.voice_assets set status='CANCELLED',updated_at=now() where status='DRAFT' and created_at<now()-interval '24 hours' returning id
  ) insert into public.voice_cleanup_jobs(voice_asset_id,previous_status) select id,'CANCELLED' from stale on conflict(voice_asset_id) do nothing;
  get diagnostics v_count=row_count; return v_count;
end $$;

create or replace function public.melsou_claim_voice_cleanup()
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_job public.voice_cleanup_jobs;
begin
  select * into v_job from public.voice_cleanup_jobs where attempts<max_attempts and (
    (status in ('QUEUED','FAILED') and (next_attempt_at is null or next_attempt_at<=now())) or (status='RUNNING' and started_at<now()-interval '15 minutes')
  ) order by created_at for update skip locked limit 1;
  if not found then return null; end if;
  perform 1 from public.voice_assets where id=v_job.voice_asset_id for update;
  update public.voice_cleanup_jobs set status='RUNNING',attempts=attempts+1,last_error=null,next_attempt_at=null,started_at=now(),updated_at=now() where id=v_job.id returning * into v_job;
  if not exists(select 1 from public.order_voice_selections where voice_asset_id=v_job.voice_asset_id) then
    update public.voice_assets set status='CLEANING',updated_at=now() where id=v_job.voice_asset_id and status in ('SUPERSEDED','CANCELLED');
  end if;
  return jsonb_build_object('id',v_job.id,'voice_asset_id',v_job.voice_asset_id,'attempts',v_job.attempts,'max_attempts',v_job.max_attempts);
end $$;

create or replace function public.melsou_complete_voice_cleanup(p_job_id uuid,p_retained boolean)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_asset uuid;
begin
  select voice_asset_id into v_asset from public.voice_cleanup_jobs where id=p_job_id for update; if not found then raise exception 'VOICE_CLEANUP_NOT_FOUND'; end if;
  if not p_retained then update public.voice_assets set status='DELETED',updated_at=now() where id=v_asset; end if;
  update public.voice_cleanup_jobs set status='SUCCESS',completed_at=now(),last_error=null,next_attempt_at=null,updated_at=now() where id=p_job_id;
  return true;
end $$;

create or replace function public.melsou_fail_voice_cleanup(p_job_id uuid,p_error text)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_job public.voice_cleanup_jobs; v_status text;
begin
  select * into v_job from public.voice_cleanup_jobs where id=p_job_id for update; if not found then raise exception 'VOICE_CLEANUP_NOT_FOUND'; end if;
  v_status:=case when v_job.attempts>=v_job.max_attempts then 'DEAD_LETTER' else 'FAILED' end;
  update public.voice_cleanup_jobs set status=v_status,last_error=left(coalesce(p_error,'VOICE_CLEANUP_FAILED'),120),
    next_attempt_at=case when v_status='FAILED' then now()+make_interval(secs=>least(3600,power(2,greatest(v_job.attempts,1))::integer*30)) else null end,updated_at=now() where id=p_job_id;
  update public.voice_assets set status=v_job.previous_status,updated_at=now() where id=v_job.voice_asset_id and status='CLEANING';
  return true;
end $$;

create or replace function public.melsou_create_order_v3(
  p_customer_id uuid,p_project_id uuid,p_package_code text,p_quote jsonb,p_shipments jsonb,p_preflight jsonb,p_idempotency_key text,p_payment_mode text
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_created jsonb; v_order_id uuid; v_document jsonb; v_mode text; v_asset public.voice_assets;
begin
  v_created:=public.melsou_create_order_v2(p_customer_id,p_project_id,p_package_code,p_quote,p_shipments,p_preflight,p_idempotency_key,p_payment_mode);
  v_order_id:=(v_created->>'id')::uuid;
  select s.document into v_document from public.orders o join public.production_snapshots s on s.id=o.production_snapshot_id where o.id=v_order_id;
  v_mode:=v_document->'voice'->>'mode';
  if coalesce((v_created->>'duplicate')::boolean,false) and p_package_code in ('VOICE','SIGNATURE') and v_mode is null then
    return v_created || jsonb_build_object('voice_legacy',true);
  end if;
  if p_package_code in ('VOICE','SIGNATURE') and v_mode not in ('RECORD_ON_WEB','RECORD_AT_HOME') then raise exception 'VOICE_SELECTION_REQUIRED'; end if;
  if v_mode='RECORD_ON_WEB' then
    select * into v_asset from public.voice_assets where id=(v_document->'voice'->>'asset_id')::uuid and project_id=p_project_id and status in ('READY','SUPERSEDED') for update;
    if not found then raise exception 'VOICE_ASSET_NOT_READY'; end if;
    insert into public.order_voice_selections(order_id,voice_mode,voice_asset_id,duration_ms,mime_type,file_size,checksum,storage_key)
      values(v_order_id,v_mode,v_asset.id,v_asset.duration_ms,v_asset.mime_type,v_asset.file_size,v_asset.checksum,v_asset.storage_key) on conflict(order_id) do nothing;
  elsif v_mode='RECORD_AT_HOME' then
    insert into public.order_voice_selections(order_id,voice_mode) values(v_order_id,v_mode) on conflict(order_id) do nothing;
  end if;
  return v_created;
end $$;

alter table public.app_users enable row level security;
alter table public.native_credentials enable row level security;
alter table public.native_sessions enable row level security;
alter table public.auth_email_challenges enable row level security;
alter table public.voice_assets enable row level security;
alter table public.order_voice_selections enable row level security;
alter table public.voice_cleanup_jobs enable row level security;

drop policy if exists "customer voice read" on public.voice_assets;
create policy "customer voice read" on public.voice_assets for select using(owner_user_id=auth.uid());
drop policy if exists "customer order voice read" on public.order_voice_selections;
create policy "customer order voice read" on public.order_voice_selections for select using(exists(select 1 from public.orders o where o.id=order_id and o.customer_id=auth.uid()));
-- Browser clients use the Worker contracts so private storage keys never become a
-- directly selectable client field. RLS remains defense in depth for future views.
revoke all on public.voice_assets,public.order_voice_selections from anon,authenticated;

revoke all on function public.melsou_register_native(text,text,text,integer) from public,anon,authenticated;
revoke all on function public.melsou_native_login_failure(uuid) from public,anon,authenticated;
revoke all on function public.melsou_native_login_success(uuid,text,timestamptz) from public,anon,authenticated;
revoke all on function public.melsou_native_session_user(text) from public,anon,authenticated;
revoke all on function public.melsou_revoke_native_session(text) from public,anon,authenticated;
revoke all on function public.melsou_change_username(uuid,text) from public,anon,authenticated;
revoke all on function public.melsou_create_email_challenge(uuid,text,text,text) from public,anon,authenticated;
revoke all on function public.melsou_verify_linked_email(uuid,text) from public,anon,authenticated;
revoke all on function public.melsou_recover_native_password(text,text,text,integer) from public,anon,authenticated;
revoke all on function public.melsou_update_native_password(uuid,text,text,text,integer) from public,anon,authenticated;
revoke all on function public.melsou_cleanup_auth_state() from public,anon,authenticated;
revoke all on function public.melsou_commit_voice(uuid,uuid,text,integer,text,uuid) from public,anon,authenticated;
revoke all on function public.melsou_request_voice_cleanup(uuid,uuid,text,uuid) from public,anon,authenticated;
revoke all on function public.melsou_enqueue_stale_voice_drafts() from public,anon,authenticated;
revoke all on function public.melsou_claim_voice_cleanup() from public,anon,authenticated;
revoke all on function public.melsou_complete_voice_cleanup(uuid,boolean) from public,anon,authenticated;
revoke all on function public.melsou_fail_voice_cleanup(uuid,text) from public,anon,authenticated;
revoke all on function public.melsou_create_order_v3(uuid,uuid,text,jsonb,jsonb,jsonb,text,text) from public,anon,authenticated;
grant execute on function public.melsou_register_native(text,text,text,integer),public.melsou_native_login_failure(uuid),
  public.melsou_native_login_success(uuid,text,timestamptz),public.melsou_native_session_user(text),public.melsou_revoke_native_session(text),
  public.melsou_change_username(uuid,text),public.melsou_create_email_challenge(uuid,text,text,text),public.melsou_verify_linked_email(uuid,text),
  public.melsou_recover_native_password(text,text,text,integer),public.melsou_update_native_password(uuid,text,text,text,integer),
  public.melsou_cleanup_auth_state(),
  public.melsou_commit_voice(uuid,uuid,text,integer,text,uuid),public.melsou_request_voice_cleanup(uuid,uuid,text,uuid),
  public.melsou_enqueue_stale_voice_drafts(),
  public.melsou_claim_voice_cleanup(),public.melsou_complete_voice_cleanup(uuid,boolean),public.melsou_fail_voice_cleanup(uuid,text),
  public.melsou_create_order_v3(uuid,uuid,text,jsonb,jsonb,jsonb,text,text) to service_role;
