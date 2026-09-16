const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const commentIdPattern = /^\d+$/;

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
});

const decodeEntities = (value) => String(value || '')
  .replace(/<[^>]*>/g, '')
  .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
  .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/&#039;|&apos;/g, "'")
  .trim();

const mapComment = (comment, replyCount = 0) => ({
  id: String(comment.id),
  post_slug: null,
  parent_comment_id: Number(comment.parent || 0) > 0 ? String(comment.parent) : null,
  author_name: decodeEntities(comment.author_name) || 'Khách hàng Melsou',
  content: decodeEntities(comment.content?.rendered || comment.content?.raw || ''),
  created_at: comment.date_gmt ? `${comment.date_gmt}Z` : comment.date,
  updated_at: comment.date_gmt ? `${comment.date_gmt}Z` : comment.date,
  status: comment.status === 'approved' || comment.status === 'approve' ? 'visible' : 'pending',
  like_count: Number(comment.like_count || 0),
  reply_count: replyCount,
  liked: false,
  source: 'wordpress'
});

async function resolvePost(wordpressFetch, slug) {
  const response = await wordpressFetch(`/posts?status=publish&slug=${encodeURIComponent(slug)}&per_page=1&_fields=id,slug,comment_status`);
  if (!response.ok) return response.status === 404 ? false : null;
  return (await response.json())[0] || false;
}

async function approvedComments(wordpressFetch, postId) {
  const comments = [];
  let page = 1;
  let pages = 1;
  do {
    const response = await wordpressFetch(`/comments?post=${postId}&status=approve&per_page=100&page=${page}&orderby=date_gmt&order=desc&_fields=id,parent,author_name,content,date,date_gmt,status`);
    if (!response.ok) return null;
    comments.push(...await response.json());
    pages = Math.min(20, Math.max(1, Number(response.headers.get('X-WP-TotalPages') || 1)));
    page += 1;
  } while (page <= pages);
  return comments;
}

export async function wordpressCommentMeta(wordpressFetch, slug) {
  const post = await resolvePost(wordpressFetch, slug);
  if (post === null) return null;
  if (!post) return false;
  const comments = await approvedComments(wordpressFetch, post.id);
  if (!comments) return null;
  const roots = comments.filter((comment) => Number(comment.parent || 0) === 0).length;
  return { post_id: post.id, comments_open: post.comment_status === 'open', comment_count: roots, reply_count: comments.length - roots };
}

export function matchWordpressComment(pathname, method) {
  let match = pathname.match(/^\/api\/blog\/([a-z0-9-]+)\/comments$/);
  if (match && (method === 'GET' || method === 'POST')) return { kind: method === 'GET' ? 'comments-list' : 'comment-create', slug: match[1] };
  match = pathname.match(/^\/api\/blog\/([a-z0-9-]+)\/comments\/(\d+)\/replies$/);
  if (match && (method === 'GET' || method === 'POST')) return { kind: method === 'GET' ? 'replies-list' : 'reply-create', slug: match[1], commentId: match[2] };
  match = pathname.match(/^\/api\/blog\/([a-z0-9-]+)\/comments\/(\d+)\/like$/);
  if (match && method === 'POST') return { kind: 'comment-like', slug: match[1], commentId: match[2] };
  return null;
}

export async function handleWordpressComment(request, env, match, dependencies) {
  const { wordpressFetch, requireUser, rateLimit } = dependencies;
  if (!slugPattern.test(match.slug) || (match.commentId && !commentIdPattern.test(match.commentId))) return json({ error: 'INVALID_BLOG_COMMENT_REFERENCE' }, 400);
  const post = await resolvePost(wordpressFetch, match.slug);
  if (post === null) return json({ error: 'BLOG_UNAVAILABLE' }, 503);
  if (!post) return json({ error: 'BLOG_POST_NOT_FOUND' }, 404);
  if (match.kind === 'comment-like') return json({ error: 'WORDPRESS_COMMENT_LIKE_NOT_AVAILABLE_FOR_MELSOU_IDENTITY' }, 501);

  if (match.kind === 'comments-list' || match.kind === 'replies-list') {
    const url = new URL(request.url);
    const limit = Math.min(20, Math.max(1, Number.parseInt(url.searchParams.get('limit') || '5', 10) || 5));
    const offset = Math.max(0, Number.parseInt(url.searchParams.get('cursor') || '0', 10) || 0);
    const requestedSort = url.searchParams.get('sort') === 'top' ? 'top' : 'latest';
    const comments = await approvedComments(wordpressFetch, post.id);
    if (!comments) return json({ error: 'BLOG_COMMENTS_UNAVAILABLE' }, 503);
    const parent = match.commentId ? Number(match.commentId) : 0;
    const rows = comments.filter((comment) => Number(comment.parent || 0) === parent);
    rows.sort((a, b) => {
      if (requestedSort === 'top') {
        const likeDifference = Number(b.like_count || 0) - Number(a.like_count || 0);
        if (likeDifference) return likeDifference;
      }
      return String(b.date_gmt || b.date).localeCompare(String(a.date_gmt || a.date));
    });
    const replyCounts = new Map();
    for (const comment of comments) if (Number(comment.parent || 0) > 0) replyCounts.set(String(comment.parent), (replyCounts.get(String(comment.parent)) || 0) + 1);
    const page = rows.slice(offset, offset + limit).map((comment) => ({ ...mapComment(comment, replyCounts.get(String(comment.id)) || 0), post_slug: match.slug }));
    return json({ post_slug: match.slug, source: 'wordpress', comments_open: post.comment_status === 'open', sort: requestedSort, limit, comments: page, next_cursor: offset + limit < rows.length ? String(offset + limit) : null });
  }

  const user = await requireUser(request);
  if (!user) return json({ error: 'UNAUTHENTICATED' }, 401);
  if (post.comment_status !== 'open') return json({ error: 'COMMENTS_CLOSED' }, 409);
  if (!env.WORDPRESS_ACCESS_TOKEN) return json({ error: 'WORDPRESS_COMMENT_WRITE_NOT_CONFIGURED' }, 503);
  const limited = await rateLimit(request, `wordpress-blog:${match.kind}`);
  if (limited?.configurationMissing) return json({ error: 'RATE_LIMIT_NOT_CONFIGURED' }, 503);
  if (limited && !limited.allowed) return json({ error: 'RATE_LIMITED' }, 429);
  let body;
  try { body = await request.json(); } catch { return json({ error: 'INVALID_JSON' }, 400); }
  const content = typeof body?.content === 'string' ? body.content.trim() : '';
  if (!content || content.length > 2000) return json({ error: 'INVALID_COMMENT' }, 400);
  const userId = String(user.id || user.user_id || 'melsou-user');
  const authorName = String(user.username || user.user_metadata?.name || user.user_metadata?.full_name || 'Khách hàng Melsou').slice(0, 100);
  const authorEmail = user.email || `${userId.replace(/[^a-z0-9-]/gi, '')}@comments.melsou.invalid`;
  const response = await wordpressFetch('/comments', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.WORDPRESS_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ post: post.id, parent: match.commentId ? Number(match.commentId) : 0, author: 0, author_name: authorName, author_email: authorEmail, content })
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) return json({ error: response.status === 403 ? 'COMMENTS_CLOSED' : 'WORDPRESS_COMMENT_CREATE_FAILED' }, response.status === 403 ? 409 : 503);
  return json({ comment: { ...mapComment(result), post_slug: match.slug } }, 201);
}
