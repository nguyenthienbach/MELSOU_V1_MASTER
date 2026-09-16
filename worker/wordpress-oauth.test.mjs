import test from 'node:test';
import assert from 'node:assert/strict';
import { handleWordpressOauthCallback, handleWordpressOauthStart } from './wordpress-oauth.mjs';

const tokenStore = () => ({ values: new Map(), async put(key, value) { this.values.set(key, value); } });
const env = (store = tokenStore()) => ({ WORDPRESS_CLIENT_ID: '12345', WORDPRESS_CLIENT_SECRET: 'server-only-secret', WORDPRESS_OAUTH_TOKENS: store });
const dependencies = { requireOwner: async () => ({ id: 'owner' }), rateLimit: async () => ({ allowed: true }) };

test('OAuth start returns authorization URL and keeps state in HttpOnly cookie', async () => {
  const result = await handleWordpressOauthStart(new Request('https://melsou.com/api/wordpress/oauth/start'), env(), dependencies);
  const body = await result.json();
  assert.equal(result.status, 200);
  assert.match(body.authorization_url, /^https:\/\/public-api\.wordpress\.com\/oauth2\/authorize\?/);
  assert.doesNotMatch(body.authorization_url, /server-only-secret/);
  assert.match(result.headers.get('Set-Cookie'), /HttpOnly; Secure; SameSite=Lax/);
});

test('OAuth callback validates state and stores token without returning it', async () => {
  const store = tokenStore();
  const start = await handleWordpressOauthStart(new Request('https://melsou.com/api/wordpress/oauth/start'), env(store), dependencies);
  const cookie = start.headers.get('Set-Cookie').split(';')[0];
  const state = new URL((await start.json()).authorization_url).searchParams.get('state');
  const exchange = { ...dependencies, exchangeToken: async ({ code, clientSecret }) => {
    assert.equal(code, 'authorization-code');
    assert.equal(clientSecret, 'server-only-secret');
    return { ok: true, accessToken: 'wordpress-access-token-value' };
  } };
  const request = new Request('https://melsou.com/api/wordpress/oauth/callback', { method: 'POST', headers: { Cookie: cookie }, body: JSON.stringify({ code: 'authorization-code', state }) });
  const result = await handleWordpressOauthCallback(request, env(store), exchange);
  const body = await result.json();
  assert.deepEqual(body, { connected: true });
  assert.equal(store.values.get('access_token'), 'wordpress-access-token-value');
  assert.doesNotMatch(JSON.stringify(body), /access-token|authorization-code|server-only-secret/);
});

test('OAuth callback fails closed before exchange when state is invalid', async () => {
  let exchanged = false;
  const request = new Request('https://melsou.com/api/wordpress/oauth/callback', { method: 'POST', headers: { Cookie: 'melsou_wordpress_oauth_state=' + 'a'.repeat(64) }, body: JSON.stringify({ code: 'authorization-code', state: 'b'.repeat(64) }) });
  const result = await handleWordpressOauthCallback(request, env(), { ...dependencies, exchangeToken: async () => { exchanged = true; return { ok: true, accessToken: 'should-not-be-used' }; } });
  assert.equal(result.status, 400);
  assert.equal(exchanged, false);
});
