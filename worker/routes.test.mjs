import test from 'node:test';
import assert from 'node:assert/strict';
import worker from './index.mjs';

test('health endpoint is explicit about environment', async () => {
  const response = await worker.fetch(new Request('https://melsou.test/api/health'), { APP_ENV: 'test' });
  assert.deepEqual(await response.json(), { ok: true, environment: 'test' });
});
test('quote endpoint uses server-side price arithmetic', async () => {
  const response = await worker.fetch(new Request('https://melsou.test/api/quote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ packageCode: 'SIGNATURE', size: 'A5_PORTRAIT', pages: 12, twin: false, shipments: 1 }) }), {});
  assert.equal(response.status, 200);
  assert.equal((await response.json()).quote.total, 289000);
});
test('quote endpoint rejects untrusted invalid configurations', async () => {
  const response = await worker.fetch(new Request('https://melsou.test/api/quote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ packageCode: 'SIGNATURE', size: 'A5_PORTRAIT', pages: 12, twin: false, shipments: 2 }) }), {});
  assert.equal(response.status, 400);
});
test('connected quote endpoint reads the active Supabase pricing version', async (t) => {
  const rules = { currency: 'VND', packages: { MELODY: 159000, VOICE: 219000, SIGNATURE: 259000 }, sizes: { A5_PORTRAIT: 0, SQUARE: 20000, A6: -20000, A5_LANDSCAPE: 10000 }, pages: { 12: 0, 16: 30000, 24: 60000 }, twin_second_copy_ratio: 0.75, shipping_per_shipment: 30000 };
  t.mock.method(globalThis, 'fetch', async (url) => {
    assert.match(String(url), /pricing_versions/);
    return new Response(JSON.stringify([{ version: 7, rules }]), { status: 200 });
  });
  const response = await worker.fetch(new Request('https://melsou.test/api/quote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ packageCode: 'MELODY', size: 'A5_PORTRAIT', pages: 12, twin: false, shipments: 1 }) }), { SUPABASE_URL: 'https://db.test', SUPABASE_SERVICE_ROLE_KEY: 'service' });
  assert.deepEqual(await response.json(), { quote: { currency: 'VND', packageCode: 'MELODY', size: 'A5_PORTRAIT', pages: 12, twin: false, shipments: 1, breakdown: { package: 159000, size: 0, pages: 0, firstCopy: 159000, twinCopy: 0, shipping: 30000 }, total: 189000 }, pricingVersion: 7 });
});
test('public config never exposes server or webhook secrets', async () => {
  const response = await worker.fetch(new Request('https://melsou.test/api/public-config'), { APP_ENV: 'test', SUPABASE_URL: 'https://db.test', SUPABASE_ANON_KEY: 'public-key', SUPABASE_SERVICE_ROLE_KEY: 'private-key', SEPAY_WEBHOOK_SECRET: 'private-webhook-key', SEPAY_BANK_ACCOUNT: '123' });
  const body = await response.json();
  assert.equal(body.supabaseAnonKey, 'public-key');
  assert.equal(JSON.stringify(body).includes('private-key'), false);
  assert.equal(JSON.stringify(body).includes('private-webhook-key'), false);
});
test('write endpoints require a verified bearer token', async () => {
  const response = await worker.fetch(new Request('https://melsou.test/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) }), { SUPABASE_URL: 'https://db.test' });
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: 'UNAUTHENTICATED' });
});
test('internal render callback rejects a missing service token', async () => {
  const response = await worker.fetch(new Request('https://melsou.test/api/internal/render-jobs/11111111-1111-4111-8111-111111111111/complete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ artifacts: {} }) }), { MELSOU_INTERNAL_JOB_TOKEN: 'not-provided' });
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: 'INTERNAL_AUTH_REQUIRED' });
});
test('guest draft creation receives an opaque HttpOnly session and stores only its hash', async (t) => {
  let inserted;
  t.mock.method(globalThis, 'fetch', async (_url, init) => {
    inserted = JSON.parse(init.body);
    return new Response(JSON.stringify([{ id: '11111111-1111-4111-8111-111111111111', revision: 1 }]), { status: 201 });
  });
  const response = await worker.fetch(new Request('https://melsou.test/api/guest/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'Private draft', document: { template: { template_id: 'first-love', version: 1 } } }) }), { SUPABASE_URL: 'https://db.test', SUPABASE_SERVICE_ROLE_KEY: 'service' });
  assert.equal(response.status, 201);
  const cookie = response.headers.get('Set-Cookie');
  assert.match(cookie, /HttpOnly/); assert.match(cookie, /SameSite=Lax/);
  assert.match(inserted.guest_session_hash, /^[a-f0-9]{64}$/);
  assert.notEqual(inserted.guest_session_hash, cookie.match(/melsou_guest_v1=([^;]+)/)[1]);
});
test('public tracking response excludes customer and payment data', async (t) => {
  const unsafeOrder = { order_code: 'MELM-2608-001', status: 'SHIPPING', expected_amount_vnd: 999999, customer_id: 'must-not-leak', shipments: [{ status: 'SHIPPING', carrier: 'Carrier', tracking_code: 'TRACK-1', tracking_url: 'https://carrier.test/T1', address_snapshot: { address: 'must-not-leak' } }] };
  t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify([unsafeOrder]), { status: 200 }));
  const response = await worker.fetch(new Request('https://melsou.test/api/tracking/MELM-2608-001'), { SUPABASE_URL: 'https://db.test', SUPABASE_SERVICE_ROLE_KEY: 'service' });
  const body = await response.json();
  assert.equal(response.status, 200); assert.equal(JSON.stringify(body).includes('must-not-leak'), false); assert.equal(body.order.shipments[0].trackingCode, 'TRACK-1');
});
