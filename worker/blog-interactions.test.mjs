import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { handleBlogInteraction, matchBlogInteraction } from './blog-interactions.mjs';

const slug = 'cau-chuyen-dau-tien-cua-melsou';
const ids = Array.from({ length: 12 }, (_, index) => `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`);

function harness() {
  const state = { postLikes: new Set(), comments: [], commentLikes: new Map(), shares: new Set(), views: [], sequence: 0 };
  const actor = (request, createGuest = false) => {
    const userId = request.headers.get('X-Test-User');
    if (userId) return { userId, guestHash: null };
    const guestHash = request.headers.get('X-Test-Guest');
    if (guestHash) return { userId: null, guestHash };
    return createGuest ? { userId: null, guestHash: 'guest-new', setCookie: 'melsou_guest_v1=test; Path=/; HttpOnly' } : null;
  };
  const actorKey = (body) => body.p_user_id ? `u:${body.p_user_id}` : `g:${body.p_guest_hash}`;
  const commentJson = (comment, body) => ({ id: comment.id, post_slug: comment.post_slug, parent_comment_id: comment.parent_comment_id, content: comment.content, status: comment.status, created_at: comment.created_at, updated_at: comment.updated_at, like_count: state.commentLikes.get(comment.id)?.size || 0, reply_count: state.comments.filter((item) => item.parent_comment_id === comment.id && item.status === 'visible').length, liked: state.commentLikes.get(comment.id)?.has(actorKey(body)) || false, author_name: 'Test user', can_edit: body.p_user_id === comment.user_id });
  const serviceFetch = async (path, options = {}) => {
    const body = JSON.parse(options.body || '{}');
    let value;
    if (path.endsWith('melsou_blog_summary')) value = { liked: state.postLikes.has(actorKey(body)), like_count: state.postLikes.size, comment_count: state.comments.filter((c) => !c.parent_comment_id && c.status === 'visible').length, reply_count: state.comments.filter((c) => c.parent_comment_id && c.status === 'visible').length, share_count: state.shares.size, view_count: state.views.length, unique_view_count: new Set(state.views).size };
    else if (path.endsWith('melsou_toggle_blog_post_like')) { body.p_liked ? state.postLikes.add(actorKey(body)) : state.postLikes.delete(actorKey(body)); value = { liked: body.p_liked, like_count: state.postLikes.size }; }
    else if (path.endsWith('melsou_create_blog_comment')) { const comment = { id: ids[state.sequence++], post_slug: body.p_post_slug, user_id: body.p_user_id, parent_comment_id: body.p_parent_comment_id, content: body.p_content, status: 'visible', created_at: new Date(1700000000000 + state.sequence * 1000).toISOString(), updated_at: new Date().toISOString() }; state.comments.push(comment); value = commentJson(comment, body); }
    else if (path.endsWith('melsou_update_blog_comment')) { const comment = state.comments.find((c) => c.id === body.p_comment_id && c.post_slug === body.p_post_slug); if (!comment || comment.user_id !== body.p_user_id) return new Response(JSON.stringify({ message: comment ? 'COMMENT_FORBIDDEN' : 'COMMENT_NOT_FOUND' }), { status: 400, headers: { 'Content-Type': 'application/json' } }); if (body.p_delete) comment.status = 'deleted'; else comment.content = body.p_content; comment.updated_at = new Date().toISOString(); value = commentJson(comment, body); }
    else if (path.endsWith('melsou_toggle_blog_comment_like')) { const likes = state.commentLikes.get(body.p_comment_id) || new Set(); body.p_liked ? likes.add(actorKey(body)) : likes.delete(actorKey(body)); state.commentLikes.set(body.p_comment_id, likes); value = { liked: body.p_liked, like_count: likes.size }; }
    else if (path.endsWith('melsou_list_blog_comments')) { let rows = state.comments.filter((c) => c.post_slug === body.p_post_slug && c.parent_comment_id === body.p_parent_comment_id && c.status === 'visible'); rows = body.p_sort === 'top' ? rows.sort((a, b) => (state.commentLikes.get(b.id)?.size || 0) - (state.commentLikes.get(a.id)?.size || 0)) : rows.sort((a, b) => b.created_at.localeCompare(a.created_at)); const page = rows.slice(body.p_offset, body.p_offset + body.p_limit); value = { comments: page.map((c) => commentJson(c, body)), next_cursor: body.p_offset + body.p_limit < rows.length ? String(body.p_offset + body.p_limit) : null }; }
    else if (path.endsWith('melsou_owner_list_blog_comments')) {
      let rows = state.comments.filter((c) => (!body.p_post_slug || c.post_slug === body.p_post_slug) && (body.p_status === 'all' || c.status === body.p_status));
      rows.sort((a, b) => body.p_sort === 'oldest' ? a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id) : b.created_at.localeCompare(a.created_at) || b.id.localeCompare(a.id));
      if (body.p_cursor_created_at && body.p_cursor_id) rows = rows.filter((c) => body.p_sort === 'oldest' ? c.created_at > body.p_cursor_created_at || (c.created_at === body.p_cursor_created_at && c.id > body.p_cursor_id) : c.created_at < body.p_cursor_created_at || (c.created_at === body.p_cursor_created_at && c.id < body.p_cursor_id));
      const page = rows.slice(0, body.p_limit);
      const boundary = page.at(-1);
      value = {
        comments: page.map((c) => ({ id: c.id, post_slug: c.post_slug, parent_comment_id: c.parent_comment_id, content: c.status === 'deleted' ? '[Đã xóa]' : c.content, status: c.status, created_at: c.created_at, updated_at: c.updated_at, author_name: 'Test user', is_reply: Boolean(c.parent_comment_id), reply_count: state.comments.filter((r) => r.parent_comment_id === c.id).length })),
        has_more: rows.length > body.p_limit,
        next_cursor: rows.length > body.p_limit && boundary ? { created_at: boundary.created_at, id: boundary.id } : null
      };
    }
    else if (path.endsWith('melsou_record_blog_share')) { const key = `${actorKey(body)}:${body.p_share_type}`; const recorded = !state.shares.has(key); state.shares.add(key); value = { recorded, share_count: state.shares.size }; }
    else if (path.endsWith('melsou_record_blog_view')) { state.views.push(actorKey(body)); value = { recorded: true, view_count: state.views.length, unique_view_count: new Set(state.views).size }; }
    else if (path.endsWith('melsou_moderate_blog_comment')) { const comment = state.comments.find((c) => c.id === body.p_comment_id); comment.status = body.p_status; value = { id: comment.id, post_slug: comment.post_slug, parent_comment_id: comment.parent_comment_id, status: comment.status, created_at: comment.created_at, updated_at: comment.updated_at }; }
    return new Response(JSON.stringify(value), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  const dependencies = {
    serviceFetch,
    getActor: async (request, options) => actor(request, options.createGuest),
    requireUser: async (request) => request.headers.get('X-Test-User') ? { id: request.headers.get('X-Test-User') } : null,
    requireOwner: async (request) => request.headers.get('X-Test-Owner') ? { id: request.headers.get('X-Test-Owner') } : null,
    authorizeOwner: async (request) => request.headers.get('X-Test-Owner')
      ? { ok: true, user: { id: request.headers.get('X-Test-Owner') } }
      : (request.headers.get('X-Test-User') ? { ok: false, status: 403, error: 'FORBIDDEN' } : { ok: false, status: 401, error: 'UNAUTHORIZED' }),
    rateLimit: async () => ({ allowed: true }),
    verifyPost: async (candidate) => candidate === slug ? { id: 42, slug: candidate } : false
  };
  const call = async (path, { method = 'GET', body, user, guest, owner } = {}) => {
    const headers = new Headers();
    if (body) headers.set('Content-Type', 'application/json');
    if (user) headers.set('X-Test-User', user);
    if (guest) headers.set('X-Test-Guest', guest);
    if (owner) headers.set('X-Test-Owner', owner);
    const request = new Request(`https://melsou.test${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
    const match = matchBlogInteraction(new URL(request.url).pathname, method);
    assert.ok(match, `route should match ${method} ${path}`);
    const response = await handleBlogInteraction(request, {}, match, dependencies);
    return { response, body: await response.json() };
  };
  return { state, call, dependencies };
}

test('post identity uses slug and post like is unique and reversible for account and guest', async () => {
  const { call } = harness(); const user = ids[10];
  let result = await call(`/api/blog/${slug}/like`, { method: 'POST', body: { liked: true }, user });
  assert.deepEqual([result.response.status, result.body.liked, result.body.like_count], [200, true, 1]);
  result = await call(`/api/blog/${slug}/like`, { method: 'POST', body: { liked: true }, user });
  assert.equal(result.body.like_count, 1);
  result = await call(`/api/blog/${slug}/like`, { method: 'POST', body: { liked: true } });
  assert.equal(result.body.like_count, 2); assert.match(result.response.headers.get('Set-Cookie'), /HttpOnly/);
  result = await call(`/api/blog/${slug}/like`, { method: 'POST', body: { liked: false }, user });
  assert.deepEqual([result.body.liked, result.body.like_count], [false, 1]);
});

test('comments require auth and replies preserve parent relationship', async () => {
  const { call } = harness(); const user = ids[10];
  assert.equal((await call(`/api/blog/${slug}/comments`, { method: 'POST', body: { content: 'Guest' } })).response.status, 401);
  const root = await call(`/api/blog/${slug}/comments`, { method: 'POST', body: { content: 'Root' }, user });
  const reply = await call(`/api/blog/${slug}/comments/${root.body.comment.id}/replies`, { method: 'POST', body: { content: 'Reply' }, user });
  assert.equal(root.response.status, 201); assert.equal(reply.body.comment.parent_comment_id, root.body.comment.id);
});

test('comment like is unique and reversible', async () => {
  const { call } = harness(); const user = ids[10];
  const root = await call(`/api/blog/${slug}/comments`, { method: 'POST', body: { content: 'Like me' }, user });
  let result = await call(`/api/blog/${slug}/comments/${root.body.comment.id}/like`, { method: 'POST', body: { liked: true }, guest: 'g1' });
  assert.equal(result.body.like_count, 1);
  result = await call(`/api/blog/${slug}/comments/${root.body.comment.id}/like`, { method: 'POST', body: { liked: true }, guest: 'g1' }); assert.equal(result.body.like_count, 1);
  result = await call(`/api/blog/${slug}/comments/${root.body.comment.id}/like`, { method: 'POST', body: { liked: false }, guest: 'g1' }); assert.equal(result.body.like_count, 0);
});

test('reply like is unique and reversible', async () => {
  const { call } = harness(); const user = ids[10];
  const root = await call(`/api/blog/${slug}/comments`, { method: 'POST', body: { content: 'Root' }, user });
  const reply = await call(`/api/blog/${slug}/comments/${root.body.comment.id}/replies`, { method: 'POST', body: { content: 'Reply' }, user });
  let result = await call(`/api/blog/${slug}/comments/${reply.body.comment.id}/like`, { method: 'POST', body: { liked: true }, user });
  assert.equal(result.body.like_count, 1);
  result = await call(`/api/blog/${slug}/comments/${reply.body.comment.id}/like`, { method: 'POST', body: { liked: true }, user });
  assert.equal(result.body.like_count, 1);
  result = await call(`/api/blog/${slug}/comments/${reply.body.comment.id}/like`, { method: 'POST', body: { liked: false }, user });
  assert.equal(result.body.like_count, 0);
});

test('customer can edit and soft-delete only own comment or reply', async () => {
  const { call, state } = harness(); const owner = ids[10]; const other = ids[9];
  const root = await call(`/api/blog/${slug}/comments`, { method: 'POST', body: { content: 'Original' }, user: owner });
  const edit = await call(`/api/blog/${slug}/comments/${root.body.comment.id}`, { method: 'PATCH', body: { content: 'Edited' }, user: owner });
  assert.equal(edit.body.comment.content, 'Edited');
  assert.equal(Object.hasOwn(edit.body.comment, 'user_id'), false);
  assert.equal((await call(`/api/blog/${slug}/comments/${root.body.comment.id}`, { method: 'PATCH', body: { content: 'Attack' }, user: other })).response.status, 403);
  const removed = await call(`/api/blog/${slug}/comments/${root.body.comment.id}`, { method: 'DELETE', user: owner });
  assert.equal(removed.body.comment.status, 'deleted');
  assert.equal(state.comments[0].status, 'deleted');
});

test('public comment responses never expose user identity fields', async () => {
  const { call } = harness(); const user = ids[10];
  const created = await call(`/api/blog/${slug}/comments`, { method: 'POST', body: { content: 'Private identity' }, user });
  const listed = await call(`/api/blog/${slug}/comments`, { user });
  for (const value of [created.body.comment, listed.body.comments[0]]) {
    assert.equal(Object.hasOwn(value, 'user_id'), false);
    assert.equal(Object.hasOwn(value, 'guest_session_hash'), false);
    assert.equal(Object.hasOwn(value, 'external_id'), false);
  }
});

test('comment and reply pagination return bounded pages and cursors', async () => {
  const { call } = harness(); const user = ids[10]; let root;
  for (let i = 0; i < 7; i += 1) root = await call(`/api/blog/${slug}/comments`, { method: 'POST', body: { content: `Comment ${i}` }, user });
  let page = await call(`/api/blog/${slug}/comments?limit=3&sort=latest`); assert.equal(page.body.comments.length, 3); assert.equal(page.body.next_cursor, '3');
  page = await call(`/api/blog/${slug}/comments?limit=3&cursor=${page.body.next_cursor}&sort=latest`); assert.equal(page.body.comments.length, 3);
  for (let i = 0; i < 4; i += 1) await call(`/api/blog/${slug}/comments/${root.body.comment.id}/replies`, { method: 'POST', body: { content: `Reply ${i}` }, user });
  const replies = await call(`/api/blog/${slug}/comments/${root.body.comment.id}/replies?limit=3`); assert.equal(replies.body.comments.length, 3); assert.equal(replies.body.next_cursor, '3');
});

test('latest and top sorting are supported', async () => {
  const { call } = harness(); const user = ids[10];
  const first = await call(`/api/blog/${slug}/comments`, { method: 'POST', body: { content: 'First' }, user });
  await call(`/api/blog/${slug}/comments`, { method: 'POST', body: { content: 'Latest' }, user });
  await call(`/api/blog/${slug}/comments/${first.body.comment.id}/like`, { method: 'POST', body: { liked: true }, guest: 'top-fan' });
  assert.equal((await call(`/api/blog/${slug}/comments?sort=latest`)).body.comments[0].content, 'Latest');
  assert.equal((await call(`/api/blog/${slug}/comments?sort=top`)).body.comments[0].content, 'First');
});

test('share tracking dedupes repeated actor/type events and analytics expose counts', async () => {
  const { call } = harness();
  let share = await call(`/api/blog/${slug}/share`, { method: 'POST', body: { share_type: 'copy_link' }, guest: 'g1' }); assert.equal(share.body.recorded, true);
  share = await call(`/api/blog/${slug}/share`, { method: 'POST', body: { share_type: 'copy_link' }, guest: 'g1' }); assert.equal(share.body.recorded, false);
  await call(`/api/blog/${slug}/view`, { method: 'POST', guest: 'g1' }); await call(`/api/blog/${slug}/view`, { method: 'POST', guest: 'g1' });
  const summary = await call(`/api/blog/${slug}/interactions`, { guest: 'g1' });
  assert.deepEqual([summary.body.share_count, summary.body.view_count, summary.body.unique_view_count], [1, 2, 1]);
});

test('OWNER moderation hides without hard deleting and non-owner is rejected', async () => {
  const { call, state } = harness(); const user = ids[10];
  const root = await call(`/api/blog/${slug}/comments`, { method: 'POST', body: { content: 'Moderate' }, user });
  assert.equal((await call(`/api/owner/blog/comments/${root.body.comment.id}`, { method: 'PATCH', body: { status: 'hidden' } })).response.status, 401);
  assert.equal((await call(`/api/owner/blog/comments/${root.body.comment.id}`, { method: 'PATCH', body: { status: 'hidden' }, user: ids[9] })).response.status, 403);
  const moderated = await call(`/api/owner/blog/comments/${root.body.comment.id}`, { method: 'PATCH', body: { status: 'hidden' }, owner: ids[11] });
  assert.equal(moderated.body.comment.status, 'hidden'); assert.equal(state.comments.length, 1);
});

test('OWNER comment inventory lists all statuses with filters, privacy and stable cursor pagination', async () => {
  const { call, state } = harness();
  state.comments.push(
    { id: ids[0], post_slug: slug, user_id: ids[8], parent_comment_id: null, content: 'Visible', status: 'visible', created_at: '2026-09-17T00:00:01.000Z', updated_at: '2026-09-17T00:00:01.000Z' },
    { id: ids[1], post_slug: slug, user_id: ids[8], parent_comment_id: ids[0], content: 'Hidden reply', status: 'hidden', created_at: '2026-09-17T00:00:02.000Z', updated_at: '2026-09-17T00:00:02.000Z' },
    { id: ids[2], post_slug: slug, user_id: ids[8], parent_comment_id: null, content: 'Secret deleted body', status: 'deleted', created_at: '2026-09-17T00:00:03.000Z', updated_at: '2026-09-17T00:00:03.000Z' },
    { id: ids[3], post_slug: 'another-post', user_id: ids[8], parent_comment_id: null, content: 'Other', status: 'visible', created_at: '2026-09-17T00:00:04.000Z', updated_at: '2026-09-17T00:00:04.000Z' }
  );

  assert.equal((await call('/api/owner/blog/comments')).response.status, 401);
  assert.equal((await call('/api/owner/blog/comments', { user: ids[9] })).response.status, 403);

  const first = await call(`/api/owner/blog/comments?post_slug=${slug}&status=all&limit=2&sort=newest`, { owner: ids[11] });
  assert.equal(first.response.status, 200);
  assert.deepEqual(first.body.comments.map((comment) => comment.status), ['deleted', 'hidden']);
  assert.equal(first.body.comments[0].content, '[Đã xóa]');
  assert.equal(typeof first.body.next_cursor, 'string');
  for (const comment of first.body.comments) {
    for (const field of ['user_id', 'guest_session_hash', 'email', 'external_id']) assert.equal(Object.hasOwn(comment, field), false);
  }

  const second = await call(`/api/owner/blog/comments?post_slug=${slug}&status=all&limit=2&sort=newest&cursor=${encodeURIComponent(first.body.next_cursor)}`, { owner: ids[11] });
  assert.deepEqual(second.body.comments.map((comment) => comment.status), ['visible']);
  assert.equal(second.body.next_cursor, null);

  const hidden = await call(`/api/owner/blog/comments?post_slug=${slug}&status=hidden&sort=oldest`, { owner: ids[11] });
  assert.deepEqual(hidden.body.comments.map((comment) => comment.id), [ids[1]]);
  assert.equal(hidden.body.post_slug, slug);
  assert.equal(hidden.body.status, 'hidden');
});

test('unknown WordPress slug is rejected before persistence', async () => {
  const { call } = harness();
  const result = await call('/api/blog/not-a-real-post/like', { method: 'POST', body: { liked: true }, guest: 'g1' });
  assert.equal(result.response.status, 404); assert.equal(result.body.error, 'BLOG_POST_NOT_FOUND');
});

test('rate limiting fails closed', async () => {
  const { call, dependencies } = harness();
  dependencies.rateLimit = async () => ({ allowed: false });
  const result = await call(`/api/blog/${slug}/like`, { method: 'POST', body: { liked: true }, guest: 'g1' });
  assert.equal(result.response.status, 429);
});

test('migration enables RLS, denies browser roles and grants only service RPC execution', async () => {
  const base = await readFile(new URL('../supabase/migrations/202609150001_blog_interactions.sql', import.meta.url), 'utf8');
  const sql = await readFile(new URL('../supabase/migrations/202609160002_blog_interactions_hardening.sql', import.meta.url), 'utf8');
  for (const table of ['blog_post_likes', 'blog_comments', 'blog_comment_likes', 'blog_share_events', 'blog_view_events']) {
    assert.match(base, new RegExp(`alter table public\\.${table} enable row level security`, 'i'));
  }
  assert.match(sql, /revoke all on table public\.blog_post_likes[\s\S]+from anon, authenticated/i);
  assert.match(sql, /grant execute on function[\s\S]+to service_role/i);
  assert.doesNotMatch(sql, /grant execute on function[\s\S]+to (?:anon|authenticated)/i);
  assert.match(base, /unique index if not exists blog_post_likes_user_unique/i);
  assert.match(base, /unique index if not exists blog_comment_likes_guest_unique/i);
  assert.match(sql, /set search_path = pg_catalog, public/gi);
  assert.match(sql, /melsou_update_blog_comment/);
  assert.doesNotMatch(sql, /grant execute[\s\S]+to (?:anon|authenticated)/i);
  assert.match(sql, /^begin;/mi);
  assert.match(sql, /commit;\s*$/i);
  assert.doesNotMatch(sql, /\b(?:drop table|truncate|alter table[^;]+drop column)\b/i);
  assert.doesNotMatch(sql, /^\s*delete from public\.(?:blog_comments|blog_share_events|blog_view_events)/mi);
  for (const table of ['blog_post_likes', 'blog_comments', 'blog_comment_likes', 'blog_share_events', 'blog_view_events']) {
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`, 'i'));
  }
  const definerFunctions = sql.split(/create or replace function/i).slice(1).filter((definition) => /security definer/i.test(definition));
  assert.ok(definerFunctions.length >= 8);
  for (const definition of definerFunctions) assert.match(definition, /set search_path = pg_catalog, public/i);
});

test('OWNER inventory migration is service-only, RLS-preserving and uses trusted search path', async () => {
  const sql = await readFile(new URL('../supabase/migrations/202609170001_owner_blog_comment_list.sql', import.meta.url), 'utf8');
  const verifier = await readFile(new URL('../tests/fixtures/202609170001_owner_blog_comment_list_post_migration.sql', import.meta.url), 'utf8');
  assert.match(sql, /^begin;/mi);
  assert.match(sql, /create index if not exists blog_comments_owner_global_cursor_idx\s+on public\.blog_comments\(created_at desc, id desc\)/i);
  assert.match(sql, /create index if not exists blog_comments_owner_post_cursor_idx\s+on public\.blog_comments\(post_slug, created_at desc, id desc\)/i);
  assert.match(sql, /create or replace function public\.melsou_owner_list_blog_comments/i);
  assert.match(sql, /security definer\s+set search_path = pg_catalog, public/i);
  assert.match(sql, /public\.melsou_is_owner\(p_owner_id\)/i);
  assert.match(sql, /revoke all on function[\s\S]+from public, anon, authenticated/i);
  assert.match(sql, /grant execute on function[\s\S]+to service_role/i);
  assert.doesNotMatch(sql, /\b(?:drop table|truncate|delete from public\.blog_comments)\b/i);
  assert.match(sql, /commit;\s*$/i);
  for (const check of [
    'owner_check_ok', 'comments_reference_ok', 'profiles_reference_ok',
    'visible_status_ok', 'hidden_status_ok', 'deleted_status_ok',
    'deleted_placeholder_ok', 'no_insert_ok', 'no_update_statement_ok',
    'no_delete_statement_ok', 'no_truncate_ok', 'no_drop_ok', 'no_alter_ok'
  ]) assert.match(verifier, new RegExp(`\\b${check}\\b`, 'i'));
  assert.doesNotMatch(verifier, /function_contract_ok/i);
  assert.match(verifier, /blog_comments_owner_global_cursor_idx/i);
  assert.match(verifier, /blog_comments_owner_post_cursor_idx/i);
  assert.match(verifier, /OWNER_BLOG_MODERATION_MIGRATION_APPLIED/i);
});
