import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  AssetProcessingError,
  MAX_DRAFT_ASSETS,
  MAX_DRAFT_BYTES,
  MAX_UPLOAD_BYTES,
  assertDraftAssetQuota,
  assertUploadSize,
  createPrivateDerivatives,
  detectImageMime,
  inspectUploadedImage,
  processAssetDerivatives,
  processAssetJobs
} from './image-processing.mjs';
import worker from './index.mjs';

const encoder = new TextEncoder();
const join = (...parts) => {
  const arrays = parts.map((part) => typeof part === 'string' ? encoder.encode(part) : Uint8Array.from(part));
  const result = new Uint8Array(arrays.reduce((total, part) => total + part.length, 0));
  let offset = 0;
  for (const part of arrays) { result.set(part, offset); offset += part.length; }
  return result;
};
const jpeg = (suffix = '') => join([0xff, 0xd8, 0xff, 0xe1], suffix);
const png = (suffix = '') => join([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], suffix);
const webp = (suffix = '') => join('RIFF', [0x10, 0, 0, 0], 'WEBP', suffix);
const heic = (suffix = '') => join([0, 0, 0, 20], 'ftyp', 'heic', suffix);
const textOf = (bytes) => new TextDecoder().decode(bytes);
const asBuffer = (bytes) => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);

class FakeImages {
  constructor({ width = 2400, height = 1600, orientation = 1, failDecode = false, failOutput = false, decodedFormat = null } = {}) {
    Object.assign(this, { width, height, orientation, failDecode, failOutput, decodedFormat });
    this.outputs = [];
  }

  async info(stream) {
    const bytes = new Uint8Array(await new Response(stream).arrayBuffer());
    if (this.failDecode || textOf(bytes).includes('CORRUPT')) throw new Error('decoder rejected input');
    const mime = detectImageMime(bytes);
    if (!mime) throw new Error('unknown image');
    const generated = textOf(bytes).includes('MELSOU_SANITIZED');
    const oriented = generated && [5, 6, 7, 8].includes(this.orientation);
    return {
      format: this.decodedFormat || mime.replace('image/', ''),
      width: oriented ? this.height : this.width,
      height: oriented ? this.width : this.height
    };
  }

  input(stream) {
    const images = this;
    const transforms = [];
    return {
      transform(options) { transforms.push(options); return this; },
      async output(options) {
        await new Response(stream).arrayBuffer();
        if (images.failOutput) throw new Error('transform failed');
        images.outputs.push({ transforms, options });
        const bytes = options.format === 'image/png' ? png('MELSOU_SANITIZED') : webp('MELSOU_SANITIZED');
        return { response: () => new Response(bytes, { status: 200, headers: { 'Content-Type': options.format } }) };
      }
    };
  }
}

const expectCode = async (promise, code) => assert.rejects(promise, (error) => error instanceof AssetProcessingError && error.code === code);

test('valid JPEG, PNG, WebP and HEIC are identified by bytes and decoded', async () => {
  for (const [bytes, mime] of [[jpeg(), 'image/jpeg'], [png(), 'image/png'], [webp(), 'image/webp'], [heic(), 'image/heic']]) {
    assert.equal(detectImageMime(bytes), mime);
    assert.deepEqual(await inspectUploadedImage(asBuffer(bytes), new FakeImages(), mime), { mimeType: mime, width: 2400, height: 1600 });
  }
});

test('fake MIME, invalid magic bytes and corrupted images are rejected', async () => {
  await expectCode(inspectUploadedImage(asBuffer(png()), new FakeImages(), 'image/jpeg'), 'UNSUPPORTED_OR_SPOOFED_FILE');
  await expectCode(inspectUploadedImage(asBuffer(encoder.encode('<svg>not allowed</svg>')), new FakeImages()), 'UNSUPPORTED_OR_SPOOFED_FILE');
  await expectCode(inspectUploadedImage(asBuffer(jpeg('CORRUPT')), new FakeImages()), 'IMAGE_DECODE_FAILED');
  await expectCode(inspectUploadedImage(asBuffer(jpeg()), new FakeImages({ decodedFormat: 'png' })), 'UNSUPPORTED_OR_SPOOFED_FILE');
});

test('derivatives are raster, scale-down only and contain no EXIF/GPS payload', async () => {
  const images = new FakeImages();
  const source = jpeg('EXIF GPSLatitude=10.000 GPSLongitude=106.000 private-camera-data');
  const result = await createPrivateDerivatives(asBuffer(source), images);
  assert.equal(result.normalized.mimeType, 'image/png');
  assert.equal(result.preview.mimeType, 'image/webp');
  assert.equal(textOf(new Uint8Array(result.normalized.bytes)).includes('GPS'), false);
  assert.equal(textOf(new Uint8Array(result.preview.bytes)).includes('EXIF'), false);
  assert.deepEqual(images.outputs.map((item) => item.options.format), ['image/png', 'image/webp']);
  assert.ok(images.outputs.every((item) => item.transforms[0].fit === 'scale-down'));
});

test('decoded EXIF orientation is preserved in metadata-free derivative dimensions', async () => {
  const images = new FakeImages({ width: 4000, height: 3000, orientation: 6 });
  const result = await createPrivateDerivatives(asBuffer(jpeg('EXIF_ORIENTATION=6')), images);
  assert.equal(result.normalized.width, 3000);
  assert.equal(result.normalized.height, 4000);
  assert.equal(textOf(new Uint8Array(result.normalized.bytes)).includes('ORIENTATION'), false);
});

test('ready asset processing is idempotent and creates no duplicate R2 objects', async () => {
  let puts = 0;
  const result = await processAssetDerivatives({
    asset: { processing_state: 'READY' }, originalBytes: asBuffer(png()),
    env: { IMAGES: new FakeImages(), MELSOU_ASSETS: { async put() { puts += 1; } } }
  });
  assert.deepEqual(result, { duplicate: true });
  assert.equal(puts, 0);
});

test('processing persists deterministic private derivative metadata', async () => {
  const writes = [];
  const asset = { id: '22222222-2222-4222-8222-222222222222', project_id: '11111111-1111-4111-8111-111111111111', storage_key: 'projects/11111111-1111-4111-8111-111111111111/assets/22222222-2222-4222-8222-222222222222/original', mime_type: 'image/webp', processing_state: 'PROCESSING' };
  const result = await processAssetDerivatives({ asset, originalBytes: asBuffer(webp()), env: { IMAGES: new FakeImages(), MELSOU_ASSETS: { async put(key, _bytes, options) { writes.push({ key, options }); } } } });
  assert.equal(result.normalizedKey, `${asset.storage_key.replace('/original', '')}/normalized.png`);
  assert.equal(result.previewKey, `${asset.storage_key.replace('/original', '')}/preview.webp`);
  assert.match(result.normalized.checksum, /^[a-f0-9]{64}$/);
  assert.equal(result.normalized.width, 2400);
  assert.equal(result.normalized.height, 1600);
  assert.equal(writes.length, 2);
  assert.ok(writes.every((write) => write.options.httpMetadata.cacheControl === 'private, no-store'));
});

test('processing failure leaves the original untouched and records retryable failure', async (t) => {
  const originalKey = 'projects/11111111-1111-4111-8111-111111111111/assets/22222222-2222-4222-8222-222222222222/original';
  const objects = new Map([[originalKey, asBuffer(jpeg())]]);
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    const name = String(url).split('/').at(-1);
    calls.push({ name, body: JSON.parse(init.body) });
    if (name === 'melsou_claim_asset_processing') return new Response(JSON.stringify({ id: '22222222-2222-4222-8222-222222222222', project_id: '11111111-1111-4111-8111-111111111111', storage_key: originalKey, mime_type: 'image/jpeg', processing_state: 'PROCESSING' }));
    return new Response(JSON.stringify({ status: 'FAILED' }));
  });
  const r2 = { async get(key) { return { arrayBuffer: async () => objects.get(key) }; }, async put(key, value) { objects.set(key, value); } };
  await processAssetJobs({ SUPABASE_URL: 'https://db.test', SUPABASE_SERVICE_ROLE_KEY: 'service', MELSOU_ASSETS: r2, IMAGES: new FakeImages({ failOutput: true }) }, 1, '22222222-2222-4222-8222-222222222222');
  assert.ok(objects.has(originalKey));
  assert.equal(objects.size, 1);
  assert.equal(calls.at(-1).name, 'melsou_fail_asset_processing');
  assert.equal(calls.at(-1).body.p_error_code, 'IMAGE_DERIVATIVE_FAILED');
});

test('upload size, asset count and total-byte quota remain enforced', () => {
  assert.doesNotThrow(() => assertUploadSize(MAX_UPLOAD_BYTES, MAX_UPLOAD_BYTES));
  assert.throws(() => assertUploadSize(MAX_UPLOAD_BYTES + 1), /ASSET_TOO_LARGE/);
  assert.throws(() => assertUploadSize(0), /ASSET_TOO_LARGE/);
  assert.doesNotThrow(() => assertDraftAssetQuota([{ file_size: 1 }], 1));
  assert.throws(() => assertDraftAssetQuota(Array.from({ length: MAX_DRAFT_ASSETS }, () => ({ file_size: 1 })), 1), /DRAFT_STORAGE_LIMIT_REACHED/);
  assert.throws(() => assertDraftAssetQuota([{ file_size: MAX_DRAFT_BYTES }], 1), /DRAFT_STORAGE_LIMIT_REACHED/);
});

test('database queue has explicit state, bounded retry and stale-lease recovery', async () => {
  const sql = await readFile(new URL('../supabase/migrations/202609010001_asset_processing.sql', import.meta.url), 'utf8');
  assert.match(sql, /processing_state text not null default 'PENDING'/);
  assert.match(sql, /processing_retry_count < 5/);
  assert.match(sql, /processing_started_at < now\(\) - interval '15 minutes'/);
  assert.match(sql, /processing_last_error/);
});

test('authenticated upload decodes before storing a private original and queues processing', async (t) => {
  const projectId = '11111111-1111-4111-8111-111111111111';
  const stored = [];
  let inserted;
  let background;
  t.mock.method(globalThis, 'fetch', async (url, init = {}) => {
    const target = String(url);
    if (target.includes('/auth/v1/user')) return new Response(JSON.stringify({ id: 'user-1' }));
    if (target.includes('/rest/v1/projects?')) return new Response(JSON.stringify([{ id: projectId, owner_user_id: 'user-1' }]));
    if (target.includes('/rest/v1/project_assets?project_id=')) return new Response('[]');
    if (target.endsWith('/rest/v1/project_assets')) {
      inserted = JSON.parse(init.body);
      return new Response(JSON.stringify([inserted]), { status: 201 });
    }
    if (target.endsWith('/rpc/melsou_claim_asset_processing')) return new Response('null');
    throw new Error(`unexpected fetch: ${target}`);
  });
  const env = {
    SUPABASE_URL: 'https://db.test', SUPABASE_SERVICE_ROLE_KEY: 'service', SUPABASE_ANON_KEY: 'anon', IMAGES: new FakeImages(),
    MELSOU_ASSETS: { async put(key, _value, options) { stored.push({ key, options }); }, async delete() { throw new Error('original must not be deleted'); } }
  };
  const response = await worker.fetch(new Request(`https://melsou.test/api/projects/${projectId}/assets`, {
    method: 'POST', headers: { Authorization: 'Bearer user-token', 'Content-Type': 'image/png' }, body: png()
  }), env, { waitUntil(promise) { background = promise; } });
  await background;
  assert.equal(response.status, 201);
  assert.equal(inserted.processing_state, 'PENDING');
  assert.equal(inserted.status, 'ORIGINAL_ONLY');
  assert.equal(inserted.mime_type, 'image/png');
  assert.equal(inserted.width_px, 2400);
  assert.equal(inserted.height_px, 1600);
  assert.equal(stored.length, 1);
  assert.match(stored[0].key, new RegExp(`^projects/${projectId}/assets/[0-9a-f-]{36}/original$`, 'i'));
  assert.equal(stored[0].options.httpMetadata.cacheControl, 'private, no-store');
});

test('preview endpoint remains authenticated and serves only the private derivative', async (t) => {
  const assetId = '22222222-2222-4222-8222-222222222222';
  const preview = webp('MELSOU_SANITIZED');
  t.mock.method(globalThis, 'fetch', async (url) => {
    const target = String(url);
    if (target.includes('/auth/v1/user')) return new Response(JSON.stringify({ id: 'user-1' }));
    if (target.includes('/rest/v1/project_assets?')) return new Response(JSON.stringify([{ id: assetId, preview_key: `projects/p/assets/${assetId}/preview.webp`, preview_mime_type: 'image/webp', processing_state: 'READY', project: { owner_user_id: 'user-1' } }]));
    throw new Error(`unexpected fetch: ${target}`);
  });
  const env = { SUPABASE_URL: 'https://db.test', SUPABASE_SERVICE_ROLE_KEY: 'service', SUPABASE_ANON_KEY: 'anon', MELSOU_ASSETS: { async get() { return { body: preview }; } } };
  const unauthenticated = await worker.fetch(new Request(`https://melsou.test/api/assets/${assetId}/preview`), env);
  assert.equal(unauthenticated.status, 401);
  const response = await worker.fetch(new Request(`https://melsou.test/api/assets/${assetId}/preview`, { headers: { Authorization: 'Bearer user-token' } }), env);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Content-Type'), 'image/webp');
  assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
});
