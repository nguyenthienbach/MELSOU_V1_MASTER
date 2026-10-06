import test from 'node:test';
import assert from 'node:assert/strict';
import worker from './index.mjs';

const wpCategory = (id, name, slug, count = 1, overrides = {}) => ({
  id,
  name,
  slug,
  count,
  taxonomy: 'category',
  ...overrides
});

const wpPostWithCategories = (id, slug, categories = []) => ({
  id,
  slug,
  status: 'publish',
  date: '2026-09-13T18:13:18',
  date_gmt: '2026-09-13T11:13:18',
  modified: '2026-09-13T18:13:18',
  modified_gmt: '2026-09-13T11:13:18',
  title: { rendered: `Post ${slug}` },
  excerpt: { rendered: '<p>Excerpt</p>' },
  content: { rendered: '<p>Content</p>' },
  jetpack_featured_media_url: '',
  _embedded: {
    'wp:term': [categories, []]
  }
});

const jsonResponse = (data, headers = {}) => new Response(JSON.stringify(data), {
  headers: { 'Content-Type': 'application/json', ...headers }
});

test('categories endpoint filters out empty categories and maps contract cleanly', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = String(input);
    if (url.includes('/categories')) {
      return jsonResponse([
        wpCategory(1, 'Quà tặng', 'qua-tang', 21),
        wpCategory(2, 'photobook', 'photobook', 17),
        wpCategory(3, 'Chất liệu', 'chat-lieu', 2),
        wpCategory(4, 'Rỗng không bài', 'empty-cat', 0)
      ], { 'X-WP-TotalPages': '1' });
    }
    return jsonResponse([]);
  };

  try {
    const res = await worker.fetch(new Request('https://melsou.test/api/blog/categories'), {}, {});
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.categories.length, 3);
    assert.equal(body.categories[0].name, 'Quà tặng');
    assert.equal(body.categories[1].name, 'photobook');
    assert.equal(body.categories[2].name, 'Chất liệu');
    assert.equal(body.categories.some(c => c.slug === 'empty-cat'), false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('posts response preserves all categories on multi-taxonomy posts', async () => {
  const originalFetch = globalThis.fetch;
  const multiCatPost = wpPostWithCategories(99, 'album-ky-yeu-da-chieu', [
    { id: 639831, name: 'photobook', slug: 'photobook' },
    { id: 6589772, name: 'Quà tặng', slug: 'qua-tang' }
  ]);

  globalThis.fetch = async () => jsonResponse([multiCatPost], {
    'X-WP-Total': '1',
    'X-WP-TotalPages': '1'
  });

  try {
    const res = await worker.fetch(new Request('https://melsou.test/api/blog?perPage=10'), {}, {});
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.posts.length, 1);
    const p = body.posts[0];
    assert.equal(p.category.slug, 'photobook');
    assert.equal(p.categories.length, 2);
    assert.equal(p.categories[0].slug, 'photobook');
    assert.equal(p.categories[1].slug, 'qua-tang');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('querying by category slug resolves slug to ID and filters posts', async () => {
  const originalFetch = globalThis.fetch;
  let requestedPostUrl = '';
  globalThis.fetch = async (input) => {
    const url = String(input);
    if (url.includes('/categories?slug=photobook')) {
      return jsonResponse([{ id: 639831, name: 'photobook', slug: 'photobook' }]);
    }
    if (url.includes('/posts')) {
      requestedPostUrl = url;
      return jsonResponse([wpPostWithCategories(10, 'bai-photobook', [{ id: 639831, name: 'photobook', slug: 'photobook' }])], {
        'X-WP-Total': '1',
        'X-WP-TotalPages': '1'
      });
    }
    return jsonResponse([]);
  };

  try {
    const res = await worker.fetch(new Request('https://melsou.test/api/blog?category=photobook'), {}, {});
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.posts.length, 1);
    assert.match(requestedPostUrl, /categories=639831/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('new taxonomy dynamically appears and renamed taxonomy updates label', async () => {
  const originalFetch = globalThis.fetch;
  let dynamicCategories = [
    wpCategory(1, 'Behind The Scenes', 'behind-the-scenes', 5),
    wpCategory(2, 'Ý tưởng quà tặng', 'y-tuong-qua-tang', 12)
  ];

  globalThis.fetch = async (input) => {
    const url = String(input);
    if (url.includes('/categories')) {
      return jsonResponse(dynamicCategories, { 'X-WP-TotalPages': '1' });
    }
    return jsonResponse([]);
  };

  try {
    const res = await worker.fetch(new Request('https://melsou.test/api/blog/categories'), {}, {});
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.categories.some(c => c.name === 'Behind The Scenes'), true);
    assert.equal(body.categories.some(c => c.name === 'Ý tưởng quà tặng'), true);
    assert.equal(body.categories.some(c => c.name === 'Quà tặng'), false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Vietnamese Unicode characters and accents are preserved perfectly in categories and post terms', async () => {
  const originalFetch = globalThis.fetch;
  const vnCategories = [
    wpCategory(101, 'Nhật ký Melsou', 'nhat-ky-melsou', 1),
    wpCategory(102, 'Câu chuyện Melsou', 'cau-chuyen-melsou', 1),
    wpCategory(103, 'Chất liệu &amp; Giấy in', 'chat-lieu-giay-in', 3)
  ];

  globalThis.fetch = async (input) => {
    const url = String(input);
    if (url.includes('/categories')) {
      return jsonResponse(vnCategories, { 'X-WP-TotalPages': '1' });
    }
    return jsonResponse([]);
  };

  try {
    const res = await worker.fetch(new Request('https://melsou.test/api/blog/categories'), {}, {});
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.categories[0].name, 'Nhật ký Melsou');
    assert.equal(body.categories[1].name, 'Câu chuyện Melsou');
    assert.equal(body.categories[2].name, 'Chất liệu & Giấy in');
  } finally {
    globalThis.fetch = originalFetch;
  }
});
