-- Duo Sync is intentionally constrained: owner + one invited editor, never a group workspace.
create table public.project_duo_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'EDITOR' check (role = 'EDITOR'),
  active boolean not null default true,
  joined_at timestamptz not null default now(),
  primary key (project_id, user_id)
);
create table public.project_duo_invites (
  id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id) on delete cascade,
  token_hash text not null unique, created_by uuid not null references auth.users(id), accepted_by uuid references auth.users(id),
  expires_at timestamptz not null, accepted_at timestamptz, revoked_at timestamptz, created_at timestamptz not null default now()
);
create or replace function public.melsou_enforce_duo_limit()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.active and not exists (select 1 from public.project_duo_members where project_id = new.project_id and user_id = new.user_id and active) and
    (select count(*) from public.project_duo_members where project_id = new.project_id and active) >= 1 then
    raise exception using errcode = '23514', message = 'DUO_LIMIT_REACHED';
  end if;
  return new;
end $$;
create trigger project_duo_limit before insert or update of active on public.project_duo_members for each row execute procedure public.melsou_enforce_duo_limit();

create or replace function public.melsou_accept_duo_invite(p_user_id uuid, p_token_hash text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_invite public.project_duo_invites; v_owner uuid;
begin
  select * into v_invite from public.project_duo_invites where token_hash = p_token_hash for update;
  if not found or v_invite.revoked_at is not null or v_invite.expires_at <= now() then raise exception 'DUO_INVITE_INVALID'; end if;
  select owner_user_id into v_owner from public.projects where id = v_invite.project_id;
  if v_owner = p_user_id then raise exception 'DUO_OWNER_CANNOT_ACCEPT'; end if;
  if v_invite.accepted_by is not null and v_invite.accepted_by <> p_user_id then raise exception 'DUO_INVITE_ALREADY_USED'; end if;
  insert into public.project_duo_members(project_id,user_id) values(v_invite.project_id,p_user_id)
    on conflict(project_id,user_id) do update set active = true;
  update public.project_duo_invites set accepted_by = p_user_id, accepted_at = coalesce(accepted_at,now()) where id = v_invite.id;
  return jsonb_build_object('project_id',v_invite.project_id,'role','EDITOR');
end $$;
revoke all on function public.melsou_accept_duo_invite(uuid,text) from public;

-- Replaces the owner-only save function once the Duo member table exists.
create or replace function public.melsou_save_project(p_project_id uuid, p_owner_user_id uuid, p_expected_revision integer, p_document jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_next_revision integer;
begin
  update public.projects set document = p_document,
    template_id = coalesce(p_document->'template'->>'template_id', template_id),
    template_version = coalesce((p_document->'template'->>'version')::integer, template_version),
    revision = revision + 1, last_activity_at = now(), updated_at = now()
  where id = p_project_id and revision = p_expected_revision and trashed_at is null and (
    owner_user_id = p_owner_user_id or exists (select 1 from public.project_duo_members m where m.project_id = p_project_id and m.user_id = p_owner_user_id and m.active)
  ) returning revision into v_next_revision;
  if v_next_revision is null then
    if exists (select 1 from public.projects where id = p_project_id and (owner_user_id = p_owner_user_id or exists (select 1 from public.project_duo_members m where m.project_id = p_project_id and m.user_id = p_owner_user_id and m.active))) then
      return jsonb_build_object('conflict', true, 'revision', (select revision from public.projects where id = p_project_id));
    end if;
    raise exception using errcode = 'P0002', message = 'PROJECT_NOT_FOUND';
  end if;
  return jsonb_build_object('id', p_project_id, 'revision', v_next_revision);
end $$;
revoke all on function public.melsou_save_project(uuid,uuid,integer,jsonb) from public;

create table public.archive_jobs (
  id uuid primary key default gen_random_uuid(), order_id uuid not null unique references public.orders(id) on delete cascade,
  status text not null default 'QUEUED' check (status in ('QUEUED','RUNNING','SUCCESS','FAILED')), attempts integer not null default 0,
  archive_uri text, error_code text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.reporting_outbox (
  id bigint generated always as identity primary key, event_type text not null, aggregate_id text not null,
  payload jsonb not null, delivered_at timestamptz, attempts integer not null default 0, created_at timestamptz not null default now()
);
create or replace function public.melsou_enqueue_archive_and_report()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'COMPLETED' and old.status is distinct from 'COMPLETED' then
    insert into public.archive_jobs(order_id) values (new.id) on conflict (order_id) do nothing;
    insert into public.reporting_outbox(event_type, aggregate_id, payload)
      values ('ORDER_COMPLETED', new.id::text, jsonb_build_object('order_code',new.order_code,'amount_vnd',new.expected_amount_vnd,'completed_at',now()));
  end if;
  return new;
end $$;
create trigger on_order_completed_enqueue_archive after update of status on public.orders for each row execute procedure public.melsou_enqueue_archive_and_report();

alter table public.project_duo_members enable row level security;
alter table public.project_duo_invites enable row level security;
create policy "duo member can read project membership" on public.project_duo_members for select using (
  user_id = auth.uid() or exists (select 1 from public.projects p where p.id = project_id and p.owner_user_id = auth.uid())
);
