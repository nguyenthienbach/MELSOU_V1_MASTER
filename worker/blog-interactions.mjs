const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const shareTypes = new Set(['copy_link', 'native_share', 'facebook', 'other']);

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
});

async function parseBody(request) {
  try { return await request.json(); } catch { return null; }
}

async function rpc(serviceFetch, name, body) {
  const response = await serviceFetch(`rpc/${name}`, { method: 'POST', body: JSON.stringify(body) });
  if (!response.ok) return { ok: false, status: response.status };
  return { ok: true, value: await response.json() };
}

function actorParams(actor) {
  return { p_user_id: actor?.userId || null, p_guest_hash: actor?.guestHash || null };
}

function withActorCookie(response, actor) {
  if (actor?.setCookie) response.headers.append('Set-Cookie', actor.setCookie);
  return response;
}

function dbFailure(result) {
  return json({ error: result.status === 409 ? 'INTERACTION_CONFLICT' : 'BLOG_INTERACTION_UNAVAILABLE' }, result.status === 409 ? 409 : 503);
}

export async function handleBlogInteraction(request, env, match, dependencies) {
  const { serviceFetch, getActor, requireUser, requireOwner, rateLimit, verifyPost } = dependencies;
  const slug = match.slug;
  if (!slugPattern.test(slug)) return json({ error: 'INVALID_POST_SLUG' }, 400);
  if (match.kind !== 'moderate') {
    const post = await verifyPost(slug);
    if (post === null) return json({ error: 'BLOG_UNAVAILABLE' }, 503);
    if (!post) return json({ error: 'BLOG_POST_NOT_FOUND' }, 404);
  }

  if (match.kind === 'summary') {
    const actor = await getActor(request, { createGuest: false });
    const result = await rpc(serviceFetch, 'melsou_blog_summary', { p_post_slug: slug, ...actorParams(actor) });
    return result.ok ? json({ post_slug: slug, ...result.value }) : dbFailure(result);
  }

  const limited = await rateLimit(request, `blog:${match.kind}`);
  if (limited?.configurationMissing) return json({ error: 'RATE_LIMIT_NOT_CONFIGURED' }, 503);
  if (limited && !limited.allowed) return json({ error: 'RATE_LIMITED' }, 429);

  if (match.kind === 'post-like') {
    const body = await parseBody(request);
    if (typeof body?.liked !== 'boolean') return json({ error: 'INVALID_LIKE_STATE' }, 400);
    const actor = await getActor(request, { createGuest: true });
    const result = await rpc(serviceFetch, 'melsou_toggle_blog_post_like', { p_post_slug: slug, ...actorParams(actor), p_liked: body.liked });
    return withActorCookie(result.ok ? json({ post_slug: slug, ...result.value }) : dbFailure(result), actor);
  }

  if (match.kind === 'comments-list' || match.kind === 'replies-list') {
    const url = new URL(request.url);
    const limit = Math.min(20, Math.max(1, Number.parseInt(url.searchParams.get('limit') || '5', 10) || 5));
    const offset = Math.max(0, Number.parseInt(url.searchParams.get('cursor') || '0', 10) || 0);
    const sort = url.searchParams.get('sort') === 'top' ? 'top' : 'latest';
    const parentId = match.commentId || null;
    if (parentId && !uuidPattern.test(parentId)) return json({ error: 'INVALID_COMMENT_ID' }, 400);
    const actor = await getActor(request, { createGuest: false });
    const result = await rpc(serviceFetch, 'melsou_list_blog_comments', { p_post_slug: slug, p_parent_comment_id: parentId, p_limit: limit, p_offset: offset, p_sort: sort, ...actorParams(actor) });
    return result.ok ? json({ post_slug: slug, sort, limit, ...result.value }) : dbFailure(result);
  }

  if (match.kind === 'comment-create' || match.kind === 'reply-create') {
    const user = await requireUser(request);
    if (!user) return json({ error: 'UNAUTHENTICATED' }, 401);
    const body = await parseBody(request);
    const content = typeof body?.content === 'string' ? body.content.trim() : '';
    if (!content || content.length > 2000) return json({ error: 'INVALID_COMMENT' }, 400);
    if (match.commentId && !uuidPattern.test(match.commentId)) return json({ error: 'INVALID_COMMENT_ID' }, 400);
    const result = await rpc(serviceFetch, 'melsou_create_blog_comment', { p_post_slug: slug, p_user_id: user.id, p_parent_comment_id: match.commentId || null, p_content: content });
    return result.ok ? json({ comment: result.value }, 201) : dbFailure(result);
  }

  if (match.kind === 'comment-like') {
    if (!uuidPattern.test(match.commentId || '')) return json({ error: 'INVALID_COMMENT_ID' }, 400);
    const body = await parseBody(request);
    if (typeof body?.liked !== 'boolean') return json({ error: 'INVALID_LIKE_STATE' }, 400);
    const actor = await getActor(request, { createGuest: true });
    const result = await rpc(serviceFetch, 'melsou_toggle_blog_comment_like', { p_comment_id: match.commentId, ...actorParams(actor), p_liked: body.liked });
    return withActorCookie(result.ok ? json({ comment_id: match.commentId, ...result.value }) : dbFailure(result), actor);
  }

  if (match.kind === 'share') {
    const body = await parseBody(request);
    const shareType = typeof body?.share_type === 'string' ? body.share_type : '';
    if (!shareTypes.has(shareType)) return json({ error: 'INVALID_SHARE_TYPE' }, 400);
    const actor = await getActor(request, { createGuest: true });
    const result = await rpc(serviceFetch, 'melsou_record_blog_share', { p_post_slug: slug, ...actorParams(actor), p_share_type: shareType });
    return withActorCookie(result.ok ? json({ post_slug: slug, share_type: shareType, ...result.value }, 202) : dbFailure(result), actor);
  }

  if (match.kind === 'view') {
    const actor = await getActor(request, { createGuest: true });
    const result = await rpc(serviceFetch, 'melsou_record_blog_view', { p_post_slug: slug, ...actorParams(actor) });
    return withActorCookie(result.ok ? json({ post_slug: slug, ...result.value }, 202) : dbFailure(result), actor);
  }

  if (match.kind === 'moderate') {
    const owner = await requireOwner(request);
    if (!owner) return json({ error: 'OWNER_REQUIRED' }, 403);
    const body = await parseBody(request);
    const status = request.method === 'DELETE' ? 'deleted' : body?.status;
    if (!['visible', 'hidden', 'deleted', 'pending'].includes(status) || !uuidPattern.test(match.commentId || '')) return json({ error: 'INVALID_MODERATION' }, 400);
    const result = await rpc(serviceFetch, 'melsou_moderate_blog_comment', { p_owner_id: owner.id, p_comment_id: match.commentId, p_status: status });
    return result.ok ? json({ comment: result.value }) : dbFailure(result);
  }

  return json({ error: 'NOT_FOUND' }, 404);
}

export function matchBlogInteraction(pathname, method) {
  let match = pathname.match(/^\/api\/blog\/([a-z0-9-]+)\/interactions$/);
  if (match && method === 'GET') return { kind: 'summary', slug: match[1] };
  match = pathname.match(/^\/api\/blog\/([a-z0-9-]+)\/like$/);
  if (match && method === 'POST') return { kind: 'post-like', slug: match[1] };
  match = pathname.match(/^\/api\/blog\/([a-z0-9-]+)\/comments$/);
  if (match && method === 'GET') return { kind: 'comments-list', slug: match[1] };
  if (match && method === 'POST') return { kind: 'comment-create', slug: match[1] };
  match = pathname.match(/^\/api\/blog\/([a-z0-9-]+)\/comments\/([0-9a-f-]{36})\/replies$/i);
  if (match && method === 'GET') return { kind: 'replies-list', slug: match[1], commentId: match[2] };
  if (match && method === 'POST') return { kind: 'reply-create', slug: match[1], commentId: match[2] };
  match = pathname.match(/^\/api\/blog\/([a-z0-9-]+)\/comments\/([0-9a-f-]{36})\/like$/i);
  if (match && method === 'POST') return { kind: 'comment-like', slug: match[1], commentId: match[2] };
  match = pathname.match(/^\/api\/blog\/([a-z0-9-]+)\/(share|view)$/);
  if (match && method === 'POST') return { kind: match[2], slug: match[1] };
  match = pathname.match(/^\/api\/owner\/blog\/comments\/([0-9a-f-]{36})$/i);
  if (match && (method === 'PATCH' || method === 'DELETE')) return { kind: 'moderate', slug: 'owner-action', commentId: match[1] };
  return null;
}
