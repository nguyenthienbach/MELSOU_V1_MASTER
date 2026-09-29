import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import worker, { HOMEPAGE_SSR_BLOG_LIMIT } from './index.mjs';

const shell = await readFile(new URL('../demo/recovery_fb38/index.html', import.meta.url), 'utf8');
const stylesCss = await readFile(new URL('../demo/recovery_fb38/styles.css', import.meta.url), 'utf8');

const assetEnv = {
  ASSETS: {
    fetch: async (request) => {
      const url = new URL(request.url);
      if (url.pathname === '/' || url.pathname === '/index.html') {
        return new Response(shell, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
      }
      if (url.pathname === '/styles.css') {
        return new Response(stylesCss, { headers: { 'Content-Type': 'text/css; charset=utf-8' } });
      }
      return new Response('Not Found', { status: 404 });
    }
  }
};

const wpPost = (overrides = {}) => ({
  id: 1,
  date_gmt: '2026-09-18T00:00:00',
  modified_gmt: '2026-09-18T00:00:00',
  slug: 'cau-chuyen-dau-tien-cua-melsou',
  status: 'publish',
  type: 'post',
  link: 'https://melsoucms.wordpress.com/2026/09/18/cau-chuyen-dau-tien-cua-melsou/',
  title: { rendered: 'Câu chuyện đầu tiên của Melsou' },
  content: { rendered: '<p>Nội dung câu chuyện</p>' },
  excerpt: { rendered: '<p>Mô tả ngắn</p>' },
  author: 1,
  featured_media: 0,
  comment_status: 'open',
  ping_status: 'closed',
  sticky: false,
  template: '',
  format: 'standard',
  meta: [],
  categories: [1],
  tags: [],
  _embedded: {
    'wp:term': [[{ id: 1, name: 'Nhật ký Melsou', slug: 'nhat-ky-melsou', taxonomy: 'category' }]]
  },
  ...overrides
});

const wpResponse = (posts, headers = {}) => new Response(JSON.stringify(posts), {
  status: 200,
  headers: {
    'Content-Type': 'application/json',
    'X-WP-Total': String(posts.length),
    'X-WP-TotalPages': '1',
    ...headers
  }
});

// A. Homepage SSR không fetch/embed 100 posts
test('Targeted A: Homepage SSR does not fetch 100 posts, respects HOMEPAGE_SSR_BLOG_LIMIT', async () => {
  assert.equal(HOMEPAGE_SSR_BLOG_LIMIT, 4, 'HOMEPAGE_SSR_BLOG_LIMIT must be 4');
  let requestedUrl = '';
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    requestedUrl = String(input);
    return wpResponse([wpPost()]);
  };
  try {
    const res = await worker.fetch(new Request('https://melsou.test/'), assetEnv, {});
    assert.equal(res.status, 200);
    assert.match(requestedUrl, /per_page=4/);
    assert.doesNotMatch(requestedUrl, /per_page=100/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// B. Homepage SSR embedded posts <= configured homepage limit
test('Targeted B: Homepage SSR embeds at most HOMEPAGE_SSR_BLOG_LIMIT posts in payload', async () => {
  const originalFetch = globalThis.fetch;
  const tenPosts = Array.from({ length: 10 }, (_, i) => wpPost({ id: i + 1, slug: `post-${i + 1}` }));
  globalThis.fetch = async () => wpResponse(tenPosts.slice(0, HOMEPAGE_SSR_BLOG_LIMIT));
  try {
    const res = await worker.fetch(new Request('https://melsou.test/'), assetEnv, {});
    const html = await res.text();
    const scriptMatch = html.match(/<script type="application\/json" id="melsouSsrBlogPosts">([\s\S]*?)<\/script>/);
    assert.ok(scriptMatch, 'melsouSsrBlogPosts script must be present');
    const data = JSON.parse(scriptMatch[1]);
    assert.ok(data.posts.length <= HOMEPAGE_SSR_BLOG_LIMIT, `Expected <= ${HOMEPAGE_SSR_BLOG_LIMIT}`);
    assert.equal(data.posts.length, 4);
    const jsonBytes = Buffer.byteLength(scriptMatch[1], 'utf-8');
    assert.ok(jsonBytes < 25000, `melsouSsrBlogPosts payload must be < 25KB, got ${jsonBytes} bytes`);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// C. /blog behavior không bị thay đổi
test('Targeted C: /api/blog behavior remains unchanged and serves requested pagination', async () => {
  const originalFetch = globalThis.fetch;
  let requestedUrl = '';
  globalThis.fetch = async (input) => {
    requestedUrl = String(input);
    return wpResponse([wpPost({ id: 1 }), wpPost({ id: 2 })]);
  };
  try {
    const res = await worker.fetch(new Request('https://melsou.test/api/blog?page=2&perPage=10'), assetEnv, {});
    assert.equal(res.status, 200);
    assert.match(requestedUrl, /page=2/);
    assert.match(requestedUrl, /per_page=10/);
    const body = await res.json();
    assert.equal(body.posts.length, 2);
    assert.equal(body.pagination.page, 2);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// D. Batch 4 Critical CSS / font asset hiện diện qua Worker asset response
test('Targeted D: Critical CSS and single LCP font preload are served through Worker asset shell', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => wpResponse([wpPost()]);
  try {
    const res = await worker.fetch(new Request('https://melsou.test/'), assetEnv, {});
    const html = await res.text();
    assert.match(html, /<style id="melsouCriticalCss">/, 'Critical CSS must be present in SSR output');
    assert.match(html, /<link rel="preload" href="\/assets\/fonts\/montserrat-400\.woff2" as="font" type="font\/woff2" crossorigin>/, 'LCP font must be preloaded');
    assert.doesNotMatch(html, /<link rel="preload"[^>]*href="[^"]*montserrat-700\.woff2"/, 'montserrat-700 must not be preloaded');
    assert.doesNotMatch(html, /<link rel="preload"[^>]*href="[^"]*playfair-600\.woff2"/, 'playfair-600 must not be preloaded');
    assert.doesNotMatch(html, /<link rel="preload"[^>]*href="[^"]*pacifico-400\.woff2"/, 'pacifico-400 must not be preloaded');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// E. Không còn Google Fonts trong production homepage template/assets
test('Targeted E: Zero Google Fonts references in homepage template and styles', async () => {
  assert.doesNotMatch(shell, /fonts\.googleapis\.com/, 'index.html must not reference fonts.googleapis.com');
  assert.doesNotMatch(shell, /fonts\.gstatic\.com/, 'index.html must not reference fonts.gstatic.com');
  assert.doesNotMatch(stylesCss, /fonts\.googleapis\.com/, 'styles.css must not reference fonts.googleapis.com');
  assert.doesNotMatch(stylesCss, /fonts\.gstatic\.com/, 'styles.css must not reference fonts.gstatic.com');
});

// F. Hero animation toggle verification
test('Targeted F: heroFloat3D animation is deferred and requires hero-animation-ready class', async () => {
  assert.match(stylesCss, /\.hero-book-3d\.hero-animation-ready\{animation:heroFloat3D 6s ease-in-out infinite\}/);
  assert.match(stylesCss, /cursor:pointer;transform-style:preserve-3d;animation:none;transition:transform 0\.3s ease\}/);
  assert.match(shell, /classList\.add\(['"]hero-animation-ready['"]\)/);
});
