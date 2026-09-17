with
role_oids as (
  select
    (select oid from pg_catalog.pg_roles where rolname = 'service_role') as service_role_oid,
    (select oid from pg_catalog.pg_roles where rolname = 'anon') as anon_oid,
    (select oid from pg_catalog.pg_roles where rolname = 'authenticated') as authenticated_oid
),
target_function as (
  select to_regprocedure(
    'public.melsou_owner_list_blog_comments(uuid,text,text,integer,timestamp with time zone,uuid,text)'
  )::oid as oid
),
function_meta as (
  select
    p.oid,
    p.proowner,
    p.prosecdef,
    p.proconfig,
    pg_catalog.pg_get_functiondef(p.oid) as definition,
    lower(pg_catalog.pg_get_functiondef(p.oid)) as lower_definition
  from pg_catalog.pg_proc p
  join target_function t on t.oid = p.oid
),
function_acl as (
  select acl.grantee, acl.privilege_type
  from pg_catalog.pg_proc p
  join target_function t on t.oid = p.oid
  cross join lateral pg_catalog.aclexplode(
    coalesce(p.proacl, pg_catalog.acldefault('f', p.proowner))
  ) acl
),
comments_table as (
  select c.oid, c.relowner, c.relrowsecurity
  from pg_catalog.pg_class c
  join pg_catalog.pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = 'blog_comments'
    and c.relkind in ('r', 'p')
),
comments_table_acl as (
  select acl.grantee, acl.privilege_type
  from comments_table c
  cross join lateral pg_catalog.aclexplode(
    coalesce(
      (select relacl from pg_catalog.pg_class where oid = c.oid),
      pg_catalog.acldefault('r', c.relowner)
    )
  ) acl
),
function_checks as (
  select
    position('public.melsou_is_owner(p_owner_id)' in lower_definition) > 0 as owner_check_ok,
    position('public.blog_comments' in lower_definition) > 0 as comments_reference_ok,
    position('public.profiles' in lower_definition) > 0 as profiles_reference_ok,
    position('''visible''' in lower_definition) > 0 as visible_status_ok,
    position('''hidden''' in lower_definition) > 0 as hidden_status_ok,
    position('''deleted''' in lower_definition) > 0 as deleted_status_ok,
    position('[đã xóa]' in lower_definition) > 0 as deleted_placeholder_ok,
    lower_definition !~ '(^|[;\n\r])[[:space:]]*insert[[:space:]]+into[[:space:]]' as no_insert_ok,
    lower_definition !~ '(^|[;\n\r])[[:space:]]*update[[:space:]]+[a-z_"]' as no_update_statement_ok,
    lower_definition !~ '(^|[;\n\r])[[:space:]]*delete[[:space:]]+from[[:space:]]' as no_delete_statement_ok,
    lower_definition !~ '(^|[;\n\r])[[:space:]]*truncate([[:space:]]+table)?[[:space:]]' as no_truncate_ok,
    lower_definition !~ '(^|[;\n\r])[[:space:]]*drop[[:space:]]+' as no_drop_ok,
    lower_definition !~ '(^|[;\n\r])[[:space:]]*alter[[:space:]]+' as no_alter_ok
  from function_meta
),
checks as (
  select
    exists(select 1 from function_meta) as function_exists,
    coalesce((select prosecdef from function_meta limit 1), false) as security_definer_ok,
    coalesce((
      select coalesce(pg_catalog.array_to_string(proconfig, ','), '')
        ~ '(^|,)search_path=pg_catalog, public(,|$)'
      from function_meta limit 1
    ), false) as trusted_search_path_ok,
    coalesce((select service_role_oid is not null from role_oids), false) as service_role_exists,
    exists(
      select 1 from function_acl fa cross join role_oids r
      where fa.grantee = r.service_role_oid and fa.privilege_type = 'EXECUTE'
    ) as service_role_execute_ok,
    not exists(
      select 1 from function_acl fa cross join role_oids r
      where fa.privilege_type = 'EXECUTE'
        and (fa.grantee = 0 or fa.grantee = r.anon_oid or fa.grantee = r.authenticated_oid)
    ) as browser_execute_denied,
    exists(select 1 from comments_table) as comments_table_exists,
    coalesce((select relrowsecurity from comments_table limit 1), false) as rls_enabled,
    not exists(
      select 1 from comments_table_acl ta cross join role_oids r
      where ta.privilege_type in ('SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER')
        and (ta.grantee = 0 or ta.grantee = r.anon_oid or ta.grantee = r.authenticated_oid)
    ) as browser_table_access_denied,
    coalesce(
      pg_catalog.pg_get_indexdef(to_regclass('public.blog_comments_owner_global_cursor_idx'))
        ~* 'ON[[:space:]]+public[.]blog_comments[[:space:]]+USING[[:space:]]+btree[[:space:]]*[(][[:space:]]*created_at[[:space:]]+DESC[[:space:]]*,[[:space:]]*id[[:space:]]+DESC[[:space:]]*[)]',
      false
    ) as global_cursor_index_ok,
    coalesce(
      pg_catalog.pg_get_indexdef(to_regclass('public.blog_comments_owner_post_cursor_idx'))
        ~* 'ON[[:space:]]+public[.]blog_comments[[:space:]]+USING[[:space:]]+btree[[:space:]]*[(][[:space:]]*post_slug[[:space:]]*,[[:space:]]*created_at[[:space:]]+DESC[[:space:]]*,[[:space:]]*id[[:space:]]+DESC[[:space:]]*[)]',
      false
    ) as post_cursor_index_ok
)
select case when
  c.function_exists
  and c.security_definer_ok
  and c.trusted_search_path_ok
  and c.service_role_exists
  and c.service_role_execute_ok
  and c.browser_execute_denied
  and c.comments_table_exists
  and c.rls_enabled
  and c.browser_table_access_denied
  and c.global_cursor_index_ok
  and c.post_cursor_index_ok
  and coalesce(f.owner_check_ok, false)
  and coalesce(f.comments_reference_ok, false)
  and coalesce(f.profiles_reference_ok, false)
  and coalesce(f.visible_status_ok, false)
  and coalesce(f.hidden_status_ok, false)
  and coalesce(f.deleted_status_ok, false)
  and coalesce(f.deleted_placeholder_ok, false)
  and coalesce(f.no_insert_ok, false)
  and coalesce(f.no_update_statement_ok, false)
  and coalesce(f.no_delete_statement_ok, false)
  and coalesce(f.no_truncate_ok, false)
  and coalesce(f.no_drop_ok, false)
  and coalesce(f.no_alter_ok, false)
then 'YES' else 'NO' end as "OWNER_BLOG_MODERATION_MIGRATION_APPLIED"
from checks c
left join function_checks f on true;
