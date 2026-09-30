/*
 * Melsou OAuth + draft persistence bridge.
 *
 * This file intentionally owns identity.  The presentation layer may show a
 * name after `MelsouAuth.handleAuthSuccess`, but it never restores that name
 * from localStorage.  Supabase is the sole authority for a logged-in session.
 */
(function melsouAuthBridge() {
  'use strict';

  const draftKey = 'melsou_auth_draft_bridge_v1';
  const apiBase = '/api';
  const templateByPackage = {
    melody: 'first-love',
    voice: 'quiet-moments',
    signature: 'melsou-editorial'
  };
  let client = null;
  let configPromise = null;
  let saveTimer = null;
  let saveInFlight = null;
  let persistQueue = Promise.resolve();
  let nativeUser = null;
  let activeOrder = null;
  const pendingSlotSources = new Map();

  const readBridge = () => {
    try {
      const value = JSON.parse(localStorage.getItem(draftKey) || '{}');
      return value && typeof value === 'object' ? value : {};
    } catch { return {}; }
  };
  const writeBridge = (value) => localStorage.setItem(draftKey, JSON.stringify(value));
  const clearBridge = () => localStorage.removeItem(draftKey);
  const api = async (path, options = {}) => {
    const response = await fetch(`${apiBase}${path}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(body.error || `API request failed (${response.status})`);
      error.code = body.error;
      error.status = response.status;
      error.body = body;
      throw error;
    }
    return body;
  };
  window.codexGetPublishedPosts = async ({ page = 1, perPage = 10, category = 'all' } = {}) => api(`/blog?page=${encodeURIComponent(page)}&perPage=${encodeURIComponent(perPage)}${category === 'all' ? '' : `&category=${encodeURIComponent(category)}`}`);
  window.codexGetPublishedCategories = async () => api('/blog/categories');
  window.codexGetPublishedPost = async (slug) => api(`/blog/${encodeURIComponent(slug)}`);
  window.codexGetBlogInteractions = async (slug) => api(`/blog/${encodeURIComponent(slug)}/interactions`);
  window.codexToggleBlogPostLike = async (slug, liked) => api(`/blog/${encodeURIComponent(slug)}/like`, { method: 'POST', body: JSON.stringify({ liked }) });
  window.codexGetBlogComments = async (slug, { limit = 5, cursor = 0, sort = 'top' } = {}) => api(`/blog/${encodeURIComponent(slug)}/comments?limit=${encodeURIComponent(limit)}&cursor=${encodeURIComponent(cursor)}&sort=${encodeURIComponent(sort)}`);
  window.codexCreateBlogComment = async (slug, content) => api(`/blog/${encodeURIComponent(slug)}/comments`, { method: 'POST', body: JSON.stringify({ content }) });
  window.codexGetBlogReplies = async (slug, commentId, { limit = 3, cursor = 0, sort = 'top' } = {}) => api(`/blog/${encodeURIComponent(slug)}/comments/${encodeURIComponent(commentId)}/replies?limit=${encodeURIComponent(limit)}&cursor=${encodeURIComponent(cursor)}&sort=${encodeURIComponent(sort)}`);
  window.codexCreateBlogReply = async (slug, commentId, content) => api(`/blog/${encodeURIComponent(slug)}/comments/${encodeURIComponent(commentId)}/replies`, { method: 'POST', body: JSON.stringify({ content }) });
  window.codexToggleBlogCommentLike = async (slug, commentId, liked) => api(`/blog/${encodeURIComponent(slug)}/comments/${encodeURIComponent(commentId)}/like`, { method: 'POST', body: JSON.stringify({ liked }) });
  window.codexUpdateBlogComment = async (slug, commentId, content) => api(`/blog/${encodeURIComponent(slug)}/comments/${encodeURIComponent(commentId)}`, { method: 'PATCH', body: JSON.stringify({ content }) });
  window.codexDeleteBlogComment = async (slug, commentId) => api(`/blog/${encodeURIComponent(slug)}/comments/${encodeURIComponent(commentId)}`, { method: 'DELETE' });
  window.codexListOwnerBlogComments = async ({ postSlug = null, status = 'all', limit = 50, cursor = null, sort = 'newest' } = {}) => {
    const params = new URLSearchParams();
    if (postSlug) params.set('post_slug', postSlug);
    params.set('status', status);
    params.set('limit', String(limit));
    if (cursor) params.set('cursor', cursor);
    params.set('sort', sort);
    return api(`/owner/blog/comments?${params.toString()}`);
  };
  window.codexModerateBlogComment = async (commentId, status) => api(`/owner/blog/comments/${encodeURIComponent(commentId)}`, { method: 'PATCH', body: JSON.stringify({ status }) });
  window.codexRecordBlogShare = async (slug, shareType) => api(`/blog/${encodeURIComponent(slug)}/share`, { method: 'POST', body: JSON.stringify({ share_type: shareType }) });
  window.codexRecordBlogView = async (slug) => api(`/blog/${encodeURIComponent(slug)}/view`, { method: 'POST' });
  window.codexHandleWordPressConnect = async () => {
    const result = await api('/wordpress/oauth/start');
    if (typeof result.authorization_url !== 'string' || !result.authorization_url.startsWith('https://public-api.wordpress.com/oauth2/authorize?')) throw new Error('WORDPRESS_OAUTH_START_INVALID');
    window.location.assign(result.authorization_url);
    return result;
  };
  window.codexHandleWordPressOAuthCallback = ({ code, state }) => api('/wordpress/oauth/callback', {
    method: 'POST',
    body: JSON.stringify({ code, state })
  });
  window.codexGetWordPressStatus = async () => api('/owner/wordpress/status');
  window.dispatchEvent(new Event('melsou-blog-api-ready'));
  const supportedStudioSource = (value) => {
    if (typeof value !== 'string') return false;
    if (/^(?:data:image\/(?:jpeg|png|webp|heic|heif);base64,|blob:)/i.test(value)) return true;
    try {
      const url = new URL(value, window.location.origin);
      return url.origin === window.location.origin || url.hostname === 'images.unsplash.com';
    } catch { return false; }
  };
  const studioImageSource = (draft) => {
    const candidates = [
      ...(Array.isArray(draft?.userGallery) ? draft.userGallery : []),
      ...(Array.isArray(draft?.spreads) ? draft.spreads.flatMap((spread) => [
        spread?.coverImg,
        spread?.backImg,
        ...(Array.isArray(spread?.elements) ? spread.elements.filter((item) => item?.type === 'photo').map((item) => item.img) : [])
      ]) : [])
    ];
    return candidates.find(supportedStudioSource) || null;
  };
  const dataUriBody = (value) => {
    const match = /^data:([^;,]+);base64,(.+)$/i.exec(value || '');
    if (!match) throw new Error('INVALID_IMAGE_DATA');
    const binary = atob(match[2]);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return { body: bytes, mimeType: match[1].toLowerCase() };
  };
  const studioImageBody = async (source) => {
    if (!supportedStudioSource(source)) throw new Error('UNSUPPORTED_IMAGE_SOURCE');
    if (source.startsWith('data:')) return dataUriBody(source);
    const response = await fetch(source, { credentials: 'omit', referrerPolicy: 'no-referrer' });
    if (!response.ok) throw new Error('IMAGE_SOURCE_UNAVAILABLE');
    const mimeType = String(response.headers.get('Content-Type') || '').split(';')[0].toLowerCase();
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'].includes(mimeType)) throw new Error('INVALID_IMAGE_TYPE');
    return { body: new Uint8Array(await response.arrayBuffer()), mimeType };
  };
  const sha256Hex = async (bytes) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))).map((value) => value.toString(16).padStart(2, '0')).join('');
  const showError = (message) => window.MelsouAuth?.setLoginState('error', window.getUserFriendlyErrorMessage ? window.getUserFriendlyErrorMessage(message) : message);

  const canonicalPackageCode = (draft) => ({ melody: 'MELODY', voice: 'VOICE', signature: 'SIGNATURE' }[String(draft?.package || '').toLowerCase()] || null);
  function canonicalSpotifyTrack(track) {
    if (!track || !/^[A-Za-z0-9]{22}$/.test(String(track.id || ''))) return null;
    const artists = Array.isArray(track.artists) ? track.artists.map((artist) => typeof artist === 'string' ? artist : artist?.name).filter(Boolean).map(String).slice(0, 10) : String(track.artistName || track.artist || '').split(',').map((item) => item.trim()).filter(Boolean).slice(0, 10);
    if (!artists.length) return null;
    return {
      id: String(track.id), uri: `spotify:track:${track.id}`, url: `https://open.spotify.com/track/${track.id}`,
      name: String(track.name || track.title || '').trim().slice(0, 300), artists,
      artistName: artists.join(', ').slice(0, 500), albumName: String(track.albumName || '').slice(0, 300),
      coverUrl: String(track.coverUrl || track.artwork || track.artworkUrl || '').slice(0, 2000) || null,
      durationMs: Number.isSafeInteger(track.durationMs) ? track.durationMs : null,
      spotifyCodeAssetRef: track.spotifyCodeAssetRef === `spcode_${track.id}_v1` ? track.spotifyCodeAssetRef : null
    };
  }
  const spotifyUiTrack = (track) => ({ ...track, title: track.name, artist: track.artistName, artistNames: track.artists, artwork: track.coverUrl, artworkUrl: track.coverUrl, canonicalUrl: track.url });
  function canonicalSpotifyState(draft) {
    const packageCode = canonicalPackageCode(draft);
    if (!['MELODY', 'SIGNATURE'].includes(packageCode)) return { activeTrack: null, history: [] };
    const activeTrack = canonicalSpotifyTrack(draft?.spotifyCanonical?.activeTrack || draft?.spotifyTrackObj);
    const history = [];
    for (const candidate of [activeTrack, ...(draft?.spotifyCanonical?.history || draft?.spotifyHistory || [])]) {
      const track = canonicalSpotifyTrack(candidate);
      if (track && !history.some((item) => item.id === track.id)) history.push(track);
      if (history.length === 10) break;
    }
    return { activeTrack, history };
  }

  function safeEditorPayload(value) {
    // Do not write a local binary/blob into Postgres JSON. Private Supabase Storage
    // remains the only long-term store for uploaded originals. Layout,
    // typography, text, transforms and remote image URLs are retained here.
    if (typeof value === 'string') return /^(?:data:|blob:)/i.test(value) ? null : value;
    if (Array.isArray(value)) return value.map(safeEditorPayload).filter((item) => item !== null);
    if (!value || typeof value !== 'object') return value;
    if (value instanceof Blob || value instanceof File) return null;
    const output = {};
    for (const [key, item] of Object.entries(value)) {
      // Cart ownership/lifecycle is independent from the editable project.
      // Never mirror a browser cart into a canonical project revision.
      if (key === 'recordedAudioBlob' || key === 'cart') continue;
      const clean = safeEditorPayload(item);
      if (clean !== null) output[key] = clean;
    }
    return output;
  }

  function canonicalTemplate(draft) {
    const requestedTemplate = templateByPackage[draft.package] || 'melsou-editorial';
    const sizeByClass = { 'ratio-portrait': 'A5_PORTRAIT', 'ratio-square': 'SQUARE', 'ratio-landscape': 'A5_LANDSCAPE', compact: 'A6' };
    const size = sizeByClass[draft.sizeClass] || 'A5_PORTRAIT';
    const templateId = size === 'A5_LANDSCAPE' ? 'melsou-editorial' : (requestedTemplate === 'melsou-editorial' ? 'memory-box' : requestedTemplate);
    return { templateId, size };
  }
  const requiredImageSlots = (templateId) => ({
    'first-love': ['image_01'], 'our-graduation': ['image_01', 'image_02'], 'besties-archive': ['image_01', 'image_02'],
    'somewhere-together': ['panorama_01'], 'birthday-letters': ['image_01'], 'quiet-moments': ['image_01'],
    'memory-box': ['image_01'], 'melsou-editorial': ['image_01']
  }[templateId] || ['image_01']);
  function projectDocument() {
    const draft = window.melsouGetActiveDraft?.() || {};
    const bridge = readBridge();
    const { templateId, size } = canonicalTemplate(draft);
    const pageCount = Math.min(24, Math.max(12, Array.isArray(draft.spreads) ? (draft.spreads.length - 2) * 2 + 2 : 12));
    const pages = pageCount <= 12 ? 12 : pageCount <= 16 ? 16 : 24;
    const contentBindings = Object.fromEntries(Object.entries(bridge.slotAssets || {}).filter(([, value]) => value?.assetId).map(([slotId, value]) => [slotId, { asset_id: value.assetId }]));
    if (bridge.primaryAssetId && !contentBindings.image_01) contentBindings.image_01 = { asset_id: bridge.primaryAssetId };
    if (templateId === 'melsou-editorial') contentBindings.headline_01 = { text: String(draft.title || 'Album chưa đặt tên').slice(0, 120) };
    const editorPayload = safeEditorPayload(draft);
    const packageCode = canonicalPackageCode(draft);
    const spotify = canonicalSpotifyState(draft);
    if (packageCode === 'VOICE') {
      for (const key of ['spotifyTrackObj','spotifyTrack','spotifyTrackTitle','spotifyArtist','spotifyUrl','spotifyTrackId','spotifyArtwork','spotifyCodeImg','spotifyEmbed','spotifyCanonical','spotifyHistory']) delete editorPayload[key];
    } else {
      editorPayload.spotifyCanonical = spotify;
      editorPayload.spotifyCodeImg = null;
    }
    // Gallery binaries and temporary preview URLs are reconstructed from the
    // canonical asset records. They never become durable project JSON.
    editorPayload.userGallery = [];
    return {
      schema_version: 1,
      template: { template_id: templateId, version: 1 },
      configuration: { size, pages, packageCode },
      cover: { title: String(draft.title || 'Album chưa đặt tên').slice(0, 120), quote: String(draft.quote || '').slice(0, 500) },
      content_bindings: contentBindings,
      gallery_assets: (bridge.galleryAssets || []).filter((item) => item?.assetId).map((item) => ({ asset_id: item.assetId })),
      spotify,
      options: { spotify_enabled: Boolean(spotify.activeTrack), spotify_url: spotify.activeTrack?.url || null },
      editor_asset_slots: bridge.uiSlotMap || {},
      // The Studio payload is namespaced so the locked V1 document remains valid
      // while the Antigravity UI is progressively migrated to template slots.
      editor_payload: editorPayload
    };
  }

  function draftTitle() {
    return String(window.melsouGetActiveDraft?.()?.title || 'Album chưa đặt tên').trim().slice(0, 120) || 'Album chưa đặt tên';
  }

  let supabaseScriptPromise = null;
  function ensureSupabaseScript() {
    if (typeof window !== 'undefined' && window.supabase?.createClient) return Promise.resolve();
    if (supabaseScriptPromise) return supabaseScriptPromise;
    supabaseScriptPromise = new Promise((resolve, reject) => {
      if (typeof document === 'undefined') return resolve();
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('Không thể tải thư viện đăng nhập.'));
      document.head.appendChild(s);
    });
    return supabaseScriptPromise;
  }

  async function loadClient() {
    if (client) return client;
    await ensureSupabaseScript();
    if (!configPromise) {
      configPromise = api('/public-config').then((config) => {
        if (!config.supabaseUrl || !config.supabaseAnonKey) {
          throw new Error('Đăng nhập Google chưa được cấu hình. Chủ website cần thêm SUPABASE_URL và SUPABASE_ANON_KEY vào Worker.');
        }
        if (!window.supabase?.createClient) throw new Error('Không thể tải thư viện đăng nhập. Vui lòng kiểm tra kết nối Internet rồi thử lại.');
        client = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey, {
          auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
        });
        return client;
      });
    }
    return configPromise;
  }

  async function sessionToken() {
    const supabase = await loadClient();
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session?.access_token || null;
  }

  async function ensureGuestProject() {
    const bridge = readBridge();
    if (bridge.projectId) return bridge;
    const result = await api('/guest/projects', {
      method: 'POST', body: JSON.stringify({ title: draftTitle(), document: projectDocument() })
    });
    const next = { ...bridge, projectId: result.project.id, revision: result.project.revision, ownership: 'guest' };
    writeBridge(next);
    return next;
  }

  async function ensureCanonicalAsset(source, bridge) {
    if (!supportedStudioSource(source)) return { bridge, asset: null };
    const upload = await studioImageBody(source);
    const fingerprint = await sha256Hex(upload.body);
    const known = (bridge.galleryAssets || []).find((item) => item.sourceFingerprint === fingerprint);
    if (known?.assetId) return { bridge, asset: known };
    const path = bridge.ownership === 'account' ? `/projects/${bridge.projectId}/assets` : `/guest/projects/${bridge.projectId}/assets`;
    const response = await fetch(`${apiBase}${path}`, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': upload.mimeType, 'X-Melsou-Expected-Revision': String(bridge.revision || 1) },
      body: upload.body
    });
    const result = await response.json().catch(() => ({}));
    if (response.status === 409 || result.error === 'REVISION_CONFLICT') {
      const conflictData = { error: 'REVISION_CONFLICT', currentRevision: result.currentRevision || result.revision };
      window.melsouOnRevisionConflict?.(conflictData);
      const conflictErr = new Error('REVISION_CONFLICT');
      conflictErr.code = 'REVISION_CONFLICT';
      conflictErr.currentRevision = conflictData.currentRevision;
      throw conflictErr;
    }
    if (!response.ok || !result.asset?.id) {
      const error = new Error(result.error || `ASSET_UPLOAD_FAILED (${response.status})`);
      error.code = result.error || 'ASSET_UPLOAD_FAILED';
      error.status = response.status;
      error.body = result;
      throw error;
    }
    const asset = {
      assetId: result.asset.id,
      sourceFingerprint: fingerprint,
      mimeType: result.asset.mime_type || upload.mimeType,
      width: result.asset.width_px || null,
      height: result.asset.height_px || null
    };
    const nextRevision = Number.isSafeInteger(result.projectRevision) ? result.projectRevision : Number(bridge.revision || 1) + 1;
    const next = { ...bridge, revision: nextRevision, galleryAssets: [...(bridge.galleryAssets || []), asset] };
    writeBridge(next);
    return { bridge: next, asset };
  }

  window.codexUploadGalleryAsset = async (source) => {
    let bridge = await ensureGuestProject();
    const { bridge: updatedBridge, asset } = await ensureCanonicalAsset(source, bridge);
    return { asset, projectRevision: updatedBridge.revision };
  };

  async function persistGalleryAssets(bridge) {
    const gallery = window.melsouGetActiveDraft?.()?.userGallery;
    if (!Array.isArray(gallery)) return bridge;
    let next = bridge;
    for (const source of gallery) {
      if (!supportedStudioSource(source)) continue;
      ({ bridge: next } = await ensureCanonicalAsset(source, next));
    }
    return next;
  }

  async function ensurePrimaryAsset(bridge) {
    const draft = window.melsouGetActiveDraft?.() || {};
    const requiredSlots = requiredImageSlots(canonicalTemplate(draft).templateId);
    const pending = [...pendingSlotSources.entries()];
    if (!pending.length) {
      const slotId = requiredSlots.find((required) => !bridge.slotAssets?.[required]?.assetId) || requiredSlots[0];
      const source = studioImageSource(draft);
      if (source && !(bridge.slotAssets?.[slotId]?.assetId || (slotId === 'image_01' && bridge.primaryAssetId))) pending.push([slotId, source]);
    }
    let next = bridge;
    for (const [slotId, source] of pending) {
      if (!source || !supportedStudioSource(source)) continue;
      const upload = await studioImageBody(source);
      const fingerprint = await sha256Hex(upload.body);
      const existing = next.slotAssets?.[slotId];
      if (existing?.assetId && existing.sourceFingerprint === fingerprint) {
        if (pendingSlotSources.get(slotId) === source) pendingSlotSources.delete(slotId);
        continue;
      }
      const canonical = await ensureCanonicalAsset(source, next);
      next = canonical.bridge;
      next = {
        ...next,
        slotAssets: { ...(next.slotAssets || {}), [slotId]: { assetId: canonical.asset.assetId, sourceFingerprint: fingerprint } },
        ...(slotId === 'image_01' ? { primaryAssetId: canonical.asset.assetId } : {})
      };
      writeBridge(next);
      if (pendingSlotSources.get(slotId) === source) pendingSlotSources.delete(slotId);
    }
    return next;
  }

  async function waitForPrimaryAsset(bridge) {
    const draft = window.melsouGetActiveDraft?.() || {};
    const slotId = requiredImageSlots(canonicalTemplate(draft).templateId)[0];
    const assetId = bridge.slotAssets?.[slotId]?.assetId || (slotId === 'image_01' ? bridge.primaryAssetId : null);
    if (!assetId) throw Object.assign(new Error(`MISSING_REQUIRED_SLOT:${slotId}`), { code: `MISSING_REQUIRED_SLOT:${slotId}` });
    const path = bridge.ownership === 'account' ? `/assets/${assetId}/preview` : `/guest/assets/${assetId}/preview`;
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const response = await fetch(`${apiBase}${path}`, { credentials: 'include' });
      if (response.ok) { await response.body?.cancel(); return; }
      const result = await response.json().catch(() => ({}));
      if (response.status !== 409 || result.error !== 'ASSET_PROCESSING_NOT_READY') throw Object.assign(new Error(result.error || 'ASSET_PROCESSING_FAILED'), { code: result.error || 'ASSET_PROCESSING_FAILED' });
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
    throw Object.assign(new Error('ASSET_PROCESSING_NOT_READY'), { code: 'ASSET_PROCESSING_NOT_READY' });
  }

  async function persistDraftNow() {
    let bridge = await ensureGuestProject();
    bridge = await persistGalleryAssets(bridge);
    bridge = await ensurePrimaryAsset(bridge);
    const token = nativeUser ? null : await sessionToken().catch(() => null);
    const authenticated = Boolean((nativeUser || token) && bridge.ownership === 'account');
    const path = authenticated ? `/projects/${bridge.projectId}` : `/guest/projects/${bridge.projectId}`;
    const response = await fetch(`${apiBase}${path}`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(authenticated && token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ expectedRevision: Number(bridge.revision || 1), document: projectDocument() })
    });
    const result = await response.json().catch(() => ({}));
    if (response.status === 409 || result.error === 'REVISION_CONFLICT') {
      const conflictData = { error: 'REVISION_CONFLICT', currentRevision: result.currentRevision || result.revision };
      window.melsouOnRevisionConflict?.(conflictData);
      const conflictErr = new Error('REVISION_CONFLICT');
      conflictErr.code = 'REVISION_CONFLICT';
      conflictErr.currentRevision = conflictData.currentRevision;
      throw conflictErr;
    }
    if (!response.ok) {
      const error = new Error(result.error || `DRAFT_SAVE_FAILED (${response.status})`);
      error.code = result.error || 'DRAFT_SAVE_FAILED';
      throw error;
    }
    writeBridge({ ...bridge, revision: result.project.revision, ownership: authenticated ? 'account' : 'guest' });
    return result.project;
  }

  function persistDraft() {
    const task = persistQueue.catch(() => {}).then(persistDraftNow);
    persistQueue = task;
    saveInFlight = task;
    return task;
  }

  function schedulePersist() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      saveInFlight = persistDraft().catch((error) => {
        // Autosave failures must not log the user out or destroy their local draft.
        console.warn('[Melsou] draft mirror unavailable:', error.code || error.message);
      });
    }, 700);
  }

  async function claimGuestDraft(session = null) {
    const bridge = readBridge();
    // A returning authenticated visitor must not receive a new empty project
    // merely by opening the site. A guest project is created on an actual draft
    // save or immediately before the user starts OAuth.
    if (!bridge.projectId) return null;
    if (bridge.ownership === 'account') return bridge;
    await persistDraft();
    const result = await api('/guest/projects/claim', {
      method: 'POST', headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}, body: '{}'
    });
    const claimed = Array.isArray(result.projects) ? result.projects.find((project) => project.id === bridge.projectId) : null;
    if (!claimed) throw new Error('Không thể chuyển bản thiết kế vào tài khoản. Bản nháp trên máy vẫn được giữ nguyên; hãy thử lại.');
    const next = { ...bridge, projectId: claimed.id, revision: claimed.revision, ownership: 'account' };
    writeBridge(next);
    return next;
  }

  async function applyAuthenticatedSession(session) {
    if (!session?.user) return;
    await claimGuestDraft(session);
    let role = 'CUSTOMER';
    try {
      const account = await api('/account', { headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {} });
      if (account?.profile?.role) role = String(account.profile.role).toUpperCase();
    } catch {}
    const authData = {
      id: session.user.id,
      name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email,
      email: session.user.email,
      avatar: session.user.user_metadata?.avatar_url || '',
      role
    };
    window.MelsouAuth?.handleAuthSuccess(authData);
    window.codexOnAuthSuccess?.(authData);
  }

  function canonicalSlotForUiSlot(slotKey, bridge) {
    const draft = window.melsouGetActiveDraft?.() || {};
    const required = requiredImageSlots(canonicalTemplate(draft).templateId);
    if (bridge.uiSlotMap?.[slotKey] && required.includes(bridge.uiSlotMap[slotKey])) return bridge.uiSlotMap[slotKey];
    return required.find((slotId) => !bridge.slotAssets?.[slotId]?.assetId && !pendingSlotSources.has(slotId))
      || `placed_${String(slotKey || 'image').replace(/[^a-z0-9_-]/gi, '_').slice(0, 80)}`;
  }

  window.codexSearchSpotifyTracks = async (query) => {
    const result = await api(`/spotify/search?q=${encodeURIComponent(String(query || '').trim())}`);
    return { tracks: (result.tracks || []).map(spotifyUiTrack) };
  };
  window.codexResolveSpotifyTrack = async (url) => {
    const result = await api('/spotify/resolve', { method: 'POST', body: JSON.stringify({ url }) });
    return spotifyUiTrack(result.track);
  };
  window.codexGetSpotifyState = () => canonicalSpotifyState(window.melsouGetActiveDraft?.() || {});
  const selectCanonicalSpotifyTrack = async (track) => {
    const draft = window.melsouGetActiveDraft?.() || {};
    if (!['MELODY', 'SIGNATURE'].includes(canonicalPackageCode(draft))) throw Object.assign(new Error('SPOTIFY_NOT_ALLOWED_FOR_PACKAGE'), { code: 'SPOTIFY_NOT_ALLOWED_FOR_PACKAGE' });
    let activeTrack = canonicalSpotifyTrack(track);
    if (!activeTrack) throw Object.assign(new Error('INVALID_SPOTIFY_SELECTION'), { code: 'INVALID_SPOTIFY_SELECTION' });
    let codeError = null;
    try {
      const generated = await api('/spotify/code', { method: 'POST', body: JSON.stringify({ uri: activeTrack.uri }) });
      activeTrack = { ...activeTrack, spotifyCodeAssetRef: generated.code?.assetRef || null };
      draft.spotifyCodeImg = generated.code?.previewUrl || null;
    } catch (error) {
      codeError = error;
      activeTrack = { ...activeTrack, spotifyCodeAssetRef: null };
      draft.spotifyCodeImg = null;
    }
    const prior = canonicalSpotifyState(draft).history;
    draft.spotifyCanonical = { activeTrack, history: [activeTrack, ...prior.filter((item) => item.id !== activeTrack.id)].slice(0, 10) };
    draft.spotifyHistory = draft.spotifyCanonical.history;
    schedulePersist();
    window.dispatchEvent(new CustomEvent('melsou-spotify-code-updated', { detail: { available: Boolean(activeTrack.spotifyCodeAssetRef), error: codeError?.code || null } }));
    return { ...structuredClone(draft.spotifyCanonical), codeError: codeError?.code || null };
  };
  window.codexSelectSpotifyTrack = selectCanonicalSpotifyTrack;
  window.codexOnSpotifyTrackSelected = selectCanonicalSpotifyTrack;

  window.melsouOnImageAssigned = ({ slotKey, source } = {}) => {
    if (!slotKey || !supportedStudioSource(source)) return;
    const bridge = readBridge();
    const slotId = canonicalSlotForUiSlot(slotKey, bridge);
    writeBridge({ ...bridge, uiSlotMap: { ...(bridge.uiSlotMap || {}), [slotKey]: slotId } });
    pendingSlotSources.set(slotId, source);
    persistDraft().catch((error) => console.warn('[Melsou] assigned image persistence unavailable:', error.code || error.message));
  };

  async function restoreCanonicalProject(authenticated = false) {
    let bridge = readBridge();
    if (authenticated && !bridge.projectId) {
      try {
        const discovery = await api('/projects');
        const selected = (discovery.projects || []).find((project) => project.active === true) || (discovery.projects || [])[0];
        if (selected?.project_id || selected?.id) {
          bridge = {
            projectId: selected.project_id || selected.id,
            revision: selected.revision || 1,
            ownership: 'account'
          };
          writeBridge(bridge);
        }
      } catch (err) {
        console.warn('[Melsou] project discovery unavailable:', err.message);
      }
    }
    if (!bridge.projectId) return null;
    const path = authenticated ? `/projects/${bridge.projectId}` : '/guest/projects';
    const result = await api(path);
    let project = authenticated ? result.project : (result.projects || []).find((item) => item.id === bridge.projectId);
    const legacySource = studioImageSource(window.melsouGetActiveDraft?.() || {});
    if (project && !project.document?.content_bindings?.image_01 && legacySource) {
      pendingSlotSources.set(requiredImageSlots(canonicalTemplate(window.melsouGetActiveDraft?.() || {}).templateId)[0], legacySource);
      await persistDraft();
      const refreshed = await api(authenticated ? `/projects/${bridge.projectId}` : '/guest/projects');
      project = authenticated ? refreshed.project : (refreshed.projects || []).find((item) => item.id === bridge.projectId);
    }
    if (project?.document?.editor_payload) {
      const restoredSlots = Object.fromEntries(Object.entries(project.document.content_bindings || {}).filter(([, binding]) => binding?.asset_id).map(([slotId, binding]) => [slotId, { assetId: binding.asset_id }]));
      const existingSlots = bridge.slotAssets || {};
      const slotAssets = Object.fromEntries(Object.entries(restoredSlots).map(([slotId, value]) => [slotId, existingSlots[slotId]?.assetId === value.assetId ? existingSlots[slotId] : value]));
      const galleryRefs = (project.document.gallery_assets || []).filter((item) => item?.asset_id);
      const nextBridge = {
        ...bridge,
        slotAssets,
        galleryAssets: galleryRefs.map((item) => ({ assetId: item.asset_id })),
        uiSlotMap: { ...(bridge.uiSlotMap || {}), ...(project.document.editor_asset_slots || {}) },
        primaryAssetId: restoredSlots.image_01?.assetId || bridge.primaryAssetId,
        revision: project.revision,
        ownership: authenticated ? 'account' : 'guest'
      };
      writeBridge(nextBridge);
      const hydrated = structuredClone(project.document.editor_payload);
      const restoredSpotify = project.document.spotify;
      if (['MELODY', 'SIGNATURE'].includes(project.document.configuration?.packageCode)) {
        if (restoredSpotify) {
          hydrated.spotifyCanonical = restoredSpotify;
          hydrated.spotifyHistory = restoredSpotify.history || [];
        }
        if (restoredSpotify?.activeTrack) {
          hydrated.spotifyTrackObj = spotifyUiTrack(restoredSpotify.activeTrack);
          hydrated.spotifyTrack = `${restoredSpotify.activeTrack.name} — ${restoredSpotify.activeTrack.artistName}`;
          hydrated.spotifyTrackTitle = restoredSpotify.activeTrack.name;
          hydrated.spotifyArtist = restoredSpotify.activeTrack.artistName;
          hydrated.spotifyUrl = restoredSpotify.activeTrack.url;
          hydrated.spotifyTrackId = restoredSpotify.activeTrack.id;
          hydrated.spotifyArtwork = restoredSpotify.activeTrack.coverUrl;
          hydrated.spotifyCodeImg = restoredSpotify.activeTrack.spotifyCodeAssetRef ? `/api/spotify/code/${encodeURIComponent(restoredSpotify.activeTrack.spotifyCodeAssetRef)}` : null;
        } else {
          hydrated.spotifyTrackObj = null;
          hydrated.spotifyTrack = null;
          hydrated.spotifyTrackTitle = null;
          hydrated.spotifyArtist = null;
          hydrated.spotifyUrl = null;
          hydrated.spotifyTrackId = null;
          hydrated.spotifyArtwork = null;
          hydrated.spotifyCodeImg = null;
        }
      } else {
        hydrated.spotifyCanonical = { activeTrack: null, history: [] };
        hydrated.spotifyHistory = [];
        hydrated.spotifyTrackObj = null;
        hydrated.spotifyTrack = null;
        hydrated.spotifyTrackTitle = null;
        hydrated.spotifyArtist = null;
        hydrated.spotifyUrl = null;
        hydrated.spotifyTrackId = null;
        hydrated.spotifyArtwork = null;
        hydrated.spotifyCodeImg = null;
      }
      hydrated.userGallery = [];
      const assetIds = [...new Set([...galleryRefs.map((item) => item.asset_id), ...Object.values(restoredSlots).map((item) => item.assetId)])];
      const previewSources = new Map();
      for (const assetId of assetIds) {
        const previewPath = authenticated ? `/assets/${assetId}/preview` : `/guest/assets/${assetId}/preview`;
        try {
          const response = await fetch(`${apiBase}${previewPath}`, { credentials: 'include' });
          if (!response.ok) continue;
          previewSources.set(assetId, URL.createObjectURL(await response.blob()));
        } catch {
          // network or transient failure
        }
      }
      hydrated.userGallery = galleryRefs.map((item) => previewSources.get(item.asset_id)).filter(Boolean);
      for (const [slotId, value] of Object.entries(restoredSlots)) {
        const source = previewSources.get(value.assetId);
        if (!source) continue;
        const uiSlot = Object.entries(nextBridge.uiSlotMap || {}).find(([, mapped]) => mapped === slotId)?.[0] || (slotId === 'image_01' ? 'coverImg' : null);
        if (uiSlot === 'coverImg' && hydrated.spreads?.[0]) hydrated.spreads[0].coverImg = source;
        else if (uiSlot === 'backImg' && hydrated.spreads?.length) hydrated.spreads[hydrated.spreads.length - 1].backImg = source;
        else if (uiSlot?.startsWith('el_')) {
          const elementId = uiSlot.slice(3);
          for (const spread of hydrated.spreads || []) {
            const element = spread.elements?.find((item) => String(item.id) === elementId);
            if (element) { element.img = source; break; }
          }
        }
      }
      window.melsouApplyCanonicalDraft?.(hydrated);
    }
    return project || null;
  }

  window.codexListProjects = () => api('/projects');
  window.codexOpenProject = async (projectId) => {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(projectId || ''))) throw new Error('INVALID_PROJECT_ID');
    clearBridge();
    writeBridge({ projectId, ownership: 'account' });
    return restoreCanonicalProject(true);
  };

  async function applyNativeUser(user) {
    nativeUser = user;
    try {
      await claimGuestDraft();
      await restoreCanonicalProject(true);
    } catch (error) {
      // Authentication and draft ownership are separate durable operations.
      // Keep the local guest bridge intact and retry claim on the next session
      // instead of presenting a successful login as an authentication failure.
      console.warn('[Melsou] guest draft claim deferred:', error.code || error.message);
    }
    const role = String(user.role || 'CUSTOMER').toUpperCase();
    window.codexOnAuthSuccess?.({
      id: user.id || user.user_id,
      username: user.username,
      name: user.username,
      email: user.email || '',
      role
    });
  }

  async function nativeAuth(path, credentials) {
    window.MelsouAuth?.setLoginState('authenticating');
    try {
      // A Blog-only visitor does not have an album draft and must not be forced
      // to create one before authenticating. If a real guest draft exists,
      // mirror it best-effort without allowing a transient asset/project error
      // to block the credential request. The bridge remains available for the
      // idempotent post-login claim.
      if (readBridge().projectId) {
        try { await persistDraft(); }
        catch (error) { console.warn('[Melsou] pre-login draft mirror deferred:', error.code || error.message); }
      }
      const result = await api(path, { method: 'POST', body: JSON.stringify(credentials) });
      await applyNativeUser(result.user);
      return result.user;
    } catch (error) {
      // Preserve the structured API code for the UI mapper. The API bridge has
      // already redacted database/provider details from the public response.
      window.codexOnAuthError?.(error);
      throw error;
    }
  }

  window.melsouOnDraftChanged = schedulePersist;
  window.codexHandleNativeRegister = (credentials) => nativeAuth('/auth/native/register', credentials);
  window.codexHandleNativeLogin = (credentials) => nativeAuth('/auth/native/login', credentials);
  window.codexHandleUsernameRegister = window.codexHandleNativeRegister;
  window.codexHandleUsernameLogin = window.codexHandleNativeLogin;
  window.codexHandleGoogleSignIn = async function codexHandleGoogleSignIn() {
    try {
      window.MelsouAuth?.setLoginState('authenticating');
      await loadClient();
      await ensureGuestProject();
      if (saveInFlight) await saveInFlight;
      const supabase = await loadClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}${window.location.pathname}` }
      });
      if (error) throw error;
    } catch (error) {
      console.error('[Melsou] Google sign-in could not start', error);
      showError(error.message || 'Không thể bắt đầu đăng nhập Google. Vui lòng thử lại.');
    }
  };
  window.codexHandleLogout = async function codexHandleLogout() {
    try { await api('/auth/native/logout', { method: 'POST', body: '{}' }); } catch (error) { console.warn('[Melsou] native sign-out request failed', error); }
    nativeUser = null;
    try { await (await loadClient()).auth.signOut(); } catch { /* Google is optional. */ }
    clearBridge();
  };
  window.codexHandleForgotPassword = async ({ email }) => {
    try {
      const result = await api('/auth/recovery/request', { method: 'POST', body: JSON.stringify({ email }) });
      window.MelsouAuth?.setLoginState('idle');
      return result;
    } catch (error) { window.codexOnAuthError?.(error.code === 'RECOVERY_EMAIL_REQUIRED' ? 'Tài khoản chưa liên kết email khôi phục.' : error.message); throw error; }
  };
  window.codexHandleLinkEmail = async ({ email }) => api('/account/email/link', { method: 'POST', body: JSON.stringify({ email }) });
  function checkoutConfiguration() {
    const draft = window.melsouGetActiveDraft?.() || {};
    const packageCode = String(draft.package || 'signature').toUpperCase();
    const sizeByClass = { 'ratio-portrait': 'A5_PORTRAIT', 'ratio-square': 'SQUARE', 'ratio-landscape': 'A5_LANDSCAPE', compact: 'A6' };
    const rawPages = Array.isArray(draft.spreads) ? Math.max(12, (draft.spreads.length - 2) * 2 + 2) : 12;
    return { packageCode, size: sizeByClass[draft.sizeClass] || 'A5_PORTRAIT', pages: rawPages <= 12 ? 12 : rawPages <= 16 ? 16 : 24, twin: false, shipments: 1 };
  }

  window.codexCreateOrder = async function codexCreateOrder({ customer }) {
    if (!nativeUser && !(await sessionToken().catch(() => null))) throw new Error('UNAUTHENTICATED');
    const project = await persistDraft();
    await waitForPrimaryAsset(readBridge());
    const configuration = checkoutConfiguration();
    const orderResult = await api('/orders', {
      method: 'POST',
      headers: { 'Idempotency-Key': `fb90:${project.id}:${project.revision}:${configuration.packageCode}:${configuration.size}:${configuration.pages}` },
      body: JSON.stringify({ projectId: project.id, configuration, shipments: [{ recipient: customer.name, phone: customer.phone, address: customer.address }] })
    });
    const order = Array.isArray(orderResult.order) ? orderResult.order[0] : orderResult.order;
    const paymentResult = await api(`/orders/${order.id}/payment`);
    activeOrder = order;
    return { order, payment: paymentResult.payment };
  };
  window.codexCheckPaymentStatus = async function codexCheckPaymentStatus() {
    if (!activeOrder?.id) throw new Error('ORDER_NOT_CREATED');
    const result = await api(`/orders/${activeOrder.id}`);
    activeOrder = result.order;
    return result.order;
  };

  const initAuthSession = async () => {
    try {
      const account = await api('/account');
      if (account?.auth?.provider === 'NATIVE') {
        await applyNativeUser({
          id: account.profile?.user_id,
          username: account.auth.username,
          email: account.auth.email,
          role: account.profile?.role || 'CUSTOMER'
        });
        return;
      }
    } catch (error) {
      if (error.status !== 401) console.info('[Melsou] native session unavailable:', error.message);
    }
    try { await restoreCanonicalProject(false); }
    catch (error) { console.info('[Melsou] guest draft restore deferred:', error.code || error.message); }
    const hasSupabaseTokens = typeof window !== 'undefined' && (
      (window.location.hash && window.location.hash.includes('access_token')) ||
      (window.location.search && window.location.search.includes('code=')) ||
      (typeof localStorage !== 'undefined' && Object.keys(localStorage || {}).some(k => k.startsWith('sb-')))
    );
    if (!hasSupabaseTokens) return;
    try {
      const supabase = await loadClient();
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      if (data.session) await applyAuthenticatedSession(data.session);
      supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT') {
          clearBridge();
          return;
        }
        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
          applyAuthenticatedSession(session).catch((error) => showError(error.message));
        }
      });
    } catch (error) {
      console.info('[Melsou] OAuth bridge inactive:', error.message);
    }
  };

  if (typeof document !== 'undefined' && document.readyState === 'loading') {
    if ('requestIdleCallback' in window) {
      window.addEventListener('load', () => requestIdleCallback(initAuthSession, { timeout: 4000 }));
    } else {
      window.addEventListener('load', () => setTimeout(initAuthSession, 2500));
    }
  } else {
    initAuthSession();
  }
})();
