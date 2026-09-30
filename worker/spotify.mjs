const TRACK_ID = /^[A-Za-z0-9]{22}$/;
const TOKEN_URL = 'https://accounts.spotify.com/api/token';
const API_URL = 'https://api.spotify.com/v1';
const SPOTIFY_CODE_SOURCE = 'https://scannables.scdn.co/uri/plain/png/000000/white/640';
const CODE_REF = /^spcode_([A-Za-z0-9]{22})_v1$/;
let cachedToken = null;

const reply = (body, status = 200, headers = {}) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...headers }
});

const failure = (code, status, extra = {}) => reply({ error: code, ...extra }, status);

export function hasSpotifyCredentials(env) {
  return !!(String(env?.SPOTIFY_CLIENT_ID || '').trim() && String(env?.SPOTIFY_CLIENT_SECRET || '').trim());
}

function spotifyCredentials(env) {
  const clientId = String(env?.SPOTIFY_CLIENT_ID || '').trim();
  const clientSecret = String(env?.SPOTIFY_CLIENT_SECRET || '').trim();
  if (!clientId || !clientSecret) throw Object.assign(new Error('SPOTIFY_NOT_CONFIGURED'), { status: 503 });
  return { clientId, clientSecret };
}

async function accessToken(env, fetchImpl = fetch, now = Date.now()) {
  if (cachedToken?.expiresAt > now + 60_000) return cachedToken.value;
  const { clientId, clientSecret } = spotifyCredentials(env);
  const response = await fetchImpl(TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({ grant_type: 'client_credentials' }).toString()
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || typeof payload.access_token !== 'string') {
    cachedToken = null;
    throw Object.assign(new Error('SPOTIFY_AUTH_FAILED'), { status: 503 });
  }
  cachedToken = { value: payload.access_token, expiresAt: now + Math.max(1, Number(payload.expires_in) || 3600) * 1000 };
  return cachedToken.value;
}

export function isPrivateOrLocalHost(hostname) {
  const host = String(hostname || '').toLowerCase().trim();
  if (!host || host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '0.0.0.0') return true;
  if (/^10\./.test(host) || /^192\.168\./.test(host) || /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host) || /^169\.254\./.test(host)) return true;
  return false;
}

export async function parseSpotifyTrackUrl(value, { fetchImpl = fetch } = {}) {
  let parsed;
  try { parsed = new URL(String(value || '').trim()); } catch { return null; }
  if (parsed.protocol !== 'https:') return null;
  if (isPrivateOrLocalHost(parsed.hostname)) return null;

  // 1. Direct open.spotify.com or spotify.com
  if (parsed.hostname === 'open.spotify.com' || parsed.hostname === 'spotify.com') {
    if (/^\/(playlist|album|artist|episode|show|user)\b/i.test(parsed.pathname)) {
      return null;
    }
    const match = parsed.pathname.match(/^\/track\/([A-Za-z0-9]{22})\/?$/);
    if (!match) return null;
    return { id: match[1], url: `https://open.spotify.com/track/${match[1]}` };
  }

  // 2. Spotify short link: https://spotify.link/<id>
  if (parsed.hostname === 'spotify.link') {
    if (!/^\/[A-Za-z0-9_-]+$/.test(parsed.pathname)) return null;
    try {
      const headRes = await fetchImpl(parsed.toString(), {
        method: 'HEAD',
        redirect: 'manual'
      });
      const location = headRes.headers.get('location');
      if (location) {
        let dest;
        try { dest = new URL(location); } catch { return null; }
        if (dest.protocol !== 'https:' || isPrivateOrLocalHost(dest.hostname)) return null;
        if (dest.hostname === 'open.spotify.com') {
          if (/^\/(playlist|album|artist|episode|show|user)\b/i.test(dest.pathname)) {
            return null;
          }
          const match = dest.pathname.match(/^\/track\/([A-Za-z0-9]{22})\/?$/);
          if (match) return { id: match[1], url: `https://open.spotify.com/track/${match[1]}` };
        }
      }
    } catch {
      return null;
    }
  }

  return null;
}

export function normalizeSpotifyTrack(track) {
  if (!track || !TRACK_ID.test(String(track.id || ''))) return null;
  const artists = Array.isArray(track.artists)
    ? track.artists.map((artist) => typeof artist === 'string' ? artist.trim() : String(artist?.name || '').trim()).filter(Boolean).slice(0, 10)
    : [];
  const externalUrl = String(track.external_urls?.spotify || track.url || track.canonicalUrl || `https://open.spotify.com/track/${track.id}`);
  let parsedId = null;
  try {
    const u = new URL(externalUrl);
    const m = u.pathname.match(/^\/track\/([A-Za-z0-9]{22})\/?$/);
    if (m) parsedId = m[1];
  } catch {}
  if (!parsedId || parsedId !== track.id) return null;

  let coverUrl = '';
  if (Array.isArray(track.album?.images)) {
    coverUrl = String(track.album.images.find((image) => /^https:\/\//.test(String(image?.url || '')))?.url || '');
  } else if (track.coverUrl || track.artworkUrl) {
    coverUrl = String(track.coverUrl || track.artworkUrl || '');
  }

  const artistName = track.artistName || artists.join(', ').slice(0, 500) || '';
  const albumName = String(track.album?.name || track.albumName || '').trim().slice(0, 300);

  return {
    id: track.id,
    uri: `spotify:track:${track.id}`,
    url: `https://open.spotify.com/track/${track.id}`,
    canonicalUrl: `https://open.spotify.com/track/${track.id}`,
    name: String(track.name || track.title || '').trim().slice(0, 300),
    title: String(track.name || track.title || '').trim().slice(0, 300),
    artists,
    artistName,
    artist: artistName,
    albumName,
    album: albumName,
    coverUrl: coverUrl.slice(0, 2000) || null,
    artworkUrl: coverUrl.slice(0, 2000) || null,
    durationMs: Number.isSafeInteger(track.duration_ms) && track.duration_ms > 0 ? track.duration_ms : (Number.isSafeInteger(track.durationMs) && track.durationMs > 0 ? track.durationMs : null),
    spotifyCodeAssetRef: null
  };
}

export async function resolveSpotifyTrackPublic(trackId, fetchImpl = fetch) {
  if (!TRACK_ID.test(String(trackId || ''))) return null;
  const canonicalUrl = `https://open.spotify.com/track/${trackId}`;
  let title = '';
  let artworkUrl = '';
  let artist = '';
  let albumName = '';
  let oembedFound = false;

  // 1. Try Spotify oEmbed (open, credential-free)
  try {
    const oembedRes = await fetchImpl(`https://open.spotify.com/oembed?url=${encodeURIComponent(canonicalUrl)}`);
    if (oembedRes.ok) {
      oembedFound = true;
      const data = await oembedRes.json().catch(() => ({}));
      if (data.title) title = String(data.title).trim();
      if (data.thumbnail_url) artworkUrl = String(data.thumbnail_url).trim();
    }
  } catch {}

  // 2. Try Spotify Track OpenGraph / HTML metadata for artist & album
  try {
    const htmlRes = await fetchImpl(canonicalUrl, {
      headers: {
        'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)'
      }
    });
    if (htmlRes.ok) {
      const html = await htmlRes.text().catch(() => '');
      if (!title) {
        const ogTitle = html.match(/property="og:title" content="([^"]+)"/)?.[1];
        if (ogTitle) title = ogTitle.trim();
      }
      if (!artworkUrl) {
        const ogImg = html.match(/property="og:image" content="([^"]+)"/)?.[1];
        if (ogImg) artworkUrl = ogImg.trim();
      }
      const ogDesc = html.match(/property="og:description" content="([^"]+)"/)?.[1];
      if (ogDesc) {
        const parts = ogDesc.split(/[\u00B7\u2022\u2219·•]/).map(p => p.trim());
        if (parts[0] && !parts[0].includes('Song') && !parts[0].includes('Spotify')) {
          artist = parts[0];
        }
        if (parts[1] && !parts[1].includes('Song') && !parts[1].includes('Spotify')) {
          albumName = parts[1];
        }
      }
      if (!artist) {
        const titleTag = html.match(/<title>([^<]+)<\/title>/)?.[1];
        const byMatch = titleTag?.match(/by ([^|]+) \| Spotify/i);
        if (byMatch && byMatch[1]) {
          artist = byMatch[1].trim();
        }
      }
    }
  } catch {}

  // If neither oEmbed nor HTML returned anything for this track ID, track doesn't exist
  if (!oembedFound && !title && !artworkUrl) {
    return null;
  }

  const artists = artist ? [artist] : [];
  return normalizeSpotifyTrack({
    id: trackId,
    name: title || `Spotify Track (${trackId})`,
    artists: artists.map(name => ({ name })),
    artistName: artist,
    album: { name: albumName, images: artworkUrl ? [{ url: artworkUrl }] : [] },
    external_urls: { spotify: canonicalUrl },
    duration_ms: null
  });
}

export const spotifyCodeAssetRef = (trackId) => `spcode_${trackId}_v1`;
const spotifyCodeStorageKey = (trackId) => `spotify-codes/v1/${trackId}.png`;

export function inspectSpotifyCodePng(bytes) {
  const data = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes || []);
  if (data.byteLength < 33 || data.byteLength > 2 * 1024 * 1024) throw new Error('SPOTIFY_CODE_GENERATION_FAILED');
  const signature = [0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a];
  if (!signature.every((value, index) => data[index] === value) || String.fromCharCode(...data.slice(12, 16)) !== 'IHDR') throw new Error('SPOTIFY_CODE_GENERATION_FAILED');
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const width = view.getUint32(16); const height = view.getUint32(20);
  if (width < 112 || height < 32 || width > 4096 || height > 2048 || width <= height) throw new Error('SPOTIFY_CODE_GENERATION_FAILED');
  return { width, height, mimeType: 'image/png' };
}

async function objectBytes(object) {
  if (!object) return null;
  if (typeof object.arrayBuffer === 'function') return new Uint8Array(await object.arrayBuffer());
  if (object.body instanceof Uint8Array) return object.body;
  if (object.body && typeof object.body.arrayBuffer === 'function') return new Uint8Array(await object.body.arrayBuffer());
  return null;
}

export async function ensureSpotifyCode(trackId, env, fetchImpl = fetch) {
  if (!TRACK_ID.test(String(trackId || '')) || !env.MELSOU_ASSETS || !env.IMAGES) throw new Error('SPOTIFY_CODE_GENERATION_FAILED');
  const key = spotifyCodeStorageKey(trackId);
  const existing = await env.MELSOU_ASSETS.get(key);
  if (existing) {
    try {
      const bytes = await objectBytes(existing);
      inspectSpotifyCodePng(bytes);
      const image = await inspectUploadedImage(bytes, env.IMAGES, 'image/png');
      if (image.width <= image.height) throw new Error('SPOTIFY_CODE_GENERATION_FAILED');
      return { assetRef: spotifyCodeAssetRef(trackId), previewUrl: `/api/spotify/code/${spotifyCodeAssetRef(trackId)}`, ...image, cached: true };
    } catch {
      await env.MELSOU_ASSETS.delete(key);
    }
  }
  const uri = `spotify:track:${trackId}`;
  const response = await fetchImpl(`${SPOTIFY_CODE_SOURCE}/${uri}`, { headers: { Accept: 'image/png' }, redirect: 'follow' });
  const contentType = String(response.headers.get('Content-Type') || '').split(';')[0].trim().toLowerCase();
  if (!response.ok || contentType !== 'image/png') throw new Error('SPOTIFY_CODE_GENERATION_FAILED');
  const bytes = new Uint8Array(await response.arrayBuffer());
  inspectSpotifyCodePng(bytes);
  const image = await inspectUploadedImage(bytes, env.IMAGES, 'image/png');
  if (image.width <= image.height) throw new Error('SPOTIFY_CODE_GENERATION_FAILED');
  await env.MELSOU_ASSETS.put(key, bytes, { httpMetadata: { contentType: 'image/png', cacheControl: 'private, max-age=31536000, immutable' }, customMetadata: { spotifyUri: uri, mode: 'ACADEMIC_DEMO_ONLY', source: 'NON_GUARANTEED_SPOTIFY_CODE_SOURCE' } });
  return { assetRef: spotifyCodeAssetRef(trackId), previewUrl: `/api/spotify/code/${spotifyCodeAssetRef(trackId)}`, ...image, cached: false };
}

export async function handleSpotifyCode(request, env, kind, { fetchImpl = fetch, rateLimit } = {}) {
  try {
    if (kind === 'generate') {
      const limit = await rateLimit?.(request, 'spotify-code');
      if (limit?.configurationMissing) return failure('RATE_LIMIT_NOT_CONFIGURED', 503);
      if (limit && !limit.allowed) return failure('SPOTIFY_RATE_LIMITED', 429, { retry_after: 60 });
      const body = await request.json().catch(() => null);
      const match = String(body?.uri || '').match(/^spotify:track:([A-Za-z0-9]{22})$/);
      if (!match) return failure('INVALID_SPOTIFY_SELECTION', 400);
      return reply({ code: await ensureSpotifyCode(match[1], env, fetchImpl), mode: 'ACADEMIC_DEMO_ONLY', source: 'NON_GUARANTEED_SPOTIFY_CODE_SOURCE' });
    }
    const match = CODE_REF.exec(String(kind || ''));
    if (!match || !env.MELSOU_ASSETS) return failure('SPOTIFY_CODE_NOT_FOUND', 404);
    const object = await env.MELSOU_ASSETS.get(spotifyCodeStorageKey(match[1]));
    if (!object) return failure('SPOTIFY_CODE_NOT_FOUND', 404);
    const bytes = await objectBytes(object);
    inspectSpotifyCodePng(bytes);
    return new Response(bytes, { status: 200, headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=86400, immutable', 'X-Content-Type-Options': 'nosniff', 'Content-Length': String(bytes.byteLength) } });
  } catch {
    return failure('SPOTIFY_CODE_GENERATION_FAILED', 502);
  }
}

async function spotifyGet(path, env, fetchImpl) {
  const token = await accessToken(env, fetchImpl);
  const response = await fetchImpl(`${API_URL}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (response.status === 401) cachedToken = null;
  if (response.status === 429) {
    const retryAfter = Math.min(3600, Math.max(1, Number(response.headers.get('Retry-After')) || 1));
    throw Object.assign(new Error('SPOTIFY_RATE_LIMITED'), { status: 429, retryAfter });
  }
  if (!response.ok) throw Object.assign(new Error(response.status === 404 ? 'SPOTIFY_TRACK_NOT_FOUND' : 'SPOTIFY_UPSTREAM_FAILED'), { status: response.status === 404 ? 404 : 502 });
  return response.json();
}

export async function handleSpotify(request, env, kind, { fetchImpl = fetch, rateLimit } = {}) {
  try {
    const limit = await rateLimit?.(request, `spotify-${kind}`);
    if (limit?.configurationMissing) return failure('RATE_LIMIT_NOT_CONFIGURED', 503);
    if (limit && !limit.allowed) return failure('SPOTIFY_RATE_LIMITED', 429, { retry_after: 60 });
    const market = /^[A-Z]{2}$/.test(String(env?.SPOTIFY_MARKET || '').trim().toUpperCase()) ? String(env.SPOTIFY_MARKET).trim().toUpperCase() : 'VN';

    if (kind === 'search') {
      const query = new URL(request.url).searchParams.get('q')?.trim() || '';
      if (query.length < 2 || query.length > 100) return failure('INVALID_SPOTIFY_QUERY', 400);
      if (!hasSpotifyCredentials(env)) {
        return reply({ tracks: [] });
      }
      const payload = await spotifyGet(`/search?${new URLSearchParams({ q: query, type: 'track', market, limit: '5' })}`, env, fetchImpl);
      const tracks = (payload.tracks?.items || []).map(normalizeSpotifyTrack).filter(Boolean).slice(0, 5);
      return reply({ tracks });
    }

    if (kind === 'resolve') {
      const body = await request.json().catch(() => null);
      const selection = await parseSpotifyTrackUrl(body?.url, { fetchImpl });
      if (!selection) return failure('INVALID_SPOTIFY_TRACK_URL', 400);

      let track = null;
      if (hasSpotifyCredentials(env)) {
        try {
          track = normalizeSpotifyTrack(await spotifyGet(`/tracks/${selection.id}?${new URLSearchParams({ market })}`, env, fetchImpl));
        } catch (e) {
          if (e?.message === 'SPOTIFY_RATE_LIMITED') throw e;
        }
      }

      // Credential-free fallback / primary resolver
      if (!track) {
        track = await resolveSpotifyTrackPublic(selection.id, fetchImpl);
      }

      return track ? reply({ track }) : failure('SPOTIFY_TRACK_NOT_FOUND', 404);
    }

    return failure('NOT_FOUND', 404);
  } catch (error) {
    const code = ['SPOTIFY_NOT_CONFIGURED','SPOTIFY_AUTH_FAILED','SPOTIFY_RATE_LIMITED','SPOTIFY_TRACK_NOT_FOUND','SPOTIFY_UPSTREAM_FAILED'].includes(error?.message) ? error.message : 'SPOTIFY_UPSTREAM_FAILED';
    return failure(code, Number(error?.status) || 502, error?.retryAfter ? { retry_after: error.retryAfter } : {});
  }
}

export function resetSpotifyTokenCacheForTest() { cachedToken = null; }
import { inspectUploadedImage } from './image-processing.mjs';
