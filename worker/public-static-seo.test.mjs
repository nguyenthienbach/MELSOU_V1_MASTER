import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import worker from './index.mjs';

const shell = await readFile(new URL('../demo/recovery_fb38/index.html', import.meta.url), 'utf8');
const routes = [
  ['/ve-melsou', 'Về Melsou | Gói tâm tình trong dáng hình thanh âm', 'aboutPageHeading'],
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
    assert.equal((html.match(/<main\b/gi) || []).length, 1);
    assert.match(html, /id="melsou-public-route-main"/);
    assert.doesNotMatch(html, /id="page-studio"|id="page-tracking"/);
    assert.doesNotMatch(html, /DOMContentLoaded[^<]+melsou-static-route-ssr/);
    assert.doesNotMatch(html, /<link rel="canonical" href="https:\/\/melsou\.com\/">/);
    assert.doesNotMatch(html, /<title>Melsou \| Gói tâm tình trong dáng hình thanh âm<\/title>/);
    const before = readMetadata(html);
    assert.deepEqual(hydrateMetadata(html, pathname), before);
    for (const pattern of [/<meta name="description"/g, /<link rel="canonical"/g, /<meta property="og:title"/g, /<meta property="og:description"/g, /<meta name="twitter:title"/g, /<meta name="twitter:description"/g]) {
      assert.equal((html.match(pattern) || []).length, 1);
    }
  });
}

test('all six indexable documents contain only their own route content and schema contract', async () => {
  const signatures = new Map([
    ['/', ['heroHeadlineText', 'Chuyện của Melsou', ['tplLibraryHeading', 'privacyPageHeading', 'warrantyPageHeading'], ['Organization', 'WebSite']]],
    ['/ve-melsou', ['aboutPageHeading', 'Melsou là dự án thương hiệu album ảnh cá nhân hóa', ['heroHeadlineText', 'pricingTitle', 'tplLibraryHeading', 'privacyPageHeading', 'warrantyPageHeading'], 'AboutPage']],
    ['/goi-san-pham', ['pricingTitle', 'Signature Combo', ['heroHeadlineText', 'tplLibraryHeading', 'privacyPageHeading', 'warrantyPageHeading'], 'CollectionPage']],
    ['/templates', ['tplLibraryHeading', 'Tình đầu trong veo', ['heroHeadlineText', 'pricingTitle', 'privacyPageHeading', 'warrantyPageHeading'], 'CollectionPage']],
    ['/chinh-sach-bao-mat', ['privacyPageHeading', 'Thông tin Melsou có thể thu thập', ['heroHeadlineText', 'pricingTitle', 'tplLibraryHeading', 'warrantyPageHeading'], 'WebPage']],
    ['/chinh-sach-bao-hanh', ['warrantyPageHeading', 'Các trường hợp được hỗ trợ', ['heroHeadlineText', 'pricingTitle', 'tplLibraryHeading', 'privacyPageHeading'], 'WebPage']]
  ]);
  for (const [pathname, [ownId, ownText, foreignIds, schemaType]] of signatures) {
    const response = await worker.fetch(new Request(`https://melsou.test${pathname}`), env, {});
    const html = await response.text();
    assert.equal(response.status, 200);
    assert.match(html, new RegExp(`id="${ownId}"`));
    assert.match(html, new RegExp(ownText));
    for (const foreignId of foreignIds) assert.doesNotMatch(html, new RegExp(`id="${foreignId}"`));
    assert.equal((html.match(/<main\b/gi) || []).length, 1);
    assert.equal((html.match(/<h1\b/gi) || []).length, 1);
    assert.match(html, /<meta name="robots" content="index,follow">/);
    assert.match(html, new RegExp(`<link rel="canonical" href="https://melsou\\.com${pathname === '/' ? '/' : pathname}">`));
    assert.doesNotMatch(html, /id="page-(?:studio|tracking)"|id="checkoutModal"|id="ownerDashboardModal"|id="authModal"|OWNER Dashboard|Thông tin giao hàng/);
    assert.doesNotMatch(html, /class="modal-backdrop/);
    assert.doesNotMatch(html, /<script\s+src="\/(?:app|auth-client|seo-routes)\.js"/i);
    const schemas = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((match) => JSON.parse(match[1]));
    assert.equal(schemas.length, 1);
    if (Array.isArray(schemaType)) {
      assert.deepEqual(schemas[0]['@graph'].map((entry) => entry['@type']), schemaType);
    } else {
      assert.equal(schemas[0]['@type'], schemaType);
      assert.equal(schemas[0]['@id'], `https://melsou.com${pathname}#webpage`);
      assert.equal(schemas[0].url, `https://melsou.com${pathname}`);
      assert.equal(schemas[0].isPartOf['@id'], 'https://melsou.com/#website');
      assert.equal(schemas[0].about['@id'], 'https://melsou.com/#organization');
      assert.equal(schemas[0].name, readMetadata(html).title);
      assert.equal(schemas[0].description, readMetadata(html).description);
    }
  }
});

test('/ve-melsou is a distinct AboutPage rather than a homepage hero subset', async () => {
  const [homeResponse, aboutResponse] = await Promise.all([
    worker.fetch(new Request('https://melsou.test/'), env, {}),
    worker.fetch(new Request('https://melsou.test/ve-melsou'), env, {})
  ]);
  const home = await homeResponse.text();
  const about = await aboutResponse.text();
  const aboutMain = about.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] || '';
  const homeMain = home.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] || '';
  for (const duplicate of [
    'Album ảnh liền trang 180° kết hợp thanh âm',
    'Gói tâm tình trong dáng hình thanh âm',
    'Chiếc máy ảnh có thể giữ lại hình dáng khoảnh khắc',
    'Melsou hòa quyện giai điệu',
    'Bảo mật vật lý off-grid',
    'Mở phẳng 180° liền trang',
    'Mã QR nhạc Spotify'
  ]) assert.doesNotMatch(aboutMain, new RegExp(duplicate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  for (const identity of [
    'Về Melsou', 'Tên gọi Melsou', 'Mel” gợi từ <em>melody</em>', 'Sou” gợi từ <em>souvenir</em>',
    'Melsou tạo ra điều gì?', 'Định hướng lưu giữ mang tính cá nhân', 'Phân biệt thực thể',
    'không liên quan đến MEL South Africa'
  ]) assert.match(aboutMain, new RegExp(identity.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.ok(aboutMain.length > 0 && !homeMain.includes(aboutMain));
  const words = aboutMain.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  assert.ok(words.length >= 350 && words.length <= 600, `AboutPage word count is ${words.length}`);
});

test('policy headings omit decorative emoji from their only H1', async () => {
  for (const pathname of ['/chinh-sach-bao-mat', '/chinh-sach-bao-hanh']) {
    const response = await worker.fetch(new Request(`https://melsou.test${pathname}`), env, {});
    const html = await response.text();
    const heading = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || '';
    assert.doesNotMatch(heading, /📜|🛡️/u);
  }
});

test('whole indexable documents remain distinct after excluding shared chrome', async () => {
  const paths = ['/', ...routes.map(([pathname]) => pathname)];
  const tokenSets = new Map();
  const tokens = (value) => new Set(
    (value.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] || '')
      .replace(/<(?:script|style)\b[\s\S]*?<\/(?:script|style)>/gi, ' ')
      .replace(/<[^>]+>/g, ' ').replace(/&(?:#\d+|[a-z]+);/gi, ' ').toLocaleLowerCase('vi')
      .match(/[a-zà-ỹ0-9]{3,}/giu) || []
  );
  for (const pathname of paths) {
    const response = await worker.fetch(new Request(`https://melsou.test${pathname}`), env, {});
    const html = await response.text();
    tokenSets.set(pathname, tokens(html));
  }
  for (let left = 0; left < paths.length; left += 1) {
    for (let right = left + 1; right < paths.length; right += 1) {
      const a = tokenSets.get(paths[left]);
      const b = tokenSets.get(paths[right]);
      const intersection = [...a].filter((token) => b.has(token)).length;
      const union = new Set([...a, ...b]).size;
      const similarity = intersection / union;
      const target = paths[left] === '/' && paths[right] === '/ve-melsou' ? 0.3 : 0.5;
      assert.ok(similarity <= target, `${paths[left]} and ${paths[right]} indexable content similarity is ${similarity.toFixed(4)}`);
    }
  }
});

test('public navigation bridges application actions to a noindex full shell only after interaction', async () => {
  for (const pathname of ['/', ...routes.map(([path]) => path)]) {
    const response = await worker.fetch(new Request(`https://melsou.test${pathname}`), env, {});
    const html = await response.text();
    for (const [target] of routes) assert.match(html, new RegExp(`href="${target}"`));
    assert.doesNotMatch(html, /<script\s+src="\/(?:app|auth-client)\.js"/i);
    assert.doesNotMatch(html, /id="page-(?:studio|tracking)"/i);
    assert.doesNotMatch(html, /onclick="(?:openSettingsModal|toggleUserDropdown|toggleCart|openTemplateOnboardingModal|openFlipbookModal|selectPackage)/);
    assert.match(html, /data-melsou-action="(?:settings|account|cart|start)"/);
    if (pathname === '/') {
      assert.match(html, /data-melsou-resume-keyboard="value-1"/);
      assert.match(html, /document\.addEventListener\("keydown"/);
    }
  }
  const appResponse = await worker.fetch(new Request('https://melsou.test/?melsou_app=1&melsou_action=account'), env, {});
  const appShell = await appResponse.text();
  assert.equal(appResponse.headers.get('X-Robots-Tag'), 'noindex');
  assert.match(appShell, /<meta name="robots" content="noindex,follow">/);
  assert.match(appShell, /id="page-studio"/);
  assert.match(appShell, /id="melsou-static-action-resume"/);
  const source = appShell.match(/<script id="melsou-static-action-resume">([\s\S]*?)<\/script>/)?.[1] || '';
  let opened = 0;
  vm.runInNewContext(source, {
    URLSearchParams, location: { search: '?melsou_app=1&melsou_action=account', pathname: '/', hash: '' },
    history: { replaceState() {} }, document: { getElementById: () => null },
    addEventListener: (_event, callback) => callback(), openAuthModal: () => { opened += 1; },
    openSettingsModal() {}, toggleCart() {}, openTemplateOnboardingModal() {}, openFlipbookModal() {},
    showPage() {}, openOwnerDashboardModal() {}, handleOpenWriteReview() {}, selectPackage() {},
    switchLanguage() {}, openValueStoryModal() {}
  });
  assert.equal(opened, 1);
});

test('homepage metadata remains byte-for-byte stable after client hydration', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response('[]', { headers: { 'Content-Type': 'application/json', 'X-WP-TotalPages': '1' } });
  try {
    const response = await worker.fetch(new Request('https://melsou.test/'), env, {});
    const html = await response.text();
    assert.deepEqual(hydrateMetadata(html, '/'), readMetadata(html));
  } finally { globalThis.fetch = originalFetch; }
});

test('browser and Googlebot receive identical public-route HTML', async () => {
  for (const pathname of ['/', ...routes.map(([path]) => path)]) {
    const browser = await worker.fetch(new Request(`https://melsou.test${pathname}`, { headers: { 'User-Agent': 'Mozilla/5.0' } }), env, {});
    const googlebot = await worker.fetch(new Request(`https://melsou.test${pathname}`, { headers: { 'User-Agent': 'Googlebot' } }), env, {});
    assert.equal(await browser.text(), await googlebot.text());
  }
});

test('production routing orders canonical Worker routes before callback, filesystem and unknown fallback', async () => {
  const vercel = JSON.parse(await readFile(new URL('../demo/recovery_fb38/vercel.json', import.meta.url), 'utf8'));
  assert.deepEqual(vercel.routes, [
    { src: '^/$', dest: 'https://melsou.nguyenthienbach18042007.workers.dev/' },
    { src: '^/(ve-melsou|goi-san-pham|templates|chinh-sach-bao-mat|chinh-sach-bao-hanh)$', dest: 'https://melsou.nguyenthienbach18042007.workers.dev/$1' },
    { src: '^/blog/([^/]+)$', dest: 'https://melsou.nguyenthienbach18042007.workers.dev/blog/$1' },
    { src: '^/sitemap\\.xml$', dest: 'https://melsou.nguyenthienbach18042007.workers.dev/api/sitemap.xml' },
    { src: '^/api/(.*)$', dest: 'https://melsou.nguyenthienbach18042007.workers.dev/api/$1' },
    { src: '^/wordpress-oauth-callback$', dest: '/index.html' },
    { handle: 'filesystem' },
    { src: '^/(.*)$', dest: 'https://melsou.nguyenthienbach18042007.workers.dev/$1' }
  ]);
  assert.equal('rewrites' in vercel, false);
});

test('Vercel route order serves real assets before sending unknown navigation to Worker 404/noindex', async () => {
  const publicRoot = fileURLToPath(new URL('../demo/recovery_fb38/', import.meta.url));
  const vercel = JSON.parse(await readFile(new URL('../demo/recovery_fb38/vercel.json', import.meta.url), 'utf8'));

  const route = async (pathname) => {
    for (const rule of vercel.routes) {
      if (rule.handle === 'filesystem') {
        const assetUrl = new URL(`../demo/recovery_fb38${pathname}`, import.meta.url);
        try {
          await access(fileURLToPath(assetUrl));
          return new Response(await readFile(assetUrl), { status: 200, headers: { 'X-Test-Route': 'filesystem' } });
        } catch {}
        continue;
      }
      const match = pathname.match(new RegExp(rule.src));
      if (!match) continue;
      if (rule.dest === '/index.html') {
        return new Response(await readFile(new URL('../demo/recovery_fb38/index.html', import.meta.url)), {
          status: 200, headers: { 'X-Test-Route': 'spa-callback' }
        });
      }
      const destination = rule.dest.replace(/\$(\d+)/g, (_, index) => match[Number(index)] || '');
      const target = new URL(destination);
      return worker.fetch(new Request(`https://melsou.test${target.pathname}${target.search}`), env, {});
    }
    throw new Error(`No route matched ${pathname}`);
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
  const callback = await route('/wordpress-oauth-callback');
  assert.equal(callback.status, 200);
  assert.equal(callback.headers.get('X-Test-Route'), 'spa-callback');
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
  const wrangler = JSON.parse(await readFile(new URL('../wrangler.jsonc', import.meta.url), 'utf8'));
  assert.equal(wrangler.assets.not_found_handling, 'none');
  const response = await worker.fetch(new Request('https://melsou.test/duong-dan-khong-ton-tai'), env, {});
  assert.equal(response.status, 404);
  assert.equal(response.headers.get('X-Robots-Tag'), 'noindex');
  assert.doesNotMatch(await response.text(), /Gói tâm tình/);
});
