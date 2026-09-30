begin;

-- Supports the same-project checksum re-check used under the project row lock.
-- It is intentionally non-unique so the migration remains compatible with any
-- legacy duplicates while the RPC deterministically reuses the oldest row.
create index if not exists project_assets_project_checksum_idx
  on public.project_assets(project_id, checksum, created_at, id);

-- Atomically creates the database record for an object already accepted by the
-- private Worker upload pipeline and attaches it to the canonical gallery at a
-- specific project revision. R2 rollback remains the Worker's responsibility
-- when this transaction reports a conflict.
create or replace function public.melsou_register_gallery_asset(
  p_project_id uuid,
  p_owner_user_id uuid,
  p_guest_session_hash text,
  p_expected_revision integer,
  p_asset_id uuid,
  p_storage_key text,
  p_mime_type text,
  p_file_size bigint,
  p_width_px integer,
  p_height_px integer,
  p_checksum text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_project public.projects;
  v_asset public.project_assets;
  v_gallery jsonb;
begin
  if (p_owner_user_id is null) = (p_guest_session_hash is null) then
    raise exception using errcode = '22023', message = 'INVALID_PROJECT_ACTOR';
  end if;

  select * into v_project
  from public.projects
  where id = p_project_id
    and trashed_at is null
    and (
      (p_owner_user_id is not null and owner_user_id = p_owner_user_id)
      or (p_guest_session_hash is not null and guest_session_hash = p_guest_session_hash)
    )
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'PROJECT_NOT_FOUND';
  end if;
  if v_project.revision <> p_expected_revision then
    return jsonb_build_object('conflict', true, 'revision', v_project.revision);
  end if;

  -- The project row lock serializes same-project uploads. Re-check by digest
  -- inside the transaction so concurrent clients cannot create duplicate
  -- canonical assets after both observed an empty preflight query.
  select * into v_asset
  from public.project_assets
  where project_id = p_project_id
    and checksum = p_checksum
    and status <> 'PROCESSING_FAILED'
  order by created_at, id
  limit 1;
  if found then
    v_gallery := case
      when jsonb_typeof(v_project.document->'gallery_assets') = 'array'
        then v_project.document->'gallery_assets'
      else '[]'::jsonb
    end;
    if not v_gallery @> jsonb_build_array(jsonb_build_object('asset_id', v_asset.id)) then
      v_gallery := v_gallery || jsonb_build_array(jsonb_strip_nulls(jsonb_build_object(
        'asset_id', v_asset.id,
        'mime_type', v_asset.mime_type,
        'width_px', v_asset.width_px,
        'height_px', v_asset.height_px,
        'added_at', statement_timestamp()
      )));
      update public.projects
      set document = jsonb_set(document, '{gallery_assets}', v_gallery, true),
          revision = revision + 1,
          last_activity_at = now(),
          updated_at = now()
      where id = p_project_id;
      return jsonb_build_object('asset', to_jsonb(v_asset) - 'storage_key' - 'preview_key' - 'normalized_key',
        'project_revision', v_project.revision + 1, 'duplicate', true);
    end if;
    return jsonb_build_object('asset', to_jsonb(v_asset) - 'storage_key' - 'preview_key' - 'normalized_key',
      'project_revision', v_project.revision, 'duplicate', true);
  end if;

  insert into public.project_assets(
    id, project_id, storage_key, mime_type, file_size, width_px, height_px,
    checksum, status, processing_state, processing_retry_count
  ) values (
    p_asset_id, p_project_id, p_storage_key, p_mime_type, p_file_size,
    p_width_px, p_height_px, p_checksum, 'ORIGINAL_ONLY', 'PENDING', 0
  );

  v_gallery := (case
      when jsonb_typeof(v_project.document->'gallery_assets') = 'array'
        then v_project.document->'gallery_assets'
      else '[]'::jsonb
    end)
    || jsonb_build_array(jsonb_strip_nulls(jsonb_build_object(
      'asset_id', p_asset_id,
      'mime_type', p_mime_type,
      'width_px', p_width_px,
      'height_px', p_height_px,
      'added_at', statement_timestamp()
    )));

  update public.projects
  set document = jsonb_set(document, '{gallery_assets}', v_gallery, true),
      revision = revision + 1,
      last_activity_at = now(),
      updated_at = now()
  where id = p_project_id;

  return jsonb_build_object(
    'asset', jsonb_build_object(
      'id', p_asset_id,
      'project_id', p_project_id,
      'mime_type', p_mime_type,
      'file_size', p_file_size,
      'width_px', p_width_px,
      'height_px', p_height_px,
      'checksum', p_checksum,
      'status', 'ORIGINAL_ONLY',
      'processing_state', 'PENDING'
    ),
    'project_revision', v_project.revision + 1,
    'duplicate', false
  );
end;
$$;

-- Idempotently attaches an existing same-project checksum match to a legacy
-- document that does not yet contain its canonical gallery reference.
create or replace function public.melsou_attach_gallery_asset(
  p_project_id uuid,
  p_owner_user_id uuid,
  p_guest_session_hash text,
  p_expected_revision integer,
  p_asset_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_project public.projects;
  v_asset public.project_assets;
  v_entry jsonb;
begin
  if (p_owner_user_id is null) = (p_guest_session_hash is null) then
    raise exception using errcode = '22023', message = 'INVALID_PROJECT_ACTOR';
  end if;

  select * into v_project
  from public.projects
  where id = p_project_id
    and trashed_at is null
    and (
      (p_owner_user_id is not null and owner_user_id = p_owner_user_id)
      or (p_guest_session_hash is not null and guest_session_hash = p_guest_session_hash)
    )
  for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'PROJECT_NOT_FOUND';
  end if;
  if v_project.revision <> p_expected_revision then
    return jsonb_build_object('conflict', true, 'revision', v_project.revision);
  end if;

  select * into v_asset from public.project_assets
  where id = p_asset_id and project_id = p_project_id;
  if not found then
    raise exception using errcode = 'P0002', message = 'ASSET_NOT_FOUND';
  end if;

  if (case when jsonb_typeof(v_project.document->'gallery_assets') = 'array'
      then v_project.document->'gallery_assets' else '[]'::jsonb end)
      @> jsonb_build_array(jsonb_build_object('asset_id', p_asset_id)) then
    return jsonb_build_object('asset', to_jsonb(v_asset) - 'storage_key' - 'preview_key' - 'normalized_key',
      'project_revision', v_project.revision, 'duplicate', true);
  end if;

  v_entry := jsonb_strip_nulls(jsonb_build_object(
    'asset_id', v_asset.id,
    'mime_type', v_asset.mime_type,
    'width_px', v_asset.width_px,
    'height_px', v_asset.height_px,
    'added_at', statement_timestamp()
  ));
  update public.projects
  set document = jsonb_set(document, '{gallery_assets}',
        (case when jsonb_typeof(document->'gallery_assets') = 'array'
          then document->'gallery_assets' else '[]'::jsonb end) || jsonb_build_array(v_entry), true),
      revision = revision + 1,
      last_activity_at = now(),
      updated_at = now()
  where id = p_project_id;

  return jsonb_build_object('asset', to_jsonb(v_asset) - 'storage_key' - 'preview_key' - 'normalized_key',
    'project_revision', v_project.revision + 1, 'duplicate', true);
end;
$$;

revoke all on function public.melsou_register_gallery_asset(uuid,uuid,text,integer,uuid,text,text,bigint,integer,integer,text)
  from public, anon, authenticated;
revoke all on function public.melsou_attach_gallery_asset(uuid,uuid,text,integer,uuid)
  from public, anon, authenticated;
grant execute on function public.melsou_register_gallery_asset(uuid,uuid,text,integer,uuid,text,text,bigint,integer,integer,text)
  to service_role;
grant execute on function public.melsou_attach_gallery_asset(uuid,uuid,text,integer,uuid)
  to service_role;

commit;
