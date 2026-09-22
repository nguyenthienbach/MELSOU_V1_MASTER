import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import worker from './index.mjs';

const shell = await readFile(new URL('../demo/recovery_fb38/index.html', import.meta.url), 'utf8');
const env = { ASSETS: { fetch: async () => new Response(shell, { headers: { 'Content-Type': 'text/html' } }) } };
const wpResponse = (posts, ok = true) => new Response(JSON.stringify(posts), { status: ok ? 200 : 500, headers: { 'Content-Type': 'application/json', 'X-WP-Total': String(posts.length), 'X-WP-TotalPages': '1' } });
const post = (overrides = {}) => ({
  id: 12, slug: 'mo-ta-chinh-thuc', status: 'publish', date_gmt: '2026-09-20T01:02:03', modified_gmt: '2026-09-21T02:03:04',
  title: { rendered: 'Bài viết &amp; ký ức' }, excerpt: { rendered: '<p>Mô tả do tác giả nhập&nbsp;riêng.</p>' },
  content: { rendered: '<p>Nội dung chính của bài viết. Câu tiếp theo đủ dài để kiểm tra fallback an toàn.</p>' },
  _embedded: { author: [{ name: 'Tác giả Melsou' }], 'wp:term': [[{ id: 1, name: 'Nhật ký', slug: 'nhat-ky' }], []], 'wp:featuredmedia': [{ source_url: 'https://cdn.example.test/real.jpg' }] },
  ...overrides
});
const extractJsonLd = (html, id = null) => {
  const pattern = id
    ? new RegExp(`<script type="application/ld\\+json" id="${id}">([\\s\\S]*?)<\\/script>`)
    : /<script type="application\/ld\+json">([\s\S]*?)<\/script>/;
  return JSON.parse(html.match(pattern)?.[1] || 'null');
};

test('homepage exposes consistent Melsou Organization and WebSite entity signals', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => wpResponse([]);
  try {
    const googlebot = await worker.fetch(new Request('https://melsou.test/', { headers: { 'User-Agent': 'Googlebot' } }), env, {});
    const browser = await worker.fetch(new Request('https://melsou.test/', { headers: { 'User-Agent': 'Mozilla/5.0' } }), env, {});
    const html = await googlebot.text();
    assert.equal(html, await browser.text());
    const short = 'Melsou kết hợp album ảnh cá nhân hóa với giai điệu và kỷ vật, để mỗi trang ảnh không chỉ lưu giữ khoảnh khắc mà còn biết cất lời.';
    const full = 'Chiếc máy ảnh có thể giữ lại hình dáng khoảnh khắc, nhưng lại vô tình bỏ quên âm thanh. Melsou hòa quyện giai điệu (melody) và kỷ vật (souvenir) để mỗi trang ảnh không chỉ đẹp, mà còn biết cất lời.';
    assert.match(html, new RegExp(`<meta name="description" content="${short}">`));
    assert.match(html, new RegExp(`<meta property="og:description" content="${short}">`));
    assert.match(html, new RegExp(`<meta name="twitter:description" content="${short}">`));
    assert.match(html, /<strong>Melsou<\/strong> hòa quyện/);
    const schema = extractJsonLd(html, 'melsou-homepage-entities');
    const organization = schema['@graph'].find((entry) => entry['@type'] === 'Organization');
    const website = schema['@graph'].find((entry) => entry['@type'] === 'WebSite');
    assert.deepEqual(organization, { '@type': 'Organization', '@id': 'https://melsou.com/#organization', name: 'Melsou', alternateName: 'Melsou Melody & Souvenir', url: 'https://melsou.com/', description: full, logo: 'https://melsou.com/favicon.png', sameAs: ['https://www.facebook.com/share/1EikCbdn3N/?mibextid=wwXIfr', 'https://www.tiktok.com/@melsou.vn'] });
    assert.equal(website.publisher['@id'], organization['@id']);
    assert.equal((html.match(/id="melsou-homepage-entities"/g) || []).length, 1);
    assert.doesNotMatch(JSON.stringify(schema), /address|telephone|taxID|vatID|aggregateRating|LocalBusiness/);
  } finally { globalThis.fetch = originalFetch; }
});

test('/ve-melsou identifies the Vietnam album project without inventing a legal entity', async () => {
  const response = await worker.fetch(new Request('https://melsou.test/ve-melsou'), env, {});
  const html = await response.text();
  assert.match(html, /Melsou là dự án thương hiệu album ảnh cá nhân hóa kết hợp hình ảnh và thanh âm, được phát triển tại Việt Nam\./);
  assert.doesNotMatch(html, /mã số thuế|taxID|vatID|LocalBusiness/);
});

test('Blog description priority, single-pass decoding and schema stay synchronized and XSS-safe', async () => {
  const originalFetch = globalThis.fetch;
  const cases = [
    [post({ meta: { advanced_seo_description: 'Mô tả SEO Jetpack thật.' }, yoast_head_json: { description: 'Không được chọn.' } }), 'Mô tả SEO Jetpack thật.', 'meta.advanced_seo_description'],
    [post({ yoast_head_json: { description: 'SEO riêng &#38; an toàn.' } }), 'SEO riêng & an toàn.', 'yoast_head_json.description'],
    [post(), 'Mô tả do tác giả nhập riêng.', 'excerpt'],
    [post({ excerpt: { rendered: '' }, content: { rendered: '<style>bad</style><script>alert(1)</script><p>Nội dung fallback sạch. Câu thứ hai hoàn chỉnh.</p>[gallery] Đọc tiếp...' } }), 'Nội dung fallback sạch. Câu thứ hai hoàn chỉnh.', 'content_fallback'],
    [post({ yoast_head_json: { description: '&amp;lt;script&amp;gt;không chạy&amp;lt;/script&amp;gt;' } }), '&lt;script&gt;không chạy&lt;/script&gt;', 'yoast_head_json.description']
  ];
  try {
    for (const [fixture, expected, source] of cases) {
      globalThis.fetch = async () => wpResponse([fixture]);
      const api = await worker.fetch(new Request('https://melsou.test/api/blog/mo-ta-chinh-thuc'), {}, {});
      const apiPost = (await api.json()).post;
      assert.equal(apiPost.description, expected);
      assert.equal(apiPost.descriptionSource, source);
      const response = await worker.fetch(new Request('https://melsou.test/blog/mo-ta-chinh-thuc', { headers: { 'User-Agent': 'Googlebot' } }), env, {});
      const html = await response.text();
      const escaped = expected.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
      assert.ok(html.includes(`<meta name="description" content="${escaped}">`));
      assert.ok(html.includes(`<meta property="og:description" content="${escaped}">`));
      assert.ok(html.includes(`<meta name="twitter:description" content="${escaped}">`));
      assert.equal((html.match(/<meta name="description"/g) || []).length, 1);
      const schema = extractJsonLd(html);
      const article = schema['@graph'].find((entry) => entry['@type'] === 'Article');
      const breadcrumb = schema['@graph'].find((entry) => entry['@type'] === 'BreadcrumbList');
      assert.equal(article.description, expected);
      assert.equal(article.publisher['@id'], 'https://melsou.com/#organization');
      assert.equal(article.mainEntityOfPage['@id'], 'https://melsou.com/blog/mo-ta-chinh-thuc');
      assert.equal(article.author.name, 'Tác giả Melsou');
      assert.deepEqual(breadcrumb.itemListElement.map(({ item }) => item), ['https://melsou.com/', 'https://melsou.com/#blog-section', 'https://melsou.com/blog/mo-ta-chinh-thuc']);
      assert.doesNotMatch(html, /<script>alert\(1\)<\/script>/);
      assert.equal((html.match(/<h1\b/g) || []).length, 1);
    }
  } finally { globalThis.fetch = originalFetch; }
});

test('malicious WordPress metadata cannot escape HTML attributes, JSON-LD, or article content', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => wpResponse([post({
    title: { rendered: '</script><script>alert(1)</script> " onmouseover="alert(2)' },
    excerpt: { rendered: '<p>Đoạn mô tả <img src=x onerror=alert(3)> an toàn.</p>' },
    content: { rendered: '<script>alert(4)</script><p onclick="alert(5)">Nội dung <a href=javascript:alert(6)>liên kết</a>.</p>' }
  })]);
  try {
    const response = await worker.fetch(new Request('https://melsou.test/blog/mo-ta-chinh-thuc'), env, {});
    const html = await response.text();
    assert.equal(response.status, 200);
    assert.doesNotMatch(html, /<script>alert\(/i);
    const ogTitleTag = html.match(/<meta property="og:title"[^>]*>/i)?.[0] || '';
    const description = html.match(/<p id="blogPostDescription"[^>]*>([\s\S]*?)<\/p>/i)?.[1] || '';
    const articleBody = html.match(/<div class="reader-body" id="readerBody">([\s\S]*?)<\/div>/i)?.[1] || '';
    assert.match(ogTitleTag, /&quot; onmouseover=&quot;/i);
    assert.doesNotMatch(ogTitleTag, /" onmouseover="/i);
    assert.doesNotMatch(description, /<img|\sonerror=/i);
    assert.doesNotMatch(articleBody, /\sonclick=|href\s*=\s*javascript:/i);
    const schema = extractJsonLd(html);
    assert.ok(schema['@graph'].find((entry) => entry['@type'] === 'Article'));
    assert.equal((html.match(/<script type="application\/ld\+json">/g) || []).length, 1);
  } finally { globalThis.fetch = originalFetch; }
});

test('sitemap remains XML, contains only static indexable routes and currently published WordPress slugs', async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => wpResponse([post(), post({ slug: 'draft-never-listed', status: 'draft' })]);
    const response = await worker.fetch(new Request('https://melsou.test/api/sitemap.xml'), {}, {});
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /^application\/xml/);
    const xml = await response.text();
    for (const path of ['/', '/ve-melsou', '/goi-san-pham', '/templates', '/chinh-sach-bao-mat', '/chinh-sach-bao-hanh', '/blog/mo-ta-chinh-thuc']) assert.ok(xml.includes(`https://melsou.com${path}`));
    assert.doesNotMatch(xml, /owner|account|checkout|api\/|draft-never-listed|slug-cua-bai/);
    globalThis.fetch = async () => wpResponse([], false);
    const failed = await worker.fetch(new Request('https://melsou.test/api/sitemap.xml'), {}, {});
    assert.equal(failed.status, 503);
    assert.match(failed.headers.get('content-type'), /^application\/xml/);
    assert.match(await failed.text(), /^<\?xml/);
  } finally { globalThis.fetch = originalFetch; }
});
