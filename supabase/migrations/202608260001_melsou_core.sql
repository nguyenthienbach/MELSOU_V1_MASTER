-- Canonical transactional schema. Apply with Supabase CLI or SQL editor before enabling production.
create extension if not exists pgcrypto;

create type public.melsou_role as enum ('OWNER', 'CUSTOMER');
create type public.melsou_order_status as enum ('DRAFT','PRICE_READY','ORDER_CREATED','AWAITING_PAYMENT','PAID','RENDERING','PREPRESS_REVIEW','PRODUCTION','READY_TO_SHIP','SHIPPING','COMPLETED','PAYMENT_EXPIRED','PAYMENT_MISMATCH','CANCELLED','REFUND_REQUESTED','REFUNDED','RENDER_FAILED','DELIVERY_FAILED');

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.melsou_role not null default 'CUSTOMER',
  display_name text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.projects (
  id uuid primary key default gen_random_uuid(), owner_user_id uuid references auth.users(id) on delete set null,
  guest_session_hash text, title text not null default 'Album chưa đặt tên', template_id text not null, template_version integer not null,
  document jsonb not null, revision integer not null default 1, last_activity_at timestamptz not null default now(), trashed_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check ((owner_user_id is not null) or (guest_session_hash is not null))
);
create table public.project_assets (
  id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id) on delete cascade,
  storage_key text not null unique, preview_key text, mime_type text not null, file_size bigint not null check (file_size > 0),
  width_px integer, height_px integer, checksum text not null, status text not null default 'READY', created_at timestamptz not null default now()
);
create table public.pricing_versions (
  id uuid primary key default gen_random_uuid(), version integer not null unique, rules jsonb not null, active boolean not null default false,
  created_at timestamptz not null default now(), check (jsonb_typeof(rules) = 'object')
);
create unique index pricing_versions_one_active on public.pricing_versions ((active)) where active;
insert into public.pricing_versions(version, rules, active) values (
  1,
  '{"currency":"VND","packages":{"MELODY":159000,"VOICE":219000,"SIGNATURE":259000},"sizes":{"A5_PORTRAIT":0,"SQUARE":20000,"A6":-20000,"A5_LANDSCAPE":10000},"pages":{"12":0,"16":30000,"24":60000},"twin_second_copy_ratio":0.75,"shipping_per_shipment":30000}'::jsonb,
  true
) on conflict (version) do nothing;
create table public.production_snapshots (
  id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id), document jsonb not null,
  template_id text not null, template_version integer not null, pricing_version integer not null, print_profile_version text not null,
  preflight jsonb not null, created_at timestamptz not null default now()
);
create table public.orders (
  id uuid primary key default gen_random_uuid(), order_code text not null unique, customer_id uuid not null references auth.users(id),
  production_snapshot_id uuid not null unique references public.production_snapshots(id), pricing_version integer not null,
  payment_code text not null unique, expected_amount_vnd integer not null check (expected_amount_vnd > 0), price_snapshot jsonb not null,
  status public.melsou_order_status not null default 'AWAITING_PAYMENT', paid_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.payment_events (
  id uuid primary key default gen_random_uuid(), provider text not null default 'SEPAY', provider_event_id text not null unique,
  order_id uuid references public.orders(id), amount_vnd integer not null, payload jsonb not null, outcome text not null,
  received_at timestamptz not null default now()
);
create table public.audit_logs (
  id bigint generated always as identity primary key, actor_id uuid references auth.users(id), action text not null, resource_type text not null,
  resource_id text not null, before_state jsonb, after_state jsonb, note text, created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_assets enable row level security;
alter table public.orders enable row level security;
create policy "profile self read" on public.profiles for select using (auth.uid() = user_id);
create policy "profile self update" on public.profiles for update using (auth.uid() = user_id) with check (auth.uid() = user_id and role = (select role from public.profiles where user_id = auth.uid()));
create policy "customer project access" on public.projects for all using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());
create policy "customer order access" on public.orders for select using (customer_id = auth.uid());
create policy "customer asset access" on public.project_assets for all using (exists (select 1 from public.projects p where p.id = project_id and p.owner_user_id = auth.uid())) with check (exists (select 1 from public.projects p where p.id = project_id and p.owner_user_id = auth.uid()));

create or replace function public.melsou_process_sepay_payment(p_provider_event_id text, p_payment_code text, p_amount_vnd integer, p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_order public.orders; v_event_id uuid;
begin
  insert into public.payment_events(provider_event_id, amount_vnd, payload, outcome)
  values (p_provider_event_id, p_amount_vnd, p_payload, 'RECEIVED')
  on conflict (provider_event_id) do nothing returning id into v_event_id;
  if v_event_id is null then return jsonb_build_object('duplicate', true); end if;
  select * into v_order from public.orders where payment_code = p_payment_code for update;
  if not found then update public.payment_events set outcome = 'UNMATCHED' where id = v_event_id; return jsonb_build_object('matched', false); end if;
  update public.payment_events set order_id = v_order.id where id = v_event_id;
  if v_order.status <> 'AWAITING_PAYMENT' then update public.payment_events set outcome = 'ORDER_NOT_PAYABLE' where id = v_event_id; return jsonb_build_object('matched', true, 'transitioned', false); end if;
  if v_order.expected_amount_vnd <> p_amount_vnd then
    update public.orders set status = 'PAYMENT_MISMATCH', updated_at = now() where id = v_order.id;
    update public.payment_events set outcome = 'AMOUNT_MISMATCH' where id = v_event_id;
    return jsonb_build_object('matched', true, 'mismatch', true);
  end if;
  update public.orders set status = 'PAID', paid_at = now(), updated_at = now() where id = v_order.id;
  update public.payment_events set outcome = 'PAID' where id = v_event_id;
  insert into public.audit_logs(action, resource_type, resource_id, after_state) values ('SEPAY_PAYMENT_VERIFIED', 'order', v_order.id::text, jsonb_build_object('status','PAID'));
  return jsonb_build_object('matched', true, 'paid', true);
end $$;
revoke all on function public.melsou_process_sepay_payment(text,text,integer,jsonb) from public;

create or replace function public.melsou_save_project(p_project_id uuid, p_owner_user_id uuid, p_expected_revision integer, p_document jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_next_revision integer;
begin
  update public.projects set document = p_document,
    template_id = coalesce(p_document->'template'->>'template_id', template_id),
    template_version = coalesce((p_document->'template'->>'version')::integer, template_version),
    revision = revision + 1, last_activity_at = now(), updated_at = now()
  where id = p_project_id and owner_user_id = p_owner_user_id and revision = p_expected_revision and trashed_at is null
  returning revision into v_next_revision;
  if v_next_revision is null then
    if exists (select 1 from public.projects where id = p_project_id and owner_user_id = p_owner_user_id) then
      return jsonb_build_object('conflict', true, 'revision', (select revision from public.projects where id = p_project_id));
    end if;
    raise exception using errcode = 'P0002', message = 'PROJECT_NOT_FOUND';
  end if;
  return jsonb_build_object('id', p_project_id, 'revision', v_next_revision);
end $$;
revoke all on function public.melsou_save_project(uuid,uuid,integer,jsonb) from public;
