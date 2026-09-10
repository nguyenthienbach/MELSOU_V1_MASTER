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
  let nativeUser = null;
  let activeOrder = null;

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
  const studioImageSource = (draft) => {
    const candidates = [
      ...(Array.isArray(draft?.userGallery) ? draft.userGallery : []),
      ...(Array.isArray(draft?.spreads) ? draft.spreads.flatMap((spread) => [
        spread?.coverImg,
        spread?.backImg,
        ...(Array.isArray(spread?.elements) ? spread.elements.filter((item) => item?.type === 'photo').map((item) => item.img) : [])
      ]) : [])
    ];
    return candidates.find((value) => {
      if (typeof value !== 'string') return false;
      if (/^(?:data:image\/(?:jpeg|png|webp|heic|heif);base64,|blob:)/i.test(value)) return true;
      try { return new URL(value, window.location.origin).hostname === 'images.unsplash.com'; } catch { return false; }
    }) || null;
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
    if (source.startsWith('data:')) return dataUriBody(source);
    const response = await fetch(source, { credentials: 'omit', referrerPolicy: 'no-referrer' });
    if (!response.ok) throw new Error('IMAGE_SOURCE_UNAVAILABLE');
    const mimeType = String(response.headers.get('Content-Type') || '').split(';')[0].toLowerCase();
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'].includes(mimeType)) throw new Error('INVALID_IMAGE_TYPE');
    return { body: new Uint8Array(await response.arrayBuffer()), mimeType };
  };
  const showError = (message) => window.MelsouAuth?.setLoginState('error', message);

  function safeEditorPayload(value) {
    // Do not write a local binary/blob into Postgres JSON. Private Supabase Storage
    // remains the only long-term store for uploaded originals. Layout,
    // typography, text, transforms and remote image URLs are retained here.
    if (typeof value === 'string') return value.startsWith('data:') ? null : value;
    if (Array.isArray(value)) return value.map(safeEditorPayload);
    if (!value || typeof value !== 'object') return value;
    if (value instanceof Blob || value instanceof File) return null;
    const output = {};
    for (const [key, item] of Object.entries(value)) {
      if (key === 'recordedAudioBlob') continue;
      const clean = safeEditorPayload(item);
      if (clean !== null) output[key] = clean;
    }
    return output;
  }

  function projectDocument() {
    const draft = window.melsouGetActiveDraft?.() || {};
    const bridge = readBridge();
    const requestedTemplate = templateByPackage[draft.package] || 'melsou-editorial';
    const pageCount = Math.min(24, Math.max(12, Array.isArray(draft.spreads) ? draft.spreads.length * 2 : 12));
    const pages = pageCount <= 12 ? 12 : pageCount <= 16 ? 16 : 24;
    const sizeByClass = { 'ratio-portrait': 'A5_PORTRAIT', 'ratio-square': 'SQUARE', 'ratio-landscape': 'A5_LANDSCAPE', compact: 'A6' };
    const size = sizeByClass[draft.sizeClass] || 'A5_PORTRAIT';
    const templateId = size === 'A5_LANDSCAPE' ? 'melsou-editorial' : (requestedTemplate === 'melsou-editorial' ? 'memory-box' : requestedTemplate);
    const contentBindings = bridge.primaryAssetId ? { image_01: { asset_id: bridge.primaryAssetId } } : {};
    if (templateId === 'melsou-editorial') contentBindings.headline_01 = { text: String(draft.title || 'Album chưa đặt tên').slice(0, 120) };
    return {
      schema_version: 1,
      template: { template_id: templateId, version: 1 },
      configuration: { size, pages },
      cover: { title: String(draft.title || 'Album chưa đặt tên').slice(0, 120), quote: String(draft.quote || '').slice(0, 500) },
      content_bindings: contentBindings,
      // The Studio payload is namespaced so the locked V1 document remains valid
      // while the Antigravity UI is progressively migrated to template slots.
      editor_payload: safeEditorPayload(draft)
    };
  }

  function draftTitle() {
    return String(window.melsouGetActiveDraft?.()?.title || 'Album chưa đặt tên').trim().slice(0, 120) || 'Album chưa đặt tên';
  }

  async function loadClient() {
    if (client) return client;
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
    const next = { projectId: result.project.id, revision: result.project.revision, ownership: 'guest' };
    writeBridge(next);
    return next;
  }

  async function ensurePrimaryAsset(bridge) {
    if (bridge.primaryAssetId) return bridge;
    const source = studioImageSource(window.melsouGetActiveDraft?.() || {});
    if (!source) return bridge;
    const upload = await studioImageBody(source);
    const path = bridge.ownership === 'account' ? `/projects/${bridge.projectId}/assets` : `/guest/projects/${bridge.projectId}/assets`;
    const response = await fetch(`${apiBase}${path}`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': upload.mimeType }, body: upload.body });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.asset?.id) {
      const error = new Error(result.error || `ASSET_UPLOAD_FAILED (${response.status})`);
      error.code = result.error || 'ASSET_UPLOAD_FAILED';
      throw error;
    }
    const next = { ...bridge, primaryAssetId: result.asset.id };
    writeBridge(next);
    return next;
  }

  async function waitForPrimaryAsset(bridge) {
    if (!bridge.primaryAssetId) throw Object.assign(new Error('MISSING_REQUIRED_SLOT:image_01'), { code: 'MISSING_REQUIRED_SLOT:image_01' });
    const path = bridge.ownership === 'account' ? `/assets/${bridge.primaryAssetId}/preview` : `/guest/assets/${bridge.primaryAssetId}/preview`;
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const response = await fetch(`${apiBase}${path}`, { credentials: 'include' });
      if (response.ok) { await response.body?.cancel(); return; }
      const result = await response.json().catch(() => ({}));
      if (response.status !== 409 || result.error !== 'ASSET_PROCESSING_NOT_READY') throw Object.assign(new Error(result.error || 'ASSET_PROCESSING_FAILED'), { code: result.error || 'ASSET_PROCESSING_FAILED' });
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
    throw Object.assign(new Error('ASSET_PROCESSING_NOT_READY'), { code: 'ASSET_PROCESSING_NOT_READY' });
  }

  async function persistDraft() {
    let bridge = await ensureGuestProject();
    bridge = await ensurePrimaryAsset(bridge);
    const token = nativeUser ? null : await sessionToken().catch(() => null);
    const authenticated = Boolean((nativeUser || token) && bridge.ownership === 'account');
    const path = authenticated ? `/projects/${bridge.projectId}` : `/guest/projects/${bridge.projectId}`;
    const result = await api(path, {
      method: 'PUT',
      headers: authenticated ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify({ expectedRevision: Number(bridge.revision || 1), document: projectDocument() })
    });
    writeBridge({ ...bridge, revision: result.project.revision, ownership: authenticated ? 'account' : 'guest' });
    return result.project;
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
    window.MelsouAuth.handleAuthSuccess({
      id: session.user.id,
      name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email,
      email: session.user.email,
      avatar: session.user.user_metadata?.avatar_url || ''
    });
  }

  async function restoreCanonicalProject(authenticated = false) {
    const bridge = readBridge();
    if (!bridge.projectId) return;
    const path = authenticated ? `/projects/${bridge.projectId}` : '/guest/projects';
    const result = await api(path);
    const project = authenticated ? result.project : (result.projects || []).find((item) => item.id === bridge.projectId);
    if (project?.document?.editor_payload) {
      window.melsouApplyCanonicalDraft?.(project.document.editor_payload);
      writeBridge({ ...bridge, revision: project.revision, ownership: authenticated ? 'account' : 'guest' });
    }
  }

  async function applyNativeUser(user) {
    nativeUser = user;
    await claimGuestDraft();
    await restoreCanonicalProject(true);
    window.codexOnAuthSuccess?.({ id: user.id, username: user.username, name: user.username, email: user.email || '' });
  }

  async function nativeAuth(path, credentials) {
    window.MelsouAuth?.setLoginState('authenticating');
    try {
      await ensureGuestProject();
      await persistDraft();
      const result = await api(path, { method: 'POST', body: JSON.stringify(credentials) });
      await applyNativeUser(result.user);
      return result.user;
    } catch (error) {
      window.codexOnAuthError?.(error.code === 'RATE_LIMIT_NOT_CONFIGURED' ? 'Máy chủ chưa cấu hình chống brute-force.' : (error.message || 'Không thể xác thực.'));
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
    const rawPages = Array.isArray(draft.spreads) ? draft.spreads.length * 2 : 12;
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

  (async () => {
    try {
      await restoreCanonicalProject(false);
      const account = await api('/account');
      if (account?.auth?.provider === 'NATIVE') {
        await applyNativeUser({ id: account.profile?.user_id, username: account.auth.username, email: account.auth.email });
        return;
      }
    } catch (error) {
      if (error.status !== 401) console.info('[Melsou] native session unavailable:', error.message);
    }
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
      // No configuration is expected on an unconfigured local demo. Keep the
      // editor usable as a guest and surface a precise error only on sign-in.
      console.info('[Melsou] OAuth bridge inactive:', error.message);
    }
  })();
})();
