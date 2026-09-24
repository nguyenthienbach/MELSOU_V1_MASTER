import { createQuote, DEFAULT_PRICING_RULES } from './quote.mjs';
import { runPreflight } from './preflight.mjs';
import { processOperations } from './operations.mjs';
import { processRenderJobs, templateCatalog, templateFor } from './renderer.mjs';
import { assertDraftAssetQuota, assertUploadSize, inspectUploadedImage, processAssetJobs } from './image-processing.mjs';
import { PASSWORD_ITERATIONS, assertPassword, derivePassword, normalizeOptionalEmail, normalizeUsername, randomSecret, verifyPassword } from './native-auth.mjs';
import { inspectVoiceBytes, processVoiceCleanupJobs } from './voice.mjs';
import { withPrivateStorage } from './storage.mjs';
import { handleBlogInteraction, matchBlogInteraction } from './blog-interactions.mjs';
import { handleWordpressComment, matchWordpressComment, wordpressCommentMeta } from './wordpress-comments.mjs';
import { exchangeWordpressToken, handleWordpressOauthCallback, handleWordpressOauthStart, handleWordpressOauthStatus } from './wordpress-oauth.mjs';
import {
  ContractError, assertCartConfiguration, assertCheckpointReason, assertIdempotencyKey, assertProjectDocument, assertUuid,
  buildPaymentInstructions, normalizeTrackingPhone, sanitizeAccountPatch, sanitizeAddress, sanitizeBlogPost, sanitizeShipments
} from './backend-contracts.mjs';

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
const publicJson = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=30, stale-while-revalidate=30', 'X-Content-Type-Options': 'nosniff' } });
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
  const trustedOrigins = new Set([new URL(request.url).origin]);
  const configuredOrigins = [env.APP_BASE_URL, ...String(env.APP_ALLOWED_ORIGINS || '').split(',')].filter(Boolean);
  for (const configuredOrigin of configuredOrigins) {
    try { trustedOrigins.add(new URL(configuredOrigin.trim()).origin); } catch { return null; }
  }
  if (!['GET','HEAD','OPTIONS'].includes(request.method) && origin && !trustedOrigins.has(origin)) return null;
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
  try { username = normalizeUsername(input?.username); } catch (error) { return contractFailure(error); }
  try { password = assertPassword(input?.password); } catch (error) {
    return error instanceof ContractError && error.code === 'INVALID_PASSWORD'
      ? json({ error: 'WEAK_PASSWORD' }, 400)
      : contractFailure(error);
  }
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

async function blogOwnerAuth(request, env) {
  const user = await nativeSessionUser(request, env);
  if (!user) return { ok: false, status: 401, error: 'UNAUTHORIZED' };
  if (!env.OWNER_USER_ID || user.id !== env.OWNER_USER_ID) return { ok: false, status: 403, error: 'FORBIDDEN' };
  const response = await serviceFetch(env, `profiles?user_id=eq.${user.id}&select=role&limit=1`);
  if (!response.ok) return { ok: false, status: 503, error: 'OWNER_PROFILE_UNAVAILABLE' };
  const [profile] = await response.json();
  return profile?.role === 'OWNER'
    ? { ok: true, user }
    : { ok: false, status: 403, error: 'FORBIDDEN' };
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

const wordpressApi = 'https://public-api.wordpress.com/wp/v2/sites/melsoucms.wordpress.com';
const wordpressFetch = (path) => fetch(`${wordpressApi}${path}`, { headers: { Accept: 'application/json' }, cf: { cacheEverything: true, cacheTtl: 30 } });
const wordpressCategory = (post) => {
  const terms = post?._embedded?.['wp:term'];
  const category = Array.isArray(terms?.[0]) ? terms[0][0] : null;
  return category ? { id: category.id, name: category.name, slug: category.slug } : null;
};
const decodeHtmlText = (value) => String(value || '')
  .replace(/<[^>]*>/g, ' ')
  .replace(/&#(\d+);|&#x([0-9a-f]+);|&([a-z]+);/gi, (match, decimal, hexadecimal, named) => {
    if (decimal) return String.fromCodePoint(Number(decimal));
    if (hexadecimal) return String.fromCodePoint(Number.parseInt(hexadecimal, 16));
    return ({ amp: '&', apos: "'", gt: '>', lt: '<', nbsp: ' ', quot: '"' })[named.toLowerCase()] || match;
  })
  .replace(/\s+/g, ' ')
  .trim();
const decodeHtmlEntitiesOnce = (value) => String(value || '').replace(/&#(\d+);|&#x([0-9a-f]+);|&([a-z]+);/gi, (match, decimal, hexadecimal, named) => {
  if (decimal) return String.fromCodePoint(Number(decimal));
  if (hexadecimal) return String.fromCodePoint(Number.parseInt(hexadecimal, 16));
  return ({ amp: '&', apos: "'", gt: '>', hellip: '…', lt: '<', nbsp: ' ', ndash: '–', mdash: '—', quot: '"' })[named.toLowerCase()] || match;
});
const cleanWordpressDescription = (value) => decodeHtmlEntitiesOnce(String(value || '')
  .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, ' ')
  .replace(/<[^>]*>/g, ' ')
  .replace(/\[[^\]]*\]/g, ' '))
  .replace(/\[?…\]?/g, ' ')
  .replace(/(?:Đọc|Xem)\s+tiếp(?:[^.!?]|\.{3})*/giu, ' ')
  .replace(/\u00a0/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();
const sentenceBoundedDescription = (value, maximum = 180) => {
  const characters = Array.from(value);
  if (characters.length <= maximum) return value;
  const candidate = characters.slice(0, maximum + 1).join('');
  const sentence = candidate.match(/^([\s\S]*[.!?])(?:\s|$)/u)?.[1];
  if (sentence && Array.from(sentence).length >= 80) return sentence.trim();
  const words = characters.slice(0, maximum).join('').replace(/\s+\S*$/u, '').trim();
  return (words || characters.slice(0, maximum).join('').trim()) + '…';
};
function resolveWordpressDescription(post) {
  const jetpackSeo = cleanWordpressDescription(post?.meta?.advanced_seo_description);
  if (jetpackSeo) return { description: jetpackSeo, source: 'meta.advanced_seo_description' };
  const seo = cleanWordpressDescription(post?.yoast_head_json?.description);
  if (seo) return { description: seo, source: 'yoast_head_json.description' };
  const excerpt = cleanWordpressDescription(post?.excerpt?.rendered ?? post?.excerpt);
  if (excerpt) return { description: excerpt, source: 'excerpt' };
  return { description: sentenceBoundedDescription(cleanWordpressDescription(post?.content?.rendered ?? post?.content)), source: 'content_fallback' };
}
const wordpressPost = (post) => {
  const resolvedDescription = resolveWordpressDescription(post);
  return {
    id: post.id,
    slug: post.slug,
    title: post.title?.rendered || '',
    content: post.content?.rendered || '',
    excerpt: post.excerpt?.rendered || '',
    description: resolvedDescription.description,
    descriptionSource: resolvedDescription.source,
    publishedAt: post.date_gmt ? `${post.date_gmt}Z` : post.date,
    modifiedAt: post.modified_gmt ? `${post.modified_gmt}Z` : post.modified,
    category: wordpressCategory(post),
    featuredImage: post._embedded?.['wp:featuredmedia']?.[0]?.source_url || post.jetpack_featured_media_url || null,
    commentsOpen: post.comment_status === 'open',
    author: post._embedded?.author?.[0]?.name ? decodeHtmlText(post._embedded.author[0].name) : null
  };
};
const htmlEscape = (value) => String(value || '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const safeImageUrl = (value) => {
  try {
    const parsed = new URL(String(value || ''));
    return parsed.protocol === 'https:' ? parsed.href : null;
  } catch { return null; }
};
const sanitizeWordpressArticleHtml = (value) => String(value || '')
  .replace(/<(script|style|iframe|object|embed|form)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
  .replace(/<(script|style|iframe|object|embed|form)\b[^>]*\/?>/gi, '')
  .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
  .replace(/\s+(href|src)\s*=\s*(?:(['"])\s*(?:javascript:|data:text\/html)[\s\S]*?\2|(?:javascript:|data:text\/html)[^\s>]*)/gi, '');

const blogFallbackImage = 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600';
const melsouFullDescription = 'Chiếc máy ảnh có thể giữ lại hình dáng khoảnh khắc, nhưng lại vô tình bỏ quên âm thanh. Melsou hòa quyện giai điệu (melody) và kỷ vật (souvenir) để mỗi trang ảnh không chỉ đẹp, mà còn biết cất lời.';
const melsouHomepageDescription = 'Melsou kết hợp album ảnh cá nhân hóa với giai điệu và kỷ vật, để mỗi trang ảnh không chỉ lưu giữ khoảnh khắc mà còn biết cất lời.';
const melsouOrganizationId = 'https://melsou.com/#organization';
const homepageEntityGraph = JSON.stringify({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization', '@id': melsouOrganizationId, name: 'Melsou', alternateName: 'Melsou Melody & Souvenir',
      url: 'https://melsou.com/', description: melsouFullDescription, logo: 'https://melsou.com/favicon.png',
      sameAs: ['https://www.facebook.com/share/1EikCbdn3N/?mibextid=wwXIfr', 'https://www.tiktok.com/@melsou.vn']
    },
    { '@type': 'WebSite', '@id': 'https://melsou.com/#website', url: 'https://melsou.com/', name: 'Melsou', inLanguage: 'vi-VN', publisher: { '@id': melsouOrganizationId } }
  ]
}).replace(/</g, '\\u003c');
const renderPublicBlogCard = (post) => {
  const slug = /^[a-z0-9-]+$/.test(post.slug || '') ? post.slug : null;
  if (!slug) return '';
  const title = decodeHtmlText(post.title);
  const excerpt = decodeHtmlText(post.excerpt);
  const category = decodeHtmlText(post.category?.name) || 'Kỷ vật';
  const image = safeImageUrl(post.featuredImage) || blogFallbackImage;
  const publishedDate = post.publishedAt
    ? new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(post.publishedAt))
    : '';
  return '<article class="blog-card-item" data-blog-slug="' + htmlEscape(slug) + '">'
    + '<a href="/blog/' + htmlEscape(slug) + '" class="blog-card-link">'
    + '<div class="blog-card-image-wrap"><img src="' + htmlEscape(image) + '" alt="' + htmlEscape(title) + '" class="blog-card-img" loading="lazy"></div>'
    + '<div class="blog-card-body"><div><div class="blog-card-meta">'
    + '<span class="blog-card-category">' + htmlEscape(category) + '</span>'
    + '<span class="blog-card-date">' + htmlEscape(publishedDate) + '</span>'
    + '</div><h3 class="blog-card-title">' + htmlEscape(title) + '</h3>'
    + '<p class="blog-card-excerpt">' + htmlEscape(excerpt) + '</p></div>'
    + '<div class="blog-card-footer"><span class="blog-card-cta">Đọc tiếp câu chuyện →</span></div>'
    + '</div></a></article>';
};

async function handlePublicHome(request, env) {
  const requestUrl = new URL(request.url);
  const appShellRequested = ['melsou_app', 'melsou_action', 'package', 'template', 'language', 'resume']
    .some((name) => requestUrl.searchParams.has(name));
  let shellResponse;
  try { shellResponse = await env.ASSETS.fetch(new Request(new URL('/', request.url), request)); }
  catch { return new Response('Melsou đang tạm thời chưa tải được.', { status: 503 }); }
  if (!shellResponse.ok) return shellResponse;
  let html = await shellResponse.text();
  const homepageSocialMetadata = '<meta property="og:title" content="Melsou | Gói tâm tình trong dáng hình thanh âm">\n'
    + '<meta property="og:description" content="' + htmlEscape(melsouHomepageDescription) + '">\n'
    + '<meta property="og:url" content="https://melsou.com/">\n<meta property="og:type" content="website">\n'
    + '<meta property="og:image" content="https://melsou.com/favicon.png">\n'
    + '<meta name="twitter:card" content="summary_large_image">\n<meta name="twitter:title" content="Melsou | Gói tâm tình trong dáng hình thanh âm">\n'
    + '<meta name="twitter:description" content="' + htmlEscape(melsouHomepageDescription) + '">\n'
    + '<meta name="twitter:image" content="https://melsou.com/favicon.png">\n'
    + '<script type="application/ld+json" id="melsou-homepage-entities">' + homepageEntityGraph + '</script>\n';
  html = html
    .replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i, '<meta name="description" content="' + htmlEscape(melsouHomepageDescription) + '">')
    .replace('</head>', homepageSocialMetadata + '</head>');
  try {
    const query = new URLSearchParams({ status: 'publish', per_page: '100', page: '1', orderby: 'date', order: 'desc', _embed: '1' });
    const response = await wordpressFetch('/posts?' + query);
    if (response.ok) {
      const posts = (await response.json())
        .filter((post) => post?.status === 'publish' && /^[a-z0-9-]+$/.test(post.slug || ''))
        .map(wordpressPost);
      const cards = posts.map(renderPublicBlogCard).join('');
      const hydrationPosts = posts.map((post) => ({
        ...post,
        title: decodeHtmlText(post.title),
        content: decodeHtmlText(post.content),
        excerpt: decodeHtmlText(post.excerpt),
        category: post.category ? { ...post.category, name: decodeHtmlText(post.category.name) } : null,
        featuredImage: safeImageUrl(post.featuredImage)
      }));
      const serialized = JSON.stringify({
        posts: hydrationPosts,
        pagination: { page: 1, total: posts.length, totalPages: 1 }
      }).replace(/</g, '\\u003c');
      html = html.replace(
        '<!-- Rendered dynamically by renderPublicBlog() -->',
        cards + '<script type="application/json" id="melsouSsrBlogPosts">' + serialized + '</script>'
      );
    }
  } catch {
    // WordPress availability must never make the rest of the homepage unavailable.
  }
  if (appShellRequested) {
    html = html.replace('</head>', '<meta name="robots" content="noindex,follow">\n</head>');
    html = html.replace('</body>', '<script id="melsou-static-action-resume">addEventListener("DOMContentLoaded",()=>{'
    + 'const p=new URLSearchParams(location.search),a=p.get("melsou_action"),pkg=p.get("package"),tid=p.get("template"),lang=p.get("language"),resume=p.get("resume");'
    + 'history.replaceState(null,"",location.pathname+location.hash);'
    + 'if(a==="settings")openSettingsModal();else if(a==="account")openAuthModal("login",{type:"account"});'
    + 'else if(a==="cart")toggleCart();else if(a==="start")openTemplateOnboardingModal();else if(a==="flipbook")openFlipbookModal();'
    + 'else if(a==="tracking")showPage("tracking");else if(a==="owner")openOwnerDashboardModal();else if(a==="review")handleOpenWriteReview();'
    + 'else if(pkg){const prices={melody:119000,voice:159000,signature:199000};if(prices[pkg])selectPackage(pkg,prices[pkg]);}'
    + 'else if(tid&&typeof TEMPLATES_DATA!=="undefined"){const t=TEMPLATES_DATA.find(x=>x.id===tid);if(t)loadTemplateToStudio(t.nameVi||t.title,t.quoteVi||t.quote,t.coverImg);}'
    + 'else if(lang==="vi"||lang==="en")switchLanguage(lang);'
    + 'else if(resume){const value=resume.match(/^value-(\\d)$/);if(value)openValueStoryModal(Number(value[1]));else{const el=document.getElementById(resume);el?.scrollIntoView({block:"center"});if(el?.matches("input,textarea,select,button"))el.focus();}}'
    + '},{once:true});</script></body>');
  } else {
    const homepage = extractElement(html, 'id="page-home"');
    if (!homepage) return new Response('Melsou đang tạm thời chưa tải được.', { status: 503 });
    html = projectPublicDocument(html, 'home', homepage.html)
      .replace('</head>', '<meta name="robots" content="index,follow">\n</head>');
  }
  return new Response(request.method === 'HEAD' ? null : html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': appShellRequested ? 'private, no-store' : 'public, max-age=30, stale-while-revalidate=30',
      'X-Content-Type-Options': 'nosniff',
      ...(appShellRequested ? { 'X-Robots-Tag': 'noindex' } : {})
    }
  });
}

const publicStaticRoutes = Object.freeze({
  '/ve-melsou': {
    title: 'Về Melsou | Gói tâm tình trong dáng hình thanh âm',
    description: 'Melsou hòa quyện giai điệu và kỷ vật để mỗi trang ảnh không chỉ đẹp, mà còn biết cất lời.',
    kind: 'hero',
    schemaType: 'AboutPage'
  },
  '/goi-san-pham': {
    title: 'Gói sản phẩm Melsou | Melody, Voice và Signature',
    description: 'Khám phá các gói Melody, Voice và Signature cho album ảnh liền trang mở phẳng 180° kết hợp hình ảnh và thanh âm.',
    kind: 'pricing',
    schemaType: 'CollectionPage'
  },
  '/templates': {
    title: 'Thư viện Template Melsou | 8 bộ mẫu nghệ thuật',
    description: 'Khám phá 8 bộ mẫu nghệ thuật độc bản của Melsou với bố cục bìa và ruột album dành cho những câu chuyện riêng.',
    kind: 'templates',
    schemaType: 'CollectionPage'
  },
  '/chinh-sach-bao-mat': {
    title: 'Chính sách bảo mật | Melsou',
    description: 'Chính sách bảo mật giải thích cách Melsou thu thập, sử dụng và bảo vệ dữ liệu của người dùng.',
    kind: 'privacy',
    schemaType: 'WebPage'
  },
  '/chinh-sach-bao-hanh': {
    title: 'Chính sách bảo hành, đổi trả và hoàn tiền | Melsou',
    description: 'Chính sách bảo hành, đổi trả và hoàn tiền dành cho các sản phẩm Melsou được sản xuất theo yêu cầu và cá nhân hóa.',
    kind: 'warranty',
    schemaType: 'WebPage'
  }
});

const publicTemplateSummaries = Object.freeze([
  ['first-love', 'Tình đầu trong veo', 'Tình yêu đầu, góc quán quen và những lời tỏ tình giấu kín', 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=800&auto=format&fit=crop&q=80'],
  ['graduation', 'Mùa tốt nghiệp', 'Kỷ yếu thanh xuân, tà áo cử nhân và hoa tươi trao tay', 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80'],
  ['besties', 'Hội bạn thân', 'Tụ họp nhóm bạn thân, máy ảnh film và tiếng cười rộn rã', 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&auto=format&fit=crop&q=80'],
  ['somewhere', 'Hành trình bên nhau', 'Khung cảnh hoàng hôn biển và những cung đường xa xôi', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80'],
  ['memory-box', 'Hộp kỷ vật hoài niệm', 'Giấy Kraft mộc mạc lưu giữ những điều trân quý', 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&auto=format&fit=crop&q=80'],
  ['sweet-romance', 'Tình nồng say', 'Tone đỏ rượu vang Burgundy và hoa hồng nhung ấm áp', 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=800&auto=format&fit=crop&q=80'],
  ['fandom', 'Đêm hòa nhạc', 'Ánh đèn sân khấu rực rỡ và giai điệu thần tượng hòa ca', 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80'],
  ['healing', 'Năm tháng thanh xuân', 'Tone xanh lá chữa lành, tìm về an yên trong tâm hồn', 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&auto=format&fit=crop&q=80']
]);

const renderPublicTemplateCards = () => publicTemplateSummaries.map(([id, title, tagline, image]) =>
  '<article class="art-tmpl-card" data-template-id="' + htmlEscape(id) + '">'
    + '<a href="/?melsou_app=1&amp;template=' + htmlEscape(id) + '" class="art-tmpl-preview-box">'
    + '<img src="' + htmlEscape(image) + '" class="bg-cover" alt="' + htmlEscape(title) + '" loading="lazy"></a>'
    + '<div class="art-tmpl-info"><div class="art-tmpl-title">' + htmlEscape(title) + '</div>'
    + '<div class="art-tmpl-tagline">' + htmlEscape(tagline) + '</div>'
    + '<a href="/?melsou_app=1&amp;template=' + htmlEscape(id) + '" class="art-tmpl-tag">Chọn mẫu này →</a></div></article>'
).join('');

const findBalancedElement = (html, startIndex) => {
  const opening = html.slice(startIndex).match(/^<([a-z][a-z0-9-]*)\b[^>]*>/i);
  if (!opening) return null;
  const tag = opening[1];
  const matcher = new RegExp('<\\/?' + tag + '\\b[^>]*>', 'gi');
  matcher.lastIndex = startIndex;
  let depth = 0;
  let match;
  while ((match = matcher.exec(html))) {
    if (/^<\//.test(match[0])) depth -= 1;
    else if (!/\/>$/.test(match[0])) depth += 1;
    if (depth === 0) return { start: startIndex, end: matcher.lastIndex, html: html.slice(startIndex, matcher.lastIndex) };
  }
  return null;
};

const extractElement = (html, marker) => {
  const markerIndex = html.indexOf(marker);
  if (markerIndex < 0) return null;
  const start = html.lastIndexOf('<', markerIndex);
  return start >= 0 ? findBalancedElement(html, start) : null;
};

const renderAboutMelsouContent = () => '<article class="about-melsou-page" aria-labelledby="aboutPageHeading">'
  + '<header class="about-melsou-intro"><p class="about-melsou-eyebrow">Câu chuyện thương hiệu</p>'
  + '<h1 id="aboutPageHeading">Về Melsou</h1>'
  + '<p class="about-melsou-lead">Melsou là dự án thương hiệu album ảnh cá nhân hóa kết hợp hình ảnh và thanh âm, được phát triển tại Việt Nam.</p>'
  + '<p>Melsou bắt đầu từ mong muốn đặt những tư liệu mà mỗi người trân trọng vào cùng một kỷ vật. Thay vì tách ảnh, lời nhắn và âm thanh thành những phần rời nhau, dự án hướng tới một cách lưu giữ có tính cá nhân, nơi từng lựa chọn đều xuất phát từ câu chuyện của người làm album.</p></header>'
  + '<section class="about-melsou-section" aria-labelledby="aboutNameHeading"><h2 id="aboutNameHeading">Tên gọi Melsou</h2>'
  + '<p>“Mel” gợi từ <em>melody</em> — giai điệu. “Sou” gợi từ <em>souvenir</em> — kỷ vật. Hai phần tên gọi diễn đạt định hướng cốt lõi: giúp hình ảnh và âm thanh cùng tồn tại trong một kỷ vật có thể lưu giữ lâu dài.</p>'
  + '<p>Tên gọi này không thay thế câu chuyện của người dùng bằng một khuôn mẫu có sẵn. Mỗi album vẫn được hình thành từ ảnh, lời nhắn, thanh âm và cách sắp xếp mà chính người dùng lựa chọn. Melsou đóng vai trò kết nối những tư liệu ấy trong một hình thức thống nhất và dễ lưu giữ.</p></section>'
  + '<section class="about-melsou-section" aria-labelledby="aboutCreatesHeading"><h2 id="aboutCreatesHeading">Melsou tạo ra điều gì?</h2>'
  + '<p>Sản phẩm trung tâm là album ảnh cá nhân hóa với thiết kế mở phẳng 180°. Cấu trúc này tạo không gian liền mạch cho hình ảnh trên hai trang đối diện và phù hợp với cách kể chuyện bằng chuỗi khoảnh khắc.</p>'
  + '<p>Khi phù hợp với thiết kế, hình ảnh có thể được kết hợp với thanh âm qua mã QR Spotify. Thanh âm không được thêm vào như một chi tiết tách biệt, mà được lựa chọn cùng với ảnh và bố cục để hỗ trợ câu chuyện mà người dùng muốn lưu lại.</p>'
  + '<ul class="about-melsou-list"><li>Album ảnh được cá nhân hóa từ tư liệu do người dùng lựa chọn.</li>'
  + '<li>Thiết kế mở phẳng 180° giúp nội dung trải rộng trên một cặp trang.</li>'
  + '<li>Hình ảnh có thể đi cùng thanh âm qua mã QR Spotify khi phù hợp với thiết kế.</li>'
  + '<li>Mỗi album được xây dựng từ câu chuyện, hình ảnh và lựa chọn riêng của người dùng.</li></ul></section>'
  + '<section class="about-melsou-section" aria-labelledby="aboutDirectionHeading"><h2 id="aboutDirectionHeading">Định hướng lưu giữ mang tính cá nhân</h2>'
  + '<p>Melsou hướng tới việc biến ảnh, lời nhắn và thanh âm thành một kỷ vật có tính cá nhân. Giá trị của album không nằm ở việc kể một câu chuyện thay cho người dùng, mà ở khả năng giúp họ tập hợp, sắp xếp và giữ lại những tư liệu có ý nghĩa theo cách của riêng mình.</p>'
  + '<p>Vì mỗi câu chuyện có bối cảnh khác nhau, quá trình tạo album được đặt quanh lựa chọn của người dùng: chọn tư liệu, chọn cách trình bày và quyết định thanh âm nào thực sự thuộc về kỷ niệm đó. Kết quả hướng tới một vật lưu giữ có thể được mở lại, xem lại và nghe lại theo thời gian.</p></section>'
  + '<section class="about-melsou-section about-melsou-identity" aria-labelledby="aboutIdentityHeading"><h2 id="aboutIdentityHeading">Phân biệt thực thể</h2>'
  + '<p>Melsou là thương hiệu hoạt động tại Việt Nam và không liên quan đến MEL South Africa hoặc các tổ chức có tên tương tự.</p></section>'
  + '<nav class="about-melsou-actions" aria-label="Khám phá Melsou"><a class="btn btn-primary" href="/?melsou_app=1&amp;melsou_action=start" data-melsou-action="start">Bắt đầu tạo album</a>'
  + '<a class="btn btn-secondary" href="/templates">Khám phá thư viện template</a></nav></article>';

const staticRouteFragment = (html, kind) => {
  if (kind === 'hero') return renderAboutMelsouContent();
  const marker = kind === 'hero' ? 'class="hero"'
    : kind === 'pricing' ? 'id="pricing"'
      : kind === 'templates' ? 'id="page-templates"'
        : kind === 'privacy' ? 'id="privacyPolicyModal"'
          : 'id="warrantyPolicyModal"';
  const element = extractElement(html, marker);
  if (!element) throw new Error('STATIC_ROUTE_FRAGMENT_MISSING:' + kind);
  let fragment = element.html;
  if (kind === 'templates') fragment = fragment
    .replace(/\sclass="page(?:\s+active)?"/i, ' class="page active"')
    .replace('<div class="templates-grid-art" id="templatesGridContainer"></div>', '<div class="templates-grid-art" id="templatesGridContainer">' + renderPublicTemplateCards() + '</div>');
  if (kind === 'privacy' || kind === 'warranty') {
    fragment = fragment
      .replace(/\sclass="modal-backdrop policy-modal-backdrop"/i, ' class="policy-page"')
      .replace(/\s+onclick="[^"]*"/i, '')
      .replace(/<button\b[^>]*class="[^"]*modal-close[^\"]*"[^>]*>[\s\S]*?<\/button>/gi, '');
  }
  return fragment;
};

const removeElement = (html, marker) => {
  const element = extractElement(html, marker);
  return element ? html.slice(0, element.start) + html.slice(element.end) : html;
};

const rewriteLeanActions = (html) => html
  .replace(/onclick="openSettingsModal\(\)"/g, 'data-melsou-action="settings"')
  .replace(/onclick="toggleUserDropdown\(event\)"/g, 'data-melsou-action="account"')
  .replace(/onclick="toggleCart\(\)"/g, 'data-melsou-action="cart"')
  .replace(/onclick="(?:toggleMobileNavMenu\(\);)?openTemplateOnboardingModal\(\)"/g, 'data-melsou-action="start"')
  .replace(/onclick="openFlipbookModal\(\)"/g, 'data-melsou-action="flipbook"')
  .replace(/onclick="selectPackage\('([^']+)',\s*\d+\)"/g, 'data-melsou-package="$1"')
  .replace(/onclick="(?:mobileNavGo|showPage)\('tracking'\)"/g, 'data-melsou-action="tracking"')
  .replace(/onclick="(?:toggleMobileNavMenu\(\);)?openOwnerDashboardModal\(\)"/g, 'data-melsou-action="owner"')
  .replace(/onclick="switchLanguage\('([^']+)'\);\s*updateSettingsLangUI\('[^']+'\)"/g, 'data-melsou-language="$1"')
  .replace(/onclick="openValueStoryModal\((\d+)\)"/g, 'data-melsou-resume="value-$1"')
  .replace(/onkeydown="[^"]*openValueStoryModal\((\d+)\)"/g, 'data-melsou-resume-keyboard="value-$1"')
  .replace(/onclick="handleOpenWriteReview\(\)"/g, 'data-melsou-action="review"')
  .replace(/\s+oninput="handleBlogSearch\(this\.value\)"/g, ' data-melsou-resume="blog-search-query"')
  .replace(/onclick="(?:clearBlogSearch|filterBlogCategory|scrollBlogCarousel)\([^\"]*\)"/g, 'data-melsou-resume="blog-section"')
  .replace(/onclick="open(?:Privacy|Warranty)PolicyModal\(event\)"/g, '')
  .replace(/onclick="close(?:Privacy|Warranty)PolicyModal\(\)"/g, 'onclick="location.href=\'/\'"')
  .replace(/onclick="toggleMobileNavMenu\(\)"/g, 'onclick="document.getElementById(\'mobileNavDrawer\')?.classList.toggle(\'open\')"')
  .replace(/onclick="closeMobileNavMenu\(\)"/g, '')
  .replace(/onclick="scrollToTop\(\)"/g, 'onclick="scrollTo({top:0,behavior:\'smooth\'})"')
  .replace(/href="javascript:void\(0\)"([^>]*data-melsou-action="([^"]+)"[^>]*)/g, 'href="/?melsou_app=1&amp;melsou_action=$2"$1')
  .replace(/href="javascript:void\(0\)"([^>]*data-melsou-package="([^"]+)"[^>]*)/g, 'href="/?melsou_app=1&amp;package=$2"$1')
  .replace(/href="javascript:void\(0\)"([^>]*id="footerLinkWorkshop"[^>]*)/g, 'href="/ve-melsou"$1');

const leanNavigationScript = '<script id="melsou-static-navigation">(()=>{'
  + 'const go=p=>location.href="/?melsou_app=1&"+p;'
  + 'document.addEventListener("click",event=>{const node=event.target.closest("[data-melsou-action],[data-melsou-package],[data-melsou-language],[data-melsou-resume]");if(!node)return;'
  + 'if(node.dataset.melsouAction){event.preventDefault();go("melsou_action="+encodeURIComponent(node.dataset.melsouAction));}'
  + 'else if(node.dataset.melsouPackage){event.preventDefault();go("package="+encodeURIComponent(node.dataset.melsouPackage));}'
  + 'else if(node.dataset.melsouLanguage){event.preventDefault();go("language="+encodeURIComponent(node.dataset.melsouLanguage));}'
  + 'else if(node.dataset.melsouResume){event.preventDefault();go("resume="+encodeURIComponent(node.dataset.melsouResume)+"#"+encodeURIComponent(node.dataset.melsouResume));}});'
  + 'document.addEventListener("keydown",event=>{if(event.key!=="Enter"&&event.key!==" ")return;const id=event.target?.dataset?.melsouResumeKeyboard;if(!id)return;event.preventDefault();go("resume="+encodeURIComponent(id)+"#"+encodeURIComponent(id));});'
  + 'document.addEventListener("focusin",event=>{const id=event.target?.dataset?.melsouResume;if(id)go("resume="+encodeURIComponent(id)+"#"+encodeURIComponent(id));});'
  + '})();</script>';

const projectPublicDocument = (html, kind, fragment) => {
  const bodyMatch = html.match(/<body\b[^>]*>/i);
  const topbar = extractElement(html, 'class="topbar"');
  const header = extractElement(html, '<header');
  const mobileNav = extractElement(html, 'id="mobileNavDrawer"');
  const footer = extractElement(html, '<footer');
  if (!bodyMatch || !header || !footer) throw new Error('STATIC_ROUTE_SHELL_MISSING');
  const headEnd = html.indexOf('</head>');
  if (headEnd < 0) throw new Error('STATIC_ROUTE_HEAD_MISSING');
  const head = html.slice(0, headEnd + 7).replace(/<script\s+src="\/seo-routes\.js"><\/script>\s*/i, '');
  let cleanHeader = removeElement(header.html, 'id="userDropdownMenu"');
  let cleanMobileNav = mobileNav?.html || '';
  cleanMobileNav = removeElement(cleanMobileNav, 'id="mndItemOwnerDashboard"');
  const shellStyle = '<style id="melsou-static-route-isolation">'
    + 'body{min-height:100vh;display:flex;flex-direction:column}'
    + '#melsou-public-route-main{display:block;flex:1;width:100%}'
    + '#melsou-public-route-main>.hero{min-height:calc(100vh - 132px)}'
    + '#melsou-public-route-main>#pricing{display:block}'
    + '#melsou-public-route-main>.page{display:block}'
    + '#melsou-public-route-main>.about-melsou-page{max-width:960px;margin:0 auto;padding:72px 24px 88px;color:var(--dark)}'
    + '.about-melsou-intro{padding-bottom:34px;border-bottom:1px solid rgba(121,45,35,.18)}'
    + '.about-melsou-eyebrow{margin:0 0 12px;color:var(--red);font-size:.82rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase}'
    + '.about-melsou-page h1{margin:0 0 22px;font-family:var(--font-display);font-size:clamp(2.6rem,7vw,5.2rem);line-height:1;color:var(--red)}'
    + '.about-melsou-lead{font-size:clamp(1.15rem,2.4vw,1.45rem);line-height:1.7;font-weight:600}'
    + '.about-melsou-page p,.about-melsou-page li{font-size:1rem;line-height:1.8}'
    + '.about-melsou-section{padding:34px 0 4px}.about-melsou-section h2{margin:0 0 14px;font-family:var(--font-display);font-size:clamp(1.65rem,3.5vw,2.35rem);color:var(--red)}'
    + '.about-melsou-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px 30px;margin:24px 0 0;padding-left:22px}'
    + '.about-melsou-identity{margin-top:30px;padding:28px 30px;background:rgba(121,45,35,.06);border-radius:18px}'
    + '.about-melsou-actions{display:flex;flex-wrap:wrap;gap:14px;margin-top:42px}'
    + '@media(max-width:640px){#melsou-public-route-main>.about-melsou-page{padding:48px 20px 64px}.about-melsou-list{grid-template-columns:1fr}.about-melsou-actions .btn{width:100%;text-align:center}}'
    + '#melsou-public-route-main>.policy-page{position:static;display:flex;min-height:calc(100vh - 132px);padding:48px 20px;background:var(--cream)}'
    + '#melsou-public-route-main>.policy-page>.modal-box{display:block;position:static;margin:auto;max-height:none}'
    + '</style>';
  return rewriteLeanActions(head.replace('</head>', shellStyle + '</head>')
    + bodyMatch[0].replace(/\s+on(?:click|keydown)="[^"]*"/gi, '')
    + (topbar?.html || '')
    + cleanHeader
    + cleanMobileNav
    + '<main id="melsou-public-route-main" data-static-route="' + htmlEscape(kind) + '">' + fragment + '</main>'
    + footer.html
    + leanNavigationScript
    + '</body></html>');
};

const projectStaticRouteDocument = (html, kind) => {
  const fragment = staticRouteFragment(html, kind);
  return projectPublicDocument(html, kind, fragment);
};

const renderStaticRouteShell = (html, pathname, route) => {
  const canonical = 'https://melsou.com' + pathname;
  const routeSchema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': route.schemaType,
    '@id': canonical + '#webpage',
    url: canonical,
    name: route.title,
    description: route.description,
    inLanguage: 'vi-VN',
    isPartOf: { '@id': 'https://melsou.com/#website' },
    about: { '@id': melsouOrganizationId }
  }).replace(/</g, '\\u003c');
  const socialMetadata = '<meta property="og:title" content="' + htmlEscape(route.title) + '">\n'
    + '<meta property="og:description" content="' + htmlEscape(route.description) + '">\n'
    + '<meta property="og:url" content="' + canonical + '">\n<meta property="og:type" content="website">\n'
    + '<meta name="twitter:card" content="summary_large_image">\n<meta name="twitter:title" content="' + htmlEscape(route.title) + '">\n'
    + '<meta name="twitter:description" content="' + htmlEscape(route.description) + '">\n'
    + '<script type="application/ld+json" id="melsou-static-route-schema">' + routeSchema + '</script>\n';
  let rendered = projectStaticRouteDocument(html, route.kind)
    .replace(/<title>[\s\S]*?<\/title>/i, '<title>' + htmlEscape(route.title) + '</title>')
    .replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i, '<meta name="description" content="' + htmlEscape(route.description) + '">')
    .replace(/<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i, '<link rel="canonical" href="' + canonical + '">')
    .replace('</head>', socialMetadata + '<meta name="robots" content="index,follow">\n</head>');

  if (route.kind !== 'hero') {
    rendered = rendered
      .replace('<h1 class="hero-title" id="heroHeadlineText">', '<div class="hero-title" id="heroHeadlineText">')
      .replace('</h1>', '</div>');
  }
  if (route.kind === 'pricing') rendered = rendered.replace(/<h2([^>]*\bid="pricingTitle"[^>]*)>([\s\S]*?)<\/h2>/i, '<h1$1>$2</h1>');
  if (route.kind === 'templates') rendered = rendered.replace(/<h2([^>]*\bid="tplLibraryHeading"[^>]*)>([\s\S]*?)<\/h2>/i, '<h1$1>$2</h1>');
  if (route.kind === 'privacy') rendered = rendered.replace('<h3 style="font-size:20px;color:var(--dark)">Chính Sách Bảo Mật Melsou 📜</h3>', '<h1 id="privacyPageHeading" style="font-size:20px;color:var(--dark)">Chính Sách Bảo Mật Melsou</h1>');
  if (route.kind === 'warranty') rendered = rendered.replace('<h3 style="font-size:20px;color:var(--dark)">Chính Sách Bảo Hành, Đổi Trả &amp; Hoàn Tiền 🛡️</h3>', '<h1 id="warrantyPageHeading" style="font-size:20px;color:var(--dark)">Chính Sách Bảo Hành, Đổi Trả &amp; Hoàn Tiền</h1>');
  return rendered;
};

async function handlePublicStaticHtml(request, env, pathname) {
  const route = publicStaticRoutes[pathname];
  if (!route) return new Response('Không tìm thấy trang.', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Robots-Tag': 'noindex' } });
  let shellResponse;
  try { shellResponse = await env.ASSETS.fetch(new Request(new URL('/', request.url), request)); }
  catch { return new Response('Melsou đang tạm thời chưa tải được.', { status: 503 }); }
  if (!shellResponse.ok) return shellResponse;
  const html = renderStaticRouteShell(await shellResponse.text(), pathname, route);
  return new Response(request.method === 'HEAD' ? null : html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=300, stale-while-revalidate=60', 'X-Content-Type-Options': 'nosniff' }
  });
}

async function handlePublicBlogHtml(request, env, slug) {
  const query = new URLSearchParams({ status: 'publish', slug, per_page: '1', _embed: '1' });
  let response;
  try { response = await wordpressFetch('/posts?' + query); }
  catch { return new Response('Câu chuyện đang tạm thời chưa tải được.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }); }
  if (!response.ok) return new Response('Không tìm thấy câu chuyện.', { status: response.status === 404 ? 404 : 503, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Robots-Tag': 'noindex' } });
  const [rawPost] = await response.json();
  if (!rawPost || rawPost.status !== 'publish') return new Response('Không tìm thấy câu chuyện.', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Robots-Tag': 'noindex' } });

  const post = wordpressPost(rawPost);
  const title = decodeHtmlText(post.title) || 'Câu chuyện Melsou';
  const description = post.description;
  const canonical = 'https://melsou.com/blog/' + slug;
  const image = safeImageUrl(post.featuredImage);
  const category = decodeHtmlText(post.category?.name) || 'Câu chuyện';
  const articleHtml = sanitizeWordpressArticleHtml(post.content);
  const article = {
    '@type': 'Article', headline: title, description,
    ...(image ? { image: [image] } : {}),
    ...(post.publishedAt ? { datePublished: post.publishedAt } : {}),
    ...(post.modifiedAt || post.publishedAt ? { dateModified: post.modifiedAt || post.publishedAt } : {}),
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
    ...(post.author ? { author: { '@type': 'Person', name: post.author } } : {}),
    publisher: { '@id': melsouOrganizationId }
  };
  const breadcrumb = {
    '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: 'https://melsou.com/' },
      { '@type': 'ListItem', position: 2, name: 'Chuyện của Melsou', item: 'https://melsou.com/#blog-section' },
      { '@type': 'ListItem', position: 3, name: title, item: canonical }
    ]
  };
  const jsonLd = JSON.stringify({ '@context': 'https://schema.org', '@graph': [article, breadcrumb] }).replace(/</g, '\\u003c');

  let shellResponse;
  try { shellResponse = await env.ASSETS.fetch(new Request(new URL('/', request.url), request)); }
  catch { return new Response('Câu chuyện đang tạm thời chưa tải được.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }); }
  if (!shellResponse.ok) return new Response('Câu chuyện đang tạm thời chưa tải được.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  let html = await shellResponse.text();
  const socialMetadata = '<meta property="og:title" content="' + htmlEscape(title) + ' | Melsou">\n'
    + '<meta property="og:description" content="' + htmlEscape(description) + '">\n'
    + '<meta property="og:url" content="' + canonical + '">\n'
    + '<meta property="og:type" content="article">\n'
    + '<meta name="twitter:card" content="summary_large_image">\n'
    + '<meta name="twitter:title" content="' + htmlEscape(title) + ' | Melsou">\n'
    + '<meta name="twitter:description" content="' + htmlEscape(description) + '">\n'
    + (image ? '<meta property="og:image" content="' + htmlEscape(image) + '">\n<meta name="twitter:image" content="' + htmlEscape(image) + '">\n' : '')
    + '<script type="application/ld+json">' + jsonLd + '</script>\n';
  html = html
    .replace(/<title>[\s\S]*?<\/title>/i, '<title>' + htmlEscape(title) + ' | Melsou</title>')
    .replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i, '<meta name="description" content="' + htmlEscape(description) + '">')
    .replace(/<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i, '<link rel="canonical" href="' + canonical + '">')
    .replace('</head>', socialMetadata + '</head>')
    .replace('<h1 class="hero-title" id="heroHeadlineText">', '<div class="hero-title" id="heroHeadlineText">')
    .replace('</h1>', '</div>')
    .replace(/<img id="readerCoverImg"[^>]*>/i, image ? '<img id="readerCoverImg" src="' + htmlEscape(image) + '" alt="' + htmlEscape(title) + '" style="width:100%;height:100%;object-fit:cover">' : '<img id="readerCoverImg" alt="" style="display:none">')
    .replace(/<span id="readerCategoryBadge"[^>]*>[\s\S]*?<\/span>/i, '<span id="readerCategoryBadge" style="font-size:11.5px;font-weight:800;color:var(--red);text-transform:uppercase;letter-spacing:1.2px;background:var(--red-light);padding:3px 10px;border-radius:100px">' + htmlEscape(category) + '</span>')
    .replace(/<span id="readerPublishDate"[^>]*>[\s\S]*?<\/span>/i, '<span id="readerPublishDate" style="font-size:12.5px;color:var(--gray)">' + htmlEscape(post.publishedAt || '') + '</span>')
    .replace(/<h2 id="readerTitle"[^>]*>[\s\S]*?<\/h2>/i, '<h1 id="blogPostPageHeading" style="font-family:\'Playfair Display\',serif;font-size:28px;line-height:1.35;color:var(--dark);margin-bottom:12px">' + htmlEscape(title) + '</h1><p id="blogPostDescription" style="font-size:15px;line-height:1.7;color:var(--gray);margin-bottom:20px">' + htmlEscape(description) + '</p>')
    .replace('<!-- Article body paragraphs -->', articleHtml);
  return new Response(request.method === 'HEAD' ? null : html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=30, stale-while-revalidate=30', 'X-Content-Type-Options': 'nosniff' }
  });
}

async function handlePublicBlog(url, slug = null) {
  const query = new URLSearchParams({ status: 'publish', _embed: '1' });
  if (slug) query.set('slug', slug);
  else {
    query.set('page', String(Math.max(1, Number(url.searchParams.get('page')) || 1)));
    query.set('per_page', String(Math.min(100, Math.max(1, Number(url.searchParams.get('perPage')) || 10))));
    query.set('orderby', 'date');
    query.set('order', 'desc');
    const category = url.searchParams.get('category');
    if (category && /^\d+$/.test(category)) query.set('categories', category);
  }
  let response;
  try { response = await wordpressFetch(`/posts?${query}`); }
  catch { return publicJson({ error: 'BLOG_UNAVAILABLE' }, 503); }
  if (!response.ok) {
    if (slug && response.status === 404) return publicJson({ error: 'BLOG_POST_NOT_FOUND' }, 404);
    return publicJson({ error: 'BLOG_UNAVAILABLE' }, 503);
  }
  const posts = (await response.json()).filter((post) => post?.status === 'publish').map(wordpressPost);
  if (slug && !posts[0]) return publicJson({ error: 'BLOG_POST_NOT_FOUND' }, 404);
  if (slug) return publicJson({ post: posts[0] });
  return publicJson({
    posts,
    pagination: {
      page: Number(query.get('page')),
      total: Number(response.headers.get('X-WP-Total') || posts.length),
      totalPages: Number(response.headers.get('X-WP-TotalPages') || 1)
    }
  });
}

async function wordpressOwnerAuth(request, env) {
  const user = await authenticatedUser(request, env);
  if (!user) return { ok: false, status: 401, error: 'UNAUTHORIZED' };
  if (!env.OWNER_USER_ID || user.id !== env.OWNER_USER_ID || !user.nativeTokenHash) return { ok: false, status: 403, error: 'FORBIDDEN' };
  const response = await serviceFetch(env, `profiles?user_id=eq.${user.id}&select=role&limit=1`);
  if (!response.ok) return { ok: false, status: 503, error: 'OWNER_PROFILE_UNAVAILABLE' };
  const [profile] = await response.json();
  return profile?.role === 'OWNER' ? { ok: true, user } : { ok: false, status: 403, error: 'FORBIDDEN' };
}

async function blogInteractionActor(request, env, { createGuest = false } = {}) {
  const user = await authenticatedUser(request, env);
  if (user) return { userId: user.id, guestHash: null };
  const existing = readCookie(request, guestCookieName);
  if (!existing && !createGuest) return null;
  const session = existing ? { raw: existing, isNew: false } : await guestSession(request);
  const guestHash = await sha256(textEncoder.encode(session.raw));
  if (!await touchGuestSession(guestHash, env)) return null;
  return {
    userId: null,
    guestHash,
    setCookie: session.isNew ? guestCookie(session.raw, new URL(request.url).protocol === 'https:') : null
  };
}

async function routeBlogInteraction(request, env, match) {
  const dependencies = {
    serviceFetch: (path, options) => serviceFetch(env, path, options),
    getActor: (incoming, options) => blogInteractionActor(incoming, env, options),
    requireUser: (incoming) => authenticatedUser(incoming, env),
    requireOwner: (incoming) => ownerUser(incoming, env),
    authorizeOwner: (incoming) => blogOwnerAuth(incoming, env),
    rateLimit: (incoming, action) => allowRateLimitedAction(env, `${action}:${requestNetworkKey(incoming)}`),
    verifyPost: async (slug) => {
      try {
        const response = await wordpressFetch(`/posts?status=publish&slug=${encodeURIComponent(slug)}&per_page=1&_fields=id,slug`);
        if (!response.ok) return response.status === 404 ? false : null;
        return (await response.json())[0] || false;
      } catch { return null; }
    }
  };
  const response = await handleBlogInteraction(request, env, match, dependencies);
  if (env.BLOG_COMMENT_SOURCE !== 'wordpress' || match.kind !== 'summary' || !response.ok) return response;
  const meta = await wordpressCommentMeta(wordpressFetch, match.slug);
  if (meta === null) return json({ error: 'BLOG_COMMENTS_UNAVAILABLE' }, 503);
  if (!meta) return response;
  const summary = await response.json();
  return json({ ...summary, comment_count: meta.comment_count, reply_count: meta.reply_count, comments_open: meta.comments_open, wordpress_post_id: meta.post_id });
}

async function routeWordpressComment(request, env, match) {
  const storedToken = env.WORDPRESS_OAUTH_TOKENS?.get ? await env.WORDPRESS_OAUTH_TOKENS.get('access_token') : null;
  return handleWordpressComment(request, { ...env, WORDPRESS_ACCESS_TOKEN: env.WORDPRESS_ACCESS_TOKEN || storedToken }, match, {
    wordpressFetch,
    requireUser: (incoming) => authenticatedUser(incoming, env),
    rateLimit: (incoming, action) => allowRateLimitedAction(env, `${action}:${requestNetworkKey(incoming)}`)
  });
}

async function routeWordpressOauth(request, env, action) {
  const dependencies = {
    authenticateOwner: (incoming) => wordpressOwnerAuth(incoming, env),
    rateLimit: (incoming, name) => allowRateLimitedAction(env, `${name}:${requestNetworkKey(incoming)}`),
    storeState: async ({ ownerUserId, nativeSessionHash, stateHash, expiresAt }) => {
      const response = await serviceFetch(env, 'rpc/melsou_create_wordpress_oauth_state', {
        method: 'POST',
        body: JSON.stringify({ p_owner_user_id: ownerUserId, p_native_session_hash: nativeSessionHash, p_state_hash: stateHash, p_expires_at: expiresAt })
      });
      return response.ok && await response.json() === true;
    },
    consumeState: async ({ ownerUserId, nativeSessionHash, stateHash, codeHash }) => {
      const response = await serviceFetch(env, 'rpc/melsou_consume_wordpress_oauth_state', {
        method: 'POST',
        body: JSON.stringify({ p_owner_user_id: ownerUserId, p_native_session_hash: nativeSessionHash, p_state_hash: stateHash, p_code_hash: codeHash })
      });
      return response.ok && await response.json() === true;
    },
    exchangeToken: exchangeWordpressToken
  };
  if (action === 'start') return handleWordpressOauthStart(request, env, dependencies);
  if (action === 'status') return handleWordpressOauthStatus(request, env, dependencies);
  return handleWordpressOauthCallback(request, env, dependencies);
}

async function handlePublicBlogCategories() {
  const categories = [];
  let page = 1;
  let totalPages = 1;
  try {
    do {
      const response = await wordpressFetch(`/categories?hide_empty=true&per_page=100&page=${page}&orderby=name&order=asc`);
      if (!response.ok) return publicJson({ error: 'BLOG_CATEGORIES_UNAVAILABLE' }, 503);
      categories.push(...await response.json());
      totalPages = Number(response.headers.get('X-WP-TotalPages') || 1);
      page += 1;
    } while (page <= totalPages);
  } catch { return publicJson({ error: 'BLOG_CATEGORIES_UNAVAILABLE' }, 503); }
  return publicJson({ categories: categories.filter((category) => category.count > 0).map(({ id, name, slug, count }) => ({ id, name, slug, count })) });
}

const xmlEscape = (value) => String(value).replace(/[<>&'\"]/g, (character) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[character]));
async function handlePublicSitemap() {
  const posts = [];
  let page = 1;
  let totalPages = 1;
  try {
    do {
      const response = await wordpressFetch(`/posts?status=publish&per_page=100&page=${page}&orderby=date&order=desc`);
      if (!response.ok) return new Response('<?xml version="1.0" encoding="UTF-8"?><error>Sitemap temporarily unavailable</error>', { status: 503, headers: { 'Content-Type': 'application/xml; charset=utf-8', 'X-Robots-Tag': 'noindex' } });
      posts.push(...await response.json());
      totalPages = Number(response.headers.get('X-WP-TotalPages') || 1);
      page += 1;
    } while (page <= totalPages);
  } catch { return new Response('<?xml version="1.0" encoding="UTF-8"?><error>Sitemap temporarily unavailable</error>', { status: 503, headers: { 'Content-Type': 'application/xml; charset=utf-8', 'X-Robots-Tag': 'noindex' } }); }
  const staticUrls = ['/', '/ve-melsou', '/goi-san-pham', '/templates', '/chinh-sach-bao-mat', '/chinh-sach-bao-hanh'];
  const urls = [
    ...staticUrls.map((path) => ({ loc: `https://melsou.com${path === '/' ? '/' : path}` })),
    ...posts.filter((post) => post?.status === 'publish' && /^[a-z0-9-]+$/.test(post.slug || '')).map((post) => ({ loc: `https://melsou.com/blog/${post.slug}`, lastmod: post.modified_gmt ? `${post.modified_gmt}Z` : post.modified }))
  ];
  const entries = urls.map(({ loc, lastmod }) => `  <url>\n    <loc>${xmlEscape(loc)}</loc>${lastmod ? `\n    <lastmod>${xmlEscape(lastmod)}</lastmod>` : ''}\n  </url>`).join('\n');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=30, stale-while-revalidate=30', 'X-Content-Type-Options': 'nosniff' } });
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
    if (details.includes('SNAPSHOT_CONFIGURATION_MISMATCH')) return json({ error: 'SNAPSHOT_CONFIGURATION_MISMATCH' }, 409);
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
    if (url.pathname === '/' && (request.method === 'GET' || request.method === 'HEAD')) return handlePublicHome(request, env);
    if (publicStaticRoutes[url.pathname] && (request.method === 'GET' || request.method === 'HEAD')) return handlePublicStaticHtml(request, env, url.pathname);
    if (url.pathname === '/api/health' && request.method === 'GET') return json({ ok: true, environment: env.APP_ENV || 'unknown' });
    if (url.pathname === '/api/auth/native/register' && request.method === 'POST') return handleNativeRegister(request, env);
    if (url.pathname === '/api/auth/native/login' && request.method === 'POST') return handleNativeLogin(request, env);
    if (url.pathname === '/api/auth/native/logout' && request.method === 'POST') return handleNativeLogout(request, env);
    if (url.pathname === '/api/auth/recovery/request' && request.method === 'POST') return handleRecoveryRequest(request, env);
    if (url.pathname === '/api/auth/recovery/complete' && request.method === 'POST') return handleRecoveryComplete(request, env);
    if (url.pathname === '/api/wordpress/oauth/start' && request.method === 'GET') return routeWordpressOauth(request, env, 'start');
    if (url.pathname === '/api/wordpress/oauth/callback' && request.method === 'POST') return routeWordpressOauth(request, env, 'callback');
    if (url.pathname === '/api/owner/wordpress/status' && request.method === 'GET') return routeWordpressOauth(request, env, 'status');
    if (url.pathname === '/api/public-config' && request.method === 'GET') return json({ supabaseUrl: env.SUPABASE_URL || null, supabaseAnonKey: env.SUPABASE_ANON_KEY || null, environment: env.APP_ENV || 'unknown', payment: { provider: 'SEPAY', mode: env.SEPAY_MODE || null } });
    if (url.pathname === '/api/quote' && request.method === 'POST') {
      const pricing = await activePricing(env);
      if (!pricing) return json({ error: 'ACTIVE_PRICING_UNAVAILABLE' }, 503);
      try { return json({ quote: createQuote(await request.json(), pricing.rules), pricingVersion: pricing.version }); }
      catch { return json({ error: 'INVALID_QUOTE_CONFIGURATION' }, 400); }
    }
    if (url.pathname === '/api/blog' && request.method === 'GET') return handlePublicBlog(url);
    if (url.pathname === '/api/blog/categories' && request.method === 'GET') return handlePublicBlogCategories();
    if (url.pathname === '/api/sitemap.xml' && request.method === 'GET') return handlePublicSitemap();
    const wordpressComment = env.BLOG_COMMENT_SOURCE === 'wordpress' ? matchWordpressComment(url.pathname, request.method) : null;
    if (wordpressComment) return routeWordpressComment(request, env, wordpressComment);
    const blogInteraction = matchBlogInteraction(url.pathname, request.method);
    if (blogInteraction) return routeBlogInteraction(request, env, blogInteraction);
    if (url.pathname === '/api/templates' && request.method === 'GET') return handleTemplates(url);
    const publicTemplate = url.pathname.match(/^\/api\/templates\/([a-z0-9-]+)$/);
    if (publicTemplate && request.method === 'GET') return handleTemplates(url, publicTemplate[1]);
    const blogCover = url.pathname.match(/^\/api\/blog\/([a-z0-9-]+)\/cover$/);
    if (blogCover && request.method === 'GET') return handleBlogCover(env, blogCover[1]);
    const publicBlogPost = url.pathname.match(/^\/api\/blog\/([a-z0-9-]+)$/);
    if (publicBlogPost && request.method === 'GET') return handlePublicBlog(url, publicBlogPost[1]);
    const publicBlogHtml = url.pathname.match(/^\/blog\/([a-z0-9-]+)$/);
    if (publicBlogHtml && (request.method === 'GET' || request.method === 'HEAD')) return handlePublicBlogHtml(request, env, publicBlogHtml[1]);
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
    if ((request.method === 'GET' || request.method === 'HEAD') && !url.pathname.startsWith('/api/')) {
      return new Response(request.method === 'HEAD' ? null : 'Không tìm thấy trang.', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Robots-Tag': 'noindex' } });
    }
    return json({ error: 'NOT_FOUND' }, 404);
  },
  async scheduled(_event, env, ctx) { env = withPrivateStorage(env); ctx.waitUntil(Promise.all([processAssetJobs(env), processVoiceCleanupJobs(env), processOperations(env), processRenderJobs(env), expireInactiveGuestDrafts(env), cleanupExpiredAccountTrash(env)])); }
};
