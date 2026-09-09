import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assertCartConfiguration, assertCheckpointReason, assertIdempotencyKey, assertProjectDocument,
  buildPaymentInstructions, normalizeBlogSlug, normalizeTrackingPhone, sanitizeAccountPatch, sanitizeAddress, sanitizeBlogPost, sanitizeShipments
} from './backend-contracts.mjs';

const document = () => ({
  template: { template_id: 'first-love', version: 1 },
  configuration: { size: 'A5_PORTRAIT', pages: 12 },
  content_bindings: { image_01: { asset_id: '11111111-1111-4111-8111-111111111111' } },
  options: { spotify_enabled: true, spotify_url: 'https://open.spotify.com/track/abc123' }
});

test('project document preserves structured content and rejects embedded binary', () => {
  assert.equal(assertProjectDocument(document()).template.template_id, 'first-love');
  assert.throws(() => assertProjectDocument({ ...document(), preview: 'data:image/png;base64,AAAA' }), { message: 'EMBEDDED_BINARY_NOT_ALLOWED' });
  assert.throws(() => assertProjectDocument({ ...document(), options: { spotify_enabled: true, spotify_url: 'https://evil.example/track/abc' } }), { message: 'INVALID_SPOTIFY_SELECTION' });
  assert.equal(assertProjectDocument({ ...document(), voice: { mode: 'RECORD_AT_HOME', asset_id: null } }).voice.mode, 'RECORD_AT_HOME');
  assert.throws(() => assertProjectDocument({ ...document(), voice: { mode: 'RECORD_ON_WEB', asset_id: 'not-an-id' } }), { message: 'INVALID_VOICE_SELECTION' });
});

test('checkpoint, idempotency and cart contracts are explicit', () => {
  assert.equal(assertCheckpointReason('PREVIEW'), 'PREVIEW');
  assert.throws(() => assertCheckpointReason('AUTOSAVE'), { message: 'INVALID_CHECKPOINT_REASON' });
  assert.equal(assertIdempotencyKey('checkout_1234567890'), 'checkout_1234567890');
  assert.throws(() => assertIdempotencyKey('short'), { message: 'IDEMPOTENCY_KEY_REQUIRED' });
  assert.deepEqual(assertCartConfiguration({ packageCode: 'VOICE', size: 'SQUARE', pages: 16, twin: true, shipments: 2 }), { packageCode: 'VOICE', size: 'SQUARE', pages: 16, twin: true, shipments: 2 });
});

test('account updates cannot change role or arbitrary preferences', () => {
  assert.deepEqual(sanitizeAccountPatch({ displayName: 'Melsou User', notifications: { orderUpdates: true, marketing: false }, role: 'OWNER' }), {
    display_name: 'Melsou User', notification_preferences: { orderUpdates: true, marketing: false }
  });
  assert.throws(() => sanitizeAccountPatch({ notifications: { admin: true } }), { message: 'INVALID_NOTIFICATION_PREFERENCES' });
});

test('blog input is normalized and bounded', () => {
  assert.equal(normalizeBlogSlug('Kỷ niệm Đầu Tiên'), 'ky-niem-dau-tien');
  assert.deepEqual(sanitizeBlogPost({ title: 'A story', content: 'Safe text', tags: ['memory'] }), {
    title: 'A story', content: 'Safe text', slug: 'a-story', status: 'DRAFT', tags: ['memory']
  });
  assert.throws(() => sanitizeBlogPost({ title: '', content: '' }), { message: 'INVALID_BLOG_TITLE' });
});

test('tracking verification and SePay QR instructions are server-derived', () => {
  assert.equal(normalizeTrackingPhone('+84 912-345-678'), '84912345678');
  const payment = buildPaymentInstructions({ expected_amount_vnd: 189000, payment_code: 'MELM-2609-001', payment_expires_at: '2026-09-08T01:00:00Z' }, {
    SEPAY_MODE: 'TEST', SEPAY_BANK_ACCOUNT: '123456789', SEPAY_BANK_CODE: 'VCB', SEPAY_ACCOUNT_NAME: 'MELSOU'
  });
  assert.equal(payment.mode, 'TEST');
  assert.match(payment.qrImageUrl, /^https:\/\/vietqr\.app\/img\?/);
  assert.equal(new URL(payment.qrImageUrl).searchParams.get('amount'), '189000');
  assert.throws(() => buildPaymentInstructions({ expected_amount_vnd: 1, payment_code: 'x' }, { SEPAY_BANK_ACCOUNT: '1', SEPAY_BANK_CODE: 'VCB' }), { message: 'PAYMENT_MODE_NOT_CONFIGURED' });
});

test('shipment snapshots require real bounded recipient data', () => {
  assert.deepEqual(sanitizeShipments([{ recipient: 'Customer', phone: '0912 345 678', address: 'Synthetic test address' }]), [{ recipient: 'Customer', phone: '0912 345 678', address: 'Synthetic test address' }]);
  assert.throws(() => sanitizeShipments([{ recipient: '', phone: '123', address: '' }]), /INVALID_SHIPMENTS/);
  assert.throws(() => sanitizeShipments([{ recipient: 'Customer', phone: 'call-me-0912345678', address: 'Synthetic test address' }]), /INVALID_SHIPMENTS/);
});

test('customer address input is bounded and cannot carry arbitrary fields', () => {
  assert.deepEqual(sanitizeAddress({ label: 'Nhà', recipient: 'Customer', phone: '0912 345 678', address: 'Synthetic test address', isDefault: true, role: 'OWNER' }), {
    label: 'Nhà', recipient: 'Customer', phone: '0912 345 678', address: 'Synthetic test address', is_default: true
  });
  assert.deepEqual(sanitizeAddress({ label: 'Văn phòng' }, { partial: true }), { label: 'Văn phòng' });
  assert.throws(() => sanitizeAddress({ label: '', recipient: '', phone: '123', address: '' }), /INVALID_ADDRESS/);
});
