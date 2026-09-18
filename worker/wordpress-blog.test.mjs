import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import worker from './index.mjs';

const blogShell = await readFile(new URL('../demo/recovery_fb38/index.html', import.meta.url), 'utf8');
const assetEnv = { ASSETS: { fetch: async () => new Response(blogShell, { headers: { 'Content-Type': 'text/html' } }) } };

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
    assert.equal(body.posts[0].featuredImage, null);
    assert.match(requestedUrl, /status=publish/);
    assert.match(requestedUrl, /orderby=date/);
    assert.match(requestedUrl, /order=desc/);
  } finally { globalThis.fetch = originalFetch; }
});

test('WordPress featured image and category filter remain source-driven', async () => {
  const originalFetch = globalThis.fetch;
  let requestedUrl = '';
  globalThis.fetch = async (input) => {
    requestedUrl = String(input);
    return wpResponse([wpPost({
      _embedded: {
        'wp:term': [[{ id: 791, name: 'Kỷ niệm mới', slug: 'ky-niem-moi' }], []],
        'wp:featuredmedia': [{ source_url: 'https://cdn.example.test/featured.jpg' }]
      }
    })]);
  };
  try {
    const response = await worker.fetch(new Request('https://melsou.test/api/blog?category=791'), {}, {});
    const body = await response.json();
    assert.equal(body.posts[0].category.name, 'Kỷ niệm mới');
    assert.equal(body.posts[0].featuredImage, 'https://cdn.example.test/featured.jpg');
    assert.match(requestedUrl, /categories=791/);
    assert.match(requestedUrl, /_embed=1/);
  } finally { globalThis.fetch = originalFetch; }
});

test('category endpoint includes only non-empty WordPress categories', async () => {
  const originalFetch = globalThis.fetch;
  let requestedUrl = '';
  globalThis.fetch = async (input) => {
    requestedUrl = String(input);
    return wpResponse([
      { id: 1, name: 'Published', slug: 'published', count: 2 },
      { id: 2, name: 'Empty', slug: 'empty', count: 0 }
    ]);
  };
  try {
    const response = await worker.fetch(new Request('https://melsou.test/api/blog/categories'), {}, {});
    assert.equal(response.status, 200);
    assert.deepEqual((await response.json()).categories, [{ id: 1, name: 'Published', slug: 'published', count: 2 }]);
    assert.match(requestedUrl, /categories\?hide_empty=true/);
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

test('Googlebot receives server-rendered article metadata and body with a self canonical', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => wpResponse([wpPost({
    excerpt: { rendered: '<p>Mô tả riêng cho bài viết Melsou.</p>' },
    content: { rendered: '<p>Nội dung bài viết có mặt trong HTML ban đầu.</p>' },
    _embedded: {
      'wp:term': [[{ id: 1, name: 'Nhật ký Melsou', slug: 'nhat-ky-melsou' }], []],
      'wp:featuredmedia': [{ source_url: 'https://cdn.example.test/article.jpg' }]
    }
  })]);
  try {
    const request = new Request('https://melsou.test/blog/cau-chuyen-dau-tien-cua-melsou', { headers: { 'User-Agent': 'Googlebot' } });
    const response = await worker.fetch(request, assetEnv, {});
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /^text\/html/);
    const html = await response.text();
    assert.match(html, /<title>Câu chuyện đầu tiên của Melsou \| Melsou<\/title>/);
    assert.match(html, /<meta name="description" content="Mô tả riêng cho bài viết Melsou\.">/);
    assert.match(html, /<link rel="canonical" href="https:\/\/melsou\.com\/blog\/cau-chuyen-dau-tien-cua-melsou">/);
    assert.match(html, /property="og:type" content="article"/);
    assert.match(html, /property="og:image" content="https:\/\/cdn\.example\.test\/article\.jpg"/);
    assert.match(html, /name="twitter:card" content="summary_large_image"/);
    assert.match(html, /type="application\/ld\+json">[\s\S]*"@type":"Article"/);
    assert.match(html, /<h1 id="blogPostPageHeading"[^>]*>Câu chuyện đầu tiên của Melsou<\/h1>/);
    assert.match(html, /Nội dung bài viết có mặt trong HTML ban đầu\./);
    assert.doesNotMatch(html, /<h1[^>]*id="heroHeadlineText"/);
    assert.equal((html.match(/<h1\b/g) || []).length, 1);
    assert.doesNotMatch(html, /<title>Melsou \| Gói tâm tình/);
    assert.doesNotMatch(html, /rel="canonical" href="https:\/\/melsou\.com\/"/);
  } finally { globalThis.fetch = originalFetch; }
});

test('server-rendered blog route returns 404 for an unpublished or unknown slug', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => wpResponse([]);
  try {
    const request = new Request('https://melsou.test/blog/khong-ton-tai', { headers: { 'User-Agent': 'Googlebot' } });
    const response = await worker.fetch(request, assetEnv, {});
    assert.equal(response.status, 404);
    assert.equal(response.headers.get('x-robots-tag'), 'noindex');
    assert.doesNotMatch(await response.text(), /rel="canonical" href="https:\/\/melsou\.com\/"/);
  } finally { globalThis.fetch = originalFetch; }
});

test('production routing sends blog documents through the Worker SSR route', async () => {
  const vercel = JSON.parse(await readFile(new URL('../demo/recovery_fb38/vercel.json', import.meta.url), 'utf8'));
  const blogRewrite = vercel.rewrites.find((rewrite) => rewrite.source === '/blog/:slug');
  assert.equal(blogRewrite?.destination, 'https://melsou.nguyenthienbach18042007.workers.dev/blog/:slug');
  const wrangler = await readFile(new URL('../wrangler.jsonc', import.meta.url), 'utf8');
  assert.match(wrangler, /"run_worker_first":\s*\["\/",\s*"\/api\/\*",\s*"\/blog\/\*"\]/);
});

test('homepage SSR emits crawlable safe links for every returned published post in one request', async () => {
  const originalFetch = globalThis.fetch;
  let fetchCount = 0;
  let requestedUrl = '';
  globalThis.fetch = async (input) => {
    fetchCount += 1;
    requestedUrl = String(input);
    return wpResponse([
      wpPost(),
      wpPost({
        id: 10,
        slug: 'bai-viet-moi',
        title: { rendered: 'Bài viết &amp; mới <script>alert(1)</script>' },
        excerpt: { rendered: '<p>Mô tả <img src=x onerror=alert(1)> an toàn.</p>' },
        jetpack_featured_media_url: 'javascript:alert(1)'
      }),
      wpPost({ id: 11, slug: 'ban-nhap', status: 'draft' }),
      wpPost({ id: 12, slug: 'bai-rieng-tu', status: 'private' }),
      wpPost({ id: 13, slug: 'bai-da-xoa', status: 'deleted' })
    ]);
  };
  try {
    const response = await worker.fetch(new Request('https://melsou.test/', { headers: { 'User-Agent': 'Googlebot' } }), assetEnv, {});
    assert.equal(response.status, 200);
    const html = await response.text();
    const list = /<div class="blog-feed-track" id="publicBlogList">([\s\S]*?)<\/div>\s*<button class="blog-carousel-arrow blog-arrow-next"/.exec(html)?.[1] || '';
    assert.match(list, /<a href="\/blog\/cau-chuyen-dau-tien-cua-melsou" class="blog-card-link">/);
    assert.match(list, /<a href="\/blog\/bai-viet-moi" class="blog-card-link">/);
    assert.doesNotMatch(list, /ban-nhap|bai-rieng-tu|bai-da-xoa/);
    assert.doesNotMatch(list, /javascript:void\(0\)|<script>alert|onerror=|javascript:alert/);
    assert.equal((list.match(/class="blog-card-link"/g) || []).length, 2);
    assert.equal(fetchCount, 1);
    assert.match(requestedUrl, /status=publish/);
    assert.match(requestedUrl, /per_page=100/);
  } finally { globalThis.fetch = originalFetch; }
});

test('homepage SSR gives Googlebot and normal browsers the same Blog links', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => wpResponse([wpPost(), wpPost({ id: 10, slug: 'bai-viet-moi' })]);
  const links = (html) => [...html.matchAll(/<a href="(\/blog\/[a-z0-9-]+)" class="blog-card-link">/g)].map((match) => match[1]);
  try {
    const googlebot = await worker.fetch(new Request('https://melsou.test/', { headers: { 'User-Agent': 'Googlebot' } }), assetEnv, {});
    const browser = await worker.fetch(new Request('https://melsou.test/', { headers: { 'User-Agent': 'Mozilla/5.0' } }), assetEnv, {});
    assert.deepEqual(links(await googlebot.text()), links(await browser.text()));
  } finally { globalThis.fetch = originalFetch; }
});

test('WordPress list failure leaves the homepage available without fake Blog links', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error('upstream unavailable'); };
  try {
    const response = await worker.fetch(new Request('https://melsou.test/'), assetEnv, {});
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /id="publicBlogList"/);
    assert.doesNotMatch(html, /id="melsouSsrBlogPosts"/);
    assert.doesNotMatch(html, /class="blog-card-link"/);
  } finally { globalThis.fetch = originalFetch; }
});
