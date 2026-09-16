const json = (body, status = 200, headers = {}) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers }
});
const stateCookie = 'melsou_wordpress_oauth_state';
const callbackUrl = 'https://melsou.com/wordpress-oauth-callback';
const readCookie = (request, name) => Object.fromEntries((request.headers.get('Cookie') || '').split(';').map((part) => part.trim().split('=').map(decodeURIComponent)).filter(([key, value]) => key && value))[name] || null;
const cookie = (value, maxAge = 600) => `${stateCookie}=${encodeURIComponent(value)}; Path=/api/wordpress/oauth; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
const randomState = () => { const bytes = new Uint8Array(32); crypto.getRandomValues(bytes); return [...bytes].map((value) => value.toString(16).padStart(2, '0')).join(''); };
const timeSafeEqual = (left, right) => {
  if (typeof left !== 'string' || typeof right !== 'string' || left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
};

const configured = (env) => Boolean(env.WORDPRESS_CLIENT_ID && env.WORDPRESS_CLIENT_SECRET && env.WORDPRESS_OAUTH_TOKENS?.put);

export async function handleWordpressOauthStart(request, env, dependencies) {
  if (!await dependencies.requireOwner(request)) return json({ error: 'OWNER_REQUIRED' }, 403);
  if (!configured(env)) return json({ error: 'WORDPRESS_OAUTH_NOT_CONFIGURED' }, 503);
  const state = randomState();
  const authorize = new URL('https://public-api.wordpress.com/oauth2/authorize');
  authorize.searchParams.set('client_id', env.WORDPRESS_CLIENT_ID);
  authorize.searchParams.set('redirect_uri', callbackUrl);
  authorize.searchParams.set('response_type', 'code');
  authorize.searchParams.set('state', state);
  return json({ authorization_url: authorize.toString() }, 200, { 'Set-Cookie': cookie(state) });
}

export async function handleWordpressOauthCallback(request, env, dependencies) {
  if (!await dependencies.requireOwner(request)) return json({ error: 'OWNER_REQUIRED' }, 403);
  if (!configured(env)) return json({ error: 'WORDPRESS_OAUTH_NOT_CONFIGURED' }, 503);
  const limited = await dependencies.rateLimit(request, 'wordpress-oauth-callback');
  if (limited?.configurationMissing) return json({ error: 'RATE_LIMIT_NOT_CONFIGURED' }, 503);
  if (limited && !limited.allowed) return json({ error: 'RATE_LIMITED' }, 429);
  let body;
  try { body = await request.json(); } catch { return json({ error: 'INVALID_JSON' }, 400); }
  const code = typeof body?.code === 'string' ? body.code : '';
  const incomingState = typeof body?.state === 'string' ? body.state : '';
  const expectedState = readCookie(request, stateCookie);
  if (!/^[a-zA-Z0-9._~-]{8,2048}$/.test(code) || !/^[0-9a-f]{64}$/.test(incomingState) || !timeSafeEqual(incomingState, expectedState || '')) {
    return json({ error: 'WORDPRESS_OAUTH_INVALID_CALLBACK' }, 400, { 'Set-Cookie': cookie('', 0) });
  }
  const tokenResponse = await dependencies.exchangeToken({
    clientId: env.WORDPRESS_CLIENT_ID,
    clientSecret: env.WORDPRESS_CLIENT_SECRET,
    code,
    redirectUri: callbackUrl
  });
  if (!tokenResponse?.ok || typeof tokenResponse.accessToken !== 'string' || tokenResponse.accessToken.length < 16) {
    return json({ error: 'WORDPRESS_OAUTH_EXCHANGE_FAILED' }, 502, { 'Set-Cookie': cookie('', 0) });
  }
  await env.WORDPRESS_OAUTH_TOKENS.put('access_token', tokenResponse.accessToken);
  return json({ connected: true }, 200, { 'Set-Cookie': cookie('', 0) });
}

export async function exchangeWordpressToken({ clientId, clientSecret, code, redirectUri }) {
  const response = await fetch('https://public-api.wordpress.com/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, code, redirect_uri: redirectUri, grant_type: 'authorization_code' })
  });
  const result = await response.json().catch(() => ({}));
  return { ok: response.ok, accessToken: result.access_token };
}
