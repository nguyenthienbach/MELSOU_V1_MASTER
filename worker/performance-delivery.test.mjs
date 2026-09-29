import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import worker from './index.mjs';

const shell = await readFile(new URL('../demo/recovery_fb38/index.html', import.meta.url), 'utf8');

function installMemoryCache() {
  const entries = new Map();
  let matches = 0;
  let puts = 0;
  const memoryCache = {
    async match(request) {
      matches += 1;
      const response = entries.get(request.url);
      return response?.clone();
    },
    async put(request, response) {
      puts += 1;
      entries.set(request.url, response.clone());
    }
  };
  const previous = globalThis.caches;
  globalThis.caches = { default: memoryCache };
  return {
    stats: () => ({ matches, puts, entries: entries.size }),
    restore: () => {
      if (previous === undefined) delete globalThis.caches;
      else globalThis.caches = previous;
    }
  };
}

test('queryless public homepage uses bounded Cloudflare edge cache without re-running SSR', async () => {
  const cache = installMemoryCache();
  const originalFetch = globalThis.fetch;
  let assetReads = 0;
  let wordpressReads = 0;
  globalThis.fetch = async () => {
    wordpressReads += 1;
    return new Response('[]', { headers: { 'Content-Type': 'application/json' } });
  };
  const env = {
    ASSETS: {
      fetch: async () => {
        assetReads += 1;
        return new Response(shell, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
      }
    }
  };
  const writes = [];
  const ctx = { waitUntil: (promise) => writes.push(promise) };
  try {
    const first = await worker.fetch(new Request('https://melsou.test/'), env, ctx);
    assert.equal(first.status, 200);
    assert.equal(first.headers.get('X-Melsou-Edge-Cache'), 'MISS');
    assert.match(first.headers.get('Cache-Control'), /^public,/);
    await Promise.all(writes);

    const second = await worker.fetch(new Request('https://melsou.test/'), env, ctx);
    assert.equal(second.status, 200);
    assert.equal(second.headers.get('X-Melsou-Edge-Cache'), 'HIT');
    assert.equal(assetReads, 1);
    assert.equal(wordpressReads, 1);
    assert.deepEqual(cache.stats(), { matches: 2, puts: 1, entries: 1 });
  } finally {
    globalThis.fetch = originalFetch;
    cache.restore();
  }
});

test('application shell query and authenticated APIs bypass public edge cache', async () => {
  const cache = installMemoryCache();
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response('[]', { headers: { 'Content-Type': 'application/json' } });
  const env = { ASSETS: { fetch: async () => new Response(shell, { headers: { 'Content-Type': 'text/html; charset=utf-8' } }) } };
  try {
    const appShell = await worker.fetch(new Request('https://melsou.test/?melsou_app=1'), env, {});
    assert.equal(appShell.status, 200);
    assert.equal(appShell.headers.get('Cache-Control'), 'private, no-store');
    assert.equal(appShell.headers.get('X-Melsou-Edge-Cache'), null);

    const account = await worker.fetch(new Request('https://melsou.test/api/account'), env, {});
    assert.equal(account.status, 401);
    assert.equal(account.headers.get('Cache-Control'), 'no-store');
    assert.equal(account.headers.get('X-Melsou-Edge-Cache'), null);
    assert.deepEqual(cache.stats(), { matches: 0, puts: 0, entries: 0 });
  } finally {
    globalThis.fetch = originalFetch;
    cache.restore();
  }
});

test('Vercel cache policy is bounded for unhashed assets and never targets API routes', async () => {
  const config = JSON.parse(await readFile(new URL('../demo/recovery_fb38/vercel.json', import.meta.url), 'utf8'));
  assert.ok(Array.isArray(config.headers));
  const serialized = JSON.stringify(config.headers);
  assert.match(serialized, /app\|studio\|auth-client\|seo-routes/);
  assert.match(serialized, /styles/);
  assert.match(serialized, /favicon\|favicon-48/);
  assert.match(serialized, /max-age=3600/);
  assert.doesNotMatch(serialized, /immutable|max-age=31536000/);
  assert.doesNotMatch(serialized, /api|account|project|checkout|order|owner/i);
});

test('Studio preload intent is scoped to Studio actions instead of every page interaction', async () => {
  const app = await readFile(new URL('../demo/recovery_fb38/app.js', import.meta.url), 'utf8');
  assert.match(app, /studioIntentSelector/);
  assert.match(app, /openTemplateOnboardingModal/);
  assert.match(app, /selectPackage/);
  assert.doesNotMatch(app, /window\.addEventListener\((['"])(?:pointerdown|touchstart|keydown)\1,\s*onIntent/);
});
