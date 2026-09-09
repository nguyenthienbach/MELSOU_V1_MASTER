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
  assert.equal(JSON.stringify(body).includes('123'), false);
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
  const unsafeOrder = { order_code: 'MELM-2608-001', status: 'SHIPPING', expected_amount_vnd: 999999, customer_id: 'must-not-leak', order_events: [{ event_type: 'STATUS_CHANGED', status: 'SHIPPING', created_at: '2026-09-08T00:00:00Z', public_visible: true }], shipments: [{ status: 'SHIPPING', carrier: 'Carrier', tracking_code: 'TRACK-1', tracking_url: 'https://carrier.test/T1', address_snapshot: { address: 'must-not-leak' } }] };
  t.mock.method(globalThis, 'fetch', async (url) => {
    assert.match(String(url), /tracking_verifier_hash=eq\.[0-9a-f]{64}/);
    return new Response(JSON.stringify([unsafeOrder]), { status: 200 });
  });
  const response = await worker.fetch(new Request('https://melsou.test/api/tracking', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderCode: 'MELM-2608-001', phone: '0912 345 678' }) }), { SUPABASE_URL: 'https://db.test', SUPABASE_SERVICE_ROLE_KEY: 'service' });
  const body = await response.json();
  assert.equal(response.status, 200); assert.equal(JSON.stringify(body).includes('must-not-leak'), false); assert.equal(body.order.shipments[0].trackingCode, 'TRACK-1');
});
test('template endpoint serves renderer-owned definitions filtered by compatibility', async () => {
  const response = await worker.fetch(new Request('https://melsou.test/api/templates?size=A5_LANDSCAPE&pages=12'), {});
  assert.equal(response.status, 200);
  const { templates } = await response.json();
  assert.deepEqual(templates.map((template) => template.template_id).sort(), ['melsou-editorial', 'somewhere-together']);
  assert.ok(templates.every((template) => Array.isArray(template.spreads)));
});

test('legacy code-only tracking is rejected without phone verification', async () => {
  const response = await worker.fetch(new Request('https://melsou.test/api/tracking/MELM-2608-001'), {});
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: 'TRACKING_VERIFICATION_REQUIRED' });
});

test('production tracking fails closed without its rate-limit binding', async () => {
  const response = await worker.fetch(new Request('https://melsou.test/api/tracking', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderCode: 'MELM-2608-001', phone: '0912345678' }) }), { APP_ENV: 'production' });
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: 'RATE_LIMIT_NOT_CONFIGURED' });
});

test('account update persists only allowed profile fields', async (t) => {
  let patch;
  t.mock.method(globalThis, 'fetch', async (url, init = {}) => {
    if (String(url).includes('/auth/v1/user')) return new Response(JSON.stringify({ id: '11111111-1111-4111-8111-111111111111', email: 'user@test.invalid' }));
    patch = JSON.parse(init.body).p_patch;
    return new Response(JSON.stringify({ user_id: '11111111-1111-4111-8111-111111111111', ...patch }), { status: 200 });
  });
  const response = await worker.fetch(new Request('https://melsou.test/api/account', { method: 'PATCH', headers: { Authorization: 'Bearer user-token', 'Content-Type': 'application/json' }, body: JSON.stringify({ displayName: 'Customer', notifications: { orderUpdates: true }, role: 'OWNER' }) }), { SUPABASE_URL: 'https://db.test', SUPABASE_ANON_KEY: 'anon', SUPABASE_SERVICE_ROLE_KEY: 'service' });
  assert.equal(response.status, 200);
  assert.equal(patch.display_name, 'Customer');
  assert.deepEqual(patch.notification_preferences, { orderUpdates: true });
  assert.equal(Object.hasOwn(patch, 'role'), false);
});

test('customer cannot use owner blog write API', async (t) => {
  t.mock.method(globalThis, 'fetch', async (url) => {
    if (String(url).includes('/auth/v1/user')) return new Response(JSON.stringify({ id: '11111111-1111-4111-8111-111111111111' }));
    return new Response(JSON.stringify([{ role: 'CUSTOMER' }]), { status: 200 });
  });
  const response = await worker.fetch(new Request('https://melsou.test/api/owner/blog', { method: 'POST', headers: { Authorization: 'Bearer user-token', 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'No', content: 'Denied' }) }), { SUPABASE_URL: 'https://db.test', SUPABASE_ANON_KEY: 'anon', SUPABASE_SERVICE_ROLE_KEY: 'service' });
  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), { error: 'OWNER_REQUIRED' });
});

test('cart ignores a client-supplied price and persists canonical configuration only', async (t) => {
  let rpcBody;
  t.mock.method(globalThis, 'fetch', async (url, init = {}) => {
    if (String(url).includes('/auth/v1/user')) return new Response(JSON.stringify({ id: '11111111-1111-4111-8111-111111111111' }));
    rpcBody = JSON.parse(init.body);
    return new Response(JSON.stringify({ cart_id: '22222222-2222-4222-8222-222222222222' }), { status: 200 });
  });
  const response = await worker.fetch(new Request('https://melsou.test/api/cart/items', { method: 'POST', headers: { Authorization: 'Bearer user-token', 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId: '33333333-3333-4333-8333-333333333333', configuration: { packageCode: 'MELODY', size: 'A5_PORTRAIT', pages: 12, twin: false, shipments: 1, total: 1 } }) }), { SUPABASE_URL: 'https://db.test', SUPABASE_ANON_KEY: 'anon', SUPABASE_SERVICE_ROLE_KEY: 'service' });
  assert.equal(response.status, 200);
  assert.deepEqual(rpcBody.p_configuration, { packageCode: 'MELODY', size: 'A5_PORTRAIT', pages: 12, twin: false, shipments: 1 });
});

test('payment instructions are authenticated, exact and explicitly TEST or LIVE', async (t) => {
  t.mock.method(globalThis, 'fetch', async (url) => {
    if (String(url).includes('/auth/v1/user')) return new Response(JSON.stringify({ id: '11111111-1111-4111-8111-111111111111' }));
    return new Response(JSON.stringify([{ id: '22222222-2222-4222-8222-222222222222', order_code: 'MELM-2609-001', status: 'AWAITING_PAYMENT', payment_code: 'MELM-2609-001', expected_amount_vnd: 189000, payment_expires_at: '2026-09-08T01:00:00Z' }]), { status: 200 });
  });
  const response = await worker.fetch(new Request('https://melsou.test/api/orders/22222222-2222-4222-8222-222222222222/payment', { headers: { Authorization: 'Bearer user-token' } }), { SUPABASE_URL: 'https://db.test', SUPABASE_ANON_KEY: 'anon', SUPABASE_SERVICE_ROLE_KEY: 'service', SEPAY_MODE: 'TEST', SEPAY_BANK_ACCOUNT: '123', SEPAY_BANK_CODE: 'VCB' });
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.payment.amount, 189000);
  assert.equal(body.payment.mode, 'TEST');
  assert.equal(new URL(body.payment.qrImageUrl).searchParams.get('des'), 'MELM-2609-001');
});

test('duplicate checkout requests use the same server-side idempotency key and authoritative quote', async (t) => {
  const projectId = '33333333-3333-4333-8333-333333333333';
  const assetId = '44444444-4444-4444-8444-444444444444';
  const document = { template: { template_id: 'first-love', version: 1 }, configuration: { size: 'A5_PORTRAIT', pages: 12 }, content_bindings: { image_01: { asset_id: assetId } } };
  const rules = { currency: 'VND', packages: { MELODY: 159000, VOICE: 219000, SIGNATURE: 259000 }, sizes: { A5_PORTRAIT: 0, SQUARE: 20000, A6: -20000, A5_LANDSCAPE: 10000 }, pages: { 12: 0, 16: 30000, 24: 60000 }, twin_second_copy_ratio: 0.75, shipping_per_shipment: 30000 };
  const keys = [];
  t.mock.method(globalThis, 'fetch', async (url, init = {}) => {
    const value = String(url);
    if (value.includes('/auth/v1/user')) return new Response(JSON.stringify({ id: '11111111-1111-4111-8111-111111111111' }));
    if (value.includes('/projects?')) return new Response(JSON.stringify([{ id: projectId, revision: 4, document, template_id: 'first-love', template_version: 1 }]), { status: 200 });
    if (value.includes('/pricing_versions?')) return new Response(JSON.stringify([{ version: 1, rules }]), { status: 200 });
    if (value.includes('/project_assets?')) return new Response(JSON.stringify([{ id: assetId, status: 'READY', processing_state: 'READY', normalized_key: `projects/${projectId}/assets/${assetId}/normalized.png`, normalized_mime_type: 'image/png', normalized_width_px: 2400, normalized_height_px: 1600 }]), { status: 200 });
    if (value.includes('/print_profiles?')) return new Response(JSON.stringify([{ production_ready: true, configuration: { finished_width_mm: 1, finished_height_mm: 1, cover_width_mm: 1, cover_height_mm: 1, bleed_mm: 1, safe_margin_mm: 1, gutter_warning_mm: 1, dpi: 300, color_profile: 'CMYK', pdf_standard: 'PDF/X', cover_construction: 'LAYFLAT' } }]), { status: 200 });
    if (value.includes('/rpc/melsou_create_order_v3')) {
      const body = JSON.parse(init.body); keys.push(body.p_idempotency_key);
      assert.equal(body.p_quote.total, 189000);
      return new Response(JSON.stringify({ id: '55555555-5555-4555-8555-555555555555', order_code: 'MELM-2609-001', expected_amount_vnd: 189000, status: 'AWAITING_PAYMENT' }), { status: 200 });
    }
    throw new Error(`Unexpected fetch ${value}`);
  });
  const request = () => new Request('https://melsou.test/api/orders', { method: 'POST', headers: { Authorization: 'Bearer user-token', 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId, configuration: { packageCode: 'MELODY', size: 'A5_PORTRAIT', pages: 12, twin: false, shipments: 1 }, shipments: [{ recipient: 'A', phone: '0912345678', address: 'Synthetic test address' }] }) });
  assert.equal((await worker.fetch(request(), { APP_ENV: 'test', SUPABASE_URL: 'https://db.test', SUPABASE_ANON_KEY: 'anon', SUPABASE_SERVICE_ROLE_KEY: 'service' })).status, 201);
  assert.equal((await worker.fetch(request(), { APP_ENV: 'test', SUPABASE_URL: 'https://db.test', SUPABASE_ANON_KEY: 'anon', SUPABASE_SERVICE_ROLE_KEY: 'service' })).status, 201);
  assert.equal(keys.length, 2);
  assert.equal(keys[0], keys[1]);
  assert.match(keys[0], /^auto:[0-9a-f]{64}$/);
});

test('customer export streams only an owned completed private PDF artifact', async (t) => {
  const orderId = '22222222-2222-4222-8222-222222222222';
  t.mock.method(globalThis, 'fetch', async (url) => {
    const value = String(url);
    if (value.includes('/auth/v1/user')) return new Response(JSON.stringify({ id: '11111111-1111-4111-8111-111111111111' }));
    if (value.includes('/orders?')) {
      assert.match(value, /customer_id=eq\.11111111-1111-4111-8111-111111111111/);
      return new Response(JSON.stringify([{ id: orderId, order_code: 'MELM-2609-001', render_jobs: [{ status: 'SUCCESS', completed_at: '2026-09-08T01:00:00Z', artifacts: { interior_spreads_pdf_key: 'orders/MELM-2609-001/melsou-renderer-v1/interior_spreads.pdf' } }] }]), { status: 200 });
    }
    throw new Error(`Unexpected fetch ${value}`);
  });
  const bucket = { async get(key) { assert.equal(key, 'orders/MELM-2609-001/melsou-renderer-v1/interior_spreads.pdf'); return { body: new Uint8Array([0x25, 0x50, 0x44, 0x46]) }; } };
  const response = await worker.fetch(new Request(`https://melsou.test/api/orders/${orderId}/artifacts/interior`, { headers: { Authorization: 'Bearer user-token' } }), { SUPABASE_URL: 'https://db.test', SUPABASE_ANON_KEY: 'anon', SUPABASE_SERVICE_ROLE_KEY: 'service', MELSOU_ASSETS: bucket });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Content-Type'), 'application/pdf');
  assert.match(response.headers.get('Content-Disposition'), /MELM-2609-001-interior\.pdf/);
  assert.deepEqual([...new Uint8Array(await response.arrayBuffer())], [0x25, 0x50, 0x44, 0x46]);
});

test('export never accepts raw album data and waits for a completed render', async (t) => {
  t.mock.method(globalThis, 'fetch', async (url) => {
    if (String(url).includes('/auth/v1/user')) return new Response(JSON.stringify({ id: '11111111-1111-4111-8111-111111111111' }));
    return new Response(JSON.stringify([{ id: '22222222-2222-4222-8222-222222222222', order_code: 'MELM-2609-001', render_jobs: [{ status: 'FAILED', artifacts: {} }] }]), { status: 200 });
  });
  const response = await worker.fetch(new Request('https://melsou.test/api/orders/22222222-2222-4222-8222-222222222222/artifacts/cover', { headers: { Authorization: 'Bearer user-token' } }), { SUPABASE_URL: 'https://db.test', SUPABASE_ANON_KEY: 'anon', SUPABASE_SERVICE_ROLE_KEY: 'service', MELSOU_ASSETS: { async get() { throw new Error('must not read'); } } });
  assert.equal(response.status, 409);
  assert.deepEqual(await response.json(), { error: 'EXPORT_NOT_READY' });
});

test('address save is authenticated, whitelisted and delegated to the atomic RPC', async (t) => {
  let rpcBody;
  t.mock.method(globalThis, 'fetch', async (url, init = {}) => {
    const value = String(url);
    if (value.includes('/auth/v1/user')) return new Response(JSON.stringify({ id: '11111111-1111-4111-8111-111111111111' }));
    if (value.includes('/rpc/melsou_save_customer_address')) { rpcBody = JSON.parse(init.body); return new Response(JSON.stringify({ id: '22222222-2222-4222-8222-222222222222', label: 'Nhà' }), { status: 200 }); }
    throw new Error(`Unexpected fetch ${value}`);
  });
  const response = await worker.fetch(new Request('https://melsou.test/api/addresses', { method: 'POST', headers: { Authorization: 'Bearer user-token', 'Content-Type': 'application/json' }, body: JSON.stringify({ label: 'Nhà', recipient: 'Customer', phone: '0912345678', address: 'Synthetic test address', isDefault: true, role: 'OWNER' }) }), { SUPABASE_URL: 'https://db.test', SUPABASE_ANON_KEY: 'anon', SUPABASE_SERVICE_ROLE_KEY: 'service' });
  assert.equal(response.status, 201);
  assert.equal(rpcBody.p_customer_id, '11111111-1111-4111-8111-111111111111');
  assert.deepEqual(rpcBody.p_address, { label: 'Nhà', recipient: 'Customer', phone: '0912345678', address: 'Synthetic test address', is_default: true });
  assert.equal(Object.hasOwn(rpcBody.p_address, 'role'), false);
});

test('only OWNER can send an audited fulfillment transition', async (t) => {
  let rpcBody;
  t.mock.method(globalThis, 'fetch', async (url, init = {}) => {
    const value = String(url);
    if (value.includes('/auth/v1/user')) return new Response(JSON.stringify({ id: '11111111-1111-4111-8111-111111111111' }));
    if (value.includes('/profiles?')) return new Response(JSON.stringify([{ role: 'OWNER' }]), { status: 200 });
    if (value.includes('/rpc/melsou_update_fulfillment')) { rpcBody = JSON.parse(init.body); return new Response(JSON.stringify({ order_status: 'SHIPPING' }), { status: 200 }); }
    throw new Error(`Unexpected fetch ${value}`);
  });
  const response = await worker.fetch(new Request('https://melsou.test/api/owner/orders/22222222-2222-4222-8222-222222222222/fulfillment', { method: 'POST', headers: { Authorization: 'Bearer owner-token', 'Content-Type': 'application/json' }, body: JSON.stringify({ sequence: 1, status: 'SHIPPING', carrier: 'Test Carrier', trackingCode: 'TRACK-1', trackingUrl: 'https://carrier.test/TRACK-1', note: 'Dispatched for test' }) }), { SUPABASE_URL: 'https://db.test', SUPABASE_ANON_KEY: 'anon', SUPABASE_SERVICE_ROLE_KEY: 'service' });
  assert.equal(response.status, 200);
  assert.equal(rpcBody.p_owner_id, '11111111-1111-4111-8111-111111111111');
  assert.equal(rpcBody.p_status, 'SHIPPING');
});

test('native registration stores only a derived verifier and returns an HttpOnly session', async (t) => {
  const bodies = [];
  t.mock.method(globalThis, 'fetch', async (url, init = {}) => {
    const value = String(url); const body = JSON.parse(init.body); bodies.push(body);
    if (value.includes('/rpc/melsou_register_native')) return new Response(JSON.stringify({ id: '11111111-1111-4111-8111-111111111111', username: 'new.user', role: 'CUSTOMER' }), { status: 200 });
    if (value.includes('/rpc/melsou_native_login_success')) return new Response(JSON.stringify({ session_id: 'session' }), { status: 200 });
    throw new Error(`Unexpected fetch ${value}`);
  });
  const response = await worker.fetch(new Request('https://melsou.test/api/auth/native/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'New.User', password: 'correct-horse-9' }) }), { APP_ENV: 'test', SUPABASE_URL: 'https://db.test', SUPABASE_SERVICE_ROLE_KEY: 'service' });
  assert.equal(response.status, 201); assert.match(response.headers.get('Set-Cookie'), /melsou_session_v1=.*HttpOnly.*SameSite=Lax.*Secure/);
  assert.equal(bodies.some((body) => Object.values(body).includes('correct-horse-9')), false);
  assert.match(bodies[0].p_password_hash, /^[0-9a-f]{64}$/); assert.match(bodies[0].p_password_salt, /^[0-9a-f]{32}$/);
});

test('native auth fails closed when its canonical database is not configured', async () => {
  const response = await worker.fetch(new Request('https://melsou.test/api/auth/native/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'native.user', password: 'correct-horse-9' })
  }), { APP_ENV: 'production' });
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: 'AUTH_NOT_CONFIGURED' });
});

test('recovery reports a clear state when a username has no linked verified email', async (t) => {
  t.mock.method(globalThis, 'fetch', async (url) => {
    if (String(url).includes('/profiles?')) return new Response(JSON.stringify([{ user_id: '11111111-1111-4111-8111-111111111111', username: 'no.email', email: null, email_verified_at: null }]), { status: 200 });
    throw new Error(`Unexpected fetch ${url}`);
  });
  const response = await worker.fetch(new Request('https://melsou.test/api/auth/recovery/request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'no.email' }) }), { APP_ENV: 'test', SUPABASE_URL: 'https://db.test', SUPABASE_SERVICE_ROLE_KEY: 'service' });
  assert.equal(response.status, 409); assert.deepEqual(await response.json(), { error: 'RECOVERY_EMAIL_REQUIRED' });
});

test('native session cookie authorizes account restore without exposing its raw token', async (t) => {
  const raw = 'a'.repeat(64);
  t.mock.method(globalThis, 'fetch', async (url, init = {}) => {
    const value = String(url);
    if (value.includes('/rpc/melsou_native_session_user')) { assert.notEqual(JSON.parse(init.body).p_token_hash, raw); return new Response(JSON.stringify({ id: '11111111-1111-4111-8111-111111111111', username: 'native.user', role: 'CUSTOMER', provider: 'NATIVE' }), { status: 200 }); }
    if (value.includes('/profiles?')) return new Response(JSON.stringify([{ user_id: '11111111-1111-4111-8111-111111111111', username: 'native.user', role: 'CUSTOMER' }]), { status: 200 });
    throw new Error(`Unexpected fetch ${value}`);
  });
  const response = await worker.fetch(new Request('https://melsou.test/api/account', { headers: { Cookie: `melsou_session_v1=${raw}` } }), { SUPABASE_URL: 'https://db.test', SUPABASE_SERVICE_ROLE_KEY: 'service' });
  assert.equal(response.status, 200); assert.equal((await response.json()).auth.provider, 'NATIVE');
});

test('voice upload validates bytes and persists a private draft reference', async (t) => {
  const projectId = '22222222-2222-4222-8222-222222222222'; let inserted; let storedKey;
  t.mock.method(globalThis, 'fetch', async (url, init = {}) => {
    const value = String(url);
    if (value.includes('/auth/v1/user')) return new Response(JSON.stringify({ id: '11111111-1111-4111-8111-111111111111' }), { status: 200 });
    if (value.includes('/projects?')) return new Response(JSON.stringify([{ id: projectId, revision: 3, document: {}, template_id: 'first-love', template_version: 1 }]), { status: 200 });
    if (value.includes('/voice_assets?')) return new Response('[]', { status: 200 });
    if (value.endsWith('/voice_assets')) { inserted = JSON.parse(init.body); return new Response(JSON.stringify([inserted]), { status: 201 }); }
    throw new Error(`Unexpected fetch ${value}`);
  });
  const data = Uint8Array.from([0x1a,0x45,0xdf,0xa3,0,0,0,0,0,0,0,0]);
  const response = await worker.fetch(new Request(`https://melsou.test/api/projects/${projectId}/voice-assets`, { method: 'POST', headers: { Authorization: 'Bearer user-token', 'Content-Type': 'audio/webm', 'X-Melsou-Voice-Duration-Ms': '1500' }, body: data }), { APP_ENV: 'test', SUPABASE_URL: 'https://db.test', SUPABASE_ANON_KEY: 'anon', SUPABASE_SERVICE_ROLE_KEY: 'service', VOICE_MAX_DURATION_SECONDS: '20', MELSOU_ASSETS: { async put(key) { storedKey = key; }, async delete() {} } });
  assert.equal(response.status, 201); assert.equal(inserted.status, 'DRAFT'); assert.equal(inserted.storage_key, storedKey); assert.match(storedKey, new RegExp(`^projects/${projectId}/voice/[0-9a-f-]{36}/original$`));
});
