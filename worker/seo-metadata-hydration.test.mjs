import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import worker from './index.mjs';

const shell = await readFile(new URL('../demo/recovery_fb38/index.html', import.meta.url), 'utf8');
const clientSource = await readFile(new URL('../demo/recovery_fb38/seo-routes.js', import.meta.url), 'utf8');
const env = { ASSETS: { fetch: async () => new Response(shell, { headers: { 'Content-Type': 'text/html' } }) } };
const rawPost = (slug, title, description) => ({
  id: slug === 'bai-mot' ? 1 : 2, slug, status: 'publish', date_gmt: '2026-09-20T01:02:03', modified_gmt: '2026-09-21T02:03:04',
  title: { rendered: title }, excerpt: { rendered: `<p>${description}</p>` }, content: { rendered: `<p>Nội dung ${title}</p>` },
  _embedded: { author: [{ name: 'Tác giả thật' }], 'wp:term': [[]] }
});
const normalizedPost = (slug, title, description) => ({ slug, title, description, excerpt: `<p>${description}</p>`, content: `<p>Nội dung ${title}</p>`, category: null, publishedAt: '2026-09-20T01:02:03Z' });

const metadataState = (html) => ({
  title: html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || '',
  description: html.match(/<meta name="description" content="([^"]*)">/i)?.[1] || '',
  canonical: html.match(/<link rel="canonical" href="([^"]*)">/i)?.[1] || '',
  ogTitle: html.match(/<meta property="og:title" content="([^"]*)">/i)?.[1] || '',
  ogDescription: html.match(/<meta property="og:description" content="([^"]*)">/i)?.[1] || '',
  twitterTitle: html.match(/<meta name="twitter:title" content="([^"]*)">/i)?.[1] || '',
  twitterDescription: html.match(/<meta name="twitter:description" content="([^"]*)">/i)?.[1] || '',
  jsonLd: html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i)?.[1] || ''
});

const runBlogHydration = (html, pathname, getPost) => {
  const initial = metadataState(html);
  const elements = {
    'meta[name="description"]': { content: initial.description },
    'meta[property="og:title"]': { content: initial.ogTitle },
    'meta[property="og:description"]': { content: initial.ogDescription },
    'meta[property="og:url"]': { content: initial.canonical },
    'meta[name="twitter:title"]': { content: initial.twitterTitle },
    'meta[name="twitter:description"]': { content: initial.twitterDescription },
    'link[rel="canonical"]': { href: initial.canonical }
  };
  const body = { textContent: '', innerHTML: '' };
  const modal = { classList: { add() {} }, setAttribute() {}, style: {} };
  const nodes = { blogArticleReaderModal: modal, readerBody: body };
  const document = {
    title: initial.title, readyState: 'complete', body: { style: {} },
    querySelector: (selector) => elements[selector] || null,
    querySelectorAll: () => [], getElementById: (id) => nodes[id] || null,
    createElement: () => ({ setAttribute() {}, attributes: [], innerHTML: '' })
  };
  const window = {
    location: { pathname }, addEventListener() {}, codexGetPublishedPost: getPost,
    sanitizeWordPressHtml: (value) => value
  };
  class DOMParser { parseFromString(value) { return { body: { textContent: String(value).replace(/<[^>]*>/g, '') } }; } }
  vm.runInNewContext(clientSource, { document, window, DOMParser, console, fetch: () => Promise.reject(new Error('unexpected fetch')), encodeURIComponent });
  const settled = new Promise((resolve) => setImmediate(() => setImmediate(resolve)));
  return { document, window, elements, initial, settled };
};

test('Blog hydration preserves SSR-selected metadata and schema without duplicates', async () => {
  const originalFetch = globalThis.fetch;
  const raw = rawPost('bai-mot', 'Bài một', 'Mô tả riêng bài một.');
  globalThis.fetch = async () => new Response(JSON.stringify([raw]), { headers: { 'Content-Type': 'application/json' } });
  try {
    const response = await worker.fetch(new Request('https://melsou.test/blog/bai-mot'), env, {});
    const html = await response.text();
    const state = runBlogHydration(html, '/blog/bai-mot', async () => ({ post: normalizedPost('bai-mot', 'Bài một', 'Mô tả riêng bài một.') }));
    await state.settled;
    assert.equal(state.document.title, 'Bài một | Melsou');
    assert.equal(state.elements['meta[name="description"]'].content, state.initial.description);
    assert.equal(state.elements['meta[property="og:title"]'].content, state.initial.ogTitle);
    assert.equal(state.elements['meta[property="og:description"]'].content, state.initial.ogDescription);
    assert.equal(state.elements['meta[name="twitter:title"]'].content, state.initial.twitterTitle);
    assert.equal(state.elements['meta[name="twitter:description"]'].content, state.initial.twitterDescription);
    assert.equal(state.elements['link[rel="canonical"]'].href, 'https://melsou.com/blog/bai-mot');
    assert.equal((html.match(/<meta name="description"/g) || []).length, 1);
    assert.equal((html.match(/<link rel="canonical"/g) || []).length, 1);
    assert.equal((html.match(/<script type="application\/ld\+json">/g) || []).length, 1);
    const graph = JSON.parse(state.initial.jsonLd)['@graph'];
    assert.equal(graph.find((entry) => entry['@type'] === 'Article').description, 'Mô tả riêng bài một.');
    assert.equal(graph.find((entry) => entry['@type'] === 'Article').mainEntityOfPage['@id'], 'https://melsou.com/blog/bai-mot');
  } finally { globalThis.fetch = originalFetch; }
});

test('stale Blog response cannot overwrite a newly selected route', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify([rawPost('bai-mot', 'Bài một', 'Mô tả riêng bài một.')]), { headers: { 'Content-Type': 'application/json' } });
  try {
    const html = await (await worker.fetch(new Request('https://melsou.test/blog/bai-mot'), env, {})).text();
    let release;
    const pending = new Promise((resolve) => { release = resolve; });
    const state = runBlogHydration(html, '/blog/bai-mot', () => pending);
    state.window.location.pathname = '/blog/bai-hai';
    const before = state.document.title;
    release?.({ post: normalizedPost('bai-mot', 'Bài một', 'Mô tả riêng bài một.') });
    await state.settled;
    assert.equal(state.document.title, before);

    globalThis.fetch = async () => new Response(JSON.stringify([rawPost('bai-hai', 'Bài hai', 'Mô tả riêng bài hai.')]), { headers: { 'Content-Type': 'application/json' } });
    const secondHtml = await (await worker.fetch(new Request('https://melsou.test/blog/bai-hai'), env, {})).text();
    const second = runBlogHydration(secondHtml, '/blog/bai-hai', async () => ({ post: normalizedPost('bai-hai', 'Bài hai', 'Mô tả riêng bài hai.') }));
    await second.settled;
    assert.equal(second.document.title, 'Bài hai | Melsou');
    assert.equal(second.elements['meta[name="description"]'].content, 'Mô tả riêng bài hai.');
    assert.equal(second.elements['link[rel="canonical"]'].href, 'https://melsou.com/blog/bai-hai');
  } finally { globalThis.fetch = originalFetch; }
});
