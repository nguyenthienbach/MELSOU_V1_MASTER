import { createQuote, DEFAULT_PRICING_RULES } from './quote.mjs';
import { runPreflight } from './preflight.mjs';
import { processOperations } from './operations.mjs';
import { processRenderJobs } from './renderer.mjs';
import { assertDraftAssetQuota, assertUploadSize, inspectUploadedImage, processAssetJobs } from './image-processing.mjs';

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
const textEncoder = new TextEncoder();
const timeSafeEqual = (a, b) => {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i += 1) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
};

const sha256 = async (bytes) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map((item) => item.toString(16).padStart(2, '0')).join('');
const supabaseHeaders = (env) => ({ apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json' });
const allowedTemplates = new Set(['first-love', 'our-graduation', 'besties-archive', 'somewhere-together', 'birthday-letters', 'quiet-moments', 'memory-box', 'melsou-editorial']);
const guestCookieName = 'melsou_guest_v1';
const readCookie = (request, name) => Object.fromEntries((request.headers.get('Cookie') || '').split(';').map((part) => part.trim().split('=').map(decodeURIComponent)).filter(([key, value]) => key && value))[name] || null;
const guestCookie = (value, secure) => `${guestCookieName}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=1209600${secure ? '; Secure' : ''}`;
const withCookie = (response, cookie) => { const headers = new Headers(response.headers); headers.append('Set-Cookie', cookie); return new Response(response.body, { status: response.status, statusText: response.statusText, headers }); };
const validProjectDocument = (document) => document && typeof document === 'object' && allowedTemplates.has(document?.template?.template_id || document?.template_id);

async function activePricing(env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return { version: 0, rules: DEFAULT_PRICING_RULES };
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/pricing_versions?active=eq.true&select=version,rules&order=version.desc&limit=1`, { headers: supabaseHeaders(env) });
  if (!response.ok) return null;
  const [pricing] = await response.json();
  return pricing || null;
}

async function authenticatedUser(request, env) {
  const token = request.headers.get('Authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token || !env.SUPABASE_URL) return null;
  const response = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, { headers: { Authorization: `Bearer ${token}`, apikey: env.SUPABASE_ANON_KEY || '' } });
  if (!response.ok) return null;
  const user = await response.json();
  if (env.OWNER_EMAIL && user.email?.toLowerCase() === env.OWNER_EMAIL.toLowerCase()) {
    await fetch(`${env.SUPABASE_URL}/rest/v1/profiles?user_id=eq.${user.id}`, { method: 'PATCH', headers: supabaseHeaders(env), body: JSON.stringify({ role: 'OWNER' }) });
  }
  return user;
}

async function ownedProject(projectId, userId, env) {
  const query = new URLSearchParams({ id: `eq.${projectId}`, owner_user_id: `eq.${userId}`, select: 'id,revision,document,template_id,template_version' });
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/projects?${query}`, { headers: supabaseHeaders(env) });
  if (!response.ok) return null;
  const rows = await response.json();
  return rows.length === 1 ? rows[0] : null;
}

async function guestSession(request) {
  const existing = readCookie(request, guestCookieName);
  if (existing && /^[a-f0-9]{64}$/i.test(existing)) return { raw: existing, isNew: false };
  return { raw: `${crypto.randomUUID().replaceAll('-', '')}${crypto.randomUUID().replaceAll('-', '')}`, isNew: true };
}

async function handleGuestProjects(request, env) {
  const session = await guestSession(request); const sessionHash = await sha256(textEncoder.encode(session.raw));
  if (request.method === 'GET') {
    const response = await fetch(`${env.SUPABASE_URL}/rest/v1/projects?owner_user_id=is.null&guest_session_hash=eq.${sessionHash}&trashed_at=is.null&select=id,title,template_id,template_version,document,revision,last_activity_at&order=last_activity_at.desc`, { headers: supabaseHeaders(env) });
    if (!response.ok) return json({ error: 'GUEST_DRAFTS_UNAVAILABLE' }, 503);
    const result = json({ projects: await response.json() }); return session.isNew ? withCookie(result, guestCookie(session.raw, new URL(request.url).protocol === 'https:')) : result;
  }
  let input;
  try { input = await request.json(); } catch { return json({ error: 'INVALID_JSON' }, 400); }
  if (!validProjectDocument(input?.document)) return json({ error: 'INVALID_PROJECT_DOCUMENT' }, 400);
  const title = typeof input?.title === 'string' ? input.title.trim().slice(0, 120) : 'Album chưa đặt tên';
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/projects`, { method: 'POST', headers: { ...supabaseHeaders(env), Prefer: 'return=representation' }, body: JSON.stringify({ guest_session_hash: sessionHash, title: title || 'Album chưa đặt tên', template_id: input.document.template?.template_id || input.document.template_id, template_version: Number.isSafeInteger(input.document.template?.version) ? input.document.template.version : 1, document: input.document }) });
  if (!response.ok) return json({ error: 'GUEST_PROJECT_CREATE_FAILED' }, 503);
  return withCookie(json({ project: (await response.json())[0] }, 201), guestCookie(session.raw, new URL(request.url).protocol === 'https:'));
}

async function handleGuestProjectSave(request, env, projectId) {
  const session = await guestSession(request); if (session.isNew) return json({ error: 'GUEST_SESSION_NOT_FOUND' }, 404);
  let input;
  try { input = await request.json(); } catch { return json({ error: 'INVALID_JSON' }, 400); }
  if (!Number.isSafeInteger(input?.expectedRevision) || !validProjectDocument(input?.document)) return json({ error: 'INVALID_PROJECT_DOCUMENT' }, 400);
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/melsou_save_guest_project`, { method: 'POST', headers: supabaseHeaders(env), body: JSON.stringify({ p_project_id: projectId, p_guest_session_hash: await sha256(textEncoder.encode(session.raw)), p_expected_revision: input.expectedRevision, p_document: input.document }) });
  if (!response.ok) return json({ error: 'GUEST_PROJECT_SAVE_FAILED' }, 503);
  const project = await response.json(); return project?.conflict ? json({ error: 'REVISION_CONFLICT', currentRevision: project.revision }, 409) : json({ project });
}

async function handleGuestClaim(request, env) {
  const user = await authenticatedUser(request, env); if (!user) return json({ error: 'UNAUTHENTICATED' }, 401);
  const session = await guestSession(request); if (session.isNew) return json({ projects: [] });
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/melsou_claim_guest_projects`, { method: 'POST', headers: supabaseHeaders(env), body: JSON.stringify({ p_owner_id: user.id, p_guest_session_hash: await sha256(textEncoder.encode(session.raw)) }) });
  if (!response.ok) return json({ error: 'GUEST_CLAIM_FAILED' }, 503);
  return withCookie(json({ projects: await response.json() }), `${guestCookieName}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${new URL(request.url).protocol === 'https:' ? '; Secure' : ''}`);
}

async function editableProject(projectId, userId, env) {
  const owned = await ownedProject(projectId, userId, env);
  if (owned) return owned;
  const member = await fetch(`${env.SUPABASE_URL}/rest/v1/project_duo_members?project_id=eq.${projectId}&user_id=eq.${userId}&active=eq.true&select=project_id`, { headers: supabaseHeaders(env) });
  if (!member.ok || !(await member.json()).length) return null;
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/projects?id=eq.${projectId}&select=id,revision,document,template_id,template_version`, { headers: supabaseHeaders(env) });
  if (!response.ok) return null;
  const [project] = await response.json(); return project || null;
}

async function handleProjectCreate(request, env) {
  const user = await authenticatedUser(request, env);
  if (!user) return json({ error: 'UNAUTHENTICATED' }, 401);
  let input;
  try { input = await request.json(); } catch { return json({ error: 'INVALID_JSON' }, 400); }
  const document = input?.document;
  const templateId = document?.template?.template_id || document?.template_id;
  const title = typeof input?.title === 'string' ? input.title.trim().slice(0, 120) : 'Album chưa đặt tên';
  if (!document || typeof document !== 'object' || !allowedTemplates.has(templateId)) return json({ error: 'INVALID_PROJECT_DOCUMENT' }, 400);
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/projects`, {
    method: 'POST', headers: { ...supabaseHeaders(env), Prefer: 'return=representation' },
    body: JSON.stringify({ owner_user_id: user.id, title: title || 'Album chưa đặt tên', template_id: templateId, template_version: Number.isSafeInteger(document?.template?.version) ? document.template.version : 1, document })
  });
  if (!response.ok) return json({ error: 'PROJECT_CREATE_FAILED' }, 503);
  return json({ project: (await response.json())[0] }, 201);
}

async function handleProjectSave(request, env, projectId) {
  const user = await authenticatedUser(request, env);
  if (!user) return json({ error: 'UNAUTHENTICATED' }, 401);
  let input;
  try { input = await request.json(); } catch { return json({ error: 'INVALID_JSON' }, 400); }
  if (!Number.isSafeInteger(input?.expectedRevision) || !input.document || typeof input.document !== 'object') return json({ error: 'INVALID_PROJECT_DOCUMENT' }, 400);
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/melsou_save_project`, {
    method: 'POST', headers: supabaseHeaders(env), body: JSON.stringify({ p_project_id: projectId, p_owner_user_id: user.id, p_expected_revision: input.expectedRevision, p_document: input.document })
  });
  if (!response.ok) return json({ error: 'PROJECT_SAVE_FAILED' }, 500);
  const result = await response.json();
  if (result?.conflict === true) return json({ error: 'REVISION_CONFLICT', currentRevision: result.revision }, 409);
  return json({ project: result });
}

async function handleAssetUpload(request, env, projectId, ctx) {
  const user = await authenticatedUser(request, env);
  if (!user) return json({ error: 'UNAUTHENTICATED' }, 401);
  if (!env.MELSOU_ASSETS) return json({ error: 'ASSET_STORAGE_NOT_CONFIGURED' }, 503);
  if (!env.IMAGES) return json({ error: 'IMAGE_PROCESSOR_NOT_CONFIGURED' }, 503);
  const project = await editableProject(projectId, user.id, env);
  if (!project) return json({ error: 'PROJECT_NOT_FOUND' }, 404);
  const declaredLength = Number(request.headers.get('Content-Length') || 0);
  if (declaredLength > 8 * 1024 * 1024) return json({ error: 'ASSET_TOO_LARGE' }, 413);
  const bytes = await request.arrayBuffer();
  try { assertUploadSize(bytes.byteLength, declaredLength); }
  catch (error) { return json({ error: error.code || 'ASSET_TOO_LARGE' }, 413); }
  let decoded;
  try { decoded = await inspectUploadedImage(bytes, env.IMAGES, request.headers.get('Content-Type')); }
  catch (error) {
    const code = error.code || 'IMAGE_DECODE_FAILED';
    return json({ error: code }, code === 'IMAGE_DIMENSIONS_UNSAFE' ? 413 : code === 'IMAGE_PROCESSOR_NOT_CONFIGURED' ? 503 : 415);
  }
  const quotaResponse = await fetch(`${env.SUPABASE_URL}/rest/v1/project_assets?project_id=eq.${projectId}&select=file_size`, { headers: supabaseHeaders(env) });
  if (!quotaResponse.ok) return json({ error: 'ASSET_QUOTA_CHECK_FAILED' }, 503);
  const existing = await quotaResponse.json();
  try { assertDraftAssetQuota(existing, bytes.byteLength); }
  catch (error) { return json({ error: error.code || 'DRAFT_STORAGE_LIMIT_REACHED' }, 413); }
  const assetId = crypto.randomUUID();
  const storageKey = `projects/${projectId}/assets/${assetId}/original`;
  await env.MELSOU_ASSETS.put(storageKey, bytes, { httpMetadata: { contentType: decoded.mimeType, cacheControl: 'private, no-store' } });
  const insert = await fetch(`${env.SUPABASE_URL}/rest/v1/project_assets`, {
    method: 'POST', headers: { ...supabaseHeaders(env), Prefer: 'return=representation' },
    body: JSON.stringify({ id: assetId, project_id: projectId, storage_key: storageKey, mime_type: decoded.mimeType, file_size: bytes.byteLength, width_px: decoded.width, height_px: decoded.height, checksum: await sha256(bytes), status: 'ORIGINAL_ONLY', processing_state: 'PENDING', processing_retry_count: 0 })
  });
  if (!insert.ok) { await env.MELSOU_ASSETS.delete(storageKey); return json({ error: 'ASSET_METADATA_SAVE_FAILED' }, 503); }
  const asset = (await insert.json())[0];
  ctx?.waitUntil?.(processAssetJobs(env, 1, assetId));
  return json({ asset }, 201);
}

async function handleAssetDownload(request, env, assetId) {
  const user = await authenticatedUser(request, env);
  if (!user) return json({ error: 'UNAUTHENTICATED' }, 401);
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/project_assets?id=eq.${assetId}&select=id,storage_key,mime_type,project:projects!inner(owner_user_id)`, { headers: supabaseHeaders(env) });
  if (!response.ok) return json({ error: 'ASSET_LOOKUP_FAILED' }, 503);
  const [asset] = await response.json();
  if (!asset || asset.project?.owner_user_id !== user.id) return json({ error: 'ASSET_NOT_FOUND' }, 404);
  const object = await env.MELSOU_ASSETS.get(asset.storage_key);
  if (!object) return json({ error: 'ASSET_MISSING' }, 404);
  return new Response(object.body, { headers: { 'Content-Type': asset.mime_type, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } });
}

async function handleAssetPreview(request, env, assetId) {
  const user = await authenticatedUser(request, env);
  if (!user) return json({ error: 'UNAUTHENTICATED' }, 401);
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/project_assets?id=eq.${assetId}&select=id,preview_key,preview_mime_type,processing_state,project:projects!inner(owner_user_id)`, { headers: supabaseHeaders(env) });
  if (!response.ok) return json({ error: 'ASSET_LOOKUP_FAILED' }, 503);
  const [asset] = await response.json();
  if (!asset || asset.project?.owner_user_id !== user.id) return json({ error: 'ASSET_NOT_FOUND' }, 404);
  if (asset.processing_state !== 'READY' || !asset.preview_key) return json({ error: 'ASSET_PREVIEW_NOT_READY', processingState: asset.processing_state }, 409);
  const object = await env.MELSOU_ASSETS.get(asset.preview_key);
  if (!object) return json({ error: 'ASSET_PREVIEW_MISSING' }, 404);
  return new Response(object.body, { headers: { 'Content-Type': asset.preview_mime_type || 'image/webp', 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } });
}

async function handleCreateOrder(request, env) {
  const user = await authenticatedUser(request, env);
  if (!user) return json({ error: 'UNAUTHENTICATED' }, 401);
  let input;
  try { input = await request.json(); } catch { return json({ error: 'INVALID_JSON' }, 400); }
  if (!/^[0-9a-f-]{36}$/i.test(String(input?.projectId || '')) || !Array.isArray(input?.shipments)) return json({ error: 'INVALID_ORDER_REQUEST' }, 400);
  const project = await ownedProject(input.projectId, user.id, env);
  if (!project) return json({ error: 'PROJECT_NOT_FOUND' }, 404);
  const [pricing, assetResponse, profileResponse] = await Promise.all([
    activePricing(env),
    fetch(`${env.SUPABASE_URL}/rest/v1/project_assets?project_id=eq.${input.projectId}&select=id,status,processing_state,normalized_key,normalized_mime_type,normalized_width_px,normalized_height_px`, { headers: supabaseHeaders(env) }),
    fetch(`${env.SUPABASE_URL}/rest/v1/print_profiles?production_ready=eq.true&select=production_ready,configuration&order=created_at.desc&limit=1`, { headers: supabaseHeaders(env) })
  ]);
  if (!pricing) return json({ error: 'ACTIVE_PRICING_UNAVAILABLE' }, 503);
  let quote;
  try { quote = createQuote(input.configuration, pricing.rules); } catch { return json({ error: 'INVALID_QUOTE_CONFIGURATION' }, 400); }
  if (input.shipments.length !== quote.shipments || input.shipments.some((shipment) => !shipment || typeof shipment !== 'object')) return json({ error: 'INVALID_SHIPMENTS' }, 400);
  if (!assetResponse.ok || !profileResponse.ok) return json({ error: 'PREFLIGHT_LOOKUP_FAILED' }, 503);
  const [assets, profiles] = await Promise.all([assetResponse.json(), profileResponse.json()]);
  const preflight = runPreflight({ document: project.document, assets, printProfile: profiles[0] || null });
  if (preflight.status === 'BLOCKING_ERROR') return json({ error: 'PREFLIGHT_BLOCKING_ERROR', preflight }, 409);
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/melsou_create_order`, {
    method: 'POST', headers: supabaseHeaders(env), body: JSON.stringify({ p_customer_id: user.id, p_project_id: input.projectId, p_package_code: quote.packageCode, p_quote: quote, p_shipments: input.shipments, p_preflight: preflight })
  });
  if (!response.ok) {
    const details = await response.text();
    return json({ error: details.includes('TBD_PRINT_VENDOR') ? 'PRINT_PROFILE_NOT_READY' : 'ORDER_CREATION_FAILED' }, details.includes('TBD_PRINT_VENDOR') ? 409 : 500);
  }
  return json({ order: await response.json() }, 201);
}

async function handlePrepressApproval(request, env, orderId) {
  const user = await authenticatedUser(request, env);
  if (!user) return json({ error: 'UNAUTHENTICATED' }, 401);
  let input = {};
  try { input = await request.json(); } catch { /* note is optional */ }
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/melsou_approve_prepress`, {
    method: 'POST', headers: supabaseHeaders(env), body: JSON.stringify({ p_owner_id: user.id, p_order_id: orderId, p_note: typeof input.note === 'string' ? input.note.slice(0, 1000) : '' })
  });
  if (!response.ok) return json({ error: 'PREPRESS_APPROVAL_DENIED' }, response.status === 401 || response.status === 403 ? 403 : 409);
  return json({ order: await response.json() });
}

async function handleDuoInvite(request, env, projectId) {
  const user = await authenticatedUser(request, env);
  if (!user) return json({ error: 'UNAUTHENTICATED' }, 401);
  if (!await ownedProject(projectId, user.id, env)) return json({ error: 'PROJECT_NOT_FOUND' }, 404);
  let input = {};
  try { input = await request.json(); } catch { /* sensible default expiry */ }
  const hours = Math.max(1, Math.min(168, Number.isSafeInteger(input?.expiresInHours) ? input.expiresInHours : 48));
  const token = crypto.randomUUID().replaceAll('-', '') + crypto.randomUUID().replaceAll('-', '');
  const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/project_duo_invites`, { method: 'POST', headers: { ...supabaseHeaders(env), Prefer: 'return=representation' }, body: JSON.stringify({ project_id: projectId, token_hash: await sha256(textEncoder.encode(token)), created_by: user.id, expires_at: expiresAt }) });
  if (!response.ok) return json({ error: 'DUO_INVITE_CREATE_FAILED' }, 503);
  return json({ invite: { url: new URL(`/?duo=${token}`, request.url).toString(), expiresAt } }, 201);
}

async function handleDuoAccept(request, env) {
  const user = await authenticatedUser(request, env);
  if (!user) return json({ error: 'UNAUTHENTICATED' }, 401);
  let input;
  try { input = await request.json(); } catch { return json({ error: 'INVALID_JSON' }, 400); }
  if (typeof input?.token !== 'string' || !/^[a-f0-9]{64}$/i.test(input.token)) return json({ error: 'INVALID_DUO_INVITE' }, 400);
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/melsou_accept_duo_invite`, { method: 'POST', headers: supabaseHeaders(env), body: JSON.stringify({ p_user_id: user.id, p_token_hash: await sha256(textEncoder.encode(input.token)) }) });
  if (!response.ok) return json({ error: 'DUO_INVITE_REJECTED' }, 409);
  return json({ collaboration: await response.json() });
}

async function handleOwnerOrders(request, env) {
  const user = await authenticatedUser(request, env);
  if (!user) return json({ error: 'UNAUTHENTICATED' }, 401);
  const roleResponse = await fetch(`${env.SUPABASE_URL}/rest/v1/profiles?user_id=eq.${user.id}&select=role`, { headers: supabaseHeaders(env) });
  const [profile] = roleResponse.ok ? await roleResponse.json() : [];
  if (profile?.role !== 'OWNER') return json({ error: 'OWNER_REQUIRED' }, 403);
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/orders?select=id,order_code,status,expected_amount_vnd,created_at,production_snapshots(template_id),shipments(status,tracking_code)&order=created_at.desc&limit=100`, { headers: supabaseHeaders(env) });
  if (!response.ok) return json({ error: 'OWNER_ORDERS_UNAVAILABLE' }, 503);
  return json({ orders: await response.json() });
}

async function handleTracking(env, orderCode) {
  if (!/^MEL[MVS]-\d{4}-\d{3,}$/i.test(orderCode)) return json({ error: 'INVALID_ORDER_CODE' }, 400);
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/orders?order_code=eq.${encodeURIComponent(orderCode.toUpperCase())}&select=order_code,status,shipments(status,carrier,tracking_code,tracking_url)&limit=1`, { headers: supabaseHeaders(env) });
  if (!response.ok) return json({ error: 'TRACKING_UNAVAILABLE' }, 503);
  const [order] = await response.json();
  if (!order) return json({ error: 'ORDER_NOT_FOUND' }, 404);
  return json({ order: { orderCode: order.order_code, status: order.status, shipments: (order.shipments || []).map((shipment) => ({ status: shipment.status, carrier: shipment.carrier || null, trackingCode: shipment.tracking_code || null, trackingUrl: shipment.tracking_url || null })) } });
}

async function handlePrintProfile(request, env) {
  const user = await authenticatedUser(request, env);
  if (!user) return json({ error: 'UNAUTHENTICATED' }, 401);
  let input;
  try { input = await request.json(); } catch { return json({ error: 'INVALID_JSON' }, 400); }
  if (typeof input?.version !== 'string' || !input.configuration || typeof input.configuration !== 'object') return json({ error: 'INVALID_PRINT_PROFILE' }, 400);
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/melsou_set_print_profile`, { method: 'POST', headers: supabaseHeaders(env), body: JSON.stringify({ p_owner_id: user.id, p_version: input.version.slice(0, 120), p_configuration: input.configuration }) });
  if (!response.ok) return json({ error: 'PRINT_PROFILE_REJECTED' }, 409);
  return json({ printProfile: await response.json() }, 201);
}

async function handleRenderCompletion(request, env, renderJobId) {
  const token = request.headers.get('Authorization')?.match(/^Bearer\s+(.+)$/i)?.[1] || '';
  if (!env.MELSOU_INTERNAL_JOB_TOKEN || !timeSafeEqual(token, env.MELSOU_INTERNAL_JOB_TOKEN)) return json({ error: 'INTERNAL_AUTH_REQUIRED' }, 401);
  let input;
  try { input = await request.json(); } catch { return json({ error: 'INVALID_JSON' }, 400); }
  if (!input?.artifacts || typeof input.artifacts !== 'object') return json({ error: 'INVALID_RENDER_ARTIFACTS' }, 400);
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/melsou_finish_render`, { method: 'POST', headers: supabaseHeaders(env), body: JSON.stringify({ p_render_job_id: renderJobId, p_artifacts: input.artifacts }) });
  if (!response.ok) return json({ error: 'RENDER_COMPLETION_REJECTED' }, 409);
  return json({ renderJob: await response.json() });
}

async function expireInactiveGuestDrafts(env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return;
  const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  await fetch(`${env.SUPABASE_URL}/rest/v1/projects?owner_user_id=is.null&last_activity_at=lt.${encodeURIComponent(cutoff)}`, { method: 'DELETE', headers: supabaseHeaders(env) });
}

async function hmacSha256(secret, value) {
  const key = await crypto.subtle.importKey('raw', textEncoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const bytes = new Uint8Array(await crypto.subtle.sign('HMAC', key, textEncoder.encode(value)));
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function verifySePaySignature({ secret, rawBody, signature, timestamp, nowSeconds = Math.floor(Date.now() / 1000), maxSkewSeconds = 300 }) {
  if (!secret || !Number.isSafeInteger(timestamp) || Math.abs(nowSeconds - timestamp) > maxSkewSeconds) return false;
  return timeSafeEqual(`sha256=${await hmacSha256(secret, `${timestamp}.${rawBody}`)}`, signature || '');
}

async function handleSePay(request, env) {
  if (!env.SEPAY_WEBHOOK_SECRET || !env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return json({ success: false, error: 'PAYMENT_NOT_CONFIGURED' }, 503);
  const rawBody = await request.text();
  const signature = request.headers.get('X-SePay-Signature') || '';
  const timestamp = Number(request.headers.get('X-SePay-Timestamp'));
  const skew = Number(env.SEPAY_ALLOWED_CLOCK_SKEW_SECONDS || 300);
  if (!Number.isSafeInteger(timestamp) || Math.abs(Math.floor(Date.now() / 1000) - timestamp) > skew) return json({ success: false, error: 'STALE_WEBHOOK' }, 401);
  if (!await verifySePaySignature({ secret: env.SEPAY_WEBHOOK_SECRET, rawBody, signature, timestamp, maxSkewSeconds: skew })) return json({ success: false, error: 'INVALID_SIGNATURE' }, 401);

  let payload;
  try { payload = JSON.parse(rawBody); } catch { return json({ success: false, error: 'INVALID_JSON' }, 400); }
  if (!Number.isSafeInteger(payload?.id) || payload.transferType !== 'in' || !Number.isSafeInteger(payload.transferAmount) || payload.transferAmount <= 0 || typeof payload.code !== 'string' || !payload.code) return json({ success: false, error: 'INVALID_PAYMENT_EVENT' }, 400);
  if (env.SEPAY_BANK_ACCOUNT && payload.accountNumber !== env.SEPAY_BANK_ACCOUNT) return json({ success: false, error: 'UNEXPECTED_ACCOUNT' }, 400);

  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/melsou_process_sepay_payment`, {
    method: 'POST',
    headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_provider_event_id: String(payload.id), p_payment_code: payload.code, p_amount_vnd: payload.transferAmount, p_payload: payload })
  });
  if (!response.ok) return json({ success: false, error: 'EVENT_NOT_DURABLE' }, 503);
  return json({ success: true });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/api/health' && request.method === 'GET') return json({ ok: true, environment: env.APP_ENV || 'unknown' });
    if (url.pathname === '/api/public-config' && request.method === 'GET') return json({ supabaseUrl: env.SUPABASE_URL || null, supabaseAnonKey: env.SUPABASE_ANON_KEY || null, environment: env.APP_ENV || 'unknown', payment: { bankCode: env.SEPAY_BANK_CODE || null, accountNumber: env.SEPAY_BANK_ACCOUNT || null, accountName: env.SEPAY_ACCOUNT_NAME || null } });
    if (url.pathname === '/api/quote' && request.method === 'POST') {
      const pricing = await activePricing(env);
      if (!pricing) return json({ error: 'ACTIVE_PRICING_UNAVAILABLE' }, 503);
      try { return json({ quote: createQuote(await request.json(), pricing.rules), pricingVersion: pricing.version }); }
      catch { return json({ error: 'INVALID_QUOTE_CONFIGURATION' }, 400); }
    }
    if (url.pathname === '/api/guest/projects' && (request.method === 'GET' || request.method === 'POST')) return handleGuestProjects(request, env);
    const guestProjectSave = url.pathname.match(/^\/api\/guest\/projects\/([0-9a-f-]{36})$/i);
    if (guestProjectSave && request.method === 'PUT') return handleGuestProjectSave(request, env, guestProjectSave[1]);
    if (url.pathname === '/api/guest/projects/claim' && request.method === 'POST') return handleGuestClaim(request, env);
    const projectSave = url.pathname.match(/^\/api\/projects\/([0-9a-f-]{36})$/i);
    if (url.pathname === '/api/projects' && request.method === 'POST') return handleProjectCreate(request, env);
    if (projectSave && request.method === 'PUT') return handleProjectSave(request, env, projectSave[1]);
    const projectAssetUpload = url.pathname.match(/^\/api\/projects\/([0-9a-f-]{36})\/assets$/i);
    if (projectAssetUpload && request.method === 'POST') return handleAssetUpload(request, env, projectAssetUpload[1], ctx);
    const duoInvite = url.pathname.match(/^\/api\/projects\/([0-9a-f-]{36})\/duo-invitations$/i);
    if (duoInvite && request.method === 'POST') return handleDuoInvite(request, env, duoInvite[1]);
    if (url.pathname === '/api/duo-invitations/accept' && request.method === 'POST') return handleDuoAccept(request, env);
    const assetDownload = url.pathname.match(/^\/api\/assets\/([0-9a-f-]{36})$/i);
    if (assetDownload && request.method === 'GET') return handleAssetDownload(request, env, assetDownload[1]);
    const assetPreview = url.pathname.match(/^\/api\/assets\/([0-9a-f-]{36})\/preview$/i);
    if (assetPreview && request.method === 'GET') return handleAssetPreview(request, env, assetPreview[1]);
    if (url.pathname === '/api/orders' && request.method === 'POST') return handleCreateOrder(request, env);
    const tracking = url.pathname.match(/^\/api\/tracking\/([^/]+)$/i);
    if (tracking && request.method === 'GET') return handleTracking(env, decodeURIComponent(tracking[1]));
    if (url.pathname === '/api/owner/orders' && request.method === 'GET') return handleOwnerOrders(request, env);
    if (url.pathname === '/api/owner/print-profiles' && request.method === 'POST') return handlePrintProfile(request, env);
    const prepressApproval = url.pathname.match(/^\/api\/orders\/([0-9a-f-]{36})\/prepress-approve$/i);
    if (prepressApproval && request.method === 'POST') return handlePrepressApproval(request, env, prepressApproval[1]);
    const renderCompletion = url.pathname.match(/^\/api\/internal\/render-jobs\/([0-9a-f-]{36})\/complete$/i);
    if (renderCompletion && request.method === 'POST') return handleRenderCompletion(request, env, renderCompletion[1]);
    if (url.pathname === '/api/sepay/webhook' && request.method === 'POST') return handleSePay(request, env);
    return json({ error: 'NOT_FOUND' }, 404);
  },
  async scheduled(_event, env, ctx) { ctx.waitUntil(Promise.all([processAssetJobs(env), processOperations(env), processRenderJobs(env), expireInactiveGuestDrafts(env)])); }
};
