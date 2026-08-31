-- Guest drafts are private to a browser-issued opaque session and expire after 14 inactive days.
create or replace function public.melsou_save_guest_project(p_project_id uuid, p_guest_session_hash text, p_expected_revision integer, p_document jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_next_revision integer;
begin
  update public.projects set document = p_document,
    template_id = coalesce(p_document->'template'->>'template_id', template_id),
    template_version = coalesce((p_document->'template'->>'version')::integer, template_version),
    revision = revision + 1, last_activity_at = now(), updated_at = now()
  where id = p_project_id and owner_user_id is null and guest_session_hash = p_guest_session_hash and revision = p_expected_revision and trashed_at is null
  returning revision into v_next_revision;
  if v_next_revision is null then
    if exists (select 1 from public.projects where id = p_project_id and owner_user_id is null and guest_session_hash = p_guest_session_hash) then
      return jsonb_build_object('conflict', true, 'revision', (select revision from public.projects where id = p_project_id));
    end if;
    raise exception using errcode = 'P0002', message = 'GUEST_PROJECT_NOT_FOUND';
  end if;
  return jsonb_build_object('id',p_project_id,'revision',v_next_revision);
end $$;
revoke all on function public.melsou_save_guest_project(uuid,text,integer,jsonb) from public;

create or replace function public.melsou_claim_guest_projects(p_owner_id uuid, p_guest_session_hash text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_projects jsonb;
begin
  with claimed as (
    update public.projects set owner_user_id = p_owner_id, guest_session_hash = null, last_activity_at = now(), updated_at = now()
    where owner_user_id is null and guest_session_hash = p_guest_session_hash and trashed_at is null
    returning id,revision,title
  ) select coalesce(jsonb_agg(jsonb_build_object('id',id,'revision',revision,'title',title)),'[]'::jsonb) into v_projects from claimed;
  insert into public.audit_logs(actor_id,action,resource_type,resource_id,after_state) values(p_owner_id,'GUEST_DRAFTS_CLAIMED','guest_session',p_guest_session_hash,jsonb_build_object('count',jsonb_array_length(v_projects)));
  return v_projects;
end $$;
revoke all on function public.melsou_claim_guest_projects(uuid,text) from public;

-- At most one current editor can hold a specific content slot; locks automatically expire.
create table public.project_slot_locks (
  id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id) on delete cascade,
  slot_id text not null check (length(slot_id) between 1 and 120), holder_user_id uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(project_id,slot_id)
);
create or replace function public.melsou_acquire_slot_lock(p_project_id uuid, p_user_id uuid, p_slot_id text, p_ttl_seconds integer default 120)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_lock public.project_slot_locks; v_allowed boolean;
begin
  select exists(select 1 from public.projects p where p.id = p_project_id and (p.owner_user_id = p_user_id or exists(select 1 from public.project_duo_members m where m.project_id=p_project_id and m.user_id=p_user_id and m.active))) into v_allowed;
  if not v_allowed then raise exception using errcode = '42501', message='PROJECT_EDITOR_REQUIRED'; end if;
  select * into v_lock from public.project_slot_locks where project_id=p_project_id and slot_id=p_slot_id for update;
  if found and v_lock.expires_at > now() and v_lock.holder_user_id <> p_user_id then return jsonb_build_object('locked',true,'expires_at',v_lock.expires_at); end if;
  insert into public.project_slot_locks(project_id,slot_id,holder_user_id,expires_at) values(p_project_id,p_slot_id,p_user_id,now()+make_interval(secs=>greatest(30,least(300,p_ttl_seconds))))
    on conflict(project_id,slot_id) do update set holder_user_id=excluded.holder_user_id,expires_at=excluded.expires_at,updated_at=now()
    returning * into v_lock;
  return jsonb_build_object('locked',false,'expires_at',v_lock.expires_at);
end $$;
revoke all on function public.melsou_acquire_slot_lock(uuid,uuid,text,integer) from public;

create or replace function public.melsou_complete_order_when_all_shipments_complete()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'COMPLETED' and old.status is distinct from 'COMPLETED' and not exists(select 1 from public.shipments where order_id=new.order_id and status <> 'COMPLETED') then
    update public.orders set status='COMPLETED',updated_at=now() where id=new.order_id and status in ('READY_TO_SHIP','SHIPPING');
  end if;
  return new;
end $$;
create trigger on_shipment_completed_maybe_complete_order after update of status on public.shipments for each row execute procedure public.melsou_complete_order_when_all_shipments_complete();
