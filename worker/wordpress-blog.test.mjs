import test from 'node:test';
import assert from 'node:assert/strict';
import worker from './index.mjs';

const wpPost = (overrides = {}) => ({
  id: 9,
  slug: 'cau-chuyen-dau-tien-cua-melsou',
  status: 'publish',
  date: '2026-09-13T18:13:18',
  date_gmt: '2026-09-13T11:13:18',
  modified: '2026-09-13T18:13:18',
  modified_gmt: '2026-09-13T11:13:18',
  title: { rendered: 'Câu chuyện đầu tiên của Melsou' },
  excerpt: { rendered: '<p>Mỗi cuốn album Melsou là một nơi lưu giữ những khoảnh khắc.</p>' },
  content: { rendered: '<p>Nội dung bài viết.</p>' },
  jetpack_featured_media_url: '',
  _embedded: { 'wp:term': [[{ id: 1, name: 'Câu chuyện Melsou', slug: 'cau-chuyen-melsou' }], []] },
  ...overrides
});

const wpResponse = (posts) => new Response(JSON.stringify(posts), { headers: { 'Content-Type': 'application/json', 'X-WP-Total': String(posts.length), 'X-WP-TotalPages': '1' } });

test('WordPress proxy returns published posts newest first with normalized metadata', async () => {
  const originalFetch = globalThis.fetch;
  let requestedUrl = '';
  globalThis.fetch = async (input) => { requestedUrl = String(input); return wpResponse([wpPost()]); };
  try {
    const response = await worker.fetch(new Request('https://melsou.test/api/blog?page=1&perPage=10'), {}, {});
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.posts[0].slug, 'cau-chuyen-dau-tien-cua-melsou');
    assert.equal(body.posts[0].category.slug, 'cau-chuyen-melsou');
    assert.match(requestedUrl, /status=publish/);
    assert.match(requestedUrl, /orderby=date/);
    assert.match(requestedUrl, /order=desc/);
  } finally { globalThis.fetch = originalFetch; }
});

test('WordPress detail excludes a slug no longer returned as published', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => wpResponse([]);
  try {
    const response = await worker.fetch(new Request('https://melsou.test/api/blog/cau-chuyen-dau-tien-cua-melsou'), {}, {});
    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), { error: 'BLOG_POST_NOT_FOUND' });
  } finally { globalThis.fetch = originalFetch; }
});

test('dynamic sitemap follows the current WordPress published collection', async () => {
  const originalFetch = globalThis.fetch;
  let published = [wpPost()];
  globalThis.fetch = async () => wpResponse(published);
  try {
    const first = await worker.fetch(new Request('https://melsou.test/api/sitemap.xml'), {}, {});
    const firstXml = await first.text();
    assert.match(firstXml, /https:\/\/melsou\.com\/blog\/cau-chuyen-dau-tien-cua-melsou/);
    assert.equal((firstXml.match(/<url>/g) || []).length, 7);

    published = [];
    const second = await worker.fetch(new Request('https://melsou.test/api/sitemap.xml'), {}, {});
    const secondXml = await second.text();
    assert.doesNotMatch(secondXml, /cau-chuyen-dau-tien-cua-melsou/);
    assert.equal((secondXml.match(/<url>/g) || []).length, 6);
  } finally { globalThis.fetch = originalFetch; }
});
