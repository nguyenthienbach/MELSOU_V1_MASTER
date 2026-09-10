import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';

const bridgeSource = await readFile(new URL('../demo/recovery_fb38/auth-client.js', import.meta.url), 'utf8');
const pixel = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAEElEQVR42mP8z8BQDwAFgwJ/lQb5WQAAAABJRU5ErkJggg==';

const waitFor = async (predicate) => {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
  assert.fail('timed out waiting for FB90 persistence');
};

function browserHarness({ storage = new Map(), projectOnGet = null } = {}) {
  const calls = [];
  let appliedDraft = null;
  let revision = 1;
  const projectId = '11111111-1111-4111-8111-111111111111';
  const assetId = '22222222-2222-4222-8222-222222222222';
  const draft = { package: 'signature', sizeClass: 'ratio-portrait', title: 'Test', userGallery: [], spreads: [
    { coverImg: pixel, elements: [] }, ...Array.from({ length: 5 }, () => ({ elements: [] })), { backImg: '', elements: [] }
  ] };
  const localStorage = { getItem: (key) => storage.get(key) || null, setItem: (key, value) => storage.set(key, value), removeItem: (key) => storage.delete(key) };
  const fetch = async (url, options = {}) => {
    calls.push({ url: String(url), method: options.method || 'GET', body: options.body });
    if (url === '/api/guest/projects' && options.method === 'POST') return Response.json({ project: { id: projectId, revision } }, { status: 201 });
    if (url === `/api/guest/projects/${projectId}/assets`) return Response.json({ asset: { id: assetId } }, { status: 201 });
    if (url === `/api/guest/projects/${projectId}` && options.method === 'PUT') {
      revision += 1;
      return Response.json({ project: { id: projectId, revision } });
    }
    if (url === '/api/guest/projects') return Response.json({ projects: projectOnGet ? [projectOnGet] : [] });
    if (url === `/api/guest/assets/${assetId}/preview`) return new Response(Buffer.from(pixel.split(',')[1], 'base64'), { headers: { 'Content-Type': 'image/png' } });
    if (url === '/api/account') return Response.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
    if (url === '/api/public-config') return Response.json({});
    throw new Error(`unexpected request ${options.method || 'GET'} ${url}`);
  };
  const window = {
    location: { origin: 'https://melsou.test', pathname: '/' }, localStorage, melsouGetActiveDraft: () => draft,
    melsouApplyCanonicalDraft: (value) => { appliedDraft = value; },
    MelsouAuth: { setLoginState() {} }, addEventListener() {}, supabase: null
  };
  const context = vm.createContext({ window, localStorage, fetch, Response, Blob, File, URL, Uint8Array, ArrayBuffer, TextEncoder, atob, crypto: webcrypto, structuredClone, setTimeout, clearTimeout, console: { info() {}, warn() {}, error() {} } });
  vm.runInContext(bridgeSource, context);
  return { window, storage, calls, projectId, assetId, appliedDraft: () => appliedDraft };
}

test('FB90 slot assignment persists one private asset and canonical image_01 binding idempotently', async () => {
  const harness = browserHarness();
  harness.window.melsouOnImageAssigned({ slotKey: 'coverImg', source: pixel });
  await waitFor(() => harness.calls.some((call) => call.method === 'PUT'));
  const firstSave = harness.calls.find((call) => call.method === 'PUT');
  const document = JSON.parse(firstSave.body).document;
  assert.equal(document.content_bindings.image_01.asset_id, harness.assetId);
  assert.equal(document.editor_asset_slots.coverImg, 'image_01');
  assert.equal(document.editor_payload.spreads[0].coverImg, undefined);
  assert.equal(harness.calls.filter((call) => call.url.endsWith('/assets')).length, 1);

  harness.window.melsouOnImageAssigned({ slotKey: 'coverImg', source: pixel });
  await waitFor(() => harness.calls.filter((call) => call.method === 'PUT').length >= 2);
  assert.equal(harness.calls.filter((call) => call.url.endsWith('/assets')).length, 1);
});

test('FB90 reload restores canonical slot binding and hydrates the private preview without re-upload', async () => {
  const first = browserHarness();
  first.window.melsouOnImageAssigned({ slotKey: 'coverImg', source: pixel });
  await waitFor(() => first.calls.some((call) => call.method === 'PUT'));
  const document = JSON.parse(first.calls.find((call) => call.method === 'PUT').body).document;
  const bridge = JSON.parse(first.storage.get('melsou_auth_draft_bridge_v1'));
  const second = browserHarness({ storage: first.storage, projectOnGet: { id: first.projectId, revision: bridge.revision, document } });
  await waitFor(() => second.appliedDraft());
  const restoredBridge = JSON.parse(second.storage.get('melsou_auth_draft_bridge_v1'));
  assert.equal(restoredBridge.slotAssets.image_01.assetId, first.assetId);
  assert.match(second.appliedDraft().spreads[0].coverImg, /^blob:/);
  assert.equal(second.calls.filter((call) => call.url.endsWith('/assets')).length, 0);
});

test('FB90 integration hooks cover template selection and every photo assignment path', async () => {
  const appSource = await readFile(new URL('../demo/recovery_fb38/app.js', import.meta.url), 'utf8');
  assert.match(appSource, /melsouOnImageAssigned\?\.\(\{ slotKey: 'coverImg', source: coverImg \}\)/);
  assert.match(appSource, /melsouOnImageAssigned\?\.\(\{ slotKey, source: url \}\)/);
  assert.match(bridgeSource, /editor_asset_slots/);
  assert.match(bridgeSource, /URL\.createObjectURL\(await response\.blob\(\)\)/);
});
