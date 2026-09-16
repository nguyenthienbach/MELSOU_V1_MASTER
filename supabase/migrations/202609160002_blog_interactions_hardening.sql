-- Harden the already-deployed Blog Interactions V1 schema without rewriting history.
-- WordPress remains the post-content authority. Supabase remains the sole
-- interaction authority. The two existing production comments are already
-- Supabase UUID rows, so this migration intentionally performs no legacy import.

begin;

-- Reassert the deployed security boundary without rerunning the original migration.
alter table public.blog_post_likes enable row level security;
alter table public.blog_comments enable row level security;
alter table public.blog_comment_likes enable row level security;
alter table public.blog_share_events enable row level security;
alter table public.blog_view_events enable row level security;

create index if not exists blog_comments_owner_updated_idx
  on public.blog_comments(user_id, updated_at desc)
  where user_id is not null;

create or replace function public.melsou_blog_actor_matches(
  p_user_id uuid, p_guest_hash text, r_user_id uuid, r_guest_hash text
) returns boolean
language sql immutable
set search_path = pg_catalog, public
as $$
  select (p_user_id is not null and p_user_id = r_user_id)
      or (p_guest_hash is not null and p_guest_hash = r_guest_hash)
$$;

create or replace function public.melsou_blog_summary(
  p_post_slug text, p_user_id uuid default null, p_guest_hash text default null
) returns jsonb
language sql security definer
set search_path = pg_catalog, public
as $$
  select jsonb_build_object(
    'liked', exists(
      select 1 from public.blog_post_likes l
      where l.post_slug = p_post_slug
        and public.melsou_blog_actor_matches(p_user_id,p_guest_hash,l.user_id,l.guest_session_hash)
    ),
    'like_count', (select count(*) from public.blog_post_likes l where l.post_slug=p_post_slug),
    'comment_count', (select count(*) from public.blog_comments c where c.post_slug=p_post_slug and c.parent_comment_id is null and c.status='visible'),
    'reply_count', (select count(*) from public.blog_comments c where c.post_slug=p_post_slug and c.parent_comment_id is not null and c.status='visible'),
    'share_count', (select count(*) from public.blog_share_events s where s.post_slug=p_post_slug),
    'view_count', (select count(*) from public.blog_view_events v where v.post_slug=p_post_slug),
    'unique_view_count', (select count(distinct coalesce(v.user_id::text,'guest:'||v.guest_session_hash)) from public.blog_view_events v where v.post_slug=p_post_slug)
  )
$$;

create or replace function public.melsou_toggle_blog_post_like(
  p_post_slug text, p_user_id uuid, p_guest_hash text, p_liked boolean
) returns jsonb
language plpgsql security definer
set search_path = pg_catalog, public
as $$
begin
  if (p_user_id is null) = (p_guest_hash is null) then raise exception 'ACTOR_REQUIRED'; end if;
  if p_liked then
    insert into public.blog_post_likes(post_slug,user_id,guest_session_hash)
      values(p_post_slug,p_user_id,p_guest_hash) on conflict do nothing;
  else
    delete from public.blog_post_likes
      where post_slug=p_post_slug
        and public.melsou_blog_actor_matches(p_user_id,p_guest_hash,user_id,guest_session_hash);
  end if;
  return public.melsou_blog_summary(p_post_slug,p_user_id,p_guest_hash);
end $$;

create or replace function public.melsou_create_blog_comment(
  p_post_slug text, p_user_id uuid, p_parent_comment_id uuid, p_content text
) returns jsonb
language plpgsql security definer
set search_path = pg_catalog, public
as $$
declare v_parent public.blog_comments; v_comment public.blog_comments; v_author text;
begin
  if p_user_id is null then raise exception 'AUTHENTICATION_REQUIRED'; end if;
  p_content := btrim(p_content);
  if char_length(p_content)<1 or char_length(p_content)>2000 then raise exception 'INVALID_COMMENT'; end if;
  if p_parent_comment_id is not null then
    select * into v_parent from public.blog_comments where id=p_parent_comment_id and status='visible';
    if not found or v_parent.post_slug<>p_post_slug then raise exception 'PARENT_COMMENT_NOT_FOUND'; end if;
    if v_parent.parent_comment_id is not null then p_parent_comment_id := v_parent.parent_comment_id; end if;
  end if;
  insert into public.blog_comments(post_slug,user_id,parent_comment_id,content)
    values(p_post_slug,p_user_id,p_parent_comment_id,p_content) returning * into v_comment;
  select coalesce(p.display_name,p.username,'Khách hàng') into v_author from public.profiles p where p.user_id=p_user_id;
  return jsonb_build_object(
    'id',v_comment.id,'post_slug',v_comment.post_slug,'parent_comment_id',v_comment.parent_comment_id,
    'content',v_comment.content,'status',v_comment.status,'created_at',v_comment.created_at,
    'updated_at',v_comment.updated_at,'like_count',0,'reply_count',0,'liked',false,
    'author_name',coalesce(v_author,'Khách hàng'),'can_edit',true
  );
end $$;

create or replace function public.melsou_toggle_blog_comment_like(
  p_comment_id uuid, p_user_id uuid, p_guest_hash text, p_liked boolean
) returns jsonb
language plpgsql security definer
set search_path = pg_catalog, public
as $$
declare v_count bigint;
begin
  if (p_user_id is null) = (p_guest_hash is null) then raise exception 'ACTOR_REQUIRED'; end if;
  if not exists(select 1 from public.blog_comments where id=p_comment_id and status='visible') then raise exception 'COMMENT_NOT_FOUND'; end if;
  if p_liked then
    insert into public.blog_comment_likes(comment_id,user_id,guest_session_hash)
      values(p_comment_id,p_user_id,p_guest_hash) on conflict do nothing;
  else
    delete from public.blog_comment_likes
      where comment_id=p_comment_id
        and public.melsou_blog_actor_matches(p_user_id,p_guest_hash,user_id,guest_session_hash);
  end if;
  select count(*) into v_count from public.blog_comment_likes where comment_id=p_comment_id;
  return jsonb_build_object('liked',p_liked,'like_count',v_count);
end $$;

create or replace function public.melsou_list_blog_comments(
  p_post_slug text, p_parent_comment_id uuid, p_limit integer, p_offset integer,
  p_sort text, p_user_id uuid default null, p_guest_hash text default null
) returns jsonb
language sql security definer
set search_path = pg_catalog, public
as $$
  with rows as (
    select c.id,c.post_slug,c.parent_comment_id,c.content,c.created_at,c.updated_at,
      (select count(*) from public.blog_comment_likes l where l.comment_id=c.id) like_count,
      (select count(*) from public.blog_comments r where r.parent_comment_id=c.id and r.status='visible') reply_count,
      exists(select 1 from public.blog_comment_likes l where l.comment_id=c.id and public.melsou_blog_actor_matches(p_user_id,p_guest_hash,l.user_id,l.guest_session_hash)) liked,
      coalesce(p.display_name,p.username,'Khách hàng') author_name,
      (p_user_id is not null and c.user_id=p_user_id) can_edit
    from public.blog_comments c left join public.profiles p on p.user_id=c.user_id
    where c.post_slug=p_post_slug and c.status='visible'
      and c.parent_comment_id is not distinct from p_parent_comment_id
    order by case when p_sort='top' then (
      (select count(*) from public.blog_comment_likes l where l.comment_id=c.id)*2+
      (select count(*) from public.blog_comments r where r.parent_comment_id=c.id and r.status='visible')
    ) end desc nulls last,c.created_at desc,c.id desc
    offset greatest(0,coalesce(p_offset,0))
    limit greatest(1,least(coalesce(p_limit,5),20))+1
  ), numbered as (select *,row_number() over() n from rows),
  page as (select * from numbered where n<=greatest(1,least(coalesce(p_limit,5),20)))
  select jsonb_build_object(
    'comments',coalesce(jsonb_agg(to_jsonb(page)-'n'),'[]'::jsonb),
    'next_cursor',case when (select count(*) from rows)>greatest(1,least(coalesce(p_limit,5),20))
      then (greatest(0,coalesce(p_offset,0))+greatest(1,least(coalesce(p_limit,5),20)))::text else null end
  ) from page
$$;

create or replace function public.melsou_update_blog_comment(
  p_user_id uuid, p_comment_id uuid, p_post_slug text, p_content text, p_delete boolean default false
) returns jsonb
language plpgsql security definer
set search_path = pg_catalog, public
as $$
declare v_comment public.blog_comments; v_author text;
begin
  if p_user_id is null then raise exception 'AUTHENTICATION_REQUIRED'; end if;
  select * into v_comment from public.blog_comments
    where id=p_comment_id and post_slug=p_post_slug for update;
  if not found then raise exception 'COMMENT_NOT_FOUND'; end if;
  if v_comment.user_id is distinct from p_user_id then raise exception 'COMMENT_FORBIDDEN'; end if;
  if v_comment.status='deleted' then raise exception 'COMMENT_DELETED'; end if;
  if p_delete then
    update public.blog_comments set status='deleted',updated_at=now() where id=p_comment_id returning * into v_comment;
  else
    p_content:=btrim(p_content);
    if char_length(p_content)<1 or char_length(p_content)>2000 then raise exception 'INVALID_COMMENT'; end if;
    update public.blog_comments set content=p_content,updated_at=now() where id=p_comment_id returning * into v_comment;
  end if;
  select coalesce(p.display_name,p.username,'Khách hàng') into v_author from public.profiles p where p.user_id=p_user_id;
  return jsonb_build_object(
    'id',v_comment.id,'post_slug',v_comment.post_slug,'parent_comment_id',v_comment.parent_comment_id,
    'content',case when v_comment.status='deleted' then null else v_comment.content end,
    'status',v_comment.status,'created_at',v_comment.created_at,'updated_at',v_comment.updated_at,
    'author_name',coalesce(v_author,'Khách hàng'),'can_edit',v_comment.status<>'deleted'
  );
end $$;

create or replace function public.melsou_record_blog_share(
  p_post_slug text,p_user_id uuid,p_guest_hash text,p_share_type text
) returns jsonb
language plpgsql security definer
set search_path = pg_catalog, public
as $$
declare v_bucket timestamptz:=date_trunc('minute',now()); v_inserted integer;
begin
  if (p_user_id is null) = (p_guest_hash is null) then raise exception 'ACTOR_REQUIRED'; end if;
  insert into public.blog_share_events(post_slug,user_id,guest_session_hash,share_type,dedupe_bucket)
    values(p_post_slug,p_user_id,p_guest_hash,p_share_type,v_bucket) on conflict do nothing;
  get diagnostics v_inserted=row_count;
  return jsonb_build_object('recorded',v_inserted=1,'share_count',(select count(*) from public.blog_share_events where post_slug=p_post_slug));
end $$;

create or replace function public.melsou_record_blog_view(
  p_post_slug text,p_user_id uuid,p_guest_hash text
) returns jsonb
language plpgsql security definer
set search_path = pg_catalog, public
as $$
declare v_inserted integer;
begin
  if (p_user_id is null) = (p_guest_hash is null) then raise exception 'ACTOR_REQUIRED'; end if;
  insert into public.blog_view_events(post_slug,user_id,guest_session_hash) values(p_post_slug,p_user_id,p_guest_hash);
  get diagnostics v_inserted=row_count;
  return jsonb_build_object('recorded',v_inserted=1,
    'view_count',(select count(*) from public.blog_view_events where post_slug=p_post_slug),
    'unique_view_count',(select count(distinct coalesce(user_id::text,'guest:'||guest_session_hash)) from public.blog_view_events where post_slug=p_post_slug));
end $$;

create or replace function public.melsou_moderate_blog_comment(
  p_owner_id uuid,p_comment_id uuid,p_status text
) returns jsonb
language plpgsql security definer
set search_path = pg_catalog, public
as $$
declare v_comment public.blog_comments;
begin
  if not public.melsou_is_owner(p_owner_id) then raise exception 'OWNER_REQUIRED'; end if;
  if p_status not in ('visible','hidden','deleted','pending') then raise exception 'INVALID_STATUS'; end if;
  update public.blog_comments set status=p_status,updated_at=now() where id=p_comment_id returning * into v_comment;
  if not found then raise exception 'COMMENT_NOT_FOUND'; end if;
  insert into public.audit_logs(actor_id,action,resource_type,resource_id,after_state)
    values(p_owner_id,'BLOG_COMMENT_MODERATE','blog_comment',p_comment_id::text,jsonb_build_object('status',p_status));
  return jsonb_build_object('id',v_comment.id,'post_slug',v_comment.post_slug,
    'parent_comment_id',v_comment.parent_comment_id,'status',v_comment.status,
    'created_at',v_comment.created_at,'updated_at',v_comment.updated_at);
end $$;

revoke all on table public.blog_post_likes, public.blog_comments, public.blog_comment_likes,
  public.blog_share_events, public.blog_view_events from anon, authenticated;
grant select,insert,update,delete on table public.blog_post_likes, public.blog_comments,
  public.blog_comment_likes, public.blog_share_events, public.blog_view_events to service_role;

revoke all on function public.melsou_blog_actor_matches(uuid,text,uuid,text),
  public.melsou_blog_summary(text,uuid,text), public.melsou_toggle_blog_post_like(text,uuid,text,boolean),
  public.melsou_create_blog_comment(text,uuid,uuid,text), public.melsou_toggle_blog_comment_like(uuid,uuid,text,boolean),
  public.melsou_list_blog_comments(text,uuid,integer,integer,text,uuid,text),
  public.melsou_update_blog_comment(uuid,uuid,text,text,boolean), public.melsou_record_blog_share(text,uuid,text,text),
  public.melsou_record_blog_view(text,uuid,text), public.melsou_moderate_blog_comment(uuid,uuid,text)
  from public, anon, authenticated;
grant execute on function public.melsou_blog_summary(text,uuid,text),
  public.melsou_toggle_blog_post_like(text,uuid,text,boolean), public.melsou_create_blog_comment(text,uuid,uuid,text),
  public.melsou_toggle_blog_comment_like(uuid,uuid,text,boolean),
  public.melsou_list_blog_comments(text,uuid,integer,integer,text,uuid,text),
  public.melsou_update_blog_comment(uuid,uuid,text,text,boolean), public.melsou_record_blog_share(text,uuid,text,text),
  public.melsou_record_blog_view(text,uuid,text), public.melsou_moderate_blog_comment(uuid,uuid,text)
  to service_role;

commit;
