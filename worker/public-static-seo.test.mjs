import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import worker from './index.mjs';

const shell = await readFile(new URL('../demo/recovery_fb38/index.html', import.meta.url), 'utf8');
const routes = [
  ['/ve-melsou', 'Về Melsou | Gói tâm tình trong dáng hình thanh âm', 'heroHeadlineText'],
  ['/goi-san-pham', 'Gói sản phẩm Melsou | Melody, Voice và Signature', 'pricingTitle'],
  ['/templates', 'Thư viện Template Melsou | 8 bộ mẫu nghệ thuật', 'tplLibraryHeading'],
  ['/chinh-sach-bao-mat', 'Chính sách bảo mật | Melsou', 'privacyPageHeading'],
  ['/chinh-sach-bao-hanh', 'Chính sách bảo hành, đổi trả và hoàn tiền | Melsou', 'warrantyPageHeading']
];
const env = { ASSETS: { fetch: async () => new Response(shell, { headers: { 'Content-Type': 'text/html' } }) } };
const clientSource = await readFile(new URL('../demo/recovery_fb38/seo-routes.js', import.meta.url), 'utf8');

const readMetadata = (html) => ({
  title: html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || '',
  description: html.match(/<meta name="description" content="([^"]*)">/i)?.[1] || '',
  canonical: html.match(/<link rel="canonical" href="([^"]*)">/i)?.[1] || '',
  ogTitle: html.match(/<meta property="og:title" content="([^"]*)">/i)?.[1] || '',
  ogDescription: html.match(/<meta property="og:description" content="([^"]*)">/i)?.[1] || '',
  ogUrl: html.match(/<meta property="og:url" content="([^"]*)">/i)?.[1] || '',
  twitterTitle: html.match(/<meta name="twitter:title" content="([^"]*)">/i)?.[1] || '',
  twitterDescription: html.match(/<meta name="twitter:description" content="([^"]*)">/i)?.[1] || ''
});

const hydrateMetadata = (html, pathname) => {
  const metadata = readMetadata(html);
  const elements = {
    'meta[name="description"]': { content: metadata.description },
    'meta[property="og:title"]': { content: metadata.ogTitle },
    'meta[property="og:description"]': { content: metadata.ogDescription },
    'meta[property="og:url"]': { content: metadata.ogUrl },
    'meta[name="twitter:title"]': { content: metadata.twitterTitle },
    'meta[name="twitter:description"]': { content: metadata.twitterDescription },
    'link[rel="canonical"]': { href: metadata.canonical }
  };
  const document = {
    title: metadata.title, readyState: 'loading', body: { style: {} },
    querySelector: (selector) => elements[selector] || null,
    querySelectorAll: () => [], getElementById: () => null,
    addEventListener: () => {}, createElement: () => ({ setAttribute() {}, attributes: [], innerHTML: '' })
  };
  const window = { location: { pathname }, addEventListener: () => {} };
  vm.runInNewContext(clientSource, { document, window, console });
  return {
    title: document.title, description: elements['meta[name="description"]'].content,
    canonical: elements['link[rel="canonical"]'].href,
    ogTitle: elements['meta[property="og:title"]'].content,
    ogDescription: elements['meta[property="og:description"]'].content,
    ogUrl: elements['meta[property="og:url"]'].content,
    twitterTitle: elements['meta[name="twitter:title"]'].content,
    twitterDescription: elements['meta[name="twitter:description"]'].content
  };
};

for (const [pathname, title, headingId] of routes) {
  test(`Googlebot receives route-specific initial HTML for ${pathname}`, async () => {
    const response = await worker.fetch(new Request(`https://melsou.test${pathname}`, { headers: { 'User-Agent': 'Googlebot' } }), env, {});
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, new RegExp(`<title>${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</title>`));
    assert.match(html, new RegExp(`<link rel="canonical" href="https://melsou\\.com${pathname}">`));
    assert.match(html, /<meta name="description" content="[^"]+">/);
    assert.match(html, new RegExp(`<h1[^>]+id="${headingId}"`));
    assert.equal((html.match(/<h1\b/gi) || []).length, 1);
    assert.match(html, /id="melsou-static-route-ssr"/);
    assert.match(html, /DOMContentLoaded[^<]+melsou-static-route-ssr/);
    assert.doesNotMatch(html, /<link rel="canonical" href="https:\/\/melsou\.com\/">/);
    assert.doesNotMatch(html, /<title>Melsou \| Gói tâm tình trong dáng hình thanh âm<\/title>/);
    const before = readMetadata(html);
    assert.deepEqual(hydrateMetadata(html, pathname), before);
    for (const pattern of [/<meta name="description"/g, /<link rel="canonical"/g, /<meta property="og:title"/g, /<meta property="og:description"/g, /<meta name="twitter:title"/g, /<meta name="twitter:description"/g]) {
      assert.equal((html.match(pattern) || []).length, 1);
    }
  });
}

test('homepage metadata remains byte-for-byte stable after client hydration', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response('[]', { headers: { 'Content-Type': 'application/json', 'X-WP-TotalPages': '1' } });
  try {
    const response = await worker.fetch(new Request('https://melsou.test/'), env, {});
    const html = await response.text();
    assert.deepEqual(hydrateMetadata(html, '/'), readMetadata(html));
  } finally { globalThis.fetch = originalFetch; }
});

test('browser and Googlebot receive identical static-route SEO signals', async () => {
  for (const [pathname] of routes) {
    const browser = await worker.fetch(new Request(`https://melsou.test${pathname}`, { headers: { 'User-Agent': 'Mozilla/5.0' } }), env, {});
    const googlebot = await worker.fetch(new Request(`https://melsou.test${pathname}`, { headers: { 'User-Agent': 'Googlebot' } }), env, {});
    assert.equal(await browser.text(), await googlebot.text());
  }
});

test('production routing sends every sitemap static URL through Worker SSR without changing other rewrites', async () => {
  const vercel = JSON.parse(await readFile(new URL('../demo/recovery_fb38/vercel.json', import.meta.url), 'utf8'));
  assert.deepEqual(vercel.routes, [
    { src: '^/$', dest: 'https://melsou.nguyenthienbach18042007.workers.dev/' },
    { src: '^/(ve-melsou|goi-san-pham|templates|chinh-sach-bao-mat|chinh-sach-bao-hanh)$', dest: 'https://melsou.nguyenthienbach18042007.workers.dev/$1' }
  ]);
  assert.equal(vercel.rewrites.some(({ source }) => routes.some(([path]) => source === path)), false);
  assert.ok(vercel.rewrites.some(({ source }) => source === '/api/:path*'));
  assert.ok(vercel.rewrites.some(({ source }) => source === '/blog/:slug'));
  assert.deepEqual(vercel.rewrites.at(-1), {
    source: '/:path*', destination: 'https://melsou.nguyenthienbach18042007.workers.dev/:path*'
  });
});

test('Vercel filesystem wins for real assets while unknown navigation falls through to Worker 404/noindex', async () => {
  const publicRoot = fileURLToPath(new URL('../demo/recovery_fb38/', import.meta.url));
  const vercel = JSON.parse(await readFile(new URL('../demo/recovery_fb38/vercel.json', import.meta.url), 'utf8'));
  assert.deepEqual(vercel.rewrites.at(-1), {
    source: '/:path*', destination: 'https://melsou.nguyenthienbach18042007.workers.dev/:path*'
  });

  const route = async (pathname) => {
    const assetUrl = new URL(`../demo/recovery_fb38${pathname}`, import.meta.url);
    try {
      await access(fileURLToPath(assetUrl));
      return new Response(await readFile(assetUrl), { status: 200, headers: { 'X-Test-Route': 'filesystem' } });
    } catch {
      return worker.fetch(new Request(`https://melsou.test${pathname}`), env, {});
    }
  };

  assert.ok(publicRoot.endsWith('recovery_fb38\\') || publicRoot.endsWith('recovery_fb38/'));
  for (const pathname of ['/app.js', '/styles.css', '/seo-routes.js', '/favicon.png']) {
    const response = await route(pathname);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('X-Test-Route'), 'filesystem');
    assert.equal(response.headers.has('X-Robots-Tag'), false);
  }
  for (const pathname of ['/duong-dan-khong-ton-tai', '/abc/xyz-khong-ton-tai']) {
    const response = await route(pathname);
    assert.equal(response.status, 404);
    assert.equal(response.headers.get('X-Robots-Tag'), 'noindex');
    assert.doesNotMatch(await response.text(), /Gói tâm tình/);
  }
});

test('static SSR retains crawlable navigation and excludes private routes from the dynamic sitemap contract', async () => {
  const response = await worker.fetch(new Request('https://melsou.test/ve-melsou'), env, {});
  const html = await response.text();
  for (const [pathname] of routes) assert.match(html, new RegExp(`href="${pathname.replaceAll('-', '\\-')}"`));
  assert.doesNotMatch(html, /href="javascript:void\(0\)"[^>]*id="(?:navLinkAbout|navLinkPricing|navLinkTemplates)"/);
  const source = await readFile(new URL('./index.mjs', import.meta.url), 'utf8');
  assert.match(source, /const staticUrls = \['\/', '\/ve-melsou', '\/goi-san-pham', '\/templates', '\/chinh-sach-bao-mat', '\/chinh-sach-bao-hanh'\]/);
  assert.doesNotMatch(source.match(/const staticUrls = \[[^\]]+\]/)?.[0] || '', /account|checkout|owner|studio/);
});

test('unknown public Blog URL remains a 404/noindex response', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (request) => String(request).includes('public-api.wordpress.com')
    ? new Response('[]', { headers: { 'Content-Type': 'application/json' } })
    : originalFetch(request);
  try {
    const response = await worker.fetch(new Request('https://melsou.test/blog/khong-ton-tai'), env, {});
    assert.equal(response.status, 404);
    assert.equal(response.headers.get('X-Robots-Tag'), 'noindex');
  } finally { globalThis.fetch = originalFetch; }
});

test('unknown public static URL is not a soft-404', async () => {
  const response = await worker.fetch(new Request('https://melsou.test/duong-dan-khong-ton-tai'), env, {});
  assert.equal(response.status, 404);
  assert.equal(response.headers.get('X-Robots-Tag'), 'noindex');
  assert.doesNotMatch(await response.text(), /Gói tâm tình/);
});
