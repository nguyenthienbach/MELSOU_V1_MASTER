-- V1 checkout stops at confirmed payment/order. Print configuration is not a
-- checkout prerequisite; any future production workflow must add its own gate.
alter table public.production_snapshots alter column print_profile_version drop not null;

create or replace function public.melsou_create_order(
  p_customer_id uuid, p_project_id uuid, p_package_code text, p_quote jsonb, p_shipments jsonb, p_preflight jsonb
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_project public.projects; v_pricing public.pricing_versions; v_snapshot_id uuid; v_order_id uuid;
  v_letter text; v_yymm text := to_char(now() at time zone 'Asia/Ho_Chi_Minh', 'YYMM'); v_sequence integer; v_code text; v_count integer;
  v_package_amount integer; v_size_amount integer; v_page_amount integer; v_first_copy integer; v_twin_copy integer; v_shipping integer; v_expected_amount integer; v_twin boolean;
begin
  if p_package_code not in ('MELODY','VOICE','SIGNATURE') then raise exception 'INVALID_PACKAGE'; end if;
  if jsonb_typeof(p_quote) <> 'object' then raise exception 'INVALID_QUOTE'; end if;
  if coalesce(p_preflight->>'status','') not in ('PASS','WARNING') then raise exception 'PREFLIGHT_BLOCKING_ERROR'; end if;
  select * into v_project from public.projects where id=p_project_id and owner_user_id=p_customer_id and trashed_at is null for update;
  if not found then raise exception 'PROJECT_NOT_FOUND'; end if;
  select * into v_pricing from public.pricing_versions where active=true order by version desc limit 1;
  if not found then raise exception 'NO_ACTIVE_PRICING'; end if;
  if p_quote->>'currency'<>'VND' or p_quote->>'packageCode'<>p_package_code then raise exception 'INVALID_QUOTE'; end if;
  if p_quote->>'size' is distinct from v_project.document->'configuration'->>'size' or p_quote->>'pages' is distinct from v_project.document->'configuration'->>'pages' then raise exception 'SNAPSHOT_CONFIGURATION_MISMATCH'; end if;
  v_package_amount := (v_pricing.rules->'packages'->>p_package_code)::integer;
  v_size_amount := (v_pricing.rules->'sizes'->>(p_quote->>'size'))::integer;
  v_page_amount := (v_pricing.rules->'pages'->>(p_quote->>'pages'))::integer;
  v_twin := coalesce((p_quote->>'twin')::boolean,false);
  if v_package_amount is null or v_size_amount is null or v_page_amount is null then raise exception 'INVALID_QUOTE_CONFIGURATION'; end if;
  v_first_copy := v_package_amount+v_size_amount+v_page_amount;
  v_twin_copy := case when v_twin then round(v_first_copy*(v_pricing.rules->>'twin_second_copy_ratio')::numeric)::integer else 0 end;
  v_shipping := coalesce((v_pricing.rules->>'shipping_per_shipment')::integer,0)*coalesce((p_quote->>'shipments')::integer,0);
  v_expected_amount := v_first_copy+v_twin_copy+v_shipping;
  if coalesce((p_quote->>'total')::integer,0)<>v_expected_amount then raise exception 'QUOTE_PRICE_MISMATCH'; end if;
  v_count := jsonb_array_length(p_shipments);
  if v_count not in (1,2) or v_count<>coalesce((p_quote->>'shipments')::integer,0) then raise exception 'INVALID_SHIPMENTS'; end if;
  if not v_twin and v_count<>1 then raise exception 'INVALID_SINGLE_COPY_SHIPMENT'; end if;
  v_letter := case p_package_code when 'MELODY' then 'M' when 'VOICE' then 'V' else 'S' end;
  insert into public.order_sequences(package_letter,yymm,next_value) values(v_letter,v_yymm,2)
    on conflict(package_letter,yymm) do update set next_value=public.order_sequences.next_value+1 returning next_value-1 into v_sequence;
  v_code := 'MEL'||v_letter||'-'||v_yymm||'-'||lpad(v_sequence::text,3,'0');
  insert into public.production_snapshots(project_id,document,template_id,template_version,pricing_version,print_profile_version,preflight)
    values(v_project.id,v_project.document,v_project.template_id,v_project.template_version,v_pricing.version,null,p_preflight) returning id into v_snapshot_id;
  insert into public.orders(order_code,customer_id,production_snapshot_id,pricing_version,payment_code,expected_amount_vnd,price_snapshot,status)
    values(v_code,p_customer_id,v_snapshot_id,v_pricing.version,v_code,v_expected_amount,p_quote,'AWAITING_PAYMENT') returning id into v_order_id;
  insert into public.shipments(order_id,sequence,address_snapshot) select v_order_id,ordinality::smallint,value from jsonb_array_elements(p_shipments) with ordinality;
  insert into public.audit_logs(actor_id,action,resource_type,resource_id,after_state) values(p_customer_id,'ORDER_CREATED','order',v_order_id::text,jsonb_build_object('order_code',v_code,'status','AWAITING_PAYMENT'));
  return jsonb_build_object('id',v_order_id,'order_code',v_code,'expected_amount_vnd',v_expected_amount,'status','AWAITING_PAYMENT');
end $$;
revoke all on function public.melsou_create_order(uuid,uuid,text,jsonb,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.melsou_create_order(uuid,uuid,text,jsonb,jsonb,jsonb) to service_role;
