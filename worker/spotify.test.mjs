import assert from 'node:assert/strict';
import test from 'node:test';
import { handleSpotify, handleSpotifyCode, inspectSpotifyCodePng, normalizeSpotifyTrack, parseSpotifyTrackUrl, resetSpotifyTokenCacheForTest } from './spotify.mjs';

const ID = '4uLU6hMCjMI75M1A2tKUQC';
const rawTrack = (id = ID) => ({ id, name: 'Never Gonna Give You Up', artists: [{ name: 'Rick Astley' }], album: { name: 'Whenever You Need Somebody', images: [{ url: 'https://i.scdn.co/image/cover' }] }, duration_ms: 213573, external_urls: { spotify: `https://open.spotify.com/track/${id}` } });
const env = { SPOTIFY_CLIENT_ID: 'client-id', SPOTIFY_CLIENT_SECRET: 'client-secret', SPOTIFY_MARKET: 'VN' };
const allow = async () => ({ allowed: true });
const png = (width = 640, height = 160) => {
  const bytes = new Uint8Array(33);
  bytes.set([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a,0,0,0,13,0x49,0x48,0x44,0x52]);
  new DataView(bytes.buffer).setUint32(16, width); new DataView(bytes.buffer).setUint32(20, height);
  return bytes;
};
const images = { async info() { return { format: 'png', width: 640, height: 160 }; } };

function spotifyFetch({ items = [rawTrack()], status = 200 } = {}) {
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    if (String(url).includes('/api/token')) return new Response(JSON.stringify({ access_token: 'server-token', expires_in: 3600 }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    if (status === 429) return new Response('{}', { status, headers: { 'Retry-After': '7' } });
    if (String(url).includes('/search?')) return new Response(JSON.stringify({ tracks: { items } }), { status, headers: { 'Content-Type': 'application/json' } });
    return new Response(JSON.stringify(rawTrack()), { status, headers: { 'Content-Type': 'application/json' } });
  };
  return { fetchImpl, calls };
}

test('track URL parser accepts canonical URLs, query params, short links and rejects invalid formats', async () => {
  // 1. Canonical track URL
  assert.deepEqual(await parseSpotifyTrackUrl(`https://open.spotify.com/track/${ID}`), { id: ID, url: `https://open.spotify.com/track/${ID}` });
  // 2. URL with ?si=
  assert.deepEqual(await parseSpotifyTrackUrl(`https://open.spotify.com/track/${ID}?si=abc123xyz`), { id: ID, url: `https://open.spotify.com/track/${ID}` });
  // 3. Rejected: playlist, album, artist, episode, show, user
  assert.equal(await parseSpotifyTrackUrl(`https://open.spotify.com/playlist/${ID}`), null);
  assert.equal(await parseSpotifyTrackUrl(`https://open.spotify.com/album/${ID}`), null);
  assert.equal(await parseSpotifyTrackUrl(`https://open.spotify.com/artist/${ID}`), null);
  assert.equal(await parseSpotifyTrackUrl(`https://open.spotify.com/episode/${ID}`), null);
  assert.equal(await parseSpotifyTrackUrl(`https://open.spotify.com/show/${ID}`), null);
  assert.equal(await parseSpotifyTrackUrl(`https://open.spotify.com/user/${ID}`), null);
  // 4. Rejected: non-Spotify, javascript, malformed
  assert.equal(await parseSpotifyTrackUrl('javascript:alert(1)'), null);
  assert.equal(await parseSpotifyTrackUrl(`https://example.com/track/${ID}`), null);
  assert.equal(await parseSpotifyTrackUrl('not-a-url'), null);
  assert.equal(await parseSpotifyTrackUrl(`https://open.spotify.com/track/short`), null);
  // 5. Short link: https://spotify.link/... resolved via HEAD location
  const mockFetchShortLink = async (url) => {
    if (url === 'https://spotify.link/mockShort123') {
      return new Response(null, { status: 302, headers: { Location: `https://open.spotify.com/track/${ID}?si=xyz` } });
    }
    if (url === 'https://spotify.link/ssrfAttack') {
      return new Response(null, { status: 302, headers: { Location: 'http://127.0.0.1:8080/secret' } });
    }
    if (url === 'https://spotify.link/playlistRedirect') {
      return new Response(null, { status: 302, headers: { Location: `https://open.spotify.com/playlist/${ID}` } });
    }
    return new Response(null, { status: 404 });
  };
  const resolvedShort = await parseSpotifyTrackUrl('https://spotify.link/mockShort123', { fetchImpl: mockFetchShortLink });
  assert.deepEqual(resolvedShort, { id: ID, url: `https://open.spotify.com/track/${ID}` });
  // SSRF defense: short link pointing to internal IP rejected
  assert.equal(await parseSpotifyTrackUrl('https://spotify.link/ssrfAttack', { fetchImpl: mockFetchShortLink }), null);
  // Short link pointing to playlist rejected
  assert.equal(await parseSpotifyTrackUrl('https://spotify.link/playlistRedirect', { fetchImpl: mockFetchShortLink }), null);
});

test('resolve works credential-free without SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET', async () => {
  const fetchImpl = async (url) => {
    const s = String(url);
    if (s.includes('/oembed?')) {
      return Response.json({
        title: 'Never Gonna Give You Up',
        thumbnail_url: 'https://i.scdn.co/image/public-cover'
      });
    }
    if (s.includes(`/track/${ID}`)) {
      return new Response(`
        <html><head>
          <meta property="og:title" content="Never Gonna Give You Up" />
          <meta property="og:description" content="Rick Astley · Whenever You Need Somebody · Song · 1987" />
          <meta property="og:image" content="https://i.scdn.co/image/public-cover" />
          <title>Never Gonna Give You Up - song and lyrics by Rick Astley | Spotify</title>
        </head><body></body></html>
      `, { headers: { 'Content-Type': 'text/html' } });
    }
    return new Response('{}', { status: 404 });
  };

  // Note: env has NO SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET
  const noCredentialsEnv = {};
  const response = await handleSpotify(
    new Request('https://melsou.com/api/spotify/resolve', {
      method: 'POST',
      body: JSON.stringify({ url: `https://open.spotify.com/track/${ID}?si=test` })
    }),
    noCredentialsEnv,
    'resolve',
    { fetchImpl, rateLimit: allow }
  );
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.track.id, ID);
  assert.equal(body.track.name, 'Never Gonna Give You Up');
  assert.equal(body.track.artist, 'Rick Astley');
  assert.equal(body.track.album, 'Whenever You Need Somebody');
  assert.equal(body.track.coverUrl, 'https://i.scdn.co/image/public-cover');
  assert.equal(body.track.canonicalUrl, `https://open.spotify.com/track/${ID}`);
  assert.equal(body.track.spotifyCodeAssetRef, null);
});

test('search returns at most five normalized tracks and caches the server token when credentials exist', async () => {
  resetSpotifyTokenCacheForTest();
  const { fetchImpl, calls } = spotifyFetch({ items: Array.from({ length: 7 }, (_, index) => rawTrack(`${String(index).padStart(2, '0')}LU6hMCjMI75M1A2tKUQC`)) });
  const request = new Request('https://melsou.com/api/spotify/search?q=Rick%20Astley');
  const first = await handleSpotify(request, env, 'search', { fetchImpl, rateLimit: allow });
  const second = await handleSpotify(request, env, 'search', { fetchImpl, rateLimit: allow });
  assert.equal(first.status, 200);
  assert.equal((await first.json()).tracks.length, 5);
  assert.equal(second.status, 200);
  assert.equal(calls.filter((call) => call.url.includes('/api/token')).length, 1);
  assert.match(calls.find((call) => call.url.includes('/search?')).url, /limit=5/);
  assert.ok(!JSON.stringify(await second.json()).includes('server-token'));
});

test('resolve fetches exact real track metadata and never returns credentials or a code asset', async () => {
  resetSpotifyTokenCacheForTest();
  const { fetchImpl, calls } = spotifyFetch();
  const response = await handleSpotify(new Request('https://melsou.com/api/spotify/resolve', { method: 'POST', body: JSON.stringify({ url: `https://open.spotify.com/track/${ID}` }) }), env, 'resolve', { fetchImpl, rateLimit: allow });
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.track.id, ID);
  assert.equal(body.track.spotifyCodeAssetRef, null);
  assert.ok(calls.some((call) => call.url.includes(`/v1/tracks/${ID}?market=VN`)));
  assert.ok(!JSON.stringify(body).includes('client-secret'));
});

test('invalid query, invalid URL, missing track and upstream rate limit are stable', async () => {
  resetSpotifyTokenCacheForTest();
  assert.equal((await handleSpotify(new Request('https://melsou.com/api/spotify/search?q=x'), env, 'search', { rateLimit: allow })).status, 400);
  assert.equal((await handleSpotify(new Request('https://melsou.com/api/spotify/resolve', { method: 'POST', body: JSON.stringify({ url: `https://open.spotify.com/album/${ID}` }) }), env, 'resolve', { rateLimit: allow })).status, 400);
  // Search without credentials returns empty tracks list gracefully without 503 error
  assert.deepEqual(await (await handleSpotify(new Request('https://melsou.com/api/spotify/search?q=valid'), {}, 'search', { rateLimit: allow })).json(), { tracks: [] });
  const { fetchImpl } = spotifyFetch({ status: 429 });
  const limited = await handleSpotify(new Request('https://melsou.com/api/spotify/search?q=valid'), env, 'search', { fetchImpl, rateLimit: allow });
  assert.equal(limited.status, 429);
  assert.deepEqual(await limited.json(), { error: 'SPOTIFY_RATE_LIMITED', retry_after: 7 });
});

test('normalizer rejects mismatched or malformed tracks', () => {
  assert.equal(normalizeSpotifyTrack({ ...rawTrack(), external_urls: { spotify: `https://open.spotify.com/track/0000000000000000000000` } }), null);
  assert.equal(normalizeSpotifyTrack({ id: 'bad' }), null);
});

test('academic demo code generation validates, caches and serves a private R2 asset reference', async () => {
  const objects = new Map(); let sourceFetches = 0;
  const envWithAssets = { ...env, IMAGES: images, MELSOU_ASSETS: {
    async get(key) { const value = objects.get(key); return value ? { arrayBuffer: async () => value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength) } : null; },
    async put(key, value) { objects.set(key, value); }
  } };
  const fetchImpl = async (url) => { sourceFetches += 1; assert.equal(String(url), `https://scannables.scdn.co/uri/plain/png/000000/white/640/spotify:track:${ID}`); return new Response(png(), { headers: { 'Content-Type': 'image/png' } }); };
  const request = () => new Request('https://melsou.com/api/spotify/code', { method: 'POST', body: JSON.stringify({ uri: `spotify:track:${ID}` }) });
  const first = await handleSpotifyCode(request(), envWithAssets, 'generate', { fetchImpl, rateLimit: allow });
  const firstBody = await first.json();
  const second = await handleSpotifyCode(request(), envWithAssets, 'generate', { fetchImpl, rateLimit: allow });
  const secondBody = await second.json();
  assert.equal(first.status, 200); assert.equal(firstBody.code.assetRef, `spcode_${ID}_v1`); assert.equal(firstBody.code.cached, false);
  assert.equal(second.status, 200); assert.equal(secondBody.code.cached, true); assert.equal(sourceFetches, 1);
  assert.ok(!JSON.stringify(firstBody).includes('spotify-codes/v1'));
  const preview = await handleSpotifyCode(new Request(`https://melsou.com/api/spotify/code/spcode_${ID}_v1`), envWithAssets, `spcode_${ID}_v1`);
  assert.equal(preview.status, 200); assert.equal(preview.headers.get('Content-Type'), 'image/png');
});

test('code generation rejects malformed URI, HTML/error bytes and unsafe image geometry', async () => {
  const store = { async get() { return null; }, async put() { throw new Error('must not store'); } };
  const malformed = await handleSpotifyCode(new Request('https://melsou.com/api/spotify/code', { method: 'POST', body: JSON.stringify({ uri: 'spotify:playlist:bad' }) }), { ...env, IMAGES: images, MELSOU_ASSETS: store }, 'generate', { rateLimit: allow });
  assert.equal(malformed.status, 400);
  const html = await handleSpotifyCode(new Request('https://melsou.com/api/spotify/code', { method: 'POST', body: JSON.stringify({ uri: `spotify:track:${ID}` }) }), { ...env, IMAGES: images, MELSOU_ASSETS: store }, 'generate', { rateLimit: allow, fetchImpl: async () => new Response('<html>error</html>', { headers: { 'Content-Type': 'text/html' } }) });
  assert.equal(html.status, 502); assert.deepEqual(await html.json(), { error: 'SPOTIFY_CODE_GENERATION_FAILED' });
  assert.throws(() => inspectSpotifyCodePng(png(64, 64)), /SPOTIFY_CODE_GENERATION_FAILED/);
});
