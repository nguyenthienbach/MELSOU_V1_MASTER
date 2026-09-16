import test from 'node:test';
import assert from 'node:assert/strict';
import { handleWordpressOauthCallback, handleWordpressOauthStart, handleWordpressOauthStatus } from './wordpress-oauth.mjs';

const tokenStore = () => ({ values: new Map(), async put(key, value) { this.values.set(key, value); } });
const env = (store = tokenStore()) => ({ WORDPRESS_CLIENT_ID: '12345', WORDPRESS_CLIENT_SECRET: 'server-only-secret', WORDPRESS_OAUTH_TOKENS: store });
const oauthStateStore = () => {
  const values = new Set();
  const usedCodes = new Set();
  return {
    async storeState({ stateHash }) { values.add(stateHash); return true; },
    async consumeState({ stateHash, codeHash }) {
      if (!values.has(stateHash) || usedCodes.has(codeHash)) return false;
      values.delete(stateHash);
      usedCodes.add(codeHash);
      return true;
    }
  };
};
const owner = { id: '11111111-1111-4111-8111-111111111111', nativeTokenHash: 'a'.repeat(64) };
const dependenciesFor = (states = oauthStateStore()) => ({
  authenticateOwner: async () => ({ ok: true, user: owner }),
  rateLimit: async () => ({ allowed: true }),
  ...states
});

test('OAuth start returns authorization URL and keeps state in HttpOnly cookie', async () => {
  const result = await handleWordpressOauthStart(new Request('https://melsou.com/api/wordpress/oauth/start'), env(), dependenciesFor());
  const body = await result.json();
  assert.equal(result.status, 200);
  assert.match(body.authorization_url, /^https:\/\/public-api\.wordpress\.com\/oauth2\/authorize\?/);
  assert.doesNotMatch(body.authorization_url, /server-only-secret/);
  const stateCookie = result.headers.get('Set-Cookie');
  assert.match(stateCookie, /Path=\/; HttpOnly; Secure; SameSite=Lax; Max-Age=600/);
  assert.doesNotMatch(stateCookie, /Domain=/i);
});

test('OAuth state cookie survives the production-origin callback proxy path', async () => {
  const store = tokenStore();
  const dependencies = dependenciesFor();
  const start = await handleWordpressOauthStart(new Request('https://melsou.com/api/wordpress/oauth/start', {
    headers: { Origin: 'https://melsou.com', 'X-Forwarded-Host': 'melsou.com', 'X-Forwarded-Proto': 'https' }
  }), env(store), dependencies);
  const cookieHeader = start.headers.get('Set-Cookie');
  const browserCookie = cookieHeader.split(';')[0];
  const state = new URL((await start.json()).authorization_url).searchParams.get('state');
  const callback = await handleWordpressOauthCallback(new Request('https://melsou.com/api/wordpress/oauth/callback', {
    method: 'POST',
    headers: {
      Cookie: browserCookie,
      Origin: 'https://melsou.com',
      Referer: 'https://melsou.com/wordpress-oauth-callback'
    },
    body: JSON.stringify({ code: 'authorization-code', state })
  }), env(store), {
    ...dependencies,
    exchangeToken: async () => ({ ok: true, accessToken: 'wordpress-access-token-value' })
  });
  assert.equal(callback.status, 200);
  assert.match(callback.headers.get('Set-Cookie'), /Path=\/; HttpOnly; Secure; SameSite=Lax; Max-Age=0/);
  assert.equal(store.values.has('access_token'), true);
});

test('OAuth callback validates state and stores token without returning it', async () => {
  const store = tokenStore();
  const dependencies = dependenciesFor();
  const start = await handleWordpressOauthStart(new Request('https://melsou.com/api/wordpress/oauth/start'), env(store), dependencies);
  const cookie = start.headers.get('Set-Cookie').split(';')[0];
  const state = new URL((await start.json()).authorization_url).searchParams.get('state');
  const exchange = { ...dependencies, exchangeToken: async ({ code, clientSecret }) => {
    assert.equal(code, 'authorization-code');
    assert.equal(clientSecret, 'server-only-secret');
    return { ok: true, accessToken: 'wordpress-access-token-value', site: 'https://melsoucms.wordpress.com' };
  } };
  const request = new Request('https://melsou.com/api/wordpress/oauth/callback', { method: 'POST', headers: { Cookie: cookie }, body: JSON.stringify({ code: 'authorization-code', state }) });
  const result = await handleWordpressOauthCallback(request, env(store), exchange);
  const body = await result.json();
  assert.deepEqual(body, { connected: true, site: 'melsoucms.wordpress.com', message: 'Kết nối thành công' });
  assert.equal(store.values.get('access_token'), 'wordpress-access-token-value');
  assert.doesNotMatch(JSON.stringify(body), /access-token|authorization-code|server-only-secret/);
});

test('OAuth callback fails closed before exchange when state is invalid', async () => {
  let exchanged = false;
  const dependencies = dependenciesFor();
  const originalError = console.error;
  const logs = [];
  console.error = (message) => logs.push(message);
  const request = new Request('https://melsou.com/api/wordpress/oauth/callback', { method: 'POST', headers: { Cookie: 'melsou_wordpress_oauth_state=' + 'a'.repeat(64) }, body: JSON.stringify({ code: 'authorization-code', state: 'b'.repeat(64) }) });
  let result;
  try {
    result = await handleWordpressOauthCallback(request, env(), { ...dependencies, exchangeToken: async () => { exchanged = true; return { ok: true, accessToken: 'should-not-be-used' }; } });
  } finally {
    console.error = originalError;
  }
  assert.equal(result.status, 400);
  assert.equal(exchanged, false);
  assert.deepEqual(logs.map((message) => JSON.parse(message)), [{
    stage: 'wordpress_oauth_callback_validation',
    json_parsed: true,
    code_valid: true,
    state_valid: true,
    state_cookie_present: true,
    state_match: false
  }]);
  assert.doesNotMatch(logs.join(''), /authorization-code|should-not-be-used|server-only-secret/);
});

test('OAuth callback reports malformed JSON using boolean-only diagnostics', async () => {
  const dependencies = dependenciesFor();
  const originalError = console.error;
  const logs = [];
  console.error = (message) => logs.push(message);
  let result;
  try {
    result = await handleWordpressOauthCallback(new Request('https://melsou.com/api/wordpress/oauth/callback', {
      method: 'POST',
      body: '{invalid'
    }), env(), dependencies);
  } finally {
    console.error = originalError;
  }
  assert.equal(result.status, 400);
  assert.deepEqual(logs.map((message) => JSON.parse(message)), [{
    stage: 'wordpress_oauth_callback_parse',
    json_parsed: false,
    code_valid: false,
    state_valid: false,
    state_cookie_present: false,
    state_match: false
  }]);
});

test('OAuth callback exposes only sanitized upstream failure diagnostics', async () => {
  const store = tokenStore();
  const dependencies = dependenciesFor();
  const start = await handleWordpressOauthStart(new Request('https://melsou.com/api/wordpress/oauth/start'), env(store), dependencies);
  const cookie = start.headers.get('Set-Cookie').split(';')[0];
  const state = new URL((await start.json()).authorization_url).searchParams.get('state');
  const request = new Request('https://melsou.com/api/wordpress/oauth/callback', {
    method: 'POST',
    headers: { Cookie: cookie },
    body: JSON.stringify({ code: 'authorization-code', state })
  });
  const originalError = console.error;
  const logs = [];
  console.error = (message) => logs.push(message);
  let result;
  try {
    result = await handleWordpressOauthCallback(request, env(store), {
      ...dependencies,
      exchangeToken: async () => ({ ok: false, status: 400, errorType: 'invalid_grant', raw: 'must-not-leak' })
    });
  } finally {
    console.error = originalError;
  }
  const body = await result.json();
  assert.equal(result.status, 502);
  assert.deepEqual(body, { error: 'OAUTH_CODE_INVALID', upstream_status: 400, upstream_error: 'invalid_grant' });
  assert.equal(store.values.size, 0);
  assert.doesNotMatch(JSON.stringify(body), /authorization-code|server-only-secret|must-not-leak|access-token/);
  assert.deepEqual(logs.map((message) => JSON.parse(message)), [{ stage: 'wordpress_token_exchange', upstream_status: 400, error_type: 'invalid_grant' }]);
  assert.doesNotMatch(logs.join(''), /authorization-code|server-only-secret|must-not-leak|access-token/);
});

test('OAuth endpoints distinguish guest and CUSTOMER from configured OWNER', async () => {
  const guest = dependenciesFor();
  guest.authenticateOwner = async () => ({ ok: false, status: 401, error: 'UNAUTHORIZED' });
  const guestResponse = await handleWordpressOauthStart(new Request('https://melsou.com/api/wordpress/oauth/start'), env(), guest);
  assert.equal(guestResponse.status, 401);
  assert.deepEqual(await guestResponse.json(), { error: 'UNAUTHORIZED' });

  const customer = dependenciesFor();
  customer.authenticateOwner = async () => ({ ok: false, status: 403, error: 'FORBIDDEN' });
  const customerResponse = await handleWordpressOauthStart(new Request('https://melsou.com/api/wordpress/oauth/start'), env(), customer);
  assert.equal(customerResponse.status, 403);
  assert.deepEqual(await customerResponse.json(), { error: 'FORBIDDEN' });
});

test('OAuth state is single-use and replay is rejected before code exchange', async () => {
  const store = tokenStore();
  const dependencies = dependenciesFor();
  const start = await handleWordpressOauthStart(new Request('https://melsou.com/api/wordpress/oauth/start'), env(store), dependencies);
  const cookie = start.headers.get('Set-Cookie').split(';')[0];
  const state = new URL((await start.json()).authorization_url).searchParams.get('state');
  let exchanges = 0;
  const exchange = { ...dependencies, exchangeToken: async () => { exchanges += 1; return { ok: true, accessToken: 'wordpress-access-token-value', site: 'melsoucms.wordpress.com' }; } };
  const makeRequest = () => new Request('https://melsou.com/api/wordpress/oauth/callback', { method: 'POST', headers: { Cookie: cookie }, body: JSON.stringify({ code: 'authorization-code', state }) });
  assert.equal((await handleWordpressOauthCallback(makeRequest(), env(store), exchange)).status, 200);
  const replay = await handleWordpressOauthCallback(makeRequest(), env(store), exchange);
  assert.equal(replay.status, 400);
  assert.deepEqual(await replay.json(), { error: 'CSRF_STATE_MISMATCH' });
  const secondStart = await handleWordpressOauthStart(new Request('https://melsou.com/api/wordpress/oauth/start'), env(store), dependencies);
  const secondCookie = secondStart.headers.get('Set-Cookie').split(';')[0];
  const secondState = new URL((await secondStart.json()).authorization_url).searchParams.get('state');
  const crossStateReplay = await handleWordpressOauthCallback(new Request('https://melsou.com/api/wordpress/oauth/callback', {
    method: 'POST', headers: { Cookie: secondCookie }, body: JSON.stringify({ code: 'authorization-code', state: secondState })
  }), env(store), exchange);
  assert.equal(crossStateReplay.status, 400);
  assert.deepEqual(await crossStateReplay.json(), { error: 'CSRF_STATE_MISMATCH' });
  assert.equal(exchanges, 1);
});

test('OAuth callback rejects missing, malformed and expired state without exchange', async () => {
  const store = tokenStore();
  let exchanges = 0;
  const rejectedState = dependenciesFor({ storeState: async () => true, consumeState: async () => false });
  const exchange = { ...rejectedState, exchangeToken: async () => { exchanges += 1; return { ok: true, accessToken: 'must-not-be-used' }; } };
  const missing = await handleWordpressOauthCallback(new Request('https://melsou.com/api/wordpress/oauth/callback', {
    method: 'POST',
    body: JSON.stringify({ code: 'authorization-code' })
  }), env(store), exchange);
  assert.equal(missing.status, 400);
  assert.equal((await missing.json()).error, 'CSRF_STATE_MISMATCH');

  const state = 'b'.repeat(64);
  const expired = await handleWordpressOauthCallback(new Request('https://melsou.com/api/wordpress/oauth/callback', {
    method: 'POST',
    headers: { Cookie: `melsou_wordpress_oauth_state=${state}` },
    body: JSON.stringify({ code: 'authorization-code', state })
  }), env(store), exchange);
  assert.equal(expired.status, 400);
  assert.deepEqual(await expired.json(), { error: 'CSRF_STATE_MISMATCH' });
  assert.equal(exchanges, 0);
});

test('OAuth invalid_client stays a stable redacted exchange failure', async () => {
  const store = tokenStore();
  const dependencies = dependenciesFor();
  const start = await handleWordpressOauthStart(new Request('https://melsou.com/api/wordpress/oauth/start'), env(store), dependencies);
  const cookie = start.headers.get('Set-Cookie').split(';')[0];
  const state = new URL((await start.json()).authorization_url).searchParams.get('state');
  const originalError = console.error;
  console.error = () => {};
  try {
    const response = await handleWordpressOauthCallback(new Request('https://melsou.com/api/wordpress/oauth/callback', {
      method: 'POST', headers: { Cookie: cookie }, body: JSON.stringify({ code: 'authorization-code', state })
    }), env(store), { ...dependencies, exchangeToken: async () => ({ ok: false, status: 400, errorType: 'invalid_client' }) });
    assert.equal(response.status, 502);
    assert.deepEqual(await response.json(), { error: 'WORDPRESS_TOKEN_EXCHANGE_FAILED', upstream_status: 400, upstream_error: 'invalid_client' });
  } finally { console.error = originalError; }
});

test('OAuth status exposes connection metadata without the token', async () => {
  const store = tokenStore();
  store.values.set('access_token', 'wordpress-access-token-value');
  store.values.set('site', 'melsoucms.wordpress.com');
  store.get = async (key) => store.values.get(key) || null;
  const response = await handleWordpressOauthStatus(new Request('https://melsou.com/api/owner/wordpress/status'), env(store), dependenciesFor());
  const body = await response.json();
  assert.deepEqual(body, { connected: true, site: 'melsoucms.wordpress.com', message: 'Đã kết nối WordPress' });
  assert.doesNotMatch(JSON.stringify(body), /access-token|server-only-secret/);
});
