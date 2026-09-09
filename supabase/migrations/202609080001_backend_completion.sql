-- Additive V1 backend completion. Apply after 202609010001_asset_processing.sql.
-- Existing migrations remain immutable; all privileged functions are callable by service_role only.

alter table public.profiles
  add column if not exists notification_preferences jsonb not null default '{"orderUpdates":true,"paymentUpdates":true,"productionUpdates":true,"marketing":false}'::jsonb;

alter table public.projects add column if not exists status text not null default 'DRAFT';
alter table public.projects drop constraint if exists projects_status_check;
alter table public.projects add constraint projects_status_check check (status in ('DRAFT','LOCKED','TRASHED'));
alter table public.projects drop constraint if exists projects_owner_xor_guest_check;
alter table public.projects add constraint projects_owner_xor_guest_check
  check ((owner_user_id is not null) <> (guest_session_hash is not null)) not valid;

alter table public.orders
  add column if not exists checkout_idempotency_key text,
  add column if not exists payment_expires_at timestamptz,
  add column if not exists tracking_verifier_hash text;
create unique index if not exists orders_customer_checkout_idempotency_unique
  on public.orders(customer_id, checkout_idempotency_key) where checkout_idempotency_key is not null;
create index if not exists orders_payment_expiry_idx
  on public.orders(payment_expires_at) where status = 'AWAITING_PAYMENT';
create index if not exists orders_tracking_lookup_idx
  on public.orders(order_code, tracking_verifier_hash);
update public.orders set payment_expires_at=created_at+interval '30 minutes'
  where status='AWAITING_PAYMENT' and payment_expires_at is null;
update public.orders o set tracking_verifier_hash=encode(digest(regexp_replace(s.address_snapshot->>'phone','[^0-9]','','g'),'sha256'),'hex')
  from public.shipments s where s.order_id=o.id and s.sequence=1 and o.tracking_verifier_hash is null
    and length(regexp_replace(s.address_snapshot->>'phone','[^0-9]','','g')) between 9 and 15;

alter table public.payment_events
  add column if not exists signature_verified_at timestamptz;

alter table public.render_jobs
  add column if not exists max_attempts integer not null default 5,
  add column if not exists last_error text,
  add column if not exists next_attempt_at timestamptz,
  add column if not exists started_at timestamptz,
  add column if not exists completed_at timestamptz;
update public.render_jobs set last_error=coalesce(last_error,error_code),max_attempts=greatest(max_attempts,attempts);
alter table public.render_jobs drop constraint if exists render_jobs_status_check;
alter table public.render_jobs add constraint render_jobs_status_check check (status in ('QUEUED','RUNNING','SUCCESS','FAILED','DEAD_LETTER'));
alter table public.render_jobs drop constraint if exists render_jobs_max_attempts_check;
alter table public.render_jobs add constraint render_jobs_max_attempts_check check (max_attempts >= 1 and attempts between 0 and max_attempts);
create index if not exists render_jobs_retry_idx on public.render_jobs(status, next_attempt_at, created_at) where status in ('QUEUED','FAILED');

alter table public.archive_jobs
  add column if not exists max_attempts integer not null default 5,
  add column if not exists last_error text,
  add column if not exists next_attempt_at timestamptz,
  add column if not exists started_at timestamptz,
  add column if not exists completed_at timestamptz;
update public.archive_jobs set last_error=coalesce(last_error,error_code),max_attempts=greatest(max_attempts,attempts);
alter table public.archive_jobs drop constraint if exists archive_jobs_status_check;
alter table public.archive_jobs add constraint archive_jobs_status_check check (status in ('QUEUED','RUNNING','SUCCESS','FAILED','DEAD_LETTER'));
alter table public.archive_jobs drop constraint if exists archive_jobs_max_attempts_check;
alter table public.archive_jobs add constraint archive_jobs_max_attempts_check check (max_attempts >= 1 and attempts between 0 and max_attempts);
create index if not exists archive_jobs_retry_idx on public.archive_jobs(status, next_attempt_at, created_at) where status in ('QUEUED','FAILED');

alter table public.reporting_outbox
  add column if not exists status text not null default 'QUEUED',
  add column if not exists max_attempts integer not null default 8,
  add column if not exists last_error text,
  add column if not exists next_attempt_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();
alter table public.reporting_outbox drop constraint if exists reporting_outbox_status_check;
alter table public.reporting_outbox add constraint reporting_outbox_status_check check (status in ('QUEUED','PROCESSING','DELIVERED','FAILED','DEAD_LETTER'));
update public.reporting_outbox set status='DELIVERED',updated_at=now() where delivered_at is not null and status<>'DELIVERED';
alter table public.reporting_outbox drop constraint if exists reporting_outbox_attempts_check;
update public.reporting_outbox set max_attempts=greatest(max_attempts,attempts);
alter table public.reporting_outbox add constraint reporting_outbox_attempts_check check (max_attempts >= 1 and attempts between 0 and max_attempts);
create index if not exists reporting_outbox_retry_idx on public.reporting_outbox(status, next_attempt_at, created_at) where delivered_at is null;

create table if not exists public.guest_sessions (
  session_hash text primary key check (session_hash ~ '^[0-9a-f]{64}$'),
  expires_at timestamptz not null,
  last_activity_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists guest_sessions_expiry_idx on public.guest_sessions(expires_at);
alter table public.projects drop constraint if exists projects_guest_session_fk;
alter table public.projects add constraint projects_guest_session_fk foreign key(guest_session_hash)
  references public.guest_sessions(session_hash) on delete restrict not valid;

create table if not exists public.project_checkpoints (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  project_revision integer not null check (project_revision > 0),
  reason text not null check (reason in ('STEP_CHANGE','PREVIEW','DESIGN_LOCK')),
  document jsonb not null check (jsonb_typeof(document) = 'object'),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(project_id, project_revision, reason)
);
create index if not exists project_checkpoints_recent_idx on public.project_checkpoints(project_id, created_at desc);

create table if not exists public.guest_claimed_projects (
  guest_session_hash text not null references public.guest_sessions(session_hash) on delete restrict,
  project_id uuid primary key references public.projects(id) on delete cascade,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  claimed_at timestamptz not null default now(),
  unique(guest_session_hash, project_id)
);
create index if not exists guest_claimed_projects_owner_idx on public.guest_claimed_projects(owner_user_id, claimed_at desc);

create table if not exists public.template_versions (
  template_id text not null,
  version integer not null check (version > 0),
  enabled boolean not null default true,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  definition_checksum text,
  created_at timestamptz not null default now(),
  primary key(template_id, version)
);
insert into public.template_versions(template_id, version, metadata) values
  ('first-love',1,'{"title":"First Love"}'::jsonb),
  ('our-graduation',1,'{"title":"Our Graduation"}'::jsonb),
  ('besties-archive',1,'{"title":"Besties Archive"}'::jsonb),
  ('somewhere-together',1,'{"title":"Somewhere Together"}'::jsonb),
  ('birthday-letters',1,'{"title":"Birthday Letters"}'::jsonb),
  ('quiet-moments',1,'{"title":"Quiet Moments"}'::jsonb),
  ('memory-box',1,'{"title":"Memory Box"}'::jsonb),
  ('melsou-editorial',1,'{"title":"Melsou Editorial"}'::jsonb)
on conflict(template_id, version) do nothing;
alter table public.projects drop constraint if exists projects_template_version_fk;
alter table public.projects add constraint projects_template_version_fk foreign key(template_id,template_version)
  references public.template_versions(template_id,version) on delete restrict not valid;
alter table public.production_snapshots drop constraint if exists production_snapshots_template_version_fk;
alter table public.production_snapshots add constraint production_snapshots_template_version_fk foreign key(template_id,template_version)
  references public.template_versions(template_id,version) on delete restrict not valid;
alter table public.production_snapshots drop constraint if exists production_snapshots_pricing_version_fk;
alter table public.production_snapshots add constraint production_snapshots_pricing_version_fk foreign key(pricing_version)
  references public.pricing_versions(version) on delete restrict not valid;
alter table public.production_snapshots drop constraint if exists production_snapshots_print_profile_fk;
alter table public.production_snapshots add constraint production_snapshots_print_profile_fk foreign key(print_profile_version)
  references public.print_profiles(version) on delete restrict not valid;
alter table public.orders drop constraint if exists orders_pricing_version_fk;
alter table public.orders add constraint orders_pricing_version_fk foreign key(pricing_version)
  references public.pricing_versions(version) on delete restrict not valid;

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references auth.users(id) on delete cascade,
  guest_session_hash text references public.guest_sessions(session_hash) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  pricing_version integer not null,
  configuration jsonb not null check (jsonb_typeof(configuration) = 'object'),
  price_snapshot jsonb not null check (jsonb_typeof(price_snapshot) = 'object'),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  check ((owner_user_id is not null) <> (guest_session_hash is not null))
);
create index if not exists quotes_owner_recent_idx on public.quotes(owner_user_id, created_at desc);
create index if not exists quotes_guest_recent_idx on public.quotes(guest_session_hash, created_at desc);

create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'ACTIVE' check (status in ('ACTIVE','CONVERTED','ABANDONED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists carts_one_active_per_customer on public.carts(customer_id) where status = 'ACTIVE';

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  project_revision integer not null check (project_revision > 0),
  configuration jsonb not null check (jsonb_typeof(configuration) = 'object'),
  checked_out_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(cart_id, project_id)
);
create index if not exists cart_items_project_idx on public.cart_items(project_id);

create table if not exists public.payment_attempts (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  provider text not null default 'SEPAY' check (provider = 'SEPAY'),
  mode text not null check (mode in ('TEST','LIVE')),
  payment_reference text not null unique,
  expected_amount_vnd integer not null check (expected_amount_vnd > 0),
  currency text not null default 'VND' check (currency = 'VND'),
  status text not null default 'PENDING' check (status in ('PENDING','PAID','EXPIRED','MISMATCH','CANCELLED')),
  expires_at timestamptz not null,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(order_id)
);
create index if not exists payment_attempts_expiry_idx on public.payment_attempts(expires_at) where status = 'PENDING';

create table if not exists public.order_lines (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  project_id uuid not null references public.projects(id),
  package_code text not null check (package_code in ('MELODY','VOICE','SIGNATURE')),
  configuration jsonb not null check (jsonb_typeof(configuration)='object'),
  quantity smallint not null check (quantity in (1,2)),
  amount_vnd integer not null check (amount_vnd>0),
  created_at timestamptz not null default now(),
  unique(order_id, project_id)
);
create index if not exists order_lines_project_idx on public.order_lines(project_id);

create table if not exists public.order_events (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  event_type text not null,
  status public.melsou_order_status,
  public_visible boolean not null default true,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now()
);
create index if not exists order_events_timeline_idx on public.order_events(order_id, created_at, id);

create table if not exists public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users(id) on delete cascade,
  label text not null default 'Địa chỉ',
  recipient text not null,
  phone text not null,
  address text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists customer_addresses_one_default on public.customer_addresses(customer_id) where is_default;

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (length(title) between 1 and 180),
  excerpt text not null default '' check (length(excerpt) <= 500),
  content text not null check (length(content) between 1 and 100000),
  cover_asset_id uuid references public.project_assets(id) on delete set null,
  author_id uuid not null references auth.users(id),
  status text not null default 'DRAFT' check (status in ('DRAFT','PUBLISHED','ARCHIVED')),
  category text,
  tags text[] not null default '{}',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status = 'PUBLISHED' and published_at is not null) or status <> 'PUBLISHED')
);
create index if not exists blog_posts_public_idx on public.blog_posts(published_at desc) where status = 'PUBLISHED';

create or replace function public.melsou_protect_production_snapshot()
returns trigger language plpgsql set search_path = public as $$
begin raise exception 'PRODUCTION_SNAPSHOT_IMMUTABLE'; end $$;
drop trigger if exists protect_production_snapshot on public.production_snapshots;
create trigger protect_production_snapshot before update or delete on public.production_snapshots for each row execute procedure public.melsou_protect_production_snapshot();

create or replace function public.melsou_protect_order_expectation()
returns trigger language plpgsql set search_path = public as $$
begin
  if old.order_code is distinct from new.order_code or old.customer_id is distinct from new.customer_id
    or old.production_snapshot_id is distinct from new.production_snapshot_id or old.pricing_version is distinct from new.pricing_version
    or old.payment_code is distinct from new.payment_code or old.expected_amount_vnd is distinct from new.expected_amount_vnd
    or old.price_snapshot is distinct from new.price_snapshot
    or (old.payment_expires_at is not null and old.payment_expires_at is distinct from new.payment_expires_at)
    or (old.checkout_idempotency_key is not null and old.checkout_idempotency_key is distinct from new.checkout_idempotency_key)
    or (old.tracking_verifier_hash is not null and old.tracking_verifier_hash is distinct from new.tracking_verifier_hash) then raise exception 'ORDER_EXPECTATION_IMMUTABLE'; end if;
  return new;
end $$;
drop trigger if exists protect_order_expectation on public.orders;
create trigger protect_order_expectation before update on public.orders for each row execute procedure public.melsou_protect_order_expectation();

create or replace function public.melsou_protect_payment_attempt_expectation()
returns trigger language plpgsql set search_path = public as $$
begin
  if old.order_id is distinct from new.order_id or old.provider is distinct from new.provider or old.mode is distinct from new.mode
    or old.payment_reference is distinct from new.payment_reference or old.expected_amount_vnd is distinct from new.expected_amount_vnd
    or old.currency is distinct from new.currency or old.expires_at is distinct from new.expires_at then
    raise exception 'PAYMENT_EXPECTATION_IMMUTABLE';
  end if;
  return new;
end $$;
drop trigger if exists protect_payment_attempt_expectation on public.payment_attempts;
create trigger protect_payment_attempt_expectation before update on public.payment_attempts for each row execute procedure public.melsou_protect_payment_attempt_expectation();

create or replace function public.melsou_enforce_order_transition()
returns trigger language plpgsql set search_path = public as $$
begin
  if old.status is not distinct from new.status then return new; end if;
  if (old.status,new.status) not in (
    ('AWAITING_PAYMENT','PAID'),('AWAITING_PAYMENT','PAYMENT_EXPIRED'),('AWAITING_PAYMENT','PAYMENT_MISMATCH'),('AWAITING_PAYMENT','CANCELLED'),
    ('PAYMENT_EXPIRED','PAYMENT_MISMATCH'),('PAYMENT_MISMATCH','PAID'),('PAYMENT_MISMATCH','CANCELLED'),
    ('PAID','RENDERING'),('RENDERING','PREPRESS_REVIEW'),('RENDERING','RENDER_FAILED'),('RENDER_FAILED','RENDERING'),
    ('PREPRESS_REVIEW','PRODUCTION'),('PRODUCTION','READY_TO_SHIP'),('READY_TO_SHIP','SHIPPING'),('READY_TO_SHIP','COMPLETED'),
    ('SHIPPING','COMPLETED'),('SHIPPING','DELIVERY_FAILED'),('DELIVERY_FAILED','SHIPPING'),
    ('PAID','REFUND_REQUESTED'),('PRODUCTION','REFUND_REQUESTED'),('READY_TO_SHIP','REFUND_REQUESTED'),
    ('REFUND_REQUESTED','REFUNDED'),('REFUND_REQUESTED','CANCELLED')
  ) then raise exception 'INVALID_ORDER_STATUS_TRANSITION:%->%',old.status,new.status; end if;
  return new;
end $$;
drop trigger if exists enforce_order_transition on public.orders;
create trigger enforce_order_transition before update of status on public.orders for each row execute procedure public.melsou_enforce_order_transition();

create or replace function public.melsou_is_owner(p_user_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where user_id = p_user_id and role = 'OWNER')
$$;
revoke all on function public.melsou_is_owner(uuid) from public;
grant execute on function public.melsou_is_owner(uuid) to authenticated, service_role;

create or replace function public.melsou_update_profile(p_user_id uuid, p_patch jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_profile public.profiles;
begin
  if jsonb_typeof(p_patch)<>'object' or (p_patch - array['display_name','notification_preferences'])<>'{}'::jsonb then raise exception 'INVALID_PROFILE_UPDATE'; end if;
  if p_patch ? 'display_name' and length(trim(coalesce(p_patch->>'display_name',''))) not between 1 and 120 then raise exception 'INVALID_DISPLAY_NAME'; end if;
  if p_patch ? 'notification_preferences' and (
    jsonb_typeof(p_patch->'notification_preferences')<>'object'
    or exists(select 1 from jsonb_object_keys(p_patch->'notification_preferences') key where key not in ('orderUpdates','paymentUpdates','productionUpdates','marketing'))
    or exists(select 1 from jsonb_each(p_patch->'notification_preferences') item where jsonb_typeof(item.value)<>'boolean')
  ) then raise exception 'INVALID_NOTIFICATION_PREFERENCES'; end if;
  update public.profiles set
    display_name=case when p_patch ? 'display_name' then trim(p_patch->>'display_name') else display_name end,
    notification_preferences=notification_preferences || coalesce(p_patch->'notification_preferences','{}'::jsonb),updated_at=now()
    where user_id=p_user_id returning * into v_profile;
  if not found then raise exception 'PROFILE_NOT_FOUND'; end if;
  insert into public.audit_logs(actor_id,action,resource_type,resource_id,after_state)
    values(p_user_id,'PROFILE_UPDATED','profile',p_user_id::text,jsonb_build_object('fields',(select jsonb_agg(key) from jsonb_object_keys(p_patch) key)));
  return jsonb_build_object('user_id',v_profile.user_id,'display_name',v_profile.display_name,'role',v_profile.role,'notification_preferences',v_profile.notification_preferences,'updated_at',v_profile.updated_at);
end $$;
revoke all on function public.melsou_update_profile(uuid,jsonb) from public, anon, authenticated;
grant execute on function public.melsou_update_profile(uuid,jsonb) to service_role;

create or replace function public.melsou_touch_guest_session(p_guest_session_hash text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_expiry timestamptz := now() + interval '14 days';
begin
  if p_guest_session_hash !~ '^[0-9a-f]{64}$' then raise exception 'INVALID_GUEST_SESSION'; end if;
  insert into public.guest_sessions(session_hash, expires_at) values(p_guest_session_hash, v_expiry)
  on conflict(session_hash) do update set expires_at=v_expiry,last_activity_at=now(),updated_at=now();
  return jsonb_build_object('expires_at',v_expiry);
end $$;
revoke all on function public.melsou_touch_guest_session(text) from public, anon, authenticated;
grant execute on function public.melsou_touch_guest_session(text) to service_role;

create or replace function public.melsou_claim_guest_projects(p_owner_id uuid, p_guest_session_hash text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_projects jsonb;
begin
  if p_guest_session_hash !~ '^[0-9a-f]{64}$' then raise exception 'INVALID_GUEST_SESSION'; end if;
  perform pg_advisory_xact_lock(hashtextextended('guest-claim:' || p_guest_session_hash,0));
  if exists(select 1 from public.guest_claimed_projects where guest_session_hash=p_guest_session_hash and owner_user_id<>p_owner_id) then
    raise exception using errcode='42501',message='GUEST_SESSION_ALREADY_CLAIMED';
  end if;
  with claimed as (
    update public.projects set owner_user_id=p_owner_id,guest_session_hash=null,last_activity_at=now(),updated_at=now()
    where owner_user_id is null and guest_session_hash=p_guest_session_hash and trashed_at is null
    returning id
  ) insert into public.guest_claimed_projects(guest_session_hash,project_id,owner_user_id)
    select p_guest_session_hash,id,p_owner_id from claimed on conflict(project_id) do nothing;
  select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'revision',p.revision,'title',p.title) order by p.last_activity_at desc),'[]'::jsonb)
    into v_projects from public.guest_claimed_projects g join public.projects p on p.id=g.project_id
    where g.guest_session_hash=p_guest_session_hash and g.owner_user_id=p_owner_id;
  insert into public.audit_logs(actor_id,action,resource_type,resource_id,after_state)
    values(p_owner_id,'GUEST_DRAFTS_CLAIMED','guest_session',p_guest_session_hash,jsonb_build_object('count',jsonb_array_length(v_projects)));
  return v_projects;
end $$;
revoke all on function public.melsou_claim_guest_projects(uuid,text) from public, anon, authenticated;
grant execute on function public.melsou_claim_guest_projects(uuid,text) to service_role;

create or replace function public.melsou_create_project_checkpoint(
  p_project_id uuid, p_actor_user_id uuid, p_guest_session_hash text, p_reason text
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_project public.projects; v_checkpoint public.project_checkpoints;
begin
  if p_reason not in ('STEP_CHANGE','PREVIEW','DESIGN_LOCK') then raise exception 'INVALID_CHECKPOINT_REASON'; end if;
  select * into v_project from public.projects where id=p_project_id and trashed_at is null and (
    owner_user_id=p_actor_user_id or
    (owner_user_id is null and guest_session_hash=p_guest_session_hash) or
    exists(select 1 from public.project_duo_members where project_id=p_project_id and user_id=p_actor_user_id and active)
  ) for update;
  if not found then raise exception using errcode='42501',message='PROJECT_EDITOR_REQUIRED'; end if;
  insert into public.project_checkpoints(project_id,project_revision,reason,document,created_by)
  values(v_project.id,v_project.revision,p_reason,v_project.document,p_actor_user_id)
  on conflict(project_id,project_revision,reason) do update set document=excluded.document
  returning * into v_checkpoint;
  delete from public.project_checkpoints where id in (
    select id from public.project_checkpoints where project_id=v_project.id order by created_at desc,id desc offset 10
  );
  return jsonb_build_object('id',v_checkpoint.id,'project_id',v_project.id,'project_revision',v_checkpoint.project_revision,'reason',v_checkpoint.reason,'created_at',v_checkpoint.created_at);
end $$;
revoke all on function public.melsou_create_project_checkpoint(uuid,uuid,text,text) from public, anon, authenticated;
grant execute on function public.melsou_create_project_checkpoint(uuid,uuid,text,text) to service_role;

create or replace function public.melsou_set_project_trash(p_owner_id uuid, p_project_id uuid, p_restore boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_project public.projects; v_before jsonb;
begin
  select * into v_project from public.projects where id=p_project_id and owner_user_id=p_owner_id for update;
  if not found then raise exception 'PROJECT_NOT_FOUND'; end if;
  v_before := jsonb_build_object('status',v_project.status,'trashed_at',v_project.trashed_at);
  if p_restore then
    if v_project.status<>'TRASHED' or v_project.trashed_at is null then raise exception 'PROJECT_NOT_FOUND'; end if;
    if v_project.trashed_at<=now()-interval '30 days' then raise exception 'TRASH_RETENTION_EXPIRED'; end if;
    update public.projects set status='DRAFT',trashed_at=null,updated_at=now(),last_activity_at=now()
      where id=p_project_id returning * into v_project;
  else
    if v_project.status<>'TRASHED' then
      update public.projects set status='TRASHED',trashed_at=now(),updated_at=now()
        where id=p_project_id returning * into v_project;
    end if;
  end if;
  insert into public.audit_logs(actor_id,action,resource_type,resource_id,before_state,after_state)
    values(p_owner_id,case when p_restore then 'PROJECT_RESTORED' else 'PROJECT_TRASHED' end,'project',p_project_id::text,v_before,
      jsonb_build_object('status',v_project.status,'trashed_at',v_project.trashed_at));
  return jsonb_build_object('id',v_project.id,'status',v_project.status,'trashed_at',v_project.trashed_at,'revision',v_project.revision);
end $$;
revoke all on function public.melsou_set_project_trash(uuid,uuid,boolean) from public, anon, authenticated;
grant execute on function public.melsou_set_project_trash(uuid,uuid,boolean) to service_role;

create or replace function public.melsou_save_customer_address(p_customer_id uuid, p_address_id uuid, p_address jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_address public.customer_addresses; v_default boolean;
begin
  if jsonb_typeof(p_address)<>'object' then raise exception 'INVALID_ADDRESS'; end if;
  perform pg_advisory_xact_lock(hashtextextended('address:' || p_customer_id::text,0));
  if p_address_id is null then
    v_default := coalesce((p_address->>'is_default')::boolean,false);
    if length(trim(coalesce(p_address->>'label',''))) not between 1 and 60
      or length(trim(coalesce(p_address->>'recipient',''))) not between 1 and 100
      or length(regexp_replace(coalesce(p_address->>'phone',''),'[^0-9]','','g')) not between 9 and 15
      or length(trim(coalesce(p_address->>'address',''))) not between 5 and 500 then raise exception 'INVALID_ADDRESS'; end if;
    if v_default then update public.customer_addresses set is_default=false,updated_at=now() where customer_id=p_customer_id and is_default; end if;
    insert into public.customer_addresses(customer_id,label,recipient,phone,address,is_default)
      values(p_customer_id,trim(p_address->>'label'),trim(p_address->>'recipient'),trim(p_address->>'phone'),trim(p_address->>'address'),v_default)
      returning * into v_address;
  else
    select * into v_address from public.customer_addresses where id=p_address_id and customer_id=p_customer_id for update;
    if not found then raise exception 'ADDRESS_NOT_FOUND'; end if;
    v_default := coalesce((p_address->>'is_default')::boolean,v_address.is_default);
    if v_default then update public.customer_addresses set is_default=false,updated_at=now() where customer_id=p_customer_id and id<>p_address_id and is_default; end if;
    update public.customer_addresses set
      label=trim(coalesce(p_address->>'label',v_address.label)),recipient=trim(coalesce(p_address->>'recipient',v_address.recipient)),
      phone=trim(coalesce(p_address->>'phone',v_address.phone)),address=trim(coalesce(p_address->>'address',v_address.address)),
      is_default=v_default,updated_at=now() where id=p_address_id returning * into v_address;
    if length(v_address.label) not between 1 and 60 or length(v_address.recipient) not between 1 and 100
      or length(regexp_replace(v_address.phone,'[^0-9]','','g')) not between 9 and 15
      or length(v_address.address) not between 5 and 500 then raise exception 'INVALID_ADDRESS'; end if;
  end if;
  insert into public.audit_logs(actor_id,action,resource_type,resource_id,after_state)
    values(p_customer_id,case when p_address_id is null then 'ADDRESS_CREATED' else 'ADDRESS_UPDATED' end,'customer_address',v_address.id::text,jsonb_build_object('is_default',v_address.is_default));
  return jsonb_build_object('id',v_address.id,'label',v_address.label,'recipient',v_address.recipient,'phone',v_address.phone,'address',v_address.address,'is_default',v_address.is_default,'updated_at',v_address.updated_at);
end $$;
revoke all on function public.melsou_save_customer_address(uuid,uuid,jsonb) from public, anon, authenticated;
grant execute on function public.melsou_save_customer_address(uuid,uuid,jsonb) to service_role;

create or replace function public.melsou_delete_customer_address(p_customer_id uuid, p_address_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_count integer;
begin
  delete from public.customer_addresses where id=p_address_id and customer_id=p_customer_id;
  get diagnostics v_count = row_count;
  if v_count>0 then insert into public.audit_logs(actor_id,action,resource_type,resource_id) values(p_customer_id,'ADDRESS_DELETED','customer_address',p_address_id::text); end if;
  return v_count>0;
end $$;
revoke all on function public.melsou_delete_customer_address(uuid,uuid) from public, anon, authenticated;
grant execute on function public.melsou_delete_customer_address(uuid,uuid) to service_role;

create or replace function public.melsou_upsert_cart_item(p_customer_id uuid, p_project_id uuid, p_configuration jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_project public.projects; v_cart public.carts; v_item public.cart_items;
begin
  perform pg_advisory_xact_lock(hashtextextended('cart:' || p_customer_id::text,0));
  select * into v_project from public.projects where id=p_project_id and owner_user_id=p_customer_id and trashed_at is null;
  if not found then raise exception using errcode='42501',message='PROJECT_NOT_FOUND'; end if;
  select * into v_cart from public.carts where customer_id=p_customer_id and status='ACTIVE' for update;
  if not found then insert into public.carts(customer_id) values(p_customer_id) returning * into v_cart; end if;
  insert into public.cart_items(cart_id,project_id,project_revision,configuration)
  values(v_cart.id,v_project.id,v_project.revision,p_configuration)
  on conflict(cart_id,project_id) do update set project_revision=excluded.project_revision,configuration=excluded.configuration,checked_out_at=null,updated_at=now()
  returning * into v_item;
  return jsonb_build_object('cart_id',v_cart.id,'item',to_jsonb(v_item));
end $$;
revoke all on function public.melsou_upsert_cart_item(uuid,uuid,jsonb) from public, anon, authenticated;
grant execute on function public.melsou_upsert_cart_item(uuid,uuid,jsonb) to service_role;

create or replace function public.melsou_remove_cart_item(p_customer_id uuid, p_project_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_count integer;
begin
  delete from public.cart_items i using public.carts c where i.cart_id=c.id and c.customer_id=p_customer_id and c.status='ACTIVE' and i.project_id=p_project_id;
  get diagnostics v_count = row_count;
  return v_count > 0;
end $$;
revoke all on function public.melsou_remove_cart_item(uuid,uuid) from public, anon, authenticated;
grant execute on function public.melsou_remove_cart_item(uuid,uuid) to service_role;

create or replace function public.melsou_create_order_v2(
  p_customer_id uuid, p_project_id uuid, p_package_code text, p_quote jsonb,
  p_shipments jsonb, p_preflight jsonb, p_idempotency_key text, p_payment_mode text
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_existing public.orders; v_existing_project uuid; v_created jsonb; v_order_id uuid; v_pricing_version integer; v_phone text; v_tracking_hash text;
begin
  if p_idempotency_key !~ '^[A-Za-z0-9][A-Za-z0-9._:-]{15,127}$' then raise exception 'INVALID_IDEMPOTENCY_KEY'; end if;
  if p_payment_mode not in ('TEST','LIVE') then raise exception 'PAYMENT_MODE_NOT_CONFIGURED'; end if;
  perform pg_advisory_xact_lock(hashtextextended('checkout:' || p_customer_id::text || ':' || p_idempotency_key,0));
  select o.* into v_existing from public.orders o
    where o.customer_id=p_customer_id and o.checkout_idempotency_key=p_idempotency_key;
  if found then
    select project_id into v_existing_project from public.production_snapshots where id=v_existing.production_snapshot_id;
    if v_existing_project <> p_project_id then raise exception 'IDEMPOTENCY_KEY_REUSED'; end if;
    return jsonb_build_object('id',v_existing.id,'order_code',v_existing.order_code,'expected_amount_vnd',v_existing.expected_amount_vnd,'status',v_existing.status,'payment_expires_at',v_existing.payment_expires_at,'duplicate',true);
  end if;
  v_phone := regexp_replace(coalesce(p_shipments->0->>'phone',''),'[^0-9]','','g');
  if length(v_phone) not between 9 and 15 then raise exception 'TRACKING_PHONE_REQUIRED'; end if;
  v_tracking_hash := encode(digest(v_phone,'sha256'),'hex');
  v_created := public.melsou_create_order(p_customer_id,p_project_id,p_package_code,p_quote,p_shipments,p_preflight);
  v_order_id := (v_created->>'id')::uuid;
  select pricing_version into v_pricing_version from public.orders where id=v_order_id;
  update public.orders set checkout_idempotency_key=p_idempotency_key,payment_expires_at=now()+interval '30 minutes',tracking_verifier_hash=v_tracking_hash where id=v_order_id;
  insert into public.quotes(owner_user_id,project_id,pricing_version,configuration,price_snapshot,expires_at)
  values(p_customer_id,p_project_id,v_pricing_version,p_quote,p_quote,now()+interval '15 minutes');
  insert into public.payment_attempts(order_id,mode,payment_reference,expected_amount_vnd,expires_at)
  select id,p_payment_mode,payment_code,expected_amount_vnd,payment_expires_at from public.orders where id=v_order_id;
  insert into public.order_lines(order_id,project_id,package_code,configuration,quantity,amount_vnd)
  values(v_order_id,p_project_id,p_package_code,p_quote,case when coalesce((p_quote->>'twin')::boolean,false) then 2 else 1 end,(p_quote->>'total')::integer);
  update public.cart_items i set checked_out_at=now(),updated_at=now() from public.carts c
    where i.cart_id=c.id and c.customer_id=p_customer_id and c.status='ACTIVE' and i.project_id=p_project_id;
  return v_created || jsonb_build_object('payment_expires_at',(select payment_expires_at from public.orders where id=v_order_id),'duplicate',false);
end $$;
revoke all on function public.melsou_create_order_v2(uuid,uuid,text,jsonb,jsonb,jsonb,text,text) from public, anon, authenticated;
grant execute on function public.melsou_create_order_v2(uuid,uuid,text,jsonb,jsonb,jsonb,text,text) to service_role;

create or replace function public.melsou_order_status_event()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op='INSERT' or old.status is distinct from new.status then
    insert into public.order_events(order_id,event_type,status,public_visible)
    values(new.id,case when tg_op='INSERT' then 'ORDER_CREATED' else 'STATUS_CHANGED' end,new.status,true);
  end if;
  return new;
end $$;
drop trigger if exists on_order_status_event on public.orders;
create trigger on_order_status_event after insert or update of status on public.orders for each row execute procedure public.melsou_order_status_event();
insert into public.order_events(order_id,event_type,status,public_visible,created_at)
select o.id,'CURRENT_STATUS',o.status,true,o.created_at from public.orders o
where not exists(select 1 from public.order_events e where e.order_id=o.id);

create or replace function public.melsou_process_sepay_payment(p_provider_event_id text, p_payment_code text, p_amount_vnd integer, p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_order public.orders; v_event_id uuid;
begin
  insert into public.payment_events(provider_event_id,amount_vnd,payload,outcome,signature_verified_at)
  values(p_provider_event_id,p_amount_vnd,p_payload,'RECEIVED',now())
  on conflict(provider_event_id) do nothing returning id into v_event_id;
  if v_event_id is null then return jsonb_build_object('duplicate',true); end if;
  select * into v_order from public.orders where payment_code=p_payment_code for update;
  if not found then update public.payment_events set outcome='UNMATCHED_REFERENCE' where id=v_event_id; return jsonb_build_object('matched',false); end if;
  update public.payment_events set order_id=v_order.id where id=v_event_id;
  if v_order.status='PAYMENT_EXPIRED' or (v_order.status='AWAITING_PAYMENT' and v_order.payment_expires_at is not null and v_order.payment_expires_at<=now()) then
    update public.orders set status='PAYMENT_MISMATCH',updated_at=now() where id=v_order.id;
    update public.payment_attempts set status='MISMATCH',updated_at=now() where order_id=v_order.id;
    update public.payment_events set outcome='LATE_PAYMENT_REVIEW_REQUIRED' where id=v_event_id;
    insert into public.audit_logs(action,resource_type,resource_id,after_state,note) values('LATE_SEPAY_PAYMENT','order',v_order.id::text,jsonb_build_object('status','PAYMENT_MISMATCH'),'Owner review required');
    return jsonb_build_object('matched',true,'mismatch',true,'reason','LATE_PAYMENT');
  end if;
  if v_order.status<>'AWAITING_PAYMENT' then update public.payment_events set outcome='ORDER_NOT_PAYABLE' where id=v_event_id; return jsonb_build_object('matched',true,'transitioned',false); end if;
  if v_order.expected_amount_vnd<>p_amount_vnd then
    update public.orders set status='PAYMENT_MISMATCH',updated_at=now() where id=v_order.id;
    update public.payment_attempts set status='MISMATCH',updated_at=now() where order_id=v_order.id;
    update public.payment_events set outcome='AMOUNT_MISMATCH' where id=v_event_id;
    return jsonb_build_object('matched',true,'mismatch',true,'reason','AMOUNT_MISMATCH');
  end if;
  update public.orders set status='PAID',paid_at=now(),updated_at=now() where id=v_order.id;
  update public.payment_attempts set status='PAID',paid_at=now(),updated_at=now() where order_id=v_order.id;
  update public.payment_events set outcome='PAID' where id=v_event_id;
  insert into public.audit_logs(action,resource_type,resource_id,after_state) values('SEPAY_PAYMENT_VERIFIED','order',v_order.id::text,jsonb_build_object('status','PAID'));
  return jsonb_build_object('matched',true,'paid',true);
end $$;
revoke all on function public.melsou_process_sepay_payment(text,text,integer,jsonb) from public, anon, authenticated;
grant execute on function public.melsou_process_sepay_payment(text,text,integer,jsonb) to service_role;

create or replace function public.melsou_expire_payment_attempts()
returns integer language plpgsql security definer set search_path = public as $$
declare v_count integer;
begin
  with expired as (
    update public.orders set status='PAYMENT_EXPIRED',updated_at=now()
    where status='AWAITING_PAYMENT' and payment_expires_at is not null and payment_expires_at<=now()
    returning id
  ) update public.payment_attempts p set status='EXPIRED',updated_at=now() from expired e where p.order_id=e.id and p.status='PENDING';
  get diagnostics v_count = row_count;
  return v_count;
end $$;
revoke all on function public.melsou_expire_payment_attempts() from public, anon, authenticated;
grant execute on function public.melsou_expire_payment_attempts() to service_role;

create or replace function public.melsou_resolve_payment_mismatch(p_owner_id uuid, p_order_id uuid, p_resolution text, p_note text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_order public.orders; v_status public.melsou_order_status;
begin
  if not public.melsou_is_owner(p_owner_id) then raise exception using errcode='42501',message='OWNER_REQUIRED'; end if;
  if p_resolution not in ('MARK_PAID','CANCEL') or length(trim(coalesce(p_note,'')))<5 then raise exception 'INVALID_PAYMENT_RESOLUTION'; end if;
  select * into v_order from public.orders where id=p_order_id for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if v_order.status<>'PAYMENT_MISMATCH' then raise exception 'ORDER_NOT_PAYMENT_MISMATCH'; end if;
  v_status := case when p_resolution='MARK_PAID' then 'PAID'::public.melsou_order_status else 'CANCELLED'::public.melsou_order_status end;
  update public.orders set status=v_status,paid_at=case when v_status='PAID' then now() else paid_at end,updated_at=now() where id=p_order_id;
  update public.payment_attempts set status=case when v_status='PAID' then 'PAID' else 'CANCELLED' end,
    paid_at=case when v_status='PAID' then now() else paid_at end,updated_at=now() where order_id=p_order_id;
  insert into public.audit_logs(actor_id,action,resource_type,resource_id,before_state,after_state,note)
    values(p_owner_id,'PAYMENT_MISMATCH_RESOLVED','order',p_order_id::text,jsonb_build_object('status','PAYMENT_MISMATCH'),jsonb_build_object('status',v_status,'resolution',p_resolution),left(trim(p_note),1000));
  return jsonb_build_object('id',p_order_id,'status',v_status);
end $$;
revoke all on function public.melsou_resolve_payment_mismatch(uuid,uuid,text,text) from public, anon, authenticated;
grant execute on function public.melsou_resolve_payment_mismatch(uuid,uuid,text,text) to service_role;

create or replace function public.melsou_update_fulfillment(
  p_owner_id uuid, p_order_id uuid, p_sequence integer, p_status text,
  p_carrier text, p_tracking_code text, p_tracking_url text, p_note text
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_order public.orders; v_shipment public.shipments; v_order_status public.melsou_order_status; v_before_status public.melsou_order_status;
begin
  if not public.melsou_is_owner(p_owner_id) then raise exception using errcode='42501',message='OWNER_REQUIRED'; end if;
  if length(trim(coalesce(p_note,'')))<3 then raise exception 'FULFILLMENT_NOTE_REQUIRED'; end if;
  select * into v_order from public.orders where id=p_order_id for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  v_before_status := v_order.status;
  if p_status='READY_TO_SHIP' then
    if v_order.status<>'PRODUCTION' then raise exception 'ORDER_NOT_READY_FOR_FULFILLMENT'; end if;
    update public.shipments set status='READY_TO_SHIP' where order_id=p_order_id and status='PENDING';
    update public.orders set status='READY_TO_SHIP',updated_at=now() where id=p_order_id returning * into v_order;
  else
    if p_sequence not in (1,2) then raise exception 'INVALID_SHIPMENT_SEQUENCE'; end if;
    select * into v_shipment from public.shipments where order_id=p_order_id and sequence=p_sequence for update;
    if not found then raise exception 'SHIPMENT_NOT_FOUND'; end if;
    if p_status='SHIPPING' then
      if v_shipment.status not in ('READY_TO_SHIP','DELIVERY_FAILED') or nullif(trim(coalesce(p_carrier,'')),'') is null
        or nullif(trim(coalesce(p_tracking_code,'')),'') is null then raise exception 'INVALID_SHIPMENT_DISPATCH'; end if;
      update public.shipments set status='SHIPPING',carrier=left(trim(p_carrier),120),tracking_code=left(trim(p_tracking_code),120),
        tracking_url=nullif(left(trim(coalesce(p_tracking_url,'')),500),''),shipped_at=coalesce(shipped_at,now()),completed_at=null where id=v_shipment.id;
      v_order_status := case when exists(select 1 from public.shipments where order_id=p_order_id and status='DELIVERY_FAILED') then 'DELIVERY_FAILED'::public.melsou_order_status else 'SHIPPING'::public.melsou_order_status end;
    elsif p_status='COMPLETED' then
      if v_shipment.status<>'SHIPPING' then raise exception 'INVALID_SHIPMENT_COMPLETION'; end if;
      update public.shipments set status='COMPLETED',completed_at=now() where id=v_shipment.id;
      v_order_status := case when not exists(select 1 from public.shipments where order_id=p_order_id and status<>'COMPLETED') then 'COMPLETED'::public.melsou_order_status else v_order.status end;
    elsif p_status='DELIVERY_FAILED' then
      if v_shipment.status<>'SHIPPING' then raise exception 'INVALID_SHIPMENT_FAILURE'; end if;
      update public.shipments set status='DELIVERY_FAILED' where id=v_shipment.id;
      v_order_status := 'DELIVERY_FAILED';
    else raise exception 'INVALID_FULFILLMENT_STATUS'; end if;
    if v_order.status is distinct from v_order_status then update public.orders set status=v_order_status,updated_at=now() where id=p_order_id returning * into v_order; end if;
  end if;
  insert into public.audit_logs(actor_id,action,resource_type,resource_id,before_state,after_state,note)
    values(p_owner_id,'FULFILLMENT_UPDATED','order',p_order_id::text,jsonb_build_object('status',v_before_status),
      jsonb_build_object('status',coalesce(v_order_status,v_order.status),'shipment_sequence',p_sequence,'shipment_status',p_status),left(trim(p_note),1000));
  return jsonb_build_object('order_id',p_order_id,'order_status',coalesce(v_order_status,v_order.status),'shipment_sequence',p_sequence,'shipment_status',p_status);
end $$;
revoke all on function public.melsou_update_fulfillment(uuid,uuid,integer,text,text,text,text,text) from public, anon, authenticated;
grant execute on function public.melsou_update_fulfillment(uuid,uuid,integer,text,text,text,text,text) to service_role;

create or replace function public.melsou_claim_archive_job()
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_job public.archive_jobs;
begin
  select * into v_job from public.archive_jobs where attempts<max_attempts and (
    (status in ('QUEUED','FAILED') and (next_attempt_at is null or next_attempt_at<=now())) or
    (status='RUNNING' and started_at<now()-interval '15 minutes')
  ) order by created_at asc for update skip locked limit 1;
  if not found then return null; end if;
  update public.archive_jobs set status='RUNNING',attempts=attempts+1,error_code=null,last_error=null,next_attempt_at=null,started_at=now(),updated_at=now()
    where id=v_job.id returning * into v_job;
  return jsonb_build_object('id',v_job.id,'order_id',v_job.order_id,'attempts',v_job.attempts,'max_attempts',v_job.max_attempts);
end $$;
revoke all on function public.melsou_claim_archive_job() from public, anon, authenticated;
grant execute on function public.melsou_claim_archive_job() to service_role;

create or replace function public.melsou_claim_reporting_event()
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_event public.reporting_outbox;
begin
  select * into v_event from public.reporting_outbox where delivered_at is null and attempts<max_attempts and (
    (status in ('QUEUED','FAILED') and (next_attempt_at is null or next_attempt_at<=now())) or
    (status='PROCESSING' and updated_at<now()-interval '15 minutes')
  ) order by created_at asc for update skip locked limit 1;
  if not found then return null; end if;
  update public.reporting_outbox set status='PROCESSING',attempts=attempts+1,last_error=null,next_attempt_at=null,updated_at=now()
    where id=v_event.id returning * into v_event;
  return jsonb_build_object('id',v_event.id,'event_type',v_event.event_type,'aggregate_id',v_event.aggregate_id,
    'payload',v_event.payload,'created_at',v_event.created_at,'attempts',v_event.attempts,'max_attempts',v_event.max_attempts);
end $$;
revoke all on function public.melsou_claim_reporting_event() from public, anon, authenticated;
grant execute on function public.melsou_claim_reporting_event() to service_role;

create or replace function public.melsou_claim_render_job()
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_job public.render_jobs;
begin
  select * into v_job from public.render_jobs where attempts<max_attempts and (
    (status in ('QUEUED','FAILED') and (next_attempt_at is null or next_attempt_at<=now())) or
    (status='RUNNING' and started_at<now()-interval '15 minutes')
  ) order by created_at asc for update skip locked limit 1;
  if not found then return null; end if;
  update public.render_jobs set status='RUNNING',attempts=attempts+1,error_code=null,last_error=null,next_attempt_at=null,started_at=now(),updated_at=now()
    where id=v_job.id returning * into v_job;
  update public.orders set status='RENDERING',updated_at=now() where id=v_job.order_id and status in ('PAID','RENDER_FAILED','RENDERING');
  insert into public.audit_logs(action,resource_type,resource_id,after_state) values('RENDER_STARTED','order',v_job.order_id::text,jsonb_build_object('render_job_id',v_job.id,'attempt',v_job.attempts));
  return jsonb_build_object('id',v_job.id,'order_id',v_job.order_id,'attempts',v_job.attempts,'max_attempts',v_job.max_attempts);
end $$;
revoke all on function public.melsou_claim_render_job() from public, anon, authenticated;
grant execute on function public.melsou_claim_render_job() to service_role;

create or replace function public.melsou_fail_render(p_render_job_id uuid, p_error_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_job public.render_jobs; v_status text;
begin
  select * into v_job from public.render_jobs where id=p_render_job_id for update;
  if not found then raise exception 'RENDER_JOB_NOT_FOUND'; end if;
  if v_job.status='SUCCESS' then return jsonb_build_object('id',v_job.id,'status','SUCCESS','duplicate',true); end if;
  v_status := case when v_job.attempts>=v_job.max_attempts then 'DEAD_LETTER' else 'FAILED' end;
  update public.render_jobs set status=v_status,error_code=left(coalesce(p_error_code,'RENDER_FAILED'),120),last_error=left(coalesce(p_error_code,'RENDER_FAILED'),120),
    next_attempt_at=case when v_status='FAILED' then now()+make_interval(secs=>least(3600,power(2,greatest(v_job.attempts,1))::integer*30)) else null end,updated_at=now()
    where id=v_job.id;
  update public.orders set status='RENDER_FAILED',updated_at=now() where id=v_job.order_id and status='RENDERING';
  insert into public.audit_logs(action,resource_type,resource_id,after_state,note) values('RENDER_FAILED','order',v_job.order_id::text,jsonb_build_object('status','RENDER_FAILED','job_status',v_status),left(coalesce(p_error_code,'RENDER_FAILED'),120));
  return jsonb_build_object('id',v_job.id,'status',v_status);
end $$;
revoke all on function public.melsou_fail_render(uuid,text) from public, anon, authenticated;
grant execute on function public.melsou_fail_render(uuid,text) to service_role;

create or replace function public.melsou_finish_render(p_render_job_id uuid, p_artifacts jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_job public.render_jobs; v_order public.orders;
begin
  select * into v_job from public.render_jobs where id=p_render_job_id for update;
  if not found then raise exception 'RENDER_JOB_NOT_FOUND'; end if;
  select * into v_order from public.orders where id=v_job.order_id for update;
  if v_job.status='SUCCESS' then return jsonb_build_object('id',v_job.id,'status','SUCCESS','duplicate',true); end if;
  if v_order.status<>'RENDERING' then raise exception 'ORDER_NOT_RENDERABLE'; end if;
  update public.render_jobs set status='SUCCESS',artifacts=p_artifacts,error_code=null,last_error=null,next_attempt_at=null,completed_at=now(),updated_at=now() where id=v_job.id;
  update public.orders set status='PREPRESS_REVIEW',updated_at=now() where id=v_order.id;
  insert into public.audit_logs(action,resource_type,resource_id,after_state) values('RENDER_FINISHED','order',v_order.id::text,jsonb_build_object('status','PREPRESS_REVIEW'));
  return jsonb_build_object('id',v_job.id,'status','SUCCESS','order_id',v_order.id);
end $$;
revoke all on function public.melsou_finish_render(uuid,jsonb) from public, anon, authenticated;
grant execute on function public.melsou_finish_render(uuid,jsonb) to service_role;

alter table public.guest_sessions enable row level security;
alter table public.project_checkpoints enable row level security;
alter table public.guest_claimed_projects enable row level security;
alter table public.template_versions enable row level security;
alter table public.pricing_versions enable row level security;
alter table public.quotes enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.payment_attempts enable row level security;
alter table public.order_lines enable row level security;
alter table public.order_events enable row level security;
alter table public.customer_addresses enable row level security;
alter table public.blog_posts enable row level security;
alter table public.production_snapshots enable row level security;
alter table public.payment_events enable row level security;
alter table public.audit_logs enable row level security;
alter table public.print_profiles enable row level security;
alter table public.render_jobs enable row level security;
alter table public.archive_jobs enable row level security;
alter table public.reporting_outbox enable row level security;
alter table public.project_slot_locks enable row level security;

drop policy if exists "profile self update" on public.profiles;
create policy "profile self update" on public.profiles for update using(auth.uid()=user_id) with check(auth.uid()=user_id);
revoke update on public.profiles from anon, authenticated;
grant update(display_name,notification_preferences,updated_at) on public.profiles to authenticated;
drop policy if exists "customer project access" on public.projects;
create policy "customer project read" on public.projects for select using(
  owner_user_id=auth.uid() or exists(select 1 from public.project_duo_members m where m.project_id=id and m.user_id=auth.uid() and m.active)
);
revoke insert,update,delete on public.projects from anon, authenticated;
drop policy if exists "customer asset access" on public.project_assets;
create policy "customer asset read" on public.project_assets for select using(exists(
  select 1 from public.projects p where p.id=project_id and (p.owner_user_id=auth.uid() or exists(select 1 from public.project_duo_members m where m.project_id=p.id and m.user_id=auth.uid() and m.active))
));
revoke insert,update,delete on public.project_assets from anon, authenticated;

drop policy if exists "active pricing public read" on public.pricing_versions;
create policy "active pricing public read" on public.pricing_versions for select using(active);
drop policy if exists "enabled template public read" on public.template_versions;
create policy "enabled template public read" on public.template_versions for select using(enabled);
drop policy if exists "published blog public read" on public.blog_posts;
create policy "published blog public read" on public.blog_posts for select using(status='PUBLISHED');
drop policy if exists "owner manages blog" on public.blog_posts;
create policy "owner manages blog" on public.blog_posts for all using(public.melsou_is_owner()) with check(public.melsou_is_owner());
drop policy if exists "customer checkpoint read" on public.project_checkpoints;
create policy "customer checkpoint read" on public.project_checkpoints for select using(exists(select 1 from public.projects p where p.id=project_id and p.owner_user_id=auth.uid()));
drop policy if exists "customer quote read" on public.quotes;
create policy "customer quote read" on public.quotes for select using(owner_user_id=auth.uid());
drop policy if exists "customer cart access" on public.carts;
create policy "customer cart access" on public.carts for select using(customer_id=auth.uid());
drop policy if exists "customer cart item access" on public.cart_items;
create policy "customer cart item access" on public.cart_items for select using(exists(select 1 from public.carts c where c.id=cart_id and c.customer_id=auth.uid()));
drop policy if exists "customer payment attempt read" on public.payment_attempts;
create policy "customer payment attempt read" on public.payment_attempts for select using(exists(select 1 from public.orders o where o.id=order_id and o.customer_id=auth.uid()));
drop policy if exists "customer order line read" on public.order_lines;
create policy "customer order line read" on public.order_lines for select using(exists(select 1 from public.orders o where o.id=order_id and o.customer_id=auth.uid()));
drop policy if exists "customer order event read" on public.order_events;
create policy "customer order event read" on public.order_events for select using(exists(select 1 from public.orders o where o.id=order_id and o.customer_id=auth.uid()));
drop policy if exists "customer address access" on public.customer_addresses;
create policy "customer address access" on public.customer_addresses for all using(customer_id=auth.uid()) with check(customer_id=auth.uid());
drop policy if exists "customer snapshot read" on public.production_snapshots;
create policy "customer snapshot read" on public.production_snapshots for select using(exists(select 1 from public.orders o where o.production_snapshot_id=id and o.customer_id=auth.uid()));
drop policy if exists "owner audit read" on public.audit_logs;
create policy "owner audit read" on public.audit_logs for select using(public.melsou_is_owner());
drop policy if exists "owner payment events read" on public.payment_events;
create policy "owner payment events read" on public.payment_events for select using(public.melsou_is_owner());
drop policy if exists "owner print profiles read" on public.print_profiles;
create policy "owner print profiles read" on public.print_profiles for select using(public.melsou_is_owner());
drop policy if exists "owner render jobs read" on public.render_jobs;
create policy "owner render jobs read" on public.render_jobs for select using(public.melsou_is_owner());
drop policy if exists "owner archive jobs read" on public.archive_jobs;
create policy "owner archive jobs read" on public.archive_jobs for select using(public.melsou_is_owner());
drop policy if exists "owner reporting outbox read" on public.reporting_outbox;
create policy "owner reporting outbox read" on public.reporting_outbox for select using(public.melsou_is_owner());

grant select on public.template_versions, public.pricing_versions, public.blog_posts to anon, authenticated;
revoke insert,update,delete on public.blog_posts from anon, authenticated;
grant select on public.project_checkpoints, public.quotes, public.carts, public.cart_items, public.payment_attempts, public.order_lines, public.order_events, public.production_snapshots to authenticated;
grant select,insert,update,delete on public.customer_addresses to authenticated;

grant execute on function public.melsou_save_project(uuid,uuid,integer,jsonb) to service_role;
grant execute on function public.melsou_save_guest_project(uuid,text,integer,jsonb) to service_role;
grant execute on function public.melsou_accept_duo_invite(uuid,text) to service_role;
grant execute on function public.melsou_acquire_slot_lock(uuid,uuid,text,integer) to service_role;
grant execute on function public.melsou_approve_prepress(uuid,uuid,text) to service_role;
grant execute on function public.melsou_set_print_profile(uuid,text,jsonb) to service_role;
grant execute on function public.melsou_claim_asset_processing(uuid) to service_role;
grant execute on function public.melsou_complete_asset_processing(uuid,integer,integer,text,text,integer,integer,text,text,text,integer,integer,text) to service_role;
grant execute on function public.melsou_fail_asset_processing(uuid,text) to service_role;
