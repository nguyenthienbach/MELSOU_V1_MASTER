create type public.melsou_shipment_status as enum ('PENDING','READY_TO_SHIP','SHIPPING','COMPLETED','DELIVERY_FAILED');

create table public.print_profiles (
  id uuid primary key default gen_random_uuid(), version text not null unique, configuration jsonb not null,
  production_ready boolean not null default false, created_at timestamptz not null default now(),
  check (jsonb_typeof(configuration) = 'object')
);
create table public.order_sequences (
  package_letter text not null check (package_letter in ('M','V','S')), yymm text not null check (yymm ~ '^[0-9]{4}$'),
  next_value integer not null default 1 check (next_value > 0), primary key (package_letter, yymm)
);
create table public.shipments (
  id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id) on delete cascade,
  sequence smallint not null check (sequence in (1,2)), address_snapshot jsonb not null, status public.melsou_shipment_status not null default 'PENDING',
  carrier text, tracking_code text, tracking_url text, shipped_at timestamptz, completed_at timestamptz, created_at timestamptz not null default now(), unique(order_id, sequence)
);
create table public.render_jobs (
  id uuid primary key default gen_random_uuid(), order_id uuid not null unique references public.orders(id) on delete cascade,
  status text not null default 'QUEUED' check (status in ('QUEUED','RUNNING','SUCCESS','FAILED')), attempts integer not null default 0,
  error_code text, artifacts jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create or replace function public.melsou_enqueue_render_after_payment()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'PAID' and old.status is distinct from 'PAID' then
    insert into public.render_jobs(order_id) values (new.id) on conflict (order_id) do nothing;
  end if;
  return new;
end $$;
create trigger on_order_paid_enqueue_render after update of status on public.orders for each row execute procedure public.melsou_enqueue_render_after_payment();

create or replace function public.melsou_finish_render(p_render_job_id uuid, p_artifacts jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_job public.render_jobs; v_order public.orders;
begin
  select * into v_job from public.render_jobs where id = p_render_job_id for update;
  if not found then raise exception 'RENDER_JOB_NOT_FOUND'; end if;
  select * into v_order from public.orders where id = v_job.order_id for update;
  if v_job.status = 'SUCCESS' then return jsonb_build_object('id',v_job.id,'status','SUCCESS','duplicate',true); end if;
  if v_order.status not in ('PAID','RENDERING') then raise exception 'ORDER_NOT_RENDERABLE'; end if;
  update public.render_jobs set status = 'SUCCESS', artifacts = p_artifacts, updated_at = now() where id = v_job.id;
  update public.orders set status = 'PREPRESS_REVIEW', updated_at = now() where id = v_order.id;
  insert into public.audit_logs(action,resource_type,resource_id,after_state) values ('RENDER_FINISHED','order',v_order.id::text,jsonb_build_object('status','PREPRESS_REVIEW'));
  return jsonb_build_object('id',v_job.id,'status','SUCCESS','order_id',v_order.id);
end $$;
revoke all on function public.melsou_finish_render(uuid,jsonb) from public;

create or replace function public.melsou_handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(user_id, display_name) values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email)) on conflict do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.melsou_handle_new_user();

create or replace function public.melsou_create_order(p_customer_id uuid, p_project_id uuid, p_package_code text, p_quote jsonb, p_shipments jsonb, p_preflight jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_project public.projects; v_profile public.print_profiles; v_pricing public.pricing_versions; v_snapshot_id uuid; v_order_id uuid;
  v_letter text; v_yymm text := to_char(now() at time zone 'Asia/Ho_Chi_Minh', 'YYMM'); v_sequence integer; v_code text; v_count integer;
  v_package_amount integer; v_size_amount integer; v_page_amount integer; v_first_copy integer; v_twin_copy integer; v_shipping integer; v_expected_amount integer; v_twin boolean;
begin
  if p_package_code not in ('MELODY','VOICE','SIGNATURE') then raise exception 'INVALID_PACKAGE'; end if;
  if jsonb_typeof(p_quote) <> 'object' then raise exception 'INVALID_QUOTE'; end if;
  if coalesce(p_preflight->>'status','') not in ('PASS','WARNING') then raise exception 'PREFLIGHT_BLOCKING_ERROR'; end if;
  select * into v_project from public.projects where id = p_project_id and owner_user_id = p_customer_id and trashed_at is null for update;
  if not found then raise exception 'PROJECT_NOT_FOUND'; end if;
  select * into v_profile from public.print_profiles where production_ready = true order by created_at desc limit 1;
  if not found then raise exception using errcode = 'P0001', message = 'TBD_PRINT_VENDOR'; end if;
  select * into v_pricing from public.pricing_versions where active = true order by version desc limit 1;
  if not found then raise exception 'NO_ACTIVE_PRICING'; end if;
  if p_quote->>'currency' <> 'VND' or p_quote->>'packageCode' <> p_package_code then raise exception 'INVALID_QUOTE'; end if;
  if p_quote->>'size' is distinct from v_project.document->'configuration'->>'size' or p_quote->>'pages' is distinct from v_project.document->'configuration'->>'pages' then raise exception 'SNAPSHOT_CONFIGURATION_MISMATCH'; end if;
  v_package_amount := (v_pricing.rules->'packages'->>p_package_code)::integer;
  v_size_amount := (v_pricing.rules->'sizes'->>(p_quote->>'size'))::integer;
  v_page_amount := (v_pricing.rules->'pages'->>(p_quote->>'pages'))::integer;
  v_twin := coalesce((p_quote->>'twin')::boolean, false);
  if v_package_amount is null or v_size_amount is null or v_page_amount is null then raise exception 'INVALID_QUOTE_CONFIGURATION'; end if;
  v_first_copy := v_package_amount + v_size_amount + v_page_amount;
  v_twin_copy := case when v_twin then round(v_first_copy * (v_pricing.rules->>'twin_second_copy_ratio')::numeric)::integer else 0 end;
  v_shipping := coalesce((v_pricing.rules->>'shipping_per_shipment')::integer, 0) * coalesce((p_quote->>'shipments')::integer, 0);
  v_expected_amount := v_first_copy + v_twin_copy + v_shipping;
  if coalesce((p_quote->>'total')::integer,0) <> v_expected_amount then raise exception 'QUOTE_PRICE_MISMATCH'; end if;
  v_count := jsonb_array_length(p_shipments);
  if v_count not in (1,2) or v_count <> coalesce((p_quote->>'shipments')::integer,0) then raise exception 'INVALID_SHIPMENTS'; end if;
  if v_twin = false and v_count <> 1 then raise exception 'INVALID_SINGLE_COPY_SHIPMENT'; end if;
  v_letter := case p_package_code when 'MELODY' then 'M' when 'VOICE' then 'V' else 'S' end;
  insert into public.order_sequences(package_letter,yymm,next_value) values(v_letter,v_yymm,2)
  on conflict(package_letter,yymm) do update set next_value = public.order_sequences.next_value + 1
  returning next_value - 1 into v_sequence;
  v_code := 'MEL' || v_letter || '-' || v_yymm || '-' || lpad(v_sequence::text,3,'0');
  insert into public.production_snapshots(project_id,document,template_id,template_version,pricing_version,print_profile_version,preflight)
  values(v_project.id,v_project.document,v_project.template_id,v_project.template_version,v_pricing.version,v_profile.version,p_preflight) returning id into v_snapshot_id;
  insert into public.orders(order_code,customer_id,production_snapshot_id,pricing_version,payment_code,expected_amount_vnd,price_snapshot,status)
  values(v_code,p_customer_id,v_snapshot_id,v_pricing.version,v_code,v_expected_amount,p_quote,'AWAITING_PAYMENT') returning id into v_order_id;
  insert into public.shipments(order_id,sequence,address_snapshot) select v_order_id, ordinality::smallint, value from jsonb_array_elements(p_shipments) with ordinality;
  insert into public.audit_logs(actor_id,action,resource_type,resource_id,after_state) values(p_customer_id,'ORDER_CREATED','order',v_order_id::text,jsonb_build_object('order_code',v_code,'status','AWAITING_PAYMENT'));
  return jsonb_build_object('id',v_order_id,'order_code',v_code,'expected_amount_vnd',v_expected_amount,'status','AWAITING_PAYMENT');
end $$;
revoke all on function public.melsou_create_order(uuid,uuid,text,jsonb,jsonb,jsonb) from public;

create or replace function public.melsou_approve_prepress(p_owner_id uuid, p_order_id uuid, p_note text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_role public.melsou_role; v_order public.orders;
begin
  select role into v_role from public.profiles where user_id = p_owner_id;
  if v_role is distinct from 'OWNER' then raise exception using errcode = '42501', message = 'OWNER_REQUIRED'; end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if v_order.status <> 'PREPRESS_REVIEW' then raise exception 'ORDER_NOT_IN_PREPRESS'; end if;
  update public.orders set status = 'PRODUCTION', updated_at = now() where id = p_order_id;
  insert into public.audit_logs(actor_id,action,resource_type,resource_id,before_state,after_state,note) values(p_owner_id,'PREPRESS_APPROVED','order',p_order_id::text,jsonb_build_object('status','PREPRESS_REVIEW'),jsonb_build_object('status','PRODUCTION'),nullif(p_note,''));
  return jsonb_build_object('id',p_order_id,'status','PRODUCTION');
end $$;
revoke all on function public.melsou_approve_prepress(uuid,uuid,text) from public;

create or replace function public.melsou_set_print_profile(p_owner_id uuid, p_version text, p_configuration jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_role public.melsou_role; v_id uuid;
begin
  select role into v_role from public.profiles where user_id = p_owner_id;
  if v_role is distinct from 'OWNER' then raise exception using errcode = '42501', message = 'OWNER_REQUIRED'; end if;
  if nullif(trim(p_version),'') is null or jsonb_typeof(p_configuration) <> 'object' or
    not (ARRAY['finished_width_mm','finished_height_mm','cover_width_mm','cover_height_mm','bleed_mm','safe_margin_mm','gutter_warning_mm','dpi'] <@ array(select key from jsonb_object_keys(p_configuration) key)) or
    exists (select 1 from jsonb_each_text(p_configuration) e(key,value) where e.key in ('finished_width_mm','finished_height_mm','cover_width_mm','cover_height_mm','bleed_mm','safe_margin_mm','gutter_warning_mm','dpi') and (e.value !~ '^[0-9]+(\.[0-9]+)?$' or e.value::numeric <= 0)) or
    nullif(p_configuration->>'color_profile','') is null or nullif(p_configuration->>'pdf_standard','') is null or nullif(p_configuration->>'cover_construction','') is null then
    raise exception 'INVALID_PRINT_PROFILE';
  end if;
  update public.print_profiles set production_ready = false where production_ready;
  insert into public.print_profiles(version,configuration,production_ready) values(trim(p_version),p_configuration,true) returning id into v_id;
  insert into public.audit_logs(actor_id,action,resource_type,resource_id,after_state) values(p_owner_id,'PRINT_PROFILE_ACTIVATED','print_profile',v_id::text,jsonb_build_object('version',trim(p_version)));
  return jsonb_build_object('id',v_id,'version',trim(p_version),'production_ready',true);
end $$;
revoke all on function public.melsou_set_print_profile(uuid,text,jsonb) from public;

alter table public.shipments enable row level security;
create policy "customer shipment access" on public.shipments for select using (exists (select 1 from public.orders o where o.id = order_id and o.customer_id = auth.uid()));
