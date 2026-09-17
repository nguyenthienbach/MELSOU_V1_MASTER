begin;

create index if not exists blog_comments_owner_global_cursor_idx
  on public.blog_comments(created_at desc, id desc);

create index if not exists blog_comments_owner_post_cursor_idx
  on public.blog_comments(post_slug, created_at desc, id desc);

create or replace function public.melsou_owner_list_blog_comments(
  p_owner_id uuid,
  p_post_slug text default null,
  p_status text default 'all',
  p_limit integer default 50,
  p_cursor_created_at timestamptz default null,
  p_cursor_id uuid default null,
  p_sort text default 'newest'
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_limit integer := greatest(1, least(coalesce(p_limit, 50), 100));
  v_result jsonb;
begin
  if not public.melsou_is_owner(p_owner_id) then
    raise exception 'OWNER_REQUIRED';
  end if;
  if p_status not in ('visible', 'hidden', 'deleted', 'all') then
    raise exception 'INVALID_STATUS';
  end if;
  if p_sort not in ('newest', 'oldest') then
    raise exception 'INVALID_SORT';
  end if;
  if (p_cursor_created_at is null) <> (p_cursor_id is null) then
    raise exception 'INVALID_CURSOR';
  end if;

  with reply_stats as (
    select
      parent_comment_id,
      count(*) as reply_count,
      count(*) filter (where status = 'visible') as visible_count,
      count(*) filter (where status = 'hidden') as hidden_count,
      count(*) filter (where status = 'deleted') as deleted_count,
      count(*) filter (where status = 'pending') as pending_count
    from public.blog_comments
    where parent_comment_id is not null
    group by parent_comment_id
  ), filtered as (
    select
      c.id,
      c.post_slug,
      c.parent_comment_id,
      case when c.status = 'deleted' then '[Đã xóa]' else c.content end as content,
      c.status,
      c.created_at,
      c.updated_at,
      coalesce(p.display_name, p.username, 'Khách hàng') as author_name,
      (c.parent_comment_id is not null) as is_reply,
      case when c.parent_comment_id is null then coalesce(rs.reply_count, 0) else 0 end as reply_count,
      case when c.parent_comment_id is null then jsonb_build_object(
        'visible', coalesce(rs.visible_count, 0),
        'hidden', coalesce(rs.hidden_count, 0),
        'deleted', coalesce(rs.deleted_count, 0),
        'pending', coalesce(rs.pending_count, 0)
      ) else null end as reply_status_counts
    from public.blog_comments c
    left join public.profiles p on p.user_id = c.user_id
    left join reply_stats rs on rs.parent_comment_id = c.id
    where (p_post_slug is null or c.post_slug = p_post_slug)
      and (p_status = 'all' or c.status = p_status)
      and (
        p_cursor_created_at is null
        or (p_sort = 'newest' and (c.created_at, c.id) < (p_cursor_created_at, p_cursor_id))
        or (p_sort = 'oldest' and (c.created_at, c.id) > (p_cursor_created_at, p_cursor_id))
      )
    order by
      case when p_sort = 'newest' then c.created_at end desc,
      case when p_sort = 'newest' then c.id end desc,
      case when p_sort = 'oldest' then c.created_at end asc,
      case when p_sort = 'oldest' then c.id end asc
    limit v_limit + 1
  ), page as (
    select * from filtered limit v_limit
  ), boundary as (
    select created_at, id from page
    order by
      case when p_sort = 'newest' then created_at end asc,
      case when p_sort = 'newest' then id end asc,
      case when p_sort = 'oldest' then created_at end desc,
      case when p_sort = 'oldest' then id end desc
    limit 1
  )
  select jsonb_build_object(
    'comments', coalesce((select jsonb_agg(to_jsonb(page) order by
      case when p_sort = 'newest' then created_at end desc,
      case when p_sort = 'newest' then id end desc,
      case when p_sort = 'oldest' then created_at end asc,
      case when p_sort = 'oldest' then id end asc
    ) from page), '[]'::jsonb),
    'has_more', (select count(*) > v_limit from filtered),
    'next_cursor', case when (select count(*) > v_limit from filtered) then
      (select jsonb_build_object('created_at', created_at, 'id', id) from boundary)
    else null end
  ) into v_result;

  return v_result;
end $$;

revoke all on function public.melsou_owner_list_blog_comments(uuid,text,text,integer,timestamptz,uuid,text)
  from public, anon, authenticated;
grant execute on function public.melsou_owner_list_blog_comments(uuid,text,text,integer,timestamptz,uuid,text)
  to service_role;

commit;
