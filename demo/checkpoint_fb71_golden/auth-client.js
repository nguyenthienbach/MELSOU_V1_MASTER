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
  const showError = (message) => window.MelsouAuth?.setLoginState('error', message);

  function safeEditorPayload(value) {
    // Do not write a local binary/blob into Postgres JSON. The existing R2 asset
    // pipeline remains the only long-term store for uploaded originals. Layout,
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
    const templateId = templateByPackage[draft.package] || 'melsou-editorial';
    return {
      schema_version: 1,
      template: { template_id: templateId, version: 1 },
      configuration: { format: draft.sizeClass || 'ratio-portrait', pages: Array.isArray(draft.spreads) ? draft.spreads.length * 2 : 12 },
      cover: { title: String(draft.title || 'Album chưa đặt tên').slice(0, 120), quote: String(draft.quote || '').slice(0, 500) },
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

  async function persistDraft() {
    const bridge = await ensureGuestProject();
    const token = await sessionToken().catch(() => null);
    const authenticated = Boolean(token && bridge.ownership === 'account');
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

  async function claimGuestDraft(session) {
    const bridge = readBridge();
    // A returning authenticated visitor must not receive a new empty project
    // merely by opening the site. A guest project is created on an actual draft
    // save or immediately before the user starts OAuth.
    if (!bridge.projectId) return null;
    if (bridge.ownership === 'account') return bridge;
    await persistDraft();
    const result = await api('/guest/projects/claim', {
      method: 'POST', headers: { Authorization: `Bearer ${session.access_token}` }, body: '{}'
    });
    const claimed = Array.isArray(result.projects) ? result.projects.find((project) => project.id === bridge.projectId) : null;
    if (!claimed) throw new Error('Không thể chuyển bản thiết kế vào tài khoản. Bản nháp trên máy vẫn được giữ nguyên; hãy thử lại.');
    const next = { projectId: claimed.id, revision: claimed.revision, ownership: 'account' };
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

  window.melsouOnDraftChanged = schedulePersist;
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
    try { await (await loadClient()).auth.signOut(); } catch (error) { console.warn('[Melsou] sign-out request failed', error); }
    clearBridge();
  };

  (async () => {
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
