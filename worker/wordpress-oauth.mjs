const json = (body, status = 200, headers = {}) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers }
});
const stateCookie = 'melsou_wordpress_oauth_state';
const callbackUrl = 'https://melsou.com/wordpress-oauth-callback';
const readCookie = (request, name) => Object.fromEntries((request.headers.get('Cookie') || '').split(';').map((part) => part.trim().split('=').map(decodeURIComponent)).filter(([key, value]) => key && value))[name] || null;
const cookie = (value, maxAge = 600) => `${stateCookie}=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
const randomState = () => { const bytes = new Uint8Array(32); crypto.getRandomValues(bytes); return [...bytes].map((value) => value.toString(16).padStart(2, '0')).join(''); };
const sha256 = async (value) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))].map((byte) => byte.toString(16).padStart(2, '0')).join('');
const timeSafeEqual = (left, right) => {
  if (typeof left !== 'string' || typeof right !== 'string' || left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
};

const configured = (env) => Boolean(env.WORDPRESS_CLIENT_ID && env.WORDPRESS_CLIENT_SECRET && env.WORDPRESS_OAUTH_TOKENS?.put);
const sanitizedOauthError = (value) => {
  const candidate = typeof value === 'string' ? value.trim() : '';
  return /^[a-zA-Z0-9_.-]{1,80}$/.test(candidate) ? candidate : 'unknown_oauth_error';
};
const safeSite = (value) => {
  if (typeof value !== 'string' || value.length > 500) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.hostname : null;
  } catch { return /^[a-z0-9.-]{1,253}$/i.test(value) ? value.toLowerCase() : null; }
};
const ownerAuth = async (request, dependencies) => dependencies.authenticateOwner(request);

export async function handleWordpressOauthStart(request, env, dependencies) {
  const auth = await ownerAuth(request, dependencies);
  if (!auth?.ok) return json({ error: auth?.error || 'FORBIDDEN' }, auth?.status || 403);
  if (!configured(env)) return json({ error: 'WORDPRESS_OAUTH_NOT_CONFIGURED' }, 503);
  const limited = await dependencies.rateLimit(request, 'wordpress-oauth-start');
  if (limited?.configurationMissing) return json({ error: 'RATE_LIMIT_NOT_CONFIGURED' }, 503);
  if (limited && !limited.allowed) return json({ error: 'RATE_LIMITED' }, 429);
  const state = randomState();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const stored = await dependencies.storeState({
    ownerUserId: auth.user.id,
    nativeSessionHash: auth.user.nativeTokenHash,
    stateHash: await sha256(state),
    expiresAt
  });
  if (!stored) return json({ error: 'OAUTH_STATE_UNAVAILABLE' }, 503);
  const authorize = new URL('https://public-api.wordpress.com/oauth2/authorize');
  authorize.searchParams.set('client_id', env.WORDPRESS_CLIENT_ID);
  authorize.searchParams.set('redirect_uri', callbackUrl);
  authorize.searchParams.set('response_type', 'code');
  authorize.searchParams.set('state', state);
  return json({ authorization_url: authorize.toString() }, 200, { 'Set-Cookie': cookie(state) });
}

export async function handleWordpressOauthCallback(request, env, dependencies) {
  const auth = await ownerAuth(request, dependencies);
  if (!auth?.ok) return json({ error: auth?.error || 'FORBIDDEN' }, auth?.status || 403);
  if (!configured(env)) return json({ error: 'WORDPRESS_OAUTH_NOT_CONFIGURED' }, 503);
  const limited = await dependencies.rateLimit(request, 'wordpress-oauth-callback');
  if (limited?.configurationMissing) return json({ error: 'RATE_LIMIT_NOT_CONFIGURED' }, 503);
  if (limited && !limited.allowed) return json({ error: 'RATE_LIMITED' }, 429);
  let body;
  try { body = await request.json(); } catch {
    console.error(JSON.stringify({
      stage: 'wordpress_oauth_callback_parse',
      json_parsed: false,
      code_valid: false,
      state_valid: false,
      state_cookie_present: false,
      state_match: false
    }));
    return json({ error: 'INVALID_JSON' }, 400);
  }
  const code = typeof body?.code === 'string' ? body.code : '';
  const incomingState = typeof body?.state === 'string' ? body.state : '';
  const expectedState = readCookie(request, stateCookie);
  const codeValid = /^[a-zA-Z0-9._~-]{8,2048}$/.test(code);
  const stateValid = /^[0-9a-f]{64}$/.test(incomingState);
  const stateCookiePresent = typeof expectedState === 'string' && expectedState.length > 0;
  const stateMatch = stateValid && stateCookiePresent && timeSafeEqual(incomingState, expectedState);
  if (!codeValid || !stateValid || !stateMatch) {
    console.error(JSON.stringify({
      stage: 'wordpress_oauth_callback_validation',
      json_parsed: true,
      code_valid: codeValid,
      state_valid: stateValid,
      state_cookie_present: stateCookiePresent,
      state_match: stateMatch
    }));
    return json({ error: codeValid ? 'CSRF_STATE_MISMATCH' : 'OAUTH_CODE_INVALID' }, 400, { 'Set-Cookie': cookie('', 0) });
  }
  const consumed = await dependencies.consumeState({
    ownerUserId: auth.user.id,
    nativeSessionHash: auth.user.nativeTokenHash,
    stateHash: await sha256(incomingState),
    codeHash: await sha256(code)
  });
  if (!consumed) return json({ error: 'CSRF_STATE_MISMATCH' }, 400, { 'Set-Cookie': cookie('', 0) });
  const tokenResponse = await dependencies.exchangeToken({
    clientId: env.WORDPRESS_CLIENT_ID,
    clientSecret: env.WORDPRESS_CLIENT_SECRET,
    code,
    redirectUri: callbackUrl
  });
  if (!tokenResponse?.ok || typeof tokenResponse.accessToken !== 'string' || tokenResponse.accessToken.length < 16) {
    const upstreamStatus = Number.isInteger(tokenResponse?.status) ? tokenResponse.status : null;
    const upstreamError = sanitizedOauthError(tokenResponse?.errorType);
    console.error(JSON.stringify({ stage: 'wordpress_token_exchange', upstream_status: upstreamStatus, error_type: upstreamError }));
    return json({
      error: tokenResponse?.errorType === 'invalid_grant' ? 'OAUTH_CODE_INVALID' : 'WORDPRESS_TOKEN_EXCHANGE_FAILED',
      upstream_status: upstreamStatus,
      upstream_error: upstreamError
    }, 502, { 'Set-Cookie': cookie('', 0) });
  }
  const site = safeSite(tokenResponse.site);
  await env.WORDPRESS_OAUTH_TOKENS.put('access_token', tokenResponse.accessToken);
  await env.WORDPRESS_OAUTH_TOKENS.put('site', site || '');
  return json({ connected: true, site, message: 'Kết nối thành công' }, 200, { 'Set-Cookie': cookie('', 0) });
}

export async function handleWordpressOauthStatus(request, env, dependencies) {
  const auth = await ownerAuth(request, dependencies);
  if (!auth?.ok) return json({ error: auth?.error || 'FORBIDDEN' }, auth?.status || 403);
  if (!env.WORDPRESS_OAUTH_TOKENS?.get) return json({ error: 'WORDPRESS_OAUTH_NOT_CONFIGURED' }, 503);
  const [token, site] = await Promise.all([
    env.WORDPRESS_OAUTH_TOKENS.get('access_token'),
    env.WORDPRESS_OAUTH_TOKENS.get('site')
  ]);
  return json({ connected: Boolean(token), site: token ? safeSite(site) : null, message: token ? 'Đã kết nối WordPress' : 'Chưa kết nối WordPress' });
}

export async function exchangeWordpressToken({ clientId, clientSecret, code, redirectUri }) {
  const response = await fetch('https://public-api.wordpress.com/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, code, redirect_uri: redirectUri, grant_type: 'authorization_code' })
  });
  const result = await response.json().catch(() => ({}));
  return {
    ok: response.ok,
    status: response.status,
    errorType: sanitizedOauthError(result?.error || result?.code),
    site: result?.blog_url || result?.site_url || result?.site,
    accessToken: result.access_token
  };
}
