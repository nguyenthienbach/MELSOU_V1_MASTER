-- Private asset derivatives are versioned by deterministic R2 keys and never replace originals.
alter table public.project_assets
  add column if not exists processing_state text not null default 'PENDING',
  add column if not exists processing_retry_count integer not null default 0,
  add column if not exists processing_last_error text,
  add column if not exists processing_started_at timestamptz,
  add column if not exists processed_at timestamptz,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists normalized_key text,
  add column if not exists normalized_mime_type text,
  add column if not exists normalized_width_px integer,
  add column if not exists normalized_height_px integer,
  add column if not exists normalized_checksum text,
  add column if not exists preview_mime_type text,
  add column if not exists preview_width_px integer,
  add column if not exists preview_height_px integer,
  add column if not exists preview_checksum text;

alter table public.project_assets drop constraint if exists project_assets_processing_state_check;
alter table public.project_assets add constraint project_assets_processing_state_check
  check (processing_state in ('PENDING', 'PROCESSING', 'READY', 'FAILED'));
alter table public.project_assets drop constraint if exists project_assets_processing_retry_count_check;
alter table public.project_assets add constraint project_assets_processing_retry_count_check check (processing_retry_count >= 0 and processing_retry_count <= 5);
create index if not exists project_assets_processing_queue_idx on public.project_assets (processing_state, created_at) where processing_state in ('PENDING', 'FAILED');
create unique index if not exists project_assets_normalized_key_unique on public.project_assets (normalized_key) where normalized_key is not null;
create unique index if not exists project_assets_preview_key_unique on public.project_assets (preview_key) where preview_key is not null;

create or replace function public.melsou_claim_asset_processing(p_asset_id uuid default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_asset public.project_assets;
begin
  select * into v_asset from public.project_assets
  where (p_asset_id is null or id=p_asset_id)
    and (processing_state in ('PENDING', 'FAILED') or (processing_state='PROCESSING' and processing_started_at < now() - interval '15 minutes'))
    and processing_retry_count < 5
  order by created_at asc for update skip locked limit 1;
  if not found then return null; end if;
  update public.project_assets set processing_state='PROCESSING', status='PROCESSING', processing_retry_count=processing_retry_count+1,
    processing_last_error=null, processing_started_at=now(), updated_at=now() where id=v_asset.id returning * into v_asset;
  insert into public.audit_logs(action, resource_type, resource_id, after_state)
  values ('ASSET_PROCESSING_STARTED', 'project_asset', v_asset.id::text, jsonb_build_object('attempt', v_asset.processing_retry_count));
  return to_jsonb(v_asset);
end $$;
revoke all on function public.melsou_claim_asset_processing(uuid) from public;

create or replace function public.melsou_complete_asset_processing(
  p_asset_id uuid, p_source_width_px integer, p_source_height_px integer,
  p_normalized_key text, p_normalized_mime_type text, p_normalized_width_px integer, p_normalized_height_px integer, p_normalized_checksum text,
  p_preview_key text, p_preview_mime_type text, p_preview_width_px integer, p_preview_height_px integer, p_preview_checksum text
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_asset public.project_assets;
begin
  select * into v_asset from public.project_assets where id=p_asset_id for update;
  if not found then raise exception 'ASSET_NOT_FOUND'; end if;
  if v_asset.processing_state='READY' then return jsonb_build_object('id', v_asset.id, 'status', 'READY', 'duplicate', true); end if;
  if v_asset.processing_state <> 'PROCESSING' then raise exception 'ASSET_NOT_PROCESSING'; end if;
  if p_source_width_px < 1 or p_source_height_px < 1 or p_normalized_width_px < 1 or p_normalized_height_px < 1 or p_preview_width_px < 1 or p_preview_height_px < 1 then raise exception 'ASSET_DIMENSIONS_INVALID'; end if;
  if greatest(p_normalized_width_px,p_normalized_height_px) > greatest(p_source_width_px,p_source_height_px)
    or least(p_normalized_width_px,p_normalized_height_px) > least(p_source_width_px,p_source_height_px)
    or greatest(p_preview_width_px,p_preview_height_px) > greatest(p_source_width_px,p_source_height_px)
    or least(p_preview_width_px,p_preview_height_px) > least(p_source_width_px,p_source_height_px) then raise exception 'ASSET_DERIVATIVE_UPSCALE_REJECTED'; end if;
  if p_normalized_mime_type <> 'image/png' or p_preview_mime_type <> 'image/webp' then raise exception 'ASSET_DERIVATIVE_FORMAT_INVALID'; end if;
  if p_normalized_checksum !~ '^[0-9a-f]{64}$' or p_preview_checksum !~ '^[0-9a-f]{64}$' then raise exception 'ASSET_DERIVATIVE_CHECKSUM_INVALID'; end if;
  if p_normalized_key !~ ('^projects/' || v_asset.project_id::text || '/assets/' || v_asset.id::text || '/normalized[.]png$') then raise exception 'ASSET_NORMALIZED_KEY_INVALID'; end if;
  if p_preview_key !~ ('^projects/' || v_asset.project_id::text || '/assets/' || v_asset.id::text || '/preview[.]webp$') then raise exception 'ASSET_PREVIEW_KEY_INVALID'; end if;
  update public.project_assets set status='READY', processing_state='READY', processing_last_error=null, processed_at=now(), updated_at=now(),
    width_px=p_source_width_px, height_px=p_source_height_px, normalized_key=p_normalized_key, normalized_mime_type=p_normalized_mime_type,
    normalized_width_px=p_normalized_width_px, normalized_height_px=p_normalized_height_px, normalized_checksum=p_normalized_checksum,
    preview_key=p_preview_key, preview_mime_type=p_preview_mime_type, preview_width_px=p_preview_width_px,
    preview_height_px=p_preview_height_px, preview_checksum=p_preview_checksum
  where id=v_asset.id returning * into v_asset;
  insert into public.audit_logs(action, resource_type, resource_id, after_state)
  values ('ASSET_PROCESSING_READY', 'project_asset', v_asset.id::text, jsonb_build_object('normalized_key', v_asset.normalized_key, 'preview_key', v_asset.preview_key));
  return to_jsonb(v_asset);
end $$;
revoke all on function public.melsou_complete_asset_processing(uuid,integer,integer,text,text,integer,integer,text,text,text,integer,integer,text) from public;

create or replace function public.melsou_fail_asset_processing(p_asset_id uuid, p_error_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_asset public.project_assets;
begin
  select * into v_asset from public.project_assets where id=p_asset_id for update;
  if not found then raise exception 'ASSET_NOT_FOUND'; end if;
  if v_asset.processing_state='READY' then return jsonb_build_object('id', v_asset.id, 'status', 'READY', 'duplicate', true); end if;
  update public.project_assets set status='PROCESSING_FAILED', processing_state='FAILED', processing_last_error=left(coalesce(p_error_code, 'ASSET_PROCESSING_FAILED'),120), updated_at=now()
  where id=v_asset.id returning * into v_asset;
  insert into public.audit_logs(action, resource_type, resource_id, after_state, note)
  values ('ASSET_PROCESSING_FAILED', 'project_asset', v_asset.id::text, jsonb_build_object('status', 'PROCESSING_FAILED'), left(coalesce(p_error_code, 'ASSET_PROCESSING_FAILED'),120));
  return to_jsonb(v_asset);
end $$;
revoke all on function public.melsou_fail_asset_processing(uuid,text) from public;
