import test from 'node:test';
import assert from 'node:assert/strict';
import { handleWordpressComment, matchWordpressComment, wordpressCommentMeta } from './wordpress-comments.mjs';

const response = (body, status = 200, headers = {}) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...headers } });
const slug = 'cau-chuyen-ve-melsou';
const rows = [
  { id: 10, parent: 0, author_name: 'thienbach', content: { rendered: '<p>Bình luận gốc</p>' }, date_gmt: '2026-09-16T01:00:00', status: 'approved' },
  { id: 11, parent: 10, author_name: 'melsou', content: { rendered: '<p>Phản hồi</p>' }, date_gmt: '2026-09-16T02:00:00', status: 'approved' }
];

function setup({ open = true, token = null } = {}) {
  const writes = [];
  return {
    env: { WORDPRESS_ACCESS_TOKEN: token },
    writes,
    dependencies: {
      wordpressFetch: async (path, options = {}) => {
        if (path.startsWith('/posts?')) return response([{ id: 57, slug, comment_status: open ? 'open' : 'closed' }]);
        if (path.startsWith('/comments?')) return response(rows, 200, { 'X-WP-TotalPages': '1' });
        writes.push({ path, options });
        return response({ id: 12, parent: JSON.parse(options.body).parent, author_name: 'thienbach', content: { rendered: '<p>Mới</p>' }, date_gmt: '2026-09-16T03:00:00', status: 'approved' }, 201);
      },
      requireUser: async () => ({ id: '00000000-0000-4000-8000-000000000001', username: 'thienbach' }),
      rateLimit: async () => ({ allowed: true })
    }
  };
}

test('WordPress comments expose identity, pagination, replies and lock state', async () => {
  const context = setup();
  assert.deepEqual(await wordpressCommentMeta(context.dependencies.wordpressFetch, slug), { post_id: 57, comments_open: true, comment_count: 1, reply_count: 1 });
  let result = await handleWordpressComment(new Request(`https://melsou.test/api/blog/${slug}/comments?limit=1&sort=latest`), context.env, matchWordpressComment(`/api/blog/${slug}/comments`, 'GET'), context.dependencies);
  let body = await result.json();
  assert.equal(body.comments[0].id, '10');
  assert.equal(body.comments[0].reply_count, 1);
  result = await handleWordpressComment(new Request(`https://melsou.test/api/blog/${slug}/comments/10/replies`), context.env, matchWordpressComment(`/api/blog/${slug}/comments/10/replies`, 'GET'), context.dependencies);
  body = await result.json();
  assert.equal(body.comments[0].parent_comment_id, '10');
});

test('WordPress writes fail closed without token and enforce comment lock', async () => {
  let context = setup();
  let request = new Request(`https://melsou.test/api/blog/${slug}/comments`, { method: 'POST', body: JSON.stringify({ content: 'Mới' }) });
  let result = await handleWordpressComment(request, context.env, matchWordpressComment(`/api/blog/${slug}/comments`, 'POST'), context.dependencies);
  assert.equal(result.status, 503);
  assert.equal((await result.json()).error, 'WORDPRESS_COMMENT_WRITE_NOT_CONFIGURED');
  context = setup({ open: false, token: 'test-token' });
  request = new Request(`https://melsou.test/api/blog/${slug}/comments`, { method: 'POST', body: JSON.stringify({ content: 'Mới' }) });
  result = await handleWordpressComment(request, context.env, matchWordpressComment(`/api/blog/${slug}/comments`, 'POST'), context.dependencies);
  assert.equal(result.status, 409);
  assert.equal((await result.json()).error, 'COMMENTS_CLOSED');
});

test('WordPress writes map Melsou identity and reply parent without dual-write', async () => {
  const context = setup({ token: 'test-token' });
  const request = new Request(`https://melsou.test/api/blog/${slug}/comments/10/replies`, { method: 'POST', body: JSON.stringify({ content: 'Mới' }) });
  const result = await handleWordpressComment(request, context.env, matchWordpressComment(`/api/blog/${slug}/comments/10/replies`, 'POST'), context.dependencies);
  assert.equal(result.status, 201);
  const payload = JSON.parse(context.writes[0].options.body);
  assert.equal(payload.parent, 10);
  assert.equal(payload.author_name, 'thienbach');
  assert.match(payload.author_email, /@comments\.melsou\.invalid$/);
});
