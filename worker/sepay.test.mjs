import test from 'node:test';
import assert from 'node:assert/strict';
import { verifySePaySignature } from './index.mjs';

async function signature(secret, rawBody, timestamp) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const bytes = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${timestamp}.${rawBody}`)));
  return `sha256=${[...bytes].map((item) => item.toString(16).padStart(2, '0')).join('')}`;
}
test('accepts a correctly signed SePay raw payload', async () => {
  const rawBody = '{"id":92704,"transferAmount":289000}'; const timestamp = 1700000000; const secret = 'test-secret';
  assert.equal(await verifySePaySignature({ secret, rawBody, timestamp, nowSeconds: timestamp, signature: await signature(secret, rawBody, timestamp) }), true);
});
test('rejects altered body and replayed timestamp', async () => {
  const timestamp = 1700000000; const secret = 'test-secret'; const rawBody = '{"id":1}'; const valid = await signature(secret, rawBody, timestamp);
  assert.equal(await verifySePaySignature({ secret, rawBody: '{"id":2}', timestamp, nowSeconds: timestamp, signature: valid }), false);
  assert.equal(await verifySePaySignature({ secret, rawBody, timestamp, nowSeconds: timestamp + 301, signature: valid }), false);
});
