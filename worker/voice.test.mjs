import assert from 'node:assert/strict';
import test from 'node:test';
import { inspectVoiceBytes, processVoiceCleanupJobs } from './voice.mjs';

const bytes = (...values) => Uint8Array.from(values).buffer;

test('voice upload validates container magic, MIME, size and configured duration', () => {
  assert.equal(inspectVoiceBytes(bytes(0x1a,0x45,0xdf,0xa3,0,0,0,0,0,0,0,0), 'audio/webm', 1500, { maxBytes: 1024, maxDurationSeconds: 20 }).mimeType, 'audio/webm');
  assert.equal(inspectVoiceBytes(bytes(0x4f,0x67,0x67,0x53,0,0,0,0,0,0,0,0), 'audio/ogg', 1500, { maxBytes: 1024, maxDurationSeconds: 20 }).mimeType, 'audio/ogg');
  assert.equal(inspectVoiceBytes(bytes(0x52,0x49,0x46,0x46,0,0,0,0,0x57,0x41,0x56,0x45), 'audio/wav', 1500, { maxBytes: 1024, maxDurationSeconds: 20 }).mimeType, 'audio/wav');
  assert.throws(() => inspectVoiceBytes(bytes(0x50,0x4b,0x03,0x04,0,0,0,0,0,0,0,0), 'audio/webm', 1500, { maxBytes: 1024, maxDurationSeconds: 20 }), { message: 'VOICE_INVALID_CONTAINER' });
  assert.throws(() => inspectVoiceBytes(bytes(0x1a,0x45,0xdf,0xa3,0,0,0,0,0,0,0,0), 'audio/ogg', 1500, { maxBytes: 1024, maxDurationSeconds: 20 }), { message: 'VOICE_MIME_MISMATCH' });
  assert.throws(() => inspectVoiceBytes(bytes(0x1a,0x45,0xdf,0xa3,0,0,0,0,0,0,0,0), 'audio/webm', 1500, { maxBytes: 1024 }), { message: 'VOICE_DURATION_NOT_CONFIGURED' });
});

test('voice cleanup retains immutable order assets and completes idempotently', async (t) => {
  let claims = 0; let deleted = 0; let retained;
  t.mock.method(globalThis, 'fetch', async (url, init = {}) => {
    const value = String(url);
    if (value.endsWith('/rpc/melsou_enqueue_stale_voice_drafts')) return new Response('0', { status: 200 });
    if (value.endsWith('/rpc/melsou_claim_voice_cleanup')) return new Response(claims++ === 0 ? JSON.stringify({ id: 'job', voice_asset_id: 'asset' }) : 'null', { status: 200 });
    if (value.includes('/voice_assets?')) return new Response(JSON.stringify([{ id: 'asset', storage_key: 'projects/p/voice/a/original' }]), { status: 200 });
    if (value.includes('/order_voice_selections?')) return new Response(JSON.stringify([{ order_id: 'order' }]), { status: 200 });
    if (value.endsWith('/rpc/melsou_complete_voice_cleanup')) { retained = JSON.parse(init.body).p_retained; return new Response('{}', { status: 200 }); }
    throw new Error(`Unexpected fetch ${value}`);
  });
  assert.deepEqual(await processVoiceCleanupJobs({ SUPABASE_URL: 'https://db.test', SUPABASE_SERVICE_ROLE_KEY: 'service', MELSOU_ASSETS: { async delete() { deleted += 1; } } }), { processed: 1 });
  assert.equal(retained, true); assert.equal(deleted, 0);
});
