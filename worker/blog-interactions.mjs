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
  if (!response.ok) {
    const failure = await response.json().catch(() => ({}));
    const message = typeof failure?.message === 'string' ? failure.message : '';
    return { ok: false, status: response.status, code: ['COMMENT_FORBIDDEN', 'COMMENT_NOT_FOUND', 'COMMENT_DELETED'].find((code) => message.includes(code)) || null };
  }
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
  if (result.code === 'COMMENT_FORBIDDEN') return json({ error: 'COMMENT_FORBIDDEN' }, 403);
  if (result.code === 'COMMENT_NOT_FOUND') return json({ error: 'COMMENT_NOT_FOUND' }, 404);
  if (result.code === 'COMMENT_DELETED') return json({ error: 'COMMENT_DELETED' }, 409);
  return json({ error: result.status === 409 ? 'INTERACTION_CONFLICT' : 'BLOG_INTERACTION_UNAVAILABLE' }, result.status === 409 ? 409 : 503);
}

function publicComment(value) {
  if (!value || typeof value !== 'object') return value;
  const { user_id, guest_session_hash, external_id, external_source, ...safe } = value;
  return safe;
}

function decodeOwnerCursor(value) {
  if (!value) return { createdAt: null, id: null };
  if (!/^[A-Za-z0-9_-]{1,512}$/.test(value)) return null;
  try {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')));
    if (!decoded || typeof decoded.created_at !== 'string' || !uuidPattern.test(decoded.id || '')) return null;
    const createdAt = new Date(decoded.created_at);
    if (!Number.isFinite(createdAt.getTime())) return null;
    return { createdAt: createdAt.toISOString(), id: decoded.id };
  } catch {
    return null;
  }
}

function encodeOwnerCursor(value) {
  if (!value?.created_at || !uuidPattern.test(value?.id || '')) return null;
  return btoa(JSON.stringify({ created_at: value.created_at, id: value.id }))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export async function handleBlogInteraction(request, env, match, dependencies) {
  const { serviceFetch, getActor, requireUser, requireOwner, authorizeOwner, rateLimit, verifyPost } = dependencies;
  const slug = match.slug;
  if (!['moderate', 'owner-list'].includes(match.kind) && !slugPattern.test(slug)) return json({ error: 'INVALID_POST_SLUG' }, 400);
  if (!['moderate', 'owner-list'].includes(match.kind)) {
    const post = await verifyPost(slug);
    if (post === null) return json({ error: 'BLOG_UNAVAILABLE' }, 503);
    if (!post) return json({ error: 'BLOG_POST_NOT_FOUND' }, 404);
  }

  if (match.kind === 'summary') {
    const actor = await getActor(request, { createGuest: false });
    const result = await rpc(serviceFetch, 'melsou_blog_summary', { p_post_slug: slug, ...actorParams(actor) });
    return result.ok ? json({ post_slug: slug, ...result.value }) : dbFailure(result);
  }

  let ownerAuthorization = null;
  if (match.kind === 'owner-list' || match.kind === 'moderate') {
    const fallbackOwner = authorizeOwner ? null : await requireOwner(request);
    ownerAuthorization = authorizeOwner
      ? await authorizeOwner(request)
      : (fallbackOwner ? { ok: true, user: fallbackOwner } : { ok: false, status: 403, error: 'OWNER_REQUIRED' });
    if (!ownerAuthorization?.ok) return json(
      { error: ownerAuthorization?.error || 'OWNER_REQUIRED' },
      ownerAuthorization?.status || 403
    );
  }

  const limited = await rateLimit(request, `blog:${match.kind}`);
  if (limited?.configurationMissing) return json({ error: 'RATE_LIMIT_NOT_CONFIGURED' }, 503);
  if (limited && !limited.allowed) return json({ error: 'RATE_LIMITED' }, 429);

  if (match.kind === 'owner-list') {
    const url = new URL(request.url);
    const postSlug = url.searchParams.get('post_slug') || null;
    const status = url.searchParams.get('status') || 'all';
    const sort = url.searchParams.get('sort') || 'newest';
    const limit = Math.min(100, Math.max(1, Number.parseInt(url.searchParams.get('limit') || '50', 10) || 50));
    const cursor = decodeOwnerCursor(url.searchParams.get('cursor'));
    if (postSlug !== null && !slugPattern.test(postSlug)) return json({ error: 'INVALID_POST_SLUG' }, 400);
    if (!['visible', 'hidden', 'deleted', 'all'].includes(status)) return json({ error: 'INVALID_STATUS' }, 400);
    if (!['newest', 'oldest'].includes(sort)) return json({ error: 'INVALID_SORT' }, 400);
    if (cursor === null) return json({ error: 'INVALID_CURSOR' }, 400);

    const result = await rpc(serviceFetch, 'melsou_owner_list_blog_comments', {
      p_owner_id: ownerAuthorization.user.id,
      p_post_slug: postSlug,
      p_status: status,
      p_limit: limit,
      p_cursor_created_at: cursor.createdAt,
      p_cursor_id: cursor.id,
      p_sort: sort
    });
    if (!result.ok) return dbFailure(result);
    return json({
      comments: (result.value?.comments || []).map(publicComment),
      limit,
      next_cursor: encodeOwnerCursor(result.value?.next_cursor),
      status,
      post_slug: postSlug
    });
  }

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
    if (!result.ok) return dbFailure(result);
    return json({ post_slug: slug, sort, limit, ...result.value, comments: (result.value?.comments || []).map(publicComment) });
  }

  if (match.kind === 'comment-create' || match.kind === 'reply-create') {
    const user = await requireUser(request);
    if (!user) return json({ error: 'UNAUTHENTICATED' }, 401);
    const body = await parseBody(request);
    const content = typeof body?.content === 'string' ? body.content.trim() : '';
    if (!content || content.length > 2000) return json({ error: 'INVALID_COMMENT' }, 400);
    if (match.commentId && !uuidPattern.test(match.commentId)) return json({ error: 'INVALID_COMMENT_ID' }, 400);
    const result = await rpc(serviceFetch, 'melsou_create_blog_comment', { p_post_slug: slug, p_user_id: user.id, p_parent_comment_id: match.commentId || null, p_content: content });
    return result.ok ? json({ comment: publicComment(result.value) }, 201) : dbFailure(result);
  }

  if (match.kind === 'comment-update' || match.kind === 'comment-delete') {
    const user = await requireUser(request);
    if (!user) return json({ error: 'UNAUTHENTICATED' }, 401);
    if (!uuidPattern.test(match.commentId || '')) return json({ error: 'INVALID_COMMENT_ID' }, 400);
    const body = match.kind === 'comment-delete' ? {} : await parseBody(request);
    const content = typeof body?.content === 'string' ? body.content.trim() : '';
    if (match.kind === 'comment-update' && (!content || content.length > 2000)) return json({ error: 'INVALID_COMMENT' }, 400);
    const result = await rpc(serviceFetch, 'melsou_update_blog_comment', {
      p_user_id: user.id,
      p_comment_id: match.commentId,
      p_post_slug: slug,
      p_content: content,
      p_delete: match.kind === 'comment-delete'
    });
    return result.ok ? json({ comment: publicComment(result.value) }) : dbFailure(result);
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
    const owner = ownerAuthorization.user;
    const body = await parseBody(request);
    const status = request.method === 'DELETE' ? 'deleted' : body?.status;
    if (!['visible', 'hidden', 'deleted', 'pending'].includes(status) || !uuidPattern.test(match.commentId || '')) return json({ error: 'INVALID_MODERATION' }, 400);
    const result = await rpc(serviceFetch, 'melsou_moderate_blog_comment', { p_owner_id: owner.id, p_comment_id: match.commentId, p_status: status });
    return result.ok ? json({ comment: publicComment(result.value) }) : dbFailure(result);
  }

  return json({ error: 'NOT_FOUND' }, 404);
}

export function matchBlogInteraction(pathname, method) {
  if (pathname === '/api/owner/blog/comments' && method === 'GET') return { kind: 'owner-list', slug: null };
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
  match = pathname.match(/^\/api\/blog\/([a-z0-9-]+)\/comments\/([0-9a-f-]{36})$/i);
  if (match && (method === 'PATCH' || method === 'PUT')) return { kind: 'comment-update', slug: match[1], commentId: match[2] };
  if (match && method === 'DELETE') return { kind: 'comment-delete', slug: match[1], commentId: match[2] };
  match = pathname.match(/^\/api\/blog\/([a-z0-9-]+)\/(share|view)$/);
  if (match && method === 'POST') return { kind: match[2], slug: match[1] };
  match = pathname.match(/^\/api\/owner\/blog\/comments\/([0-9a-f-]{36})$/i);
  if (match && (method === 'PATCH' || method === 'DELETE')) return { kind: 'moderate', slug: 'owner-action', commentId: match[1] };
  return null;
}
