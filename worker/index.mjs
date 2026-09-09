import { createQuote, DEFAULT_PRICING_RULES } from './quote.mjs';
import { runPreflight } from './preflight.mjs';
import { processOperations } from './operations.mjs';
import { processRenderJobs, templateCatalog, templateFor } from './renderer.mjs';
import { assertDraftAssetQuota, assertUploadSize, inspectUploadedImage, processAssetJobs } from './image-processing.mjs';
import { PASSWORD_ITERATIONS, assertPassword, derivePassword, normalizeOptionalEmail, normalizeUsername, randomSecret, verifyPassword } from './native-auth.mjs';
import { inspectVoiceBytes, processVoiceCleanupJobs } from './voice.mjs';
import { withPrivateStorage } from './storage.mjs';
import {
  ContractError, assertCartConfiguration, assertCheckpointReason, assertIdempotencyKey, assertProjectDocument, assertUuid,
  buildPaymentInstructions, normalizeTrackingPhone, sanitizeAccountPatch, sanitizeAddress, sanitizeBlogPost, sanitizeShipments
} from './backend-contracts.mjs';

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
const guestCookieName = 'melsou_guest_v1';
const nativeCookieName = 'melsou_session_v1';
const readCookie = (request, name) => Object.fromEntries((request.headers.get('Cookie') || '').split(';').map((part) => part.trim().split('=').map(decodeURIComponent)).filter(([key, value]) => key && value))[name] || null;
const guestCookie = (value, secure) => `${guestCookieName}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=1209600${secure ? '; Secure' : ''}`;
const nativeCookie = (value, secure, maxAge = 2592000) => `${nativeCookieName}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? '; Secure' : ''}`;
const withCookie = (response, cookie) => { const headers = new Headers(response.headers); headers.append('Set-Cookie', cookie); return new Response(response.body, { status: response.status, statusText: response.statusText, headers }); };
const validProjectDocument = (document) => { try { assertProjectDocument(document); return true; } catch { return false; } };
const contractFailure = (error, fallback = 'INVALID_REQUEST') => json({ error: error instanceof ContractError ? error.code : fallback }, error instanceof ContractError ? error.status : 400);

async function serviceFetch(env, path, options = {}) {
  return fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, { ...options, headers: { ...supabaseHeaders(env), ...(options.headers || {}) } });
}

const nativeAuthConfigured = (env) => Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);

async function allowRateLimitedAction(env, key) {
  if (!env.API_RATE_LIMITER) return env.APP_ENV !== 'production' ? { allowed: true } : { allowed: false, configurationMissing: true };
  const result = await env.API_RATE_LIMITER.limit({ key });
  return { allowed: result.success === true };
}
const requestNetworkKey = (request) => String(request.headers.get('CF-Connecting-IP') || 'unknown').slice(0, 80);

async function activePricing(env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return { version: 0, rules: DEFAULT_PRICING_RULES };
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/pricing_versions?active=eq.true&select=version,rules&order=version.desc&limit=1`, { headers: supabaseHeaders(env) });
  if (!response.ok) return null;
  const [pricing] = await response.json();
  return pricing || null;
}

async function nativeSessionUser(request, env) {
  const origin = request.headers.get('Origin');
  if (!['GET','HEAD','OPTIONS'].includes(request.method) && origin && origin !== new URL(request.url).origin) return null;
  const raw = readCookie(request, nativeCookieName);
  if (!raw || !/^[0-9a-f]{64}$/i.test(raw) || !env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return null;
  const tokenHash = await sha256(textEncoder.encode(raw));
  const response = await serviceFetch(env, 'rpc/melsou_native_session_user', { method: 'POST', body: JSON.stringify({ p_token_hash: tokenHash }) });
  if (!response.ok) return null;
  const user = await response.json();
  return user ? { ...user, nativeTokenHash: tokenHash } : null;
}

async function authenticatedUser(request, env) {
  const token = request.headers.get('Authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  let user;
  if (token && env.SUPABASE_URL) {
    const response = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, { headers: { Authorization: `Bearer ${token}`, apikey: env.SUPABASE_ANON_KEY || '' } });
    if (response.ok) user = { ...(await response.json()), provider: 'GOOGLE' };
  }
  if (!user) user = await nativeSessionUser(request, env);
  if (!user) return null;
  if ((env.OWNER_EMAIL && user.email?.toLowerCase() === env.OWNER_EMAIL.toLowerCase()) || (env.OWNER_USER_ID && user.id === env.OWNER_USER_ID)) {
    await serviceFetch(env, `profiles?user_id=eq.${user.id}`, { method: 'PATCH', body: JSON.stringify({ role: 'OWNER' }) });
  }
  return user;
}

async function nativeProfileByUsername(username, env) {
  const response = await serviceFetch(env, `profiles?username=eq.${encodeURIComponent(username)}&select=user_id,username,email,email_verified_at,role&limit=1`);
  if (!response.ok) return null;
  return (await response.json())[0] || null;
}

async function nativeProfileByEmail(email, env) {
  const response = await serviceFetch(env, `profiles?email=eq.${encodeURIComponent(email)}&email_verified_at=not.is.null&select=user_id,username,email,email_verified_at,role&limit=1`);
  if (!response.ok) return null;
  return (await response.json())[0] || null;
}

async function nativeCredential(userId, env) {
  const response = await serviceFetch(env, `native_credentials?user_id=eq.${userId}&select=user_id,password_hash,password_salt,password_iterations,failed_attempts,locked_until&limit=1`);
  if (!response.ok) return null;
  return (await response.json())[0] || null;
}

async function establishNativeSession(request, env, user, status = 200) {
  const raw = randomSecret(32); const tokenHash = await sha256(textEncoder.encode(raw));
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const response = await serviceFetch(env, 'rpc/melsou_native_login_success', { method: 'POST', body: JSON.stringify({ p_user_id: user.id || user.user_id, p_token_hash: tokenHash, p_expires_at: expiresAt }) });
  if (!response.ok) return json({ error: 'SESSION_CREATE_FAILED' }, 503);
  return withCookie(json({ user: { id: user.id || user.user_id, username: user.username, email: user.email || null, emailVerified: Boolean(user.email_verified_at || user.email_verified), role: user.role || 'CUSTOMER', provider: 'NATIVE' } }, status), nativeCookie(raw, new URL(request.url).protocol === 'https:'));
}

async function handleNativeRegister(request, env) {
  if (!nativeAuthConfigured(env)) return json({ error: 'AUTH_NOT_CONFIGURED' }, 503);
  let input; try { input = await request.json(); } catch { return json({ error: 'INVALID_JSON' }, 400); }
  let username; let password;
  try { username = normalizeUsername(input?.username); password = assertPassword(input?.password); } catch (error) { return contractFailure(error); }
  const limit = await allowRateLimitedAction(env, `native-register:${requestNetworkKey(request)}:${username}`);
  if (limit.configurationMissing) return json({ error: 'RATE_LIMIT_NOT_CONFIGURED' }, 503);
  if (!limit.allowed) return json({ error: 'RATE_LIMITED' }, 429);
  const credential = await derivePassword(password);
  const response = await serviceFetch(env, 'rpc/melsou_register_native', { method: 'POST', body: JSON.stringify({ p_username: username, p_password_hash: credential.hashHex, p_password_salt: credential.saltHex, p_password_iterations: credential.iterations }) });
  if (!response.ok) { const details = await response.text(); return json({ error: details.includes('USERNAME_TAKEN') ? 'USERNAME_TAKEN' : 'REGISTER_FAILED' }, details.includes('USERNAME_TAKEN') ? 409 : 503); }
  return establishNativeSession(request, env, await response.json(), 201);
}

async function handleNativeLogin(request, env) {
  if (!nativeAuthConfigured(env)) return json({ error: 'AUTH_NOT_CONFIGURED' }, 503);
  let input; try { input = await request.json(); } catch { return json({ error: 'INVALID_JSON' }, 400); }
  let username; try { username = normalizeUsername(input?.username); assertPassword(input?.password); } catch (error) { return contractFailure(error); }
  const limit = await allowRateLimitedAction(env, `native-login:${requestNetworkKey(request)}:${username}`);
  if (limit.configurationMissing) return json({ error: 'RATE_LIMIT_NOT_CONFIGURED' }, 503);
  if (!limit.allowed) return json({ error: 'RATE_LIMITED' }, 429);
  const profile = await nativeProfileByUsername(username, env); const credential = profile ? await nativeCredential(profile.user_id, env) : null;
  if (!credential) {
    await derivePassword(input.password, '00000000000000000000000000000000', PASSWORD_ITERATIONS);
    return json({ error: 'INVALID_CREDENTIALS' }, 401);
  }
  if (credential.locked_until && Date.parse(credential.locked_until) > Date.now()) return json({ error: 'ACCOUNT_TEMPORARILY_LOCKED', retryAt: credential.locked_until }, 429);
  if (!await verifyPassword(input.password, credential)) {
    await serviceFetch(env, 'rpc/melsou_native_login_failure', { method: 'POST', body: JSON.stringify({ p_user_id: profile.user_id }) });
    return json({ error: 'INVALID_CREDENTIALS' }, 401);
  }
  return establishNativeSession(request, env, { ...profile, id: profile.user_id });
}

async function handleNativeLogout(request, env) {
  const raw = readCookie(request, nativeCookieName);
  if (raw && /^[0-9a-f]{64}$/i.test(raw)) await serviceFetch(env, 'rpc/melsou_revoke_native_session', { method: 'POST', body: JSON.stringify({ p_token_hash: await sha256(textEncoder.encode(raw)) }) });
  return withCookie(json({ signedOut: true }), nativeCookie('', new URL(request.url).protocol === 'https:', 0));
}

async function sendAuthEmail(env, { email, purpose, token }) {
  if (!env.AUTH_EMAIL_DELIVERY_URL || !env.AUTH_EMAIL_DELIVERY_TOKEN || !env.APP_BASE_URL) return false;
  const endpoint = new URL(env.AUTH_EMAIL_DELIVERY_URL);
  if (endpoint.protocol !== 'https:' && env.APP_ENV === 'production') return false;
  const actionPath = purpose === 'LINK_EMAIL' ? '/account/verify-email' : '/account/recover-password';
  const response = await fetch(endpoint, { method: 'POST', headers: { Authorization: `Bearer ${env.AUTH_EMAIL_DELIVERY_TOKEN}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ to: email, template: purpose, actionUrl: new URL(`${actionPath}?token=${encodeURIComponent(token)}`, env.APP_BASE_URL).toString() }) });
  return response.ok;
}

async function createAndSendEmailChallenge(env, userId, email, purpose) {
  const token = randomSecret(32); const tokenHash = await sha256(textEncoder.encode(token));
  const create = await serviceFetch(env, 'rpc/melsou_create_email_challenge', { method: 'POST', body: JSON.stringify({ p_user_id: userId, p_email: email, p_purpose: purpose, p_token_hash: tokenHash }) });
  if (!create.ok) return { ok: false, error: await create.text() };
  if (!await sendAuthEmail(env, { email, purpose, token })) return { ok: false, error: 'EMAIL_DELIVERY_NOT_CONFIGURED' };
  return { ok: true, challenge: await create.json() };
}

async function handleRecoveryRequest(request, env) {
  if (!nativeAuthConfigured(env)) return json({ error: 'AUTH_NOT_CONFIGURED' }, 503);
  let input; try { input = await request.json(); } catch { return json({ error: 'INVALID_JSON' }, 400); }
  let profile; let identity;
  try {
    if (input?.email) { identity = normalizeOptionalEmail(input.email); profile = await nativeProfileByEmail(identity, env); }
    else { identity = normalizeUsername(input?.username); profile = await nativeProfileByUsername(identity, env); }
  } catch (error) { return contractFailure(error); }
  const identityHash = await sha256(textEncoder.encode(identity));
  const limit = await allowRateLimitedAction(env, `native-recovery:${requestNetworkKey(request)}:${identityHash}`);
  if (limit.configurationMissing) return json({ error: 'RATE_LIMIT_NOT_CONFIGURED' }, 503);
  if (!limit.allowed) return json({ error: 'RATE_LIMITED' }, 429);
  if (!profile && input?.email) return json({ state: 'RECOVERY_EMAIL_SENT' }, 202);
  if (!profile?.email || !profile.email_verified_at) return json({ error: 'RECOVERY_EMAIL_REQUIRED' }, 409);
  const sent = await createAndSendEmailChallenge(env, profile.user_id, profile.email, 'RECOVER_PASSWORD');
  if (!sent.ok) return json({ error: sent.error.includes?.('RECOVERY_EMAIL_REQUIRED') ? 'RECOVERY_EMAIL_REQUIRED' : 'EMAIL_DELIVERY_UNAVAILABLE' }, sent.error.includes?.('RECOVERY_EMAIL_REQUIRED') ? 409 : 503);
  return json({ state: 'RECOVERY_EMAIL_SENT' }, 202);
}

async function handleRecoveryComplete(request, env) {
  if (!nativeAuthConfigured(env)) return json({ error: 'AUTH_NOT_CONFIGURED' }, 503);
  let input; try { input = await request.json(); } catch { return json({ error: 'INVALID_JSON' }, 400); }
  if (typeof input?.token !== 'string' || !/^[0-9a-f]{64}$/i.test(input.token)) return json({ error: 'RECOVERY_TOKEN_INVALID' }, 400);
  const tokenHash = await sha256(textEncoder.encode(input.token));
  const limit = await allowRateLimitedAction(env, `native-recovery-complete:${requestNetworkKey(request)}:${tokenHash}`);
  if (limit.configurationMissing) return json({ error: 'RATE_LIMIT_NOT_CONFIGURED' }, 503);
  if (!limit.allowed) return json({ error: 'RATE_LIMITED' }, 429);
  let credential; try { credential = await derivePassword(input?.newPassword); } catch (error) { return contractFailure(error); }
  const response = await serviceFetch(env, 'rpc/melsou_recover_native_password', { method: 'POST', body: JSON.stringify({ p_token_hash: tokenHash, p_password_hash: credential.hashHex, p_password_salt: credential.saltHex, p_password_iterations: credential.iterations }) });
  if (!response.ok) return json({ error: 'RECOVERY_TOKEN_INVALID' }, 409);
  return withCookie(json({ reset: true }), nativeCookie('', new URL(request.url).protocol === 'https:', 0));
}

async function verifyNativeCurrentPassword(user, password, env) {
  if (user.provider !== 'NATIVE') return null;
  const credential = await nativeCredential(user.id, env);
  return credential && await verifyPassword(password, credential) ? credential : null;
}

async function handleEmailLinkRequest(request, env) {
  const user = await authenticatedUser(request, env); if (!user) return json({ error: 'UNAUTHENTICATED' }, 401);
  let input; try { input = await request.json(); } catch { return json({ error: 'INVALID_JSON' }, 400); }
  let email; try { email = normalizeOptionalEmail(input?.email); } catch (error) { return contractFailure(error); }
  const limit = await allowRateLimitedAction(env, `email-link:${user.id}`);
  if (limit.configurationMissing) return json({ error: 'RATE_LIMIT_NOT_CONFIGURED' }, 503);
  if (!limit.allowed) return json({ error: 'RATE_LIMITED' }, 429);
  const sent = await createAndSendEmailChallenge(env, user.id, email, 'LINK_EMAIL');
  if (!sent.ok) return json({ error: String(sent.error).includes('EMAIL_ALREADY_LINKED') ? 'EMAIL_ALREADY_LINKED' : 'EMAIL_DELIVERY_UNAVAILABLE' }, String(sent.error).includes('EMAIL_ALREADY_LINKED') ? 409 : 503);
  return json({ state: 'EMAIL_VERIFICATION_SENT' }, 202);
}

async function handleEmailVerify(request, env) {
  const user = await authenticatedUser(request, env); if (!user) return json({ error: 'UNAUTHENTICATED' }, 401);
  let input; try { input = await request.json(); } catch { return json({ error: 'INVALID_JSON' }, 400); }
  if (typeof input?.token !== 'string' || !/^[0-9a-f]{64}$/i.test(input.token)) return json({ error: 'EMAIL_VERIFICATION_INVALID' }, 400);
  const tokenHash = await sha256(textEncoder.encode(input.token));
  const limit = await allowRateLimitedAction(env, `email-verify:${user.id}:${tokenHash}`);
  if (limit.configurationMissing) return json({ error: 'RATE_LIMIT_NOT_CONFIGURED' }, 503);
  if (!limit.allowed) return json({ error: 'RATE_LIMITED' }, 429);
  const response = await serviceFetch(env, 'rpc/melsou_verify_linked_email', { method: 'POST', body: JSON.stringify({ p_user_id: user.id, p_token_hash: tokenHash }) });
  if (!response.ok) return json({ error: 'EMAIL_VERIFICATION_INVALID' }, 409);
  return json({ profile: await response.json() });
}

async function handleUsernameChange(request, env) {
  const user = await authenticatedUser(request, env); if (!user) return json({ error: 'UNAUTHENTICATED' }, 401);
  let input; try { input = await request.json(); } catch { return json({ error: 'INVALID_JSON' }, 400); }
  let username; try { username = normalizeUsername(input?.username); assertPassword(input?.password); } catch (error) { return contractFailure(error); }
  if (!await verifyNativeCurrentPassword(user, input.password, env)) return json({ error: 'CURRENT_PASSWORD_INVALID' }, 401);
  const response = await serviceFetch(env, 'rpc/melsou_change_username', { method: 'POST', body: JSON.stringify({ p_user_id: user.id, p_username: username }) });
  if (!response.ok) { const details = await response.text(); return json({ error: details.includes('USERNAME_CHANGE_COOLDOWN') ? 'USERNAME_CHANGE_COOLDOWN' : details.includes('USERNAME_TAKEN') ? 'USERNAME_TAKEN' : 'USERNAME_CHANGE_FAILED' }, 409); }
  return json({ profile: await response.json() });
}

async function handlePasswordChange(request, env) {
  const user = await authenticatedUser(request, env); if (!user) return json({ error: 'UNAUTHENTICATED' }, 401);
  let input; try { input = await request.json(); } catch { return json({ error: 'INVALID_JSON' }, 400); }
  try { assertPassword(input?.currentPassword); assertPassword(input?.newPassword); } catch (error) { return contractFailure(error); }
  const currentCredential = await verifyNativeCurrentPassword(user, input.currentPassword, env);
  if (!currentCredential) return json({ error: 'CURRENT_PASSWORD_INVALID' }, 401);
  const credential = await derivePassword(input.newPassword);
  const response = await serviceFetch(env, 'rpc/melsou_update_native_password', { method: 'POST', body: JSON.stringify({ p_user_id: user.id, p_expected_password_hash: currentCredential.password_hash, p_password_hash: credential.hashHex, p_password_salt: credential.saltHex, p_password_iterations: credential.iterations }) });
  if (!response.ok) { const details = await response.text(); return json({ error: details.includes('CREDENTIAL_CHANGED_RETRY') ? 'CREDENTIAL_CHANGED_RETRY' : 'PASSWORD_CHANGE_FAILED' }, details.includes('CREDENTIAL_CHANGED_RETRY') ? 409 : 503); }
  return withCookie(json({ passwordChanged: true, reauthenticationRequired: true }), nativeCookie('', new URL(request.url).protocol === 'https:', 0));
}

async function ownedProject(projectId, userId, env) {
  const query = new URLSearchParams({ id: `eq.${projectId}`, owner_user_id: `eq.${userId}`, trashed_at: 'is.null', select: 'id,revision,document,template_id,template_version' });
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

async function touchGuestSession(sessionHash, env) {
  const response = await serviceFetch(env, 'rpc/melsou_touch_guest_session', { method: 'POST', body: JSON.stringify({ p_guest_session_hash: sessionHash }) });
  return response.ok;
}

async function guestOwnedProject(request, projectId, env) {
  const session = await guestSession(request);
  if (session.isNew) return null;
  const sessionHash = await sha256(textEncoder.encode(session.raw));
  const query = new URLSearchParams({ id: `eq.${projectId}`, owner_user_id: 'is.null', guest_session_hash: `eq.${sessionHash}`, trashed_at: 'is.null', select: 'id,revision,document,template_id,template_version' });
  const response = await serviceFetch(env, `projects?${query}`);
  if (!response.ok) return null;
  const [project] = await response.json();
  return project ? { project, sessionHash } : null;
}

async function handleGuestProjects(request, env) {
  const session = await guestSession(request); const sessionHash = await sha256(textEncoder.encode(session.raw));
  if (!await touchGuestSession(sessionHash, env)) return json({ error: 'GUEST_SESSION_UNAVAILABLE' }, 503);
  if (request.method === 'GET') {
    const response = await fetch(`${env.SUPABASE_URL}/rest/v1/projects?owner_user_id=is.null&guest_session_hash=eq.${sessionHash}&trashed_at=is.null&select=id,title,template_id,template_version,document,revision,last_activity_at&order=last_activity_at.desc`, { headers: supabaseHeaders(env) });
    if (!response.ok) return json({ error: 'GUEST_DRAFTS_UNAVAILABLE' }, 503);
    const result = json({ projects: await response.json() }); return session.isNew ? withCookie(result, guestCookie(session.raw, new URL(request.url).protocol === 'https:')) : result;
  }
  const limit = await allowRateLimitedAction(env, `guest-create:${requestNetworkKey(request)}:${sessionHash}`);
  if (limit.configurationMissing) return json({ error: 'RATE_LIMIT_NOT_CONFIGURED' }, 503);
  if (!limit.allowed) return json({ error: 'RATE_LIMITED' }, 429);
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
  const sessionHash = await sha256(textEncoder.encode(session.raw));
  if (!await touchGuestSession(sessionHash, env)) return json({ error: 'GUEST_SESSION_UNAVAILABLE' }, 503);
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/melsou_save_guest_project`, { method: 'POST', headers: supabaseHeaders(env), body: JSON.stringify({ p_project_id: projectId, p_guest_session_hash: sessionHash, p_expected_revision: input.expectedRevision, p_document: input.document }) });
  if (!response.ok) return json({ error: 'GUEST_PROJECT_SAVE_FAILED' }, 503);
  const project = await response.json(); return project?.conflict ? json({ error: 'REVISION_CONFLICT', currentRevision: project.revision }, 409) : json({ project });
}

async function handleGuestClaim(request, env) {
  const user = await authenticatedUser(request, env); if (!user) return json({ error: 'UNAUTHENTICATED' }, 401);
  const session = await guestSession(request); if (session.isNew) return json({ projects: [] });
  const sessionHash = await sha256(textEncoder.encode(session.raw));
  if (!await touchGuestSession(sessionHash, env)) return json({ error: 'GUEST_SESSION_UNAVAILABLE' }, 503);
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/melsou_claim_guest_projects`, { method: 'POST', headers: supabaseHeaders(env), body: JSON.stringify({ p_owner_id: user.id, p_guest_session_hash: sessionHash }) });
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
  if (!validProjectDocument(document)) return json({ error: 'INVALID_PROJECT_DOCUMENT' }, 400);
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
  if (!Number.isSafeInteger(input?.expectedRevision) || !validProjectDocument(input.document)) return json({ error: 'INVALID_PROJECT_DOCUMENT' }, 400);
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/melsou_save_project`, {
    method: 'POST', headers: supabaseHeaders(env), body: JSON.stringify({ p_project_id: projectId, p_owner_user_id: user.id, p_expected_revision: input.expectedRevision, p_document: input.document })
  });
  if (!response.ok) return json({ error: 'PROJECT_SAVE_FAILED' }, 500);
  const result = await response.json();
  if (result?.conflict === true) return json({ error: 'REVISION_CONFLICT', currentRevision: result.revision }, 409);
  return json({ project: result });
}

async function handleProjectList(request, env) {
  const user = await authenticatedUser(request, env);
  if (!user) return json({ error: 'UNAUTHENTICATED' }, 401);
  const response = await serviceFetch(env, `projects?owner_user_id=eq.${user.id}&trashed_at=is.null&select=id,title,template_id,template_version,document,revision,last_activity_at,updated_at&order=last_activity_at.desc`);
  if (!response.ok) return json({ error: 'PROJECTS_UNAVAILABLE' }, 503);
  return json({ projects: await response.json() });
}

async function handleProjectGet(request, env, projectId) {
  const user = await authenticatedUser(request, env);
  if (!user) return json({ error: 'UNAUTHENTICATED' }, 401);
  const project = await editableProject(projectId, user.id, env);
  if (!project) return json({ error: 'PROJECT_NOT_FOUND' }, 404);
  return json({ project });
}

async function handleProjectTrash(request, env, projectId, restore = false) {
  const user = await authenticatedUser(request, env);
  if (!user) return json({ error: 'UNAUTHENTICATED' }, 401);
  const response = await serviceFetch(env, 'rpc/melsou_set_project_trash', {
    method: 'POST', body: JSON.stringify({ p_owner_id: user.id, p_project_id: projectId, p_restore: restore })
  });
  if (!response.ok) {
    const details = await response.text();
    if (details.includes('PROJECT_NOT_FOUND')) return json({ error: 'PROJECT_NOT_FOUND' }, 404);
    if (details.includes('TRASH_RETENTION_EXPIRED')) return json({ error: 'TRASH_RETENTION_EXPIRED' }, 409);
    return json({ error: restore ? 'PROJECT_RESTORE_FAILED' : 'PROJECT_TRASH_FAILED' }, 503);
  }
  return json({ project: await response.json() });
}

async function handleCheckpoint(request, env, projectId, guest = false) {
  let input;
  try { input = await request.json(); } catch { return json({ error: 'INVALID_JSON' }, 400); }
  let reason;
  try { reason = assertCheckpointReason(input?.reason); } catch (error) { return contractFailure(error); }
  let userId = null; let sessionHash = null;
  if (guest) {
    const access = await guestOwnedProject(request, projectId, env);
    if (!access) return json({ error: 'PROJECT_NOT_FOUND' }, 404);
    sessionHash = access.sessionHash;
    if (!await touchGuestSession(sessionHash, env)) return json({ error: 'GUEST_SESSION_UNAVAILABLE' }, 503);
  } else {
    const user = await authenticatedUser(request, env);
    if (!user) return json({ error: 'UNAUTHENTICATED' }, 401);
    if (!await editableProject(projectId, user.id, env)) return json({ error: 'PROJECT_NOT_FOUND' }, 404);
    userId = user.id;
  }
  const response = await serviceFetch(env, 'rpc/melsou_create_project_checkpoint', {
    method: 'POST', body: JSON.stringify({ p_project_id: projectId, p_actor_user_id: userId, p_guest_session_hash: sessionHash, p_reason: reason })
  });
  if (!response.ok) return json({ error: 'CHECKPOINT_CREATE_FAILED' }, 503);
  return json({ checkpoint: await response.json() }, 201);
}

async function ownerUser(request, env) {
  const user = await authenticatedUser(request, env);
  if (!user) return null;
  const response = await serviceFetch(env, `profiles?user_id=eq.${user.id}&select=role`);
  if (!response.ok) return null;
  const [profile] = await response.json();
  return profile?.role === 'OWNER' ? user : null;
}

async function handleAccount(request, env) {
  const user = await authenticatedUser(request, env);
  if (!user) return json({ error: 'UNAUTHENTICATED' }, 401);
  if (request.method === 'GET') {
    const response = await serviceFetch(env, `profiles?user_id=eq.${user.id}&select=user_id,username,email,email_verified_at,display_name,role,notification_preferences,username_changed_at,created_at,updated_at`);
    if (!response.ok) return json({ error: 'ACCOUNT_UNAVAILABLE' }, 503);
    const [profile] = await response.json();
    return json({ profile: profile || null, auth: { provider: user.provider || 'GOOGLE', username: user.username || profile?.username || null, email: user.email || profile?.email || null, emailVerified: Boolean(user.email_verified || profile?.email_verified_at) } });
  }
  let input;
  try { input = await request.json(); } catch { return json({ error: 'INVALID_JSON' }, 400); }
  let update;
  try { update = sanitizeAccountPatch(input); } catch (error) { return contractFailure(error); }
  const response = await serviceFetch(env, 'rpc/melsou_update_profile', { method: 'POST', body: JSON.stringify({ p_user_id: user.id, p_patch: update }) });
  if (!response.ok) return json({ error: 'ACCOUNT_UPDATE_FAILED' }, 503);
  return json({ profile: await response.json() });
}

async function handleCart(request, env) {
  const user = await authenticatedUser(request, env);
  if (!user) return json({ error: 'UNAUTHENTICATED' }, 401);
  const response = await serviceFetch(env, `carts?customer_id=eq.${user.id}&status=eq.ACTIVE&select=id,status,updated_at,cart_items(id,project_id,project_revision,configuration,checked_out_at,project:projects(title,template_id,template_version,revision))&limit=1`);
  if (!response.ok) return json({ error: 'CART_UNAVAILABLE' }, 503);
  return json({ cart: (await response.json())[0] || { id: null, status: 'ACTIVE', cart_items: [] } });
}

async function handleCartItem(request, env, projectId = null) {
  const user = await authenticatedUser(request, env);
  if (!user) return json({ error: 'UNAUTHENTICATED' }, 401);
  if (request.method === 'DELETE') {
    const response = await serviceFetch(env, 'rpc/melsou_remove_cart_item', { method: 'POST', body: JSON.stringify({ p_customer_id: user.id, p_project_id: projectId }) });
    if (!response.ok) return json({ error: 'CART_ITEM_REMOVE_FAILED' }, 503);
    return json({ removed: await response.json() });
  }
  let input;
  try { input = await request.json(); } catch { return json({ error: 'INVALID_JSON' }, 400); }
  let configuration;
  try { assertUuid(input?.projectId, 'INVALID_PROJECT_ID'); configuration = assertCartConfiguration(input?.configuration); } catch (error) { return contractFailure(error); }
  const response = await serviceFetch(env, 'rpc/melsou_upsert_cart_item', { method: 'POST', body: JSON.stringify({ p_customer_id: user.id, p_project_id: input.projectId, p_configuration: configuration }) });
  if (!response.ok) return json({ error: 'CART_ITEM_SAVE_FAILED' }, 503);
  return json({ cart: await response.json() }, 200);
}

async function handlePublicBlog(env, slug = null) {
  const filter = slug ? `slug=eq.${encodeURIComponent(slug)}&` : '';
  const response = await serviceFetch(env, `blog_posts?${filter}status=eq.PUBLISHED&select=id,slug,title,excerpt,content,cover_asset_id,category,tags,published_at&order=published_at.desc${slug ? '&limit=1' : '&limit=50'}`);
  if (!response.ok) return json({ error: 'BLOG_UNAVAILABLE' }, 503);
  const posts = await response.json();
  if (slug && !posts[0]) return json({ error: 'BLOG_POST_NOT_FOUND' }, 404);
  return slug ? json({ post: posts[0] }) : json({ posts });
}

async function handleTemplates(url, templateId = null) {
  try {
    if (templateId) return json({ template: await templateFor(templateId, Number(url.searchParams.get('version') || 1)) });
    const size = url.searchParams.get('size'); const pages = url.searchParams.get('pages');
    const templates = await templateCatalog({ size, pages: pages ? Number(pages) : null });
    return json({ templates });
  } catch { return json({ error: 'TEMPLATE_VERSION_UNAVAILABLE' }, 404); }
}

async function handleOwnerBlog(request, env, postId = null) {
  const user = await ownerUser(request, env);
  if (!user) return json({ error: 'OWNER_REQUIRED' }, 403);
  if (request.method === 'GET') {
    const response = await serviceFetch(env, 'blog_posts?select=id,slug,title,excerpt,content,cover_asset_id,status,category,tags,published_at,created_at,updated_at&order=updated_at.desc&limit=100');
    if (!response.ok) return json({ error: 'BLOG_UNAVAILABLE' }, 503);
    return json({ posts: await response.json() });
  }
  if (request.method === 'DELETE') {
    const response = await serviceFetch(env, `blog_posts?id=eq.${postId}&author_id=eq.${user.id}`, { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ status: 'ARCHIVED', published_at: null, updated_at: new Date().toISOString() }) });
    if (!response.ok) return json({ error: 'BLOG_ARCHIVE_FAILED' }, 503);
    const [post] = await response.json();
    return post ? json({ post }) : json({ error: 'BLOG_POST_NOT_FOUND' }, 404);
  }
  let input;
  try { input = await request.json(); } catch { return json({ error: 'INVALID_JSON' }, 400); }
  let post;
  try { post = sanitizeBlogPost(input, { partial: Boolean(postId) }); } catch (error) { return contractFailure(error); }
  if (post.status === 'PUBLISHED') post.published_at = new Date().toISOString();
  if (post.status && post.status !== 'PUBLISHED') post.published_at = null;
  post.updated_at = new Date().toISOString();
  const response = postId
    ? await serviceFetch(env, `blog_posts?id=eq.${postId}`, { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify(post) })
    : await serviceFetch(env, 'blog_posts', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ ...post, author_id: user.id }) });
  if (!response.ok) return json({ error: postId ? 'BLOG_UPDATE_FAILED' : 'BLOG_CREATE_FAILED' }, response.status === 409 ? 409 : 503);
  const [saved] = await response.json();
  return saved ? json({ post: saved }, postId ? 200 : 201) : json({ error: 'BLOG_POST_NOT_FOUND' }, 404);
}

async function handleBlogCover(env, slug) {
  const response = await serviceFetch(env, `blog_posts?slug=eq.${encodeURIComponent(slug)}&status=eq.PUBLISHED&select=cover:project_assets(preview_key,preview_mime_type,processing_state)&limit=1`);
  if (!response.ok) return json({ error: 'BLOG_UNAVAILABLE' }, 503);
  const [post] = await response.json(); const cover = post?.cover;
  if (!cover?.preview_key || cover.processing_state !== 'READY') return json({ error: 'BLOG_COVER_NOT_FOUND' }, 404);
  const object = await env.MELSOU_ASSETS?.get(cover.preview_key);
  if (!object) return json({ error: 'BLOG_COVER_NOT_FOUND' }, 404);
  return new Response(object.body, { headers: { 'Content-Type': cover.preview_mime_type || 'image/webp', 'Cache-Control': 'public, max-age=300', 'X-Content-Type-Options': 'nosniff' } });
}

async function handleAssetUpload(request, env, projectId, ctx, guest = false) {
  if (!env.MELSOU_ASSETS) return json({ error: 'ASSET_STORAGE_NOT_CONFIGURED' }, 503);
  if (!env.IMAGES) return json({ error: 'IMAGE_PROCESSOR_NOT_CONFIGURED' }, 503);
  if (guest) {
    if (!await guestOwnedProject(request, projectId, env)) return json({ error: 'PROJECT_NOT_FOUND' }, 404);
  } else {
    const user = await authenticatedUser(request, env);
    if (!user) return json({ error: 'UNAUTHENTICATED' }, 401);
    if (!await editableProject(projectId, user.id, env)) return json({ error: 'PROJECT_NOT_FOUND' }, 404);
  }
  const limit = await allowRateLimitedAction(env, `asset-upload:${requestNetworkKey(request)}:${projectId}`);
  if (limit.configurationMissing) return json({ error: 'RATE_LIMIT_NOT_CONFIGURED' }, 503);
  if (!limit.allowed) return json({ error: 'RATE_LIMITED' }, 429);
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
  const checksum = await sha256(bytes);
  const quotaResponse = await fetch(`${env.SUPABASE_URL}/rest/v1/project_assets?project_id=eq.${projectId}&select=id,file_size,checksum,status,processing_state,preview_key,normalized_key`, { headers: supabaseHeaders(env) });
  if (!quotaResponse.ok) return json({ error: 'ASSET_QUOTA_CHECK_FAILED' }, 503);
  const existing = await quotaResponse.json();
  const duplicate = existing.find((asset) => asset.checksum === checksum && asset.status !== 'PROCESSING_FAILED');
  if (duplicate) {
    if (duplicate.processing_state !== 'READY') ctx?.waitUntil?.(processAssetJobs(env, 1, duplicate.id));
    return json({ asset: duplicate, duplicate: true });
  }
  try { assertDraftAssetQuota(existing, bytes.byteLength); }
  catch (error) { return json({ error: error.code || 'DRAFT_STORAGE_LIMIT_REACHED' }, 413); }
  const assetId = crypto.randomUUID();
  const storageKey = `projects/${projectId}/assets/${assetId}/original`;
  await env.MELSOU_ASSETS.put(storageKey, bytes, { httpMetadata: { contentType: decoded.mimeType, cacheControl: 'private, no-store' } });
  const insert = await fetch(`${env.SUPABASE_URL}/rest/v1/project_assets`, {
    method: 'POST', headers: { ...supabaseHeaders(env), Prefer: 'return=representation' },
    body: JSON.stringify({ id: assetId, project_id: projectId, storage_key: storageKey, mime_type: decoded.mimeType, file_size: bytes.byteLength, width_px: decoded.width, height_px: decoded.height, checksum, status: 'ORIGINAL_ONLY', processing_state: 'PENDING', processing_retry_count: 0 })
  });
  if (!insert.ok) { await env.MELSOU_ASSETS.delete(storageKey); return json({ error: 'ASSET_METADATA_SAVE_FAILED' }, 503); }
  const asset = (await insert.json())[0];
  ctx?.waitUntil?.(processAssetJobs(env, 1, assetId));
  return json({ asset }, 201);
}

async function handleAssetDownload(request, env, assetId) {
  const user = await authenticatedUser(request, env);
  if (!user) return json({ error: 'UNAUTHENTICATED' }, 401);
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/project_assets?id=eq.${assetId}&select=id,project_id,storage_key,mime_type`, { headers: supabaseHeaders(env) });
  if (!response.ok) return json({ error: 'ASSET_LOOKUP_FAILED' }, 503);
  const [asset] = await response.json();
  if (!asset || !await editableProject(asset.project_id, user.id, env)) return json({ error: 'ASSET_NOT_FOUND' }, 404);
  const object = await env.MELSOU_ASSETS.get(asset.storage_key);
  if (!object) return json({ error: 'ASSET_MISSING' }, 404);
  return new Response(object.body, { headers: { 'Content-Type': asset.mime_type, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } });
}

async function handleAssetPreview(request, env, assetId) {
  const user = await authenticatedUser(request, env);
  if (!user) return json({ error: 'UNAUTHENTICATED' }, 401);
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/project_assets?id=eq.${assetId}&select=id,project_id,preview_key,preview_mime_type,processing_state`, { headers: supabaseHeaders(env) });
  if (!response.ok) return json({ error: 'ASSET_LOOKUP_FAILED' }, 503);
  const [asset] = await response.json();
  if (!asset || !await editableProject(asset.project_id, user.id, env)) return json({ error: 'ASSET_NOT_FOUND' }, 404);
  if (asset.processing_state !== 'READY' || !asset.preview_key) return json({ error: 'ASSET_PREVIEW_NOT_READY', processingState: asset.processing_state }, 409);
  const object = await env.MELSOU_ASSETS.get(asset.preview_key);
  if (!object) return json({ error: 'ASSET_PREVIEW_MISSING' }, 404);
  return new Response(object.body, { headers: { 'Content-Type': asset.preview_mime_type || 'image/webp', 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } });
}

async function handleGuestAssetPreview(request, env, assetId) {
  const response = await serviceFetch(env, `project_assets?id=eq.${assetId}&select=id,project_id,preview_key,preview_mime_type,processing_state`);
  if (!response.ok) return json({ error: 'ASSET_LOOKUP_FAILED' }, 503);
  const [asset] = await response.json();
  if (!asset || !await guestOwnedProject(request, asset.project_id, env)) return json({ error: 'ASSET_NOT_FOUND' }, 404);
  if (asset.processing_state !== 'READY' || !asset.preview_key) return json({ error: 'ASSET_PREVIEW_NOT_READY', processingState: asset.processing_state }, 409);
  const object = await env.MELSOU_ASSETS?.get(asset.preview_key);
  if (!object) return json({ error: 'ASSET_PREVIEW_MISSING' }, 404);
  return new Response(object.body, { headers: { 'Content-Type': asset.preview_mime_type || 'image/webp', 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } });
}

async function voiceActor(request, env, projectId, guest) {
  if (guest) {
    const access = await guestOwnedProject(request, projectId, env);
    return access ? { userId: null, sessionHash: access.sessionHash } : null;
  }
  const user = await authenticatedUser(request, env);
  if (!user || !await editableProject(projectId, user.id, env)) return null;
  return { userId: user.id, sessionHash: null };
}

async function handleVoiceUpload(request, env, projectId, ctx, guest = false) {
  if (!env.MELSOU_ASSETS) return json({ error: 'ASSET_STORAGE_NOT_CONFIGURED' }, 503);
  const actor = await voiceActor(request, env, projectId, guest);
  if (!actor) return json({ error: guest ? 'PROJECT_NOT_FOUND' : 'UNAUTHENTICATED_OR_PROJECT_NOT_FOUND' }, guest ? 404 : 401);
  const limit = await allowRateLimitedAction(env, `voice-upload:${requestNetworkKey(request)}:${projectId}`);
  if (limit.configurationMissing) return json({ error: 'RATE_LIMIT_NOT_CONFIGURED' }, 503);
  if (!limit.allowed) return json({ error: 'RATE_LIMITED' }, 429);
  const declaredLength = Number(request.headers.get('Content-Length') || 0);
  const maxBytes = Number(env.VOICE_MAX_BYTES || 5 * 1024 * 1024);
  if (declaredLength > maxBytes) return json({ error: 'VOICE_TOO_LARGE' }, 413);
  const bytes = await request.arrayBuffer(); let inspected;
  try {
    inspected = inspectVoiceBytes(bytes, request.headers.get('Content-Type'), Number(request.headers.get('X-Melsou-Voice-Duration-Ms')), {
      maxBytes, maxDurationSeconds: Number(env.VOICE_MAX_DURATION_SECONDS || (env.APP_ENV === 'production' ? Number.NaN : 120))
    });
  } catch (error) { return json({ error: error.code || 'VOICE_INVALID' }, error.status || 400); }
  if (env.APP_ENV === 'production' && (!env.VOICE_PROCESSOR_URL || !env.VOICE_PROCESSOR_TOKEN)) return json({ error: 'VOICE_PROCESSOR_NOT_CONFIGURED' }, 503);
  if (env.VOICE_PROCESSOR_URL) {
    let endpoint;
    try { endpoint = new URL(env.VOICE_PROCESSOR_URL); } catch { return json({ error: 'VOICE_PROCESSOR_NOT_CONFIGURED' }, 503); }
    if (env.APP_ENV === 'production' && endpoint.protocol !== 'https:') return json({ error: 'VOICE_PROCESSOR_NOT_CONFIGURED' }, 503);
    const probe = await fetch(endpoint, { method: 'POST', headers: { Authorization: `Bearer ${env.VOICE_PROCESSOR_TOKEN || ''}`, 'Content-Type': inspected.mimeType, 'X-Melsou-Reported-Duration-Ms': String(inspected.durationMs) }, body: bytes });
    if (!probe.ok) return json({ error: 'VOICE_PROCESSOR_UNAVAILABLE' }, 503);
    const result = await probe.json();
    if (result?.valid !== true || result.mimeType !== inspected.mimeType || !Number.isFinite(Number(result.durationMs)) || Math.abs(Number(result.durationMs) - inspected.durationMs) > 1000) return json({ error: 'VOICE_DECODE_VALIDATION_FAILED' }, 415);
    inspected.durationMs = Math.round(Number(result.durationMs));
  }
  const checksum = await sha256(bytes);
  const lookup = await serviceFetch(env, `voice_assets?project_id=eq.${projectId}&checksum=eq.${checksum}&status=in.(DRAFT,READY)&select=id,project_id,duration_ms,mime_type,file_size,checksum,status,created_at&limit=1`);
  if (!lookup.ok) return json({ error: 'VOICE_LOOKUP_FAILED' }, 503);
  const [duplicate] = await lookup.json(); if (duplicate) return json({ voiceAsset: duplicate, duplicate: true });
  const id = crypto.randomUUID(); const storageKey = `projects/${projectId}/voice/${id}/original`;
  await env.MELSOU_ASSETS.put(storageKey, bytes, { httpMetadata: { contentType: inspected.mimeType, cacheControl: 'private, no-store' } });
  const insert = await serviceFetch(env, 'voice_assets', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify({
    id, project_id: projectId, owner_user_id: actor.userId, guest_session_hash: actor.sessionHash, duration_ms: inspected.durationMs,
    mime_type: inspected.mimeType, file_size: inspected.size, checksum, storage_key: storageKey, status: 'DRAFT'
  }) });
  if (!insert.ok) { await env.MELSOU_ASSETS.delete(storageKey); return json({ error: 'VOICE_METADATA_SAVE_FAILED' }, 503); }
  return json({ voiceAsset: (await insert.json())[0] }, 201);
}

async function handleVoiceCommit(request, env, projectId, ctx, guest = false) {
  const actor = await voiceActor(request, env, projectId, guest);
  if (!actor) return json({ error: guest ? 'PROJECT_NOT_FOUND' : 'UNAUTHENTICATED_OR_PROJECT_NOT_FOUND' }, guest ? 404 : 401);
  let input; try { input = await request.json(); } catch { return json({ error: 'INVALID_JSON' }, 400); }
  const mode = String(input?.voiceMode || ''); const assetId = input?.voiceAssetId || null;
  if (!Number.isSafeInteger(input?.expectedRevision) || !['RECORD_ON_WEB','RECORD_AT_HOME'].includes(mode) || (mode === 'RECORD_ON_WEB' && !/^[0-9a-f-]{36}$/i.test(String(assetId))) || (mode === 'RECORD_AT_HOME' && assetId !== null)) return json({ error: 'INVALID_VOICE_SELECTION' }, 400);
  const response = await serviceFetch(env, 'rpc/melsou_commit_voice', { method: 'POST', body: JSON.stringify({ p_project_id: projectId, p_actor_user_id: actor.userId, p_guest_session_hash: actor.sessionHash, p_expected_revision: input.expectedRevision, p_voice_mode: mode, p_voice_asset_id: assetId }) });
  if (!response.ok) return json({ error: 'VOICE_COMMIT_FAILED' }, 409);
  const result = await response.json();
  if (result?.conflict) return json({ error: 'REVISION_CONFLICT', currentRevision: result.revision }, 409);
  ctx?.waitUntil?.(processVoiceCleanupJobs(env, 1));
  return json({ project: result });
}

async function handleVoiceAsset(request, env, assetId, ctx, guest = false) {
  const response = await serviceFetch(env, `voice_assets?id=eq.${assetId}&select=id,project_id,owner_user_id,guest_session_hash,duration_ms,mime_type,file_size,checksum,storage_key,status&limit=1`);
  if (!response.ok) return json({ error: 'VOICE_LOOKUP_FAILED' }, 503);
  const [asset] = await response.json(); if (!asset) return json({ error: 'VOICE_NOT_FOUND' }, 404);
  const actor = await voiceActor(request, env, asset.project_id, guest);
  if (!actor || (guest && asset.guest_session_hash !== actor.sessionHash)) return json({ error: 'VOICE_NOT_FOUND' }, 404);
  if (request.method === 'DELETE') {
    const cleanup = await serviceFetch(env, 'rpc/melsou_request_voice_cleanup', { method: 'POST', body: JSON.stringify({ p_project_id: asset.project_id, p_actor_user_id: actor.userId, p_guest_session_hash: actor.sessionHash, p_voice_asset_id: asset.id }) });
    if (!cleanup.ok || !await cleanup.json()) return json({ error: 'VOICE_DRAFT_NOT_CANCELLABLE' }, 409);
    ctx?.waitUntil?.(processVoiceCleanupJobs(env, 1));
    return json({ cancelled: true });
  }
  if (!['DRAFT','READY','SUPERSEDED'].includes(asset.status)) return json({ error: 'VOICE_NOT_FOUND' }, 404);
  const object = await env.MELSOU_ASSETS?.get(asset.storage_key); if (!object) return json({ error: 'VOICE_OBJECT_MISSING' }, 404);
  return new Response(object.body, { headers: { 'Content-Type': asset.mime_type, 'Content-Length': String(asset.file_size), 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } });
}

async function handleCreateOrder(request, env) {
  const user = await authenticatedUser(request, env);
  if (!user) return json({ error: 'UNAUTHENTICATED' }, 401);
  let input;
  try { input = await request.json(); } catch { return json({ error: 'INVALID_JSON' }, 400); }
  if (!/^[0-9a-f-]{36}$/i.test(String(input?.projectId || '')) || !Array.isArray(input?.shipments)) return json({ error: 'INVALID_ORDER_REQUEST' }, 400);
  let shipments;
  try { shipments = sanitizeShipments(input.shipments); } catch (error) { return contractFailure(error); }
  const project = await ownedProject(input.projectId, user.id, env);
  if (!project) return json({ error: 'PROJECT_NOT_FOUND' }, 404);
  let idempotencyKey;
  try {
    const supplied = request.headers.get('Idempotency-Key') || input.idempotencyKey;
    idempotencyKey = supplied ? assertIdempotencyKey(supplied) : `auto:${await sha256(textEncoder.encode(JSON.stringify({ projectId: input.projectId, revision: project.revision, configuration: input.configuration, shipments })))}`;
  } catch (error) { return contractFailure(error); }
  const paymentMode = String(env.SEPAY_MODE || (env.APP_ENV === 'production' ? '' : 'TEST')).toUpperCase();
  if (!['TEST', 'LIVE'].includes(paymentMode)) return json({ error: 'PAYMENT_MODE_NOT_CONFIGURED' }, 503);
  const [pricing, assetResponse] = await Promise.all([
    activePricing(env),
    fetch(`${env.SUPABASE_URL}/rest/v1/project_assets?project_id=eq.${input.projectId}&select=id,status,processing_state,normalized_key,normalized_mime_type,normalized_width_px,normalized_height_px`, { headers: supabaseHeaders(env) })
  ]);
  if (!pricing) return json({ error: 'ACTIVE_PRICING_UNAVAILABLE' }, 503);
  let quote;
  try { quote = createQuote(input.configuration, pricing.rules); } catch { return json({ error: 'INVALID_QUOTE_CONFIGURATION' }, 400); }
  if (shipments.length !== quote.shipments) return json({ error: 'INVALID_SHIPMENTS' }, 400);
  if (!assetResponse.ok) return json({ error: 'PREFLIGHT_LOOKUP_FAILED' }, 503);
  const assets = await assetResponse.json();
  const preflight = runPreflight({ document: project.document, assets, requirePrintProfile: false });
  if (preflight.status === 'BLOCKING_ERROR') return json({ error: 'PREFLIGHT_BLOCKING_ERROR', preflight }, 409);
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/melsou_create_order_v3`, {
    method: 'POST', headers: supabaseHeaders(env), body: JSON.stringify({ p_customer_id: user.id, p_project_id: input.projectId, p_package_code: quote.packageCode, p_quote: quote, p_shipments: shipments, p_preflight: preflight, p_idempotency_key: idempotencyKey, p_payment_mode: paymentMode })
  });
  if (!response.ok) {
    const details = await response.text();
    if (details.includes('VOICE_SELECTION_REQUIRED')) return json({ error: 'VOICE_SELECTION_REQUIRED' }, 409);
    if (details.includes('VOICE_ASSET_NOT_READY')) return json({ error: 'VOICE_ASSET_NOT_READY' }, 409);
    return json({ error: 'ORDER_CREATION_FAILED', ...(env.APP_ENV === 'development' ? { diagnostic: details.slice(0, 500) } : {}) }, 500);
  }
  return json({ order: await response.json() }, 201);
}

async function handleOrderGet(request, env, orderId) {
  const user = await authenticatedUser(request, env);
  if (!user) return json({ error: 'UNAUTHENTICATED' }, 401);
  const response = await serviceFetch(env, `orders?id=eq.${orderId}&customer_id=eq.${user.id}&select=id,order_code,status,expected_amount_vnd,price_snapshot,payment_expires_at,created_at,updated_at,shipments(sequence,status,carrier,tracking_code,tracking_url),order_events(event_type,status,created_at),order_voice_selections(voice_mode,duration_ms,mime_type,file_size,created_at)&limit=1`);
  if (!response.ok) return json({ error: 'ORDER_UNAVAILABLE' }, 503);
  const [order] = await response.json();
  return order ? json({ order }) : json({ error: 'ORDER_NOT_FOUND' }, 404);
}

async function handleOrderList(request, env) {
  const user = await authenticatedUser(request, env);
  if (!user) return json({ error: 'UNAUTHENTICATED' }, 401);
  const response = await serviceFetch(env, `orders?customer_id=eq.${user.id}&select=id,order_code,status,expected_amount_vnd,price_snapshot,payment_expires_at,created_at,updated_at,shipments(sequence,status,carrier,tracking_code,tracking_url),order_voice_selections(voice_mode,duration_ms,mime_type,file_size,created_at)&order=created_at.desc&limit=100`);
  if (!response.ok) return json({ error: 'ORDERS_UNAVAILABLE' }, 503);
  return json({ orders: await response.json() });
}

async function handleAddresses(request, env, addressId = null) {
  const user = await authenticatedUser(request, env);
  if (!user) return json({ error: 'UNAUTHENTICATED' }, 401);
  if (request.method === 'GET') {
    const response = await serviceFetch(env, `customer_addresses?customer_id=eq.${user.id}&select=id,label,recipient,phone,address,is_default,created_at,updated_at&order=is_default.desc,updated_at.desc`);
    if (!response.ok) return json({ error: 'ADDRESSES_UNAVAILABLE' }, 503);
    return json({ addresses: await response.json() });
  }
  if (request.method === 'DELETE') {
    const response = await serviceFetch(env, 'rpc/melsou_delete_customer_address', { method: 'POST', body: JSON.stringify({ p_customer_id: user.id, p_address_id: addressId }) });
    if (!response.ok) return json({ error: 'ADDRESS_DELETE_FAILED' }, 503);
    return json({ removed: await response.json() });
  }
  let input;
  try { input = await request.json(); } catch { return json({ error: 'INVALID_JSON' }, 400); }
  let address;
  try { address = sanitizeAddress(input, { partial: Boolean(addressId) }); } catch (error) { return contractFailure(error); }
  const response = await serviceFetch(env, 'rpc/melsou_save_customer_address', {
    method: 'POST', body: JSON.stringify({ p_customer_id: user.id, p_address_id: addressId, p_address: address })
  });
  if (!response.ok) return json({ error: 'ADDRESS_SAVE_FAILED' }, 503);
  return json({ address: await response.json() }, addressId ? 200 : 201);
}

async function handleOrderPayment(request, env, orderId) {
  const user = await authenticatedUser(request, env);
  if (!user) return json({ error: 'UNAUTHENTICATED' }, 401);
  const response = await serviceFetch(env, `orders?id=eq.${orderId}&customer_id=eq.${user.id}&select=id,order_code,status,payment_code,expected_amount_vnd,payment_expires_at&limit=1`);
  if (!response.ok) return json({ error: 'PAYMENT_UNAVAILABLE' }, 503);
  const [order] = await response.json();
  if (!order) return json({ error: 'ORDER_NOT_FOUND' }, 404);
  if (!['AWAITING_PAYMENT', 'PAYMENT_EXPIRED', 'PAYMENT_MISMATCH', 'PAID'].includes(order.status)) return json({ error: 'PAYMENT_NOT_AVAILABLE_FOR_ORDER' }, 409);
  try { return json({ order: { id: order.id, orderCode: order.order_code, status: order.status }, payment: buildPaymentInstructions(order, env) }); }
  catch (error) { return contractFailure(error, 'PAYMENT_NOT_CONFIGURED'); }
}

async function handleOrderArtifact(request, env, orderId, artifactKind) {
  const user = await authenticatedUser(request, env);
  if (!user) return json({ error: 'UNAUTHENTICATED' }, 401);
  if (!env.MELSOU_ASSETS) return json({ error: 'ASSET_STORAGE_NOT_CONFIGURED' }, 503);
  const artifactField = artifactKind === 'cover' ? 'cover_print_pdf_key' : artifactKind === 'interior' ? 'interior_spreads_pdf_key' : null;
  if (!artifactField) return json({ error: 'EXPORT_ARTIFACT_NOT_SUPPORTED' }, 404);
  const response = await serviceFetch(env, `orders?id=eq.${orderId}&customer_id=eq.${user.id}&select=id,order_code,render_jobs(status,artifacts,completed_at)&limit=1`);
  if (!response.ok) return json({ error: 'EXPORT_UNAVAILABLE' }, 503);
  const [order] = await response.json();
  if (!order) return json({ error: 'ORDER_NOT_FOUND' }, 404);
  const render = (order.render_jobs || []).filter((job) => job.status === 'SUCCESS' && job.artifacts?.[artifactField])
    .sort((left, right) => String(right.completed_at || '').localeCompare(String(left.completed_at || '')))[0];
  if (!render) return json({ error: 'EXPORT_NOT_READY' }, 409);
  const storageKey = render.artifacts[artifactField];
  const expectedPrefix = `orders/${order.order_code}/`;
  if (typeof storageKey !== 'string' || !storageKey.startsWith(expectedPrefix) || !storageKey.endsWith('.pdf')) return json({ error: 'EXPORT_ARTIFACT_INVALID' }, 500);
  const object = await env.MELSOU_ASSETS.get(storageKey);
  if (!object) return json({ error: 'EXPORT_ARTIFACT_MISSING' }, 503);
  const safeCode = String(order.order_code).replace(/[^A-Z0-9-]/gi, '');
  return new Response(object.body, { headers: {
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="${safeCode}-${artifactKind}.pdf"`,
    'Cache-Control': 'private, no-store',
    'X-Content-Type-Options': 'nosniff'
  } });
}

async function handlePaymentResolution(request, env, orderId) {
  const user = await ownerUser(request, env);
  if (!user) return json({ error: 'OWNER_REQUIRED' }, 403);
  let input;
  try { input = await request.json(); } catch { return json({ error: 'INVALID_JSON' }, 400); }
  const resolution = String(input?.resolution || ''); const note = String(input?.note || '').trim();
  if (!['MARK_PAID', 'CANCEL'].includes(resolution) || note.length < 5 || note.length > 1000) return json({ error: 'INVALID_PAYMENT_RESOLUTION' }, 400);
  const response = await serviceFetch(env, 'rpc/melsou_resolve_payment_mismatch', { method: 'POST', body: JSON.stringify({ p_owner_id: user.id, p_order_id: orderId, p_resolution: resolution, p_note: note }) });
  if (!response.ok) return json({ error: 'PAYMENT_RESOLUTION_REJECTED' }, 409);
  return json({ order: await response.json() });
}

async function handleOwnerFulfillment(request, env, orderId) {
  const user = await ownerUser(request, env);
  if (!user) return json({ error: 'OWNER_REQUIRED' }, 403);
  let input;
  try { input = await request.json(); } catch { return json({ error: 'INVALID_JSON' }, 400); }
  const status = String(input?.status || '');
  const sequence = input?.sequence === undefined || input?.sequence === null ? null : Number(input.sequence);
  const note = String(input?.note || '').trim();
  if (!['READY_TO_SHIP', 'SHIPPING', 'COMPLETED', 'DELIVERY_FAILED'].includes(status) || (status !== 'READY_TO_SHIP' && ![1, 2].includes(sequence)) || note.length < 3 || note.length > 1000) {
    return json({ error: 'INVALID_FULFILLMENT_UPDATE' }, 400);
  }
  const carrier = input?.carrier === undefined || input?.carrier === null ? null : String(input.carrier).trim();
  const trackingCode = input?.trackingCode === undefined || input?.trackingCode === null ? null : String(input.trackingCode).trim();
  const trackingUrl = input?.trackingUrl === undefined || input?.trackingUrl === null || input?.trackingUrl === '' ? null : String(input.trackingUrl).trim();
  if ((carrier && carrier.length > 120) || (trackingCode && trackingCode.length > 120) || (trackingUrl && (trackingUrl.length > 500 || !/^https:\/\//i.test(trackingUrl))) || (status === 'SHIPPING' && (!carrier || !trackingCode))) {
    return json({ error: 'INVALID_FULFILLMENT_UPDATE' }, 400);
  }
  const response = await serviceFetch(env, 'rpc/melsou_update_fulfillment', { method: 'POST', body: JSON.stringify({
    p_owner_id: user.id, p_order_id: orderId, p_sequence: sequence, p_status: status,
    p_carrier: carrier, p_tracking_code: trackingCode, p_tracking_url: trackingUrl, p_note: note
  }) });
  if (!response.ok) return json({ error: 'FULFILLMENT_UPDATE_REJECTED' }, 409);
  return json({ fulfillment: await response.json() });
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
  const limit = await allowRateLimitedAction(env, `duo-invite:${user.id}:${projectId}`);
  if (limit.configurationMissing) return json({ error: 'RATE_LIMIT_NOT_CONFIGURED' }, 503);
  if (!limit.allowed) return json({ error: 'RATE_LIMITED' }, 429);
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

async function handleTracking(request, env) {
  let input;
  try { input = await request.json(); } catch { return json({ error: 'INVALID_JSON' }, 400); }
  const orderCode = String(input?.orderCode || '').trim().toUpperCase();
  if (!/^MEL[MVS]-\d{4}-\d{3,}$/.test(orderCode)) return json({ error: 'INVALID_ORDER_CODE' }, 400);
  let verifierHash;
  try { verifierHash = await sha256(textEncoder.encode(normalizeTrackingPhone(input?.phone))); } catch (error) { return contractFailure(error); }
  const limit = await allowRateLimitedAction(env, `tracking:${requestNetworkKey(request)}:${orderCode}`);
  if (limit.configurationMissing) return json({ error: 'RATE_LIMIT_NOT_CONFIGURED' }, 503);
  if (!limit.allowed) return json({ error: 'RATE_LIMITED' }, 429);
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/orders?order_code=eq.${encodeURIComponent(orderCode)}&tracking_verifier_hash=eq.${verifierHash}&select=order_code,status,shipments(status,carrier,tracking_code,tracking_url),order_events(event_type,status,created_at,public_visible)&limit=1`, { headers: supabaseHeaders(env) });
  if (!response.ok) return json({ error: 'TRACKING_UNAVAILABLE' }, 503);
  const [order] = await response.json();
  if (!order) return json({ error: 'ORDER_NOT_FOUND' }, 404);
  return json({ order: {
    orderCode: order.order_code, status: order.status,
    timeline: (order.order_events || []).filter((event) => event.public_visible !== false).map((event) => ({ event: event.event_type, status: event.status, at: event.created_at })),
    shipments: (order.shipments || []).map((shipment) => ({ status: shipment.status, carrier: shipment.carrier || null, trackingCode: shipment.tracking_code || null, trackingUrl: shipment.tracking_url || null }))
  } });
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
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY || !env.MELSOU_ASSETS) return;
  const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const lookup = await serviceFetch(env, `projects?owner_user_id=is.null&last_activity_at=lt.${encodeURIComponent(cutoff)}&select=id,project_assets(storage_key,preview_key,normalized_key),voice_assets(storage_key)&order=last_activity_at.asc&limit=20`);
  if (!lookup.ok) return;
  for (const project of await lookup.json()) {
    const prefix = `projects/${project.id}/assets/`;
    const voicePrefix = `projects/${project.id}/voice/`;
    const keys = [...(project.project_assets || []).flatMap((asset) => [asset.storage_key, asset.preview_key, asset.normalized_key]), ...(project.voice_assets || []).map((asset) => asset.storage_key)]
      .filter((key) => typeof key === 'string' && (key.startsWith(prefix) || key.startsWith(voicePrefix)));
    try {
      const marked = await serviceFetch(env, `projects?id=eq.${project.id}&owner_user_id=is.null&last_activity_at=lt.${encodeURIComponent(cutoff)}`, { method: 'PATCH', body: JSON.stringify({ status: 'TRASHED', trashed_at: new Date().toISOString(), updated_at: new Date().toISOString() }) });
      if (!marked.ok) continue;
      for (const key of [...new Set(keys)]) await env.MELSOU_ASSETS.delete(key);
      await serviceFetch(env, `projects?id=eq.${project.id}&owner_user_id=is.null&status=eq.TRASHED`, { method: 'DELETE' });
    } catch { /* Keep the explicit TRASHED state so cleanup can be retried safely. */ }
  }
  await serviceFetch(env, `guest_sessions?expires_at=lt.${encodeURIComponent(new Date().toISOString())}`, { method: 'DELETE' });
}

async function cleanupExpiredAccountTrash(env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY || !env.MELSOU_ASSETS) return;
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const lookup = await serviceFetch(env, `projects?owner_user_id=not.is.null&status=eq.TRASHED&trashed_at=lt.${encodeURIComponent(cutoff)}&select=id,project_assets(storage_key,preview_key,normalized_key),voice_assets(storage_key),production_snapshots(id)&order=trashed_at.asc&limit=20`);
  if (!lookup.ok) return;
  for (const project of await lookup.json()) {
    if (project.production_snapshots?.length) continue;
    const prefix = `projects/${project.id}/assets/`;
    const voicePrefix = `projects/${project.id}/voice/`;
    const keys = [...(project.project_assets || []).flatMap((asset) => [asset.storage_key, asset.preview_key, asset.normalized_key]), ...(project.voice_assets || []).map((asset) => asset.storage_key)]
      .filter((key) => typeof key === 'string' && (key.startsWith(prefix) || key.startsWith(voicePrefix)));
    try {
      for (const key of [...new Set(keys)]) await env.MELSOU_ASSETS.delete(key);
      await serviceFetch(env, `projects?id=eq.${project.id}&status=eq.TRASHED&trashed_at=lt.${encodeURIComponent(cutoff)}`, { method: 'DELETE' });
    } catch { /* A missing/failed object deletion remains retryable on the next schedule. */ }
  }
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
  const limit = await allowRateLimitedAction(env, `sepay-webhook:${requestNetworkKey(request)}`);
  if (limit.configurationMissing) return json({ success: false, error: 'RATE_LIMIT_NOT_CONFIGURED' }, 503);
  if (!limit.allowed) return json({ success: false, error: 'RATE_LIMITED' }, 429);
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
    env = withPrivateStorage(env);
    const url = new URL(request.url);
    if (url.pathname === '/api/health' && request.method === 'GET') return json({ ok: true, environment: env.APP_ENV || 'unknown' });
    if (url.pathname === '/api/auth/native/register' && request.method === 'POST') return handleNativeRegister(request, env);
    if (url.pathname === '/api/auth/native/login' && request.method === 'POST') return handleNativeLogin(request, env);
    if (url.pathname === '/api/auth/native/logout' && request.method === 'POST') return handleNativeLogout(request, env);
    if (url.pathname === '/api/auth/recovery/request' && request.method === 'POST') return handleRecoveryRequest(request, env);
    if (url.pathname === '/api/auth/recovery/complete' && request.method === 'POST') return handleRecoveryComplete(request, env);
    if (url.pathname === '/api/public-config' && request.method === 'GET') return json({ supabaseUrl: env.SUPABASE_URL || null, supabaseAnonKey: env.SUPABASE_ANON_KEY || null, environment: env.APP_ENV || 'unknown', payment: { provider: 'SEPAY', mode: env.SEPAY_MODE || null } });
    if (url.pathname === '/api/quote' && request.method === 'POST') {
      const pricing = await activePricing(env);
      if (!pricing) return json({ error: 'ACTIVE_PRICING_UNAVAILABLE' }, 503);
      try { return json({ quote: createQuote(await request.json(), pricing.rules), pricingVersion: pricing.version }); }
      catch { return json({ error: 'INVALID_QUOTE_CONFIGURATION' }, 400); }
    }
    if (url.pathname === '/api/blog' && request.method === 'GET') return handlePublicBlog(env);
    if (url.pathname === '/api/templates' && request.method === 'GET') return handleTemplates(url);
    const publicTemplate = url.pathname.match(/^\/api\/templates\/([a-z0-9-]+)$/);
    if (publicTemplate && request.method === 'GET') return handleTemplates(url, publicTemplate[1]);
    const blogCover = url.pathname.match(/^\/api\/blog\/([a-z0-9-]+)\/cover$/);
    if (blogCover && request.method === 'GET') return handleBlogCover(env, blogCover[1]);
    const publicBlogPost = url.pathname.match(/^\/api\/blog\/([a-z0-9-]+)$/);
    if (publicBlogPost && request.method === 'GET') return handlePublicBlog(env, publicBlogPost[1]);
    if (url.pathname === '/api/guest/projects' && (request.method === 'GET' || request.method === 'POST')) return handleGuestProjects(request, env);
    const guestProjectSave = url.pathname.match(/^\/api\/guest\/projects\/([0-9a-f-]{36})$/i);
    if (guestProjectSave && request.method === 'PUT') return handleGuestProjectSave(request, env, guestProjectSave[1]);
    const guestCheckpoint = url.pathname.match(/^\/api\/guest\/projects\/([0-9a-f-]{36})\/checkpoints$/i);
    if (guestCheckpoint && request.method === 'POST') return handleCheckpoint(request, env, guestCheckpoint[1], true);
    const guestAssetUpload = url.pathname.match(/^\/api\/guest\/projects\/([0-9a-f-]{36})\/assets$/i);
    if (guestAssetUpload && request.method === 'POST') return handleAssetUpload(request, env, guestAssetUpload[1], ctx, true);
    const guestAssetPreview = url.pathname.match(/^\/api\/guest\/assets\/([0-9a-f-]{36})\/preview$/i);
    if (guestAssetPreview && request.method === 'GET') return handleGuestAssetPreview(request, env, guestAssetPreview[1]);
    const guestVoiceUpload = url.pathname.match(/^\/api\/guest\/projects\/([0-9a-f-]{36})\/voice-assets$/i);
    if (guestVoiceUpload && request.method === 'POST') return handleVoiceUpload(request, env, guestVoiceUpload[1], ctx, true);
    const guestVoiceCommit = url.pathname.match(/^\/api\/guest\/projects\/([0-9a-f-]{36})\/voice$/i);
    if (guestVoiceCommit && request.method === 'POST') return handleVoiceCommit(request, env, guestVoiceCommit[1], ctx, true);
    const guestVoiceAsset = url.pathname.match(/^\/api\/guest\/voice-assets\/([0-9a-f-]{36})$/i);
    if (guestVoiceAsset && (request.method === 'GET' || request.method === 'DELETE')) return handleVoiceAsset(request, env, guestVoiceAsset[1], ctx, true);
    if (url.pathname === '/api/guest/projects/claim' && request.method === 'POST') return handleGuestClaim(request, env);
    const projectSave = url.pathname.match(/^\/api\/projects\/([0-9a-f-]{36})$/i);
    if (url.pathname === '/api/projects' && request.method === 'GET') return handleProjectList(request, env);
    if (url.pathname === '/api/projects' && request.method === 'POST') return handleProjectCreate(request, env);
    if (projectSave && request.method === 'GET') return handleProjectGet(request, env, projectSave[1]);
    if (projectSave && request.method === 'PUT') return handleProjectSave(request, env, projectSave[1]);
    if (projectSave && request.method === 'DELETE') return handleProjectTrash(request, env, projectSave[1]);
    const projectRestore = url.pathname.match(/^\/api\/projects\/([0-9a-f-]{36})\/restore$/i);
    if (projectRestore && request.method === 'POST') return handleProjectTrash(request, env, projectRestore[1], true);
    const projectCheckpoint = url.pathname.match(/^\/api\/projects\/([0-9a-f-]{36})\/checkpoints$/i);
    if (projectCheckpoint && request.method === 'POST') return handleCheckpoint(request, env, projectCheckpoint[1]);
    const projectAssetUpload = url.pathname.match(/^\/api\/projects\/([0-9a-f-]{36})\/assets$/i);
    if (projectAssetUpload && request.method === 'POST') return handleAssetUpload(request, env, projectAssetUpload[1], ctx);
    const duoInvite = url.pathname.match(/^\/api\/projects\/([0-9a-f-]{36})\/duo-invitations$/i);
    if (duoInvite && request.method === 'POST') return handleDuoInvite(request, env, duoInvite[1]);
    if (url.pathname === '/api/duo-invitations/accept' && request.method === 'POST') return handleDuoAccept(request, env);
    const assetDownload = url.pathname.match(/^\/api\/assets\/([0-9a-f-]{36})$/i);
    if (assetDownload && request.method === 'GET') return handleAssetDownload(request, env, assetDownload[1]);
    const assetPreview = url.pathname.match(/^\/api\/assets\/([0-9a-f-]{36})\/preview$/i);
    if (assetPreview && request.method === 'GET') return handleAssetPreview(request, env, assetPreview[1]);
    const projectVoiceUpload = url.pathname.match(/^\/api\/projects\/([0-9a-f-]{36})\/voice-assets$/i);
    if (projectVoiceUpload && request.method === 'POST') return handleVoiceUpload(request, env, projectVoiceUpload[1], ctx);
    const projectVoiceCommit = url.pathname.match(/^\/api\/projects\/([0-9a-f-]{36})\/voice$/i);
    if (projectVoiceCommit && request.method === 'POST') return handleVoiceCommit(request, env, projectVoiceCommit[1], ctx);
    const voiceAsset = url.pathname.match(/^\/api\/voice-assets\/([0-9a-f-]{36})$/i);
    if (voiceAsset && (request.method === 'GET' || request.method === 'DELETE')) return handleVoiceAsset(request, env, voiceAsset[1], ctx);
    if (url.pathname === '/api/account' && (request.method === 'GET' || request.method === 'PATCH')) return handleAccount(request, env);
    if (url.pathname === '/api/account/email/link' && request.method === 'POST') return handleEmailLinkRequest(request, env);
    if (url.pathname === '/api/account/email/verify' && request.method === 'POST') return handleEmailVerify(request, env);
    if (url.pathname === '/api/account/username' && request.method === 'POST') return handleUsernameChange(request, env);
    if (url.pathname === '/api/account/password' && request.method === 'POST') return handlePasswordChange(request, env);
    if (url.pathname === '/api/cart' && request.method === 'GET') return handleCart(request, env);
    if (url.pathname === '/api/cart/items' && request.method === 'POST') return handleCartItem(request, env);
    const cartItem = url.pathname.match(/^\/api\/cart\/items\/([0-9a-f-]{36})$/i);
    if (cartItem && request.method === 'DELETE') return handleCartItem(request, env, cartItem[1]);
    if (url.pathname === '/api/orders' && request.method === 'GET') return handleOrderList(request, env);
    if (url.pathname === '/api/orders' && request.method === 'POST') return handleCreateOrder(request, env);
    if (url.pathname === '/api/addresses' && (request.method === 'GET' || request.method === 'POST')) return handleAddresses(request, env);
    const customerAddress = url.pathname.match(/^\/api\/addresses\/([0-9a-f-]{36})$/i);
    if (customerAddress && (request.method === 'PATCH' || request.method === 'DELETE')) return handleAddresses(request, env, customerAddress[1]);
    const orderPayment = url.pathname.match(/^\/api\/orders\/([0-9a-f-]{36})\/payment$/i);
    if (orderPayment && request.method === 'GET') return handleOrderPayment(request, env, orderPayment[1]);
    const orderArtifact = url.pathname.match(/^\/api\/orders\/([0-9a-f-]{36})\/artifacts\/(cover|interior)$/i);
    if (orderArtifact && request.method === 'GET') return handleOrderArtifact(request, env, orderArtifact[1], orderArtifact[2].toLowerCase());
    const orderGet = url.pathname.match(/^\/api\/orders\/([0-9a-f-]{36})$/i);
    if (orderGet && request.method === 'GET') return handleOrderGet(request, env, orderGet[1]);
    if (url.pathname === '/api/tracking' && request.method === 'POST') return handleTracking(request, env);
    if (/^\/api\/tracking\//i.test(url.pathname) && request.method === 'GET') return json({ error: 'TRACKING_VERIFICATION_REQUIRED' }, 400);
    if (url.pathname === '/api/owner/orders' && request.method === 'GET') return handleOwnerOrders(request, env);
    if (url.pathname === '/api/owner/blog' && (request.method === 'GET' || request.method === 'POST')) return handleOwnerBlog(request, env);
    const ownerBlogPost = url.pathname.match(/^\/api\/owner\/blog\/([0-9a-f-]{36})$/i);
    if (ownerBlogPost && (request.method === 'PUT' || request.method === 'DELETE')) return handleOwnerBlog(request, env, ownerBlogPost[1]);
    const paymentResolution = url.pathname.match(/^\/api\/owner\/orders\/([0-9a-f-]{36})\/payment-resolution$/i);
    if (paymentResolution && request.method === 'POST') return handlePaymentResolution(request, env, paymentResolution[1]);
    const fulfillmentUpdate = url.pathname.match(/^\/api\/owner\/orders\/([0-9a-f-]{36})\/fulfillment$/i);
    if (fulfillmentUpdate && request.method === 'POST') return handleOwnerFulfillment(request, env, fulfillmentUpdate[1]);
    if (url.pathname === '/api/owner/print-profiles' && request.method === 'POST') return handlePrintProfile(request, env);
    const prepressApproval = url.pathname.match(/^\/api\/orders\/([0-9a-f-]{36})\/prepress-approve$/i);
    if (prepressApproval && request.method === 'POST') return handlePrepressApproval(request, env, prepressApproval[1]);
    const renderCompletion = url.pathname.match(/^\/api\/internal\/render-jobs\/([0-9a-f-]{36})\/complete$/i);
    if (renderCompletion && request.method === 'POST') return handleRenderCompletion(request, env, renderCompletion[1]);
    if (url.pathname === '/api/sepay/webhook' && request.method === 'POST') return handleSePay(request, env);
    return json({ error: 'NOT_FOUND' }, 404);
  },
  async scheduled(_event, env, ctx) { env = withPrivateStorage(env); ctx.waitUntil(Promise.all([processAssetJobs(env), processVoiceCleanupJobs(env), processOperations(env), processRenderJobs(env), expireInactiveGuestDrafts(env), cleanupExpiredAccountTrash(env)])); }
};
