import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';
import worker from './index.mjs';

const source = await readFile(new URL('../demo/recovery_fb38/auth-client.js', import.meta.url), 'utf8');
const projectId = '11111111-1111-4111-8111-111111111111';
const imageSources = Array.from({ length: 8 }, (_unused, index) => `data:image/png;base64,${Buffer.from(`canonical-image-${index}`).toString('base64')}`);
const assetId = (index) => `22222222-2222-4222-8222-${String(index + 1).padStart(12, '0')}`;

async function waitFor(predicate, message) {
  for (let attempt = 0; attempt < 160; attempt += 1) {
    if (predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  assert.fail(message);
}

function runBrowser({ authenticated = false, canonicalProject = null, storage = new Map() } = {}) {
  const calls = [];
  const uploaded = new Map();
  let revision = 1;
  let savedDocument = null;
  let appliedDraft = null;
  const draft = {
    package: 'signature', sizeClass: 'ratio-portrait', title: 'Canonical eight', userGallery: [...imageSources],
    spreads: [{ coverImg: '', elements: [] }, { elements: [{ id: 'el-one', type: 'photo', img: '' }, { id: 'el-two', type: 'photo', img: '' }] }, ...Array.from({ length: 4 }, () => ({ elements: [] })), { backImg: '', elements: [] }]
  };
  const localStorage = { getItem: (key) => storage.get(key) || null, setItem: (key, value) => storage.set(key, value), removeItem: (key) => storage.delete(key) };
  const fetch = async (input, options = {}) => {
    const url = String(input);
    calls.push({ url, method: options.method || 'GET', body: options.body, headers: options.headers || {} });
    if (url === '/api/account') return authenticated
      ? Response.json({ auth: { provider: 'NATIVE', username: 'owner', email: null }, profile: { user_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' } })
      : Response.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
    if (url === '/api/public-config') return Response.json({});
    if (url === '/api/projects') return Response.json({ projects: canonicalProject ? [{ project_id: projectId, revision: canonicalProject.revision, active: true }] : [] });
    if (url === `/api/projects/${projectId}`) return Response.json({ project: canonicalProject, assets: [] });
    if (url === '/api/guest/projects' && options.method === 'POST') return Response.json({ project: { id: projectId, revision } }, { status: 201 });
    if (url.startsWith(`/api/guest/projects/${projectId}/assets`) && options.method === 'POST') {
      assert.equal(Number(options.headers['X-Melsou-Expected-Revision']), revision);
      const key = Buffer.from(options.body).toString('hex');
      if (!uploaded.has(key)) uploaded.set(key, assetId(uploaded.size));
      revision += 1;
      return Response.json({ asset: { id: uploaded.get(key), mime_type: 'image/png' }, projectRevision: revision }, { status: 201 });
    }
    if (url === `/api/guest/projects/${projectId}` && options.method === 'PUT') {
      const payload = JSON.parse(options.body);
      assert.equal(payload.expectedRevision, revision);
      savedDocument = payload.document;
      revision += 1;
      return Response.json({ project: { id: projectId, revision, document: savedDocument } });
    }
    if (url === '/api/guest/projects') return Response.json({ projects: [] });
    if (/^\/api\/assets\/[0-9a-f-]+\/preview$/i.test(url)) return new Response(new Uint8Array([137, 80, 78, 71]), { headers: { 'Content-Type': 'image/png' } });
    throw new Error(`unexpected request: ${options.method || 'GET'} ${url}`);
  };
  const window = {
    location: { origin: 'https://melsou.test', pathname: '/' }, localStorage,
    melsouGetActiveDraft: () => draft, melsouApplyCanonicalDraft: (value) => { appliedDraft = value; },
    MelsouAuth: { setLoginState() {} }, addEventListener() {}, dispatchEvent() {}, codexOnAuthSuccess() {}, supabase: null
  };
  class Event { constructor(type) { this.type = type; } }
  const context = vm.createContext({ window, localStorage, fetch, Response, Blob, File, URL, Uint8Array, ArrayBuffer, TextEncoder, Event, atob, crypto: webcrypto, structuredClone, setTimeout, clearTimeout, console: { info() {}, warn() {}, error() {} } });
  vm.runInContext(source, context);
  return { window, calls, storage, draft, uploaded, savedDocument: () => savedDocument, appliedDraft: () => appliedDraft, revision: () => revision };
}

test('eight gallery assets persist canonically while only three are placed', async () => {
  const browser = runBrowser();
  browser.window.melsouOnImageAssigned({ slotKey: 'coverImg', source: imageSources[0] });
  browser.window.melsouOnImageAssigned({ slotKey: 'el_el-one', source: imageSources[1] });
  browser.window.melsouOnImageAssigned({ slotKey: 'el_el-two', source: imageSources[2] });
  await waitFor(() => browser.savedDocument()?.gallery_assets?.length === 8, 'eight canonical gallery assets were not saved');

  const document = browser.savedDocument();
  assert.equal(browser.uploaded.size, 8);
  assert.equal(document.gallery_assets.length, 8);
  assert.equal(Object.keys(document.content_bindings).length, 3);
  assert.equal(document.content_bindings.image_01.asset_id, assetId(0));
  assert.equal(document.content_bindings['placed_el_el-one'].asset_id, assetId(1));
  assert.equal(document.content_bindings['placed_el_el-two'].asset_id, assetId(2));
  assert.deepEqual(Array.from(document.editor_payload.userGallery), []);
  assert.doesNotMatch(JSON.stringify(document), /data:image|blob:/i);
  assert.equal(browser.calls.filter((call) => call.url.endsWith('/assets')).length, 8);
});

test('clean authenticated browser discovers latest project and restores placed plus unplaced assets', async () => {
  const first = runBrowser();
  first.window.melsouOnImageAssigned({ slotKey: 'coverImg', source: imageSources[0] });
  first.window.melsouOnImageAssigned({ slotKey: 'el_el-one', source: imageSources[1] });
  first.window.melsouOnImageAssigned({ slotKey: 'el_el-two', source: imageSources[2] });
  await waitFor(() => first.savedDocument()?.gallery_assets?.length === 8 && Object.keys(first.savedDocument()?.content_bindings || {}).length === 3, 'source browser did not persist gallery and bindings');
  const canonicalProject = { id: projectId, revision: first.revision(), document: first.savedDocument(), template_id: 'melsou-editorial', template_version: 1 };

  const cleanStorage = new Map();
  const second = runBrowser({ authenticated: true, canonicalProject, storage: cleanStorage });
  await waitFor(() => second.appliedDraft()?.userGallery?.length === 8, 'clean browser did not hydrate all gallery assets');
  const bridge = JSON.parse(cleanStorage.get('melsou_auth_draft_bridge_v1'));
  assert.equal(bridge.projectId, projectId);
  assert.equal(bridge.galleryAssets.length, 8);
  assert.equal(Object.keys(bridge.slotAssets).length, 3);
  assert.deepEqual(Object.fromEntries(Object.entries(canonicalProject.document.editor_asset_slots)), {
    coverImg: 'image_01',
    'el_el-one': 'placed_el_el-one',
    'el_el-two': 'placed_el_el-two'
  });
  assert.equal(second.appliedDraft().userGallery.length, 8);
  assert.match(second.appliedDraft().spreads[0].coverImg, /^blob:/);
  assert.match(second.appliedDraft().spreads[1].elements[0].img, /^blob:/);
  assert.equal(second.calls.filter((call) => call.url === '/api/projects').length, 1);
  assert.equal(second.calls.filter((call) => call.url === `/api/projects/${projectId}`).length, 1);
});

test('authenticated project discovery returns deterministic safe summaries only for the session owner', async (t) => {
  const rows = [
    { id: projectId, title: 'Latest', template_id: 'melsou-editorial', template_version: 1, revision: 9, status: 'DRAFT', updated_at: '2026-09-30T10:00:00Z', last_activity_at: '2026-09-30T10:00:00Z', document: { configuration: { packageCode: 'SIGNATURE' }, gallery_assets: [{ asset_id: assetId(0) }] } },
    { id: '33333333-3333-4333-8333-333333333333', title: 'Older', template_id: 'first-love', template_version: 1, revision: 3, status: 'LOCKED', updated_at: '2026-09-29T10:00:00Z', last_activity_at: '2026-09-29T10:00:00Z', document: {} }
  ];
  t.mock.method(globalThis, 'fetch', async (url) => {
    const target = String(url);
    if (target.includes('/auth/v1/user')) return Response.json({ id: 'account-user' });
    if (target.includes('/rest/v1/projects?')) {
      assert.match(target, /owner_user_id=eq\.account-user/);
      assert.match(target, /status=in\.\(DRAFT,LOCKED\)/);
      assert.match(target, /order=updated_at\.desc,id\.desc/);
      return Response.json(rows);
    }
    throw new Error(`unexpected fetch: ${target}`);
  });
  const response = await worker.fetch(new Request('https://melsou.test/api/projects', { headers: { Authorization: 'Bearer user-token' } }), { SUPABASE_URL: 'https://db.test', SUPABASE_ANON_KEY: 'anon', SUPABASE_SERVICE_ROLE_KEY: 'service' });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.projects.length, 2);
  assert.equal(body.projects[0].active, true);
  assert.equal(body.projects[1].active, false);
  assert.equal(body.projects[0].project_id, projectId);
  assert.equal(body.projects[0].thumbnail_asset_id, assetId(0));
  assert.equal(body.projects[0].package, 'SIGNATURE');
  assert.equal('document' in body.projects[0], false);
});
