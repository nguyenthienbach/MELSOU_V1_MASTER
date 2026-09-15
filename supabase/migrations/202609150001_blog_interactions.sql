-- Blog interactions V1. WordPress remains the content authority; Melsou stores
-- interactions keyed by the stable, normalized WordPress post slug.

create table if not exists public.blog_post_likes (
  id uuid primary key default gen_random_uuid(),
  post_slug text not null check (post_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  user_id uuid references public.app_users(id) on delete cascade,
  guest_session_hash text,
  created_at timestamptz not null default now(),
  check ((user_id is not null)::integer + (guest_session_hash is not null)::integer = 1)
);
create unique index if not exists blog_post_likes_user_unique on public.blog_post_likes(post_slug,user_id) where user_id is not null;
create unique index if not exists blog_post_likes_guest_unique on public.blog_post_likes(post_slug,guest_session_hash) where guest_session_hash is not null;

create table if not exists public.blog_comments (
  id uuid primary key default gen_random_uuid(),
  post_slug text not null check (post_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  user_id uuid not null references public.app_users(id) on delete cascade,
  parent_comment_id uuid references public.blog_comments(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 2000),
  status text not null default 'visible' check (status in ('visible','hidden','deleted','pending')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists blog_comments_post_latest_idx on public.blog_comments(post_slug,created_at desc,id desc) where parent_comment_id is null;
create index if not exists blog_comments_parent_latest_idx on public.blog_comments(parent_comment_id,created_at asc,id asc);

create table if not exists public.blog_comment_likes (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.blog_comments(id) on delete cascade,
  user_id uuid references public.app_users(id) on delete cascade,
  guest_session_hash text,
  created_at timestamptz not null default now(),
  check ((user_id is not null)::integer + (guest_session_hash is not null)::integer = 1)
);
create unique index if not exists blog_comment_likes_user_unique on public.blog_comment_likes(comment_id,user_id) where user_id is not null;
create unique index if not exists blog_comment_likes_guest_unique on public.blog_comment_likes(comment_id,guest_session_hash) where guest_session_hash is not null;

create table if not exists public.blog_share_events (
  id uuid primary key default gen_random_uuid(),
  post_slug text not null check (post_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  user_id uuid references public.app_users(id) on delete set null,
  guest_session_hash text,
  share_type text not null check (share_type in ('copy_link','native_share','facebook','other')),
  dedupe_bucket timestamptz not null,
  created_at timestamptz not null default now(),
  check ((user_id is not null)::integer + (guest_session_hash is not null)::integer = 1)
);
create unique index if not exists blog_share_user_dedupe on public.blog_share_events(post_slug,user_id,share_type,dedupe_bucket) where user_id is not null;
create unique index if not exists blog_share_guest_dedupe on public.blog_share_events(post_slug,guest_session_hash,share_type,dedupe_bucket) where guest_session_hash is not null;

create table if not exists public.blog_view_events (
  id uuid primary key default gen_random_uuid(),
  post_slug text not null check (post_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  user_id uuid references public.app_users(id) on delete set null,
  guest_session_hash text,
  unique_day date not null default (now() at time zone 'utc')::date,
  created_at timestamptz not null default now(),
  check ((user_id is not null)::integer + (guest_session_hash is not null)::integer = 1)
);
create index if not exists blog_view_events_post_idx on public.blog_view_events(post_slug,created_at desc);
create index if not exists blog_view_user_daily_idx on public.blog_view_events(post_slug,user_id,unique_day) where user_id is not null;
create index if not exists blog_view_guest_daily_idx on public.blog_view_events(post_slug,guest_session_hash,unique_day) where guest_session_hash is not null;

alter table public.blog_post_likes enable row level security;
alter table public.blog_comments enable row level security;
alter table public.blog_comment_likes enable row level security;
alter table public.blog_share_events enable row level security;
alter table public.blog_view_events enable row level security;
revoke all on public.blog_post_likes, public.blog_comments, public.blog_comment_likes, public.blog_share_events, public.blog_view_events from anon, authenticated;
grant select,insert,update,delete on public.blog_post_likes, public.blog_comments, public.blog_comment_likes, public.blog_share_events, public.blog_view_events to service_role;

create or replace function public.melsou_blog_actor_matches(p_user_id uuid,p_guest_hash text,r_user_id uuid,r_guest_hash text)
returns boolean language sql immutable as $$ select (p_user_id is not null and p_user_id=r_user_id) or (p_guest_hash is not null and p_guest_hash=r_guest_hash) $$;

create or replace function public.melsou_blog_summary(p_post_slug text,p_user_id uuid default null,p_guest_hash text default null)
returns jsonb language sql security definer set search_path=public as $$
  select jsonb_build_object(
    'liked',exists(select 1 from blog_post_likes l where l.post_slug=p_post_slug and melsou_blog_actor_matches(p_user_id,p_guest_hash,l.user_id,l.guest_session_hash)),
    'like_count',(select count(*) from blog_post_likes l where l.post_slug=p_post_slug),
    'comment_count',(select count(*) from blog_comments c where c.post_slug=p_post_slug and c.parent_comment_id is null and c.status='visible'),
    'reply_count',(select count(*) from blog_comments c where c.post_slug=p_post_slug and c.parent_comment_id is not null and c.status='visible'),
    'share_count',(select count(*) from blog_share_events s where s.post_slug=p_post_slug),
    'view_count',(select count(*) from blog_view_events v where v.post_slug=p_post_slug),
    'unique_view_count',(select count(distinct coalesce(v.user_id::text,'guest:'||v.guest_session_hash)) from blog_view_events v where v.post_slug=p_post_slug)
  )
$$;

create or replace function public.melsou_toggle_blog_post_like(p_post_slug text,p_user_id uuid,p_guest_hash text,p_liked boolean)
returns jsonb language plpgsql security definer set search_path=public as $$
begin
  if (p_user_id is null) = (p_guest_hash is null) then raise exception 'ACTOR_REQUIRED'; end if;
  if p_liked then
    insert into blog_post_likes(post_slug,user_id,guest_session_hash) values(p_post_slug,p_user_id,p_guest_hash) on conflict do nothing;
  else
    delete from blog_post_likes where post_slug=p_post_slug and melsou_blog_actor_matches(p_user_id,p_guest_hash,user_id,guest_session_hash);
  end if;
  return public.melsou_blog_summary(p_post_slug,p_user_id,p_guest_hash);
end $$;

create or replace function public.melsou_create_blog_comment(p_post_slug text,p_user_id uuid,p_parent_comment_id uuid,p_content text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_parent blog_comments; v_comment blog_comments;
begin
  if p_user_id is null then raise exception 'AUTHENTICATION_REQUIRED'; end if;
  p_content:=btrim(p_content);
  if char_length(p_content)<1 or char_length(p_content)>2000 then raise exception 'INVALID_COMMENT'; end if;
  if p_parent_comment_id is not null then
    select * into v_parent from blog_comments where id=p_parent_comment_id and status='visible';
    if not found or v_parent.post_slug<>p_post_slug then raise exception 'PARENT_COMMENT_NOT_FOUND'; end if;
  end if;
  insert into blog_comments(post_slug,user_id,parent_comment_id,content) values(p_post_slug,p_user_id,p_parent_comment_id,p_content) returning * into v_comment;
  return to_jsonb(v_comment);
end $$;

create or replace function public.melsou_toggle_blog_comment_like(p_comment_id uuid,p_user_id uuid,p_guest_hash text,p_liked boolean)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_count bigint;
begin
  if (p_user_id is null) = (p_guest_hash is null) then raise exception 'ACTOR_REQUIRED'; end if;
  if not exists(select 1 from blog_comments where id=p_comment_id and status='visible') then raise exception 'COMMENT_NOT_FOUND'; end if;
  if p_liked then insert into blog_comment_likes(comment_id,user_id,guest_session_hash) values(p_comment_id,p_user_id,p_guest_hash) on conflict do nothing;
  else delete from blog_comment_likes where comment_id=p_comment_id and melsou_blog_actor_matches(p_user_id,p_guest_hash,user_id,guest_session_hash); end if;
  select count(*) into v_count from blog_comment_likes where comment_id=p_comment_id;
  return jsonb_build_object('liked',p_liked,'like_count',v_count);
end $$;

create or replace function public.melsou_list_blog_comments(p_post_slug text,p_parent_comment_id uuid,p_limit integer,p_offset integer,p_sort text,p_user_id uuid default null,p_guest_hash text default null)
returns jsonb language sql security definer set search_path=public as $$
  with rows as (
    select c.id,c.post_slug,c.user_id,c.parent_comment_id,c.content,c.created_at,c.updated_at,
      (select count(*) from blog_comment_likes l where l.comment_id=c.id) like_count,
      (select count(*) from blog_comments r where r.parent_comment_id=c.id and r.status='visible') reply_count,
      exists(select 1 from blog_comment_likes l where l.comment_id=c.id and melsou_blog_actor_matches(p_user_id,p_guest_hash,l.user_id,l.guest_session_hash)) liked,
      coalesce(p.display_name,p.username,'Khách hàng') author_name
    from blog_comments c left join profiles p on p.user_id=c.user_id
    where c.post_slug=p_post_slug and c.status='visible' and c.parent_comment_id is not distinct from p_parent_comment_id
    order by case when p_sort='top' then ((select count(*) from blog_comment_likes l where l.comment_id=c.id)*2+(select count(*) from blog_comments r where r.parent_comment_id=c.id and r.status='visible')) end desc nulls last,c.created_at desc,c.id desc
    offset greatest(0,coalesce(p_offset,0))
    limit greatest(1,least(coalesce(p_limit,5),20))+1
  ), numbered as (select *,row_number() over() n from rows), page as (select * from numbered where n<=greatest(1,least(coalesce(p_limit,5),20)))
  select jsonb_build_object('comments',coalesce(jsonb_agg(to_jsonb(page)-'n'),'[]'::jsonb),'next_cursor',case when (select count(*) from rows)>greatest(1,least(coalesce(p_limit,5),20)) then (greatest(0,coalesce(p_offset,0))+greatest(1,least(coalesce(p_limit,5),20)))::text else null end) from page
$$;

create or replace function public.melsou_record_blog_share(p_post_slug text,p_user_id uuid,p_guest_hash text,p_share_type text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_bucket timestamptz:=date_trunc('minute',now()); v_inserted integer;
begin
  if (p_user_id is null) = (p_guest_hash is null) then raise exception 'ACTOR_REQUIRED'; end if;
  insert into blog_share_events(post_slug,user_id,guest_session_hash,share_type,dedupe_bucket) values(p_post_slug,p_user_id,p_guest_hash,p_share_type,v_bucket) on conflict do nothing;
  get diagnostics v_inserted=row_count;
  return jsonb_build_object('recorded',v_inserted=1,'share_count',(select count(*) from blog_share_events where post_slug=p_post_slug));
end $$;

create or replace function public.melsou_record_blog_view(p_post_slug text,p_user_id uuid,p_guest_hash text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_inserted integer;
begin
  if (p_user_id is null) = (p_guest_hash is null) then raise exception 'ACTOR_REQUIRED'; end if;
  insert into blog_view_events(post_slug,user_id,guest_session_hash) values(p_post_slug,p_user_id,p_guest_hash);
  get diagnostics v_inserted=row_count;
  return jsonb_build_object('recorded',v_inserted=1,'view_count',(select count(*) from blog_view_events where post_slug=p_post_slug),'unique_view_count',(select count(distinct coalesce(user_id::text,'guest:'||guest_session_hash)) from blog_view_events where post_slug=p_post_slug));
end $$;

create or replace function public.melsou_moderate_blog_comment(p_owner_id uuid,p_comment_id uuid,p_status text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_comment blog_comments;
begin
  if not public.melsou_is_owner(p_owner_id) then raise exception 'OWNER_REQUIRED'; end if;
  if p_status not in ('visible','hidden','deleted','pending') then raise exception 'INVALID_STATUS'; end if;
  update blog_comments set status=p_status,updated_at=now() where id=p_comment_id returning * into v_comment;
  if not found then raise exception 'COMMENT_NOT_FOUND'; end if;
  insert into audit_logs(actor_id,action,resource_type,resource_id,after_state) values(p_owner_id,'BLOG_COMMENT_MODERATE','blog_comment',p_comment_id::text,jsonb_build_object('status',p_status));
  return to_jsonb(v_comment);
end $$;

revoke all on function public.melsou_blog_summary(text,uuid,text), public.melsou_toggle_blog_post_like(text,uuid,text,boolean), public.melsou_create_blog_comment(text,uuid,uuid,text), public.melsou_toggle_blog_comment_like(uuid,uuid,text,boolean), public.melsou_list_blog_comments(text,uuid,integer,integer,text,uuid,text), public.melsou_record_blog_share(text,uuid,text,text), public.melsou_record_blog_view(text,uuid,text), public.melsou_moderate_blog_comment(uuid,uuid,text) from public, anon, authenticated;
grant execute on function public.melsou_blog_summary(text,uuid,text), public.melsou_toggle_blog_post_like(text,uuid,text,boolean), public.melsou_create_blog_comment(text,uuid,uuid,text), public.melsou_toggle_blog_comment_like(uuid,uuid,text,boolean), public.melsou_list_blog_comments(text,uuid,integer,integer,text,uuid,text), public.melsou_record_blog_share(text,uuid,text,text), public.melsou_record_blog_view(text,uuid,text), public.melsou_moderate_blog_comment(uuid,uuid,text) to service_role;
