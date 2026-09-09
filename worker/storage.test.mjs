import assert from 'node:assert/strict';
import test from 'node:test';
import { createSupabaseStorage, withPrivateStorage } from './storage.mjs';

test('Supabase storage keeps objects private and safely encodes keys', async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    return new Response('ok');
  };
  try {
    const storage = createSupabaseStorage({ SUPABASE_URL: 'https://example.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'secret', SUPABASE_STORAGE_BUCKET: 'melsou-assets' });
    await storage.put('users/not-pii/photo one.jpg', new Uint8Array([1, 2]), { httpMetadata: { contentType: 'image/jpeg' } });
    assert.equal(calls[0].url, 'https://example.supabase.co/storage/v1/object/melsou-assets/users/not-pii/photo%20one.jpg');
    assert.equal(calls[0].options.headers.Authorization, 'Bearer secret');
    assert.equal(calls[0].options.headers['x-upsert'], 'true');
    assert.equal(calls[0].options.headers['Cache-Control'], 'private, no-store');
  } finally { globalThis.fetch = originalFetch; }
});

test('existing test/R2-compatible binding remains preferred', () => {
  const binding = { get() {} };
  assert.equal(withPrivateStorage({ MELSOU_ASSETS: binding }).MELSOU_ASSETS, binding);
});
