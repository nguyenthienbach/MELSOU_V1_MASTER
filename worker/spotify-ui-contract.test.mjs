import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const source = await readFile(new URL('../demo/recovery_fb38/auth-client.js', import.meta.url), 'utf8');
const appSource = await readFile(new URL('../demo/recovery_fb38/app.js', import.meta.url), 'utf8');
const PROJECT_ID = '11111111-1111-4111-8111-111111111111';
const ids = Array.from({ length: 11 }, (_, index) => `${String(index).padStart(2, '0')}LU6hMCjMI75M1A2tKUQC`);
const track = (id, name = `Track ${id.slice(0, 2)}`) => ({ id, uri: `spotify:track:${id}`, url: `https://open.spotify.com/track/${id}`, name, artists: ['Artist'], artistName: 'Artist', albumName: 'Album', coverUrl: 'https://i.scdn.co/image/cover', durationMs: 1000, spotifyCodeAssetRef: null });

function loadBridge({ draft = { package: 'melody' }, fetchImpl } = {}) {
  const storage = new Map();
  const window = {
    location: { origin: 'https://melsou.com', pathname: '/' },
    melsouGetActiveDraft: () => draft,
    dispatchEvent() {}
  };
  const context = {
    window, localStorage: { getItem: (key) => storage.get(key) || null, setItem: (key, value) => storage.set(key, value), removeItem: (key) => storage.delete(key) },
    fetch: fetchImpl || (async (url) => new Response('{}', { status: String(url).endsWith('/api/account') ? 401 : 503 })),
    Response, Request, Headers, URL, URLSearchParams, Blob, File: class File {}, Event: class Event {}, crypto, structuredClone,
    TextEncoder, Uint8Array, atob, btoa, CustomEvent: class CustomEvent { constructor(type, init) { this.type = type; this.detail = init?.detail; } }, console: { info() {}, warn() {}, error() {} },
    setTimeout: () => 1, clearTimeout() {}
  };
  vm.runInNewContext(source, context, { filename: 'auth-client.js' });
  return { window, storage };
}

test('selection keeps a deduplicated most-recent history capped at ten and blocks VOICE', async () => {
  const draft = { package: 'melody' };
  const fetchImpl = async (url, options = {}) => {
    if (String(url).endsWith('/api/account')) return new Response('{}', { status: 401 });
    if (String(url).endsWith('/api/spotify/code')) { const uri = JSON.parse(options.body).uri; const id = uri.split(':').at(-1); return Response.json({ code: { assetRef: `spcode_${id}_v1`, previewUrl: `/api/spotify/code/spcode_${id}_v1` } }); }
    return new Response('{}', { status: 503 });
  };
  const { window } = loadBridge({ draft, fetchImpl });
  for (const id of ids) await window.codexOnSpotifyTrackSelected(track(id));
  assert.equal(draft.spotifyCanonical.activeTrack.id, ids[10]);
  assert.equal(draft.spotifyCanonical.activeTrack.spotifyCodeAssetRef, `spcode_${ids[10]}_v1`);
  assert.equal(draft.spotifyCodeImg, `/api/spotify/code/spcode_${ids[10]}_v1`);
  assert.equal(draft.spotifyCanonical.history.length, 10);
  assert.ok(!draft.spotifyCanonical.history.some((item) => item.id === ids[0]));
  await window.codexOnSpotifyTrackSelected(track(ids[5]));
  assert.equal(draft.spotifyCanonical.history[0].id, ids[5]);
  assert.equal(new Set(draft.spotifyCanonical.history.map((item) => item.id)).size, 10);
  draft.package = 'voice';
  assert.deepEqual(JSON.parse(JSON.stringify(window.codexGetSpotifyState())), { activeTrack: null, history: [] });
  await assert.rejects(() => window.codexOnSpotifyTrackSelected(track(ids[1])), /SPOTIFY_NOT_ALLOWED_FOR_PACKAGE/);
});

test('code failure keeps the selected track canonical and exposes no fake image', async () => {
  const draft = { package: 'signature' };
  const { window } = loadBridge({ draft, fetchImpl: async (url) => new Response(JSON.stringify({ error: String(url).endsWith('/api/account') ? 'UNAUTHENTICATED' : 'SPOTIFY_CODE_GENERATION_FAILED' }), { status: String(url).endsWith('/api/account') ? 401 : 502, headers: { 'Content-Type': 'application/json' } }) });
  const result = await window.codexSelectSpotifyTrack(track(ids[0]));
  assert.equal(result.activeTrack.id, ids[0]);
  assert.equal(result.activeTrack.spotifyCodeAssetRef, null);
  assert.equal(result.codeError, 'SPOTIFY_CODE_GENERATION_FAILED');
  assert.equal(draft.spotifyCodeImg, null);
});

test('search and resolve hooks use only Melsou API routes and normalized UI fields', async () => {
  const requests = [];
  const fetchImpl = async (url, options = {}) => {
    requests.push({ url: String(url), options });
    if (String(url).endsWith('/api/account')) return new Response('{}', { status: 401 });
    if (String(url).includes('/api/spotify/search')) return Response.json({ tracks: [track(ids[0], 'Song')] });
    if (String(url).endsWith('/api/spotify/resolve')) return Response.json({ track: track(ids[0], 'Song') });
    return new Response('{}', { status: 503 });
  };
  const { window } = loadBridge({ fetchImpl });
  const search = await window.codexSearchSpotifyTracks(' artist + song ');
  const resolved = await window.codexResolveSpotifyTrack(`https://open.spotify.com/track/${ids[0]}`);
  assert.equal(search.tracks[0].title, 'Song');
  assert.equal(resolved.canonicalUrl, `https://open.spotify.com/track/${ids[0]}`);
  assert.ok(requests.some((item) => item.url.includes('/api/spotify/search?q=artist%20%2B%20song')));
  assert.ok(requests.some((item) => item.url.endsWith('/api/spotify/resolve') && item.options.credentials === 'include'));
});

test('clean authenticated session restores canonical Spotify state from the project revision', async () => {
  const restored = track(ids[0], 'Restored Song');
  let applied = null;
  const fetchImpl = async (url) => {
    const path = new URL(String(url), 'https://melsou.com').pathname;
    if (path === '/api/account') return Response.json({ auth: { provider: 'NATIVE', username: 'owner' }, profile: { user_id: PROJECT_ID } });
    if (path === '/api/projects') return Response.json({ projects: [{ project_id: PROJECT_ID, revision: 4, active: true }] });
    if (path === `/api/projects/${PROJECT_ID}`) return Response.json({ project: { id: PROJECT_ID, revision: 4, document: { configuration: { packageCode: 'MELODY' }, editor_payload: { package: 'melody', userGallery: [] }, content_bindings: {}, gallery_assets: [], spotify: { activeTrack: restored, history: [restored] } } }, assets: [] });
    return new Response('{}', { status: 404 });
  };
  const { window } = loadBridge({ fetchImpl });
  window.melsouApplyCanonicalDraft = (draft) => { applied = draft; };
  await new Promise((resolve) => setImmediate(resolve));
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(applied?.spotifyTrackId, restored.id);
  assert.equal(applied?.spotifyCanonical?.history?.[0]?.id, restored.id);
  assert.equal(applied?.spotifyCodeImg, null);
});

test('Studio presentation uses the backend preview and never draws or directly fetches a fake code', () => {
  assert.doesNotMatch(appSource, /scannables\.scdn\.co/);
  assert.doesNotMatch(appSource, /spotify-soundwave-bar/);
  assert.match(appSource, /Spotify Code could not be generated for this track\./);
  assert.match(appSource, /melsou-spotify-code-updated/);
});

test('localStorage wiped restore restores activeTrack, spotifyCodeAssetRef, history from backend canonical revision', async () => {
  const codeRef = `spcode_${ids[1]}_v1`;
  const restored = { ...track(ids[1], 'Saved Track'), spotifyCodeAssetRef: codeRef };
  let applied = null;
  const fetchImpl = async (url) => {
    const path = new URL(String(url), 'https://melsou.com').pathname;
    if (path === '/api/account') return Response.json({ auth: { provider: 'NATIVE', username: 'customer' }, profile: { user_id: PROJECT_ID } });
    if (path === `/api/projects/${PROJECT_ID}`) return Response.json({
      project: {
        id: PROJECT_ID,
        revision: 7,
        document: {
          configuration: { packageCode: 'SIGNATURE' },
          editor_payload: { package: 'signature', spreads: [{ elements: [] }] },
          content_bindings: {},
          gallery_assets: [],
          spotify: { activeTrack: restored, history: [restored, track(ids[2], 'History Song 2')] },
          options: { spotify_enabled: true, spotify_url: restored.url }
        }
      },
      assets: []
    });
    return new Response('{}', { status: 404 });
  };
  const { window, storage } = loadBridge({ fetchImpl });
  window.melsouApplyCanonicalDraft = (draft) => { applied = draft; };

  // 1. Wipe all localStorage
  storage.clear();
  assert.equal(storage.size, 0);

  // 2. Open project from backend
  await window.codexOpenProject(PROJECT_ID);

  // 3. Verify all canonical state was restored into draft without prior localStorage
  assert.ok(applied, 'Canonical draft was not applied');
  assert.equal(applied.spotifyTrackId, ids[1]);
  assert.equal(applied.spotifyTrackTitle, 'Saved Track');
  assert.equal(applied.spotifyCodeImg, `/api/spotify/code/${codeRef}`);
  assert.equal(applied.spotifyCanonical.activeTrack.spotifyCodeAssetRef, codeRef);
  assert.equal(applied.spotifyCanonical.history.length, 2);
  assert.equal(applied.spotifyCanonical.history[0].id, ids[1]);
  assert.equal(applied.spotifyCanonical.history[1].id, ids[2]);
});

test('VOICE package transition canonicalizes spotify to null activeTrack and empty history on backend', async () => {
  let savedDocument = null;
  const draft = {
    package: 'signature',
    title: 'Voice Gating Test',
    spreads: [{ elements: [] }],
    spotifyCanonical: { activeTrack: track(ids[0]), history: [track(ids[0])] }
  };
  const fetchImpl = async (url, options = {}) => {
    const path = new URL(String(url), 'https://melsou.com').pathname;
    if (path === '/api/account') return Response.json({ auth: { provider: 'NATIVE', username: 'owner' }, profile: { user_id: PROJECT_ID } });
    if (path === '/api/guest/projects' && options.method === 'POST') return Response.json({ project: { id: PROJECT_ID, revision: 1 } }, { status: 201 });
    if (path === `/api/guest/projects/${PROJECT_ID}` && options.method === 'PUT') {
      const payload = JSON.parse(options.body);
      savedDocument = payload.document;
      return Response.json({ project: { id: PROJECT_ID, revision: 2, document: savedDocument } });
    }
    return new Response('{}', { status: 404 });
  };
  const { window } = loadBridge({ draft, fetchImpl });
  await window.codexOnSpotifyTrackSelected(track(ids[0]));

  // Switch package to VOICE
  draft.package = 'voice';
  const stateOnVoice = JSON.parse(JSON.stringify(window.codexGetSpotifyState()));
  assert.deepEqual(stateOnVoice, { activeTrack: null, history: [] });

  // Verify that VOICE rejects track selection
  await assert.rejects(() => window.codexSelectSpotifyTrack(track(ids[1])), /SPOTIFY_NOT_ALLOWED_FOR_PACKAGE/);
});
