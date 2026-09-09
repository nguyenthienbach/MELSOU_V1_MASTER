const MAX_IMAGE_EDGE = 12000;
const MAX_IMAGE_PIXELS = 100_000_000;
const PREVIEW_MAX_EDGE = 1600;
const PRINT_MAX_EDGE = 12000;
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
export const MAX_DRAFT_ASSETS = 40;
export const MAX_DRAFT_BYTES = 150 * 1024 * 1024;

export class AssetProcessingError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}

const bytesStream = (bytes) => new Response(bytes).body;

export function detectImageMime(bytes) {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes.length >= 8 && bytes.slice(0, 8).every((item, index) => item === [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a][index])) return 'image/png';
  if (bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP') return 'image/webp';
  if (bytes.length >= 12 && String.fromCharCode(...bytes.slice(4, 8)) === 'ftyp') {
    const brand = String.fromCharCode(...bytes.slice(8, 12)).toLowerCase();
    if (['heic', 'heix', 'hevc', 'hevx', 'mif1', 'msf1'].includes(brand)) return 'image/heic';
  }
  return null;
}

const mimeFromDecodedFormat = (format) => {
  const normalized = String(format || '').toLowerCase().replace('image/', '');
  if (normalized === 'jpeg' || normalized === 'jpg') return 'image/jpeg';
  if (normalized === 'png') return 'image/png';
  if (normalized === 'webp') return 'image/webp';
  if (normalized === 'heic' || normalized === 'heif') return 'image/heic';
  return null;
};

const normalizedDeclaredMime = (value) => {
  const mime = String(value || '').split(';', 1)[0].trim().toLowerCase();
  if (mime === 'image/jpeg' || mime === 'image/jpg') return 'image/jpeg';
  if (mime === 'image/png') return 'image/png';
  if (mime === 'image/webp') return 'image/webp';
  if (mime === 'image/heic' || mime === 'image/heif') return 'image/heic';
  return null;
};

export function assertUploadSize(byteLength, declaredLength = 0) {
  if (!Number.isSafeInteger(byteLength) || byteLength < 1 || byteLength > MAX_UPLOAD_BYTES || declaredLength > MAX_UPLOAD_BYTES) {
    throw new AssetProcessingError('ASSET_TOO_LARGE');
  }
}

export function assertDraftAssetQuota(existingAssets, incomingBytes) {
  const assets = Array.isArray(existingAssets) ? existingAssets : [];
  const used = assets.reduce((total, item) => total + Math.max(0, Number(item.file_size || 0)), 0);
  if (assets.length >= MAX_DRAFT_ASSETS || used + incomingBytes > MAX_DRAFT_BYTES) throw new AssetProcessingError('DRAFT_STORAGE_LIMIT_REACHED');
}

const safeDimensions = (info) => {
  const width = Number(info?.width);
  const height = Number(info?.height);
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) throw new AssetProcessingError('IMAGE_DECODE_INVALID_DIMENSIONS');
  if (width > MAX_IMAGE_EDGE || height > MAX_IMAGE_EDGE || width * height > MAX_IMAGE_PIXELS) throw new AssetProcessingError('IMAGE_DIMENSIONS_UNSAFE');
  return { width, height };
};

export async function inspectUploadedImage(bytes, images, declaredMime = null) {
  const headerMime = detectImageMime(new Uint8Array(bytes.slice(0, 32)));
  if (!headerMime) throw new AssetProcessingError('UNSUPPORTED_OR_SPOOFED_FILE');
  if (!images?.info) throw new AssetProcessingError('IMAGE_PROCESSOR_NOT_CONFIGURED');
  let info;
  try {
    info = await images.info(bytesStream(bytes));
  } catch {
    throw new AssetProcessingError('IMAGE_DECODE_FAILED');
  }
  const decodedMime = mimeFromDecodedFormat(info?.format);
  const declared = normalizedDeclaredMime(declaredMime);
  if (!decodedMime || decodedMime !== headerMime || (declared && declared !== headerMime)) {
    throw new AssetProcessingError('UNSUPPORTED_OR_SPOOFED_FILE');
  }
  return { mimeType: decodedMime, ...safeDimensions(info) };
}

async function outputBytes(images, bytes, transform, output) {
  let response;
  try {
    const operation = await images.input(bytesStream(bytes)).transform(transform).output(output);
    response = operation.response();
  } catch {
    throw new AssetProcessingError('IMAGE_DERIVATIVE_FAILED');
  }
  if (!response?.ok) throw new AssetProcessingError('IMAGE_DERIVATIVE_FAILED');
  return response.arrayBuffer();
}

export async function createPrivateDerivatives(bytes, images) {
  // Cloudflare Images decodes orientation before output. PNG and WebP outputs
  // discard all metadata, including EXIF/GPS, rather than preserving it.
  const [normalizedBytes, previewBytes] = await Promise.all([
    outputBytes(images, bytes, { fit: 'scale-down', width: PRINT_MAX_EDGE, height: PRINT_MAX_EDGE }, { format: 'image/png', anim: false }),
    outputBytes(images, bytes, { fit: 'scale-down', width: PREVIEW_MAX_EDGE, height: PREVIEW_MAX_EDGE }, { format: 'image/webp', quality: 80, anim: false })
  ]);
  const [normalized, preview] = await Promise.all([
    inspectUploadedImage(normalizedBytes, images, 'image/png'),
    inspectUploadedImage(previewBytes, images, 'image/webp')
  ]);
  if (normalized.mimeType !== 'image/png' || preview.mimeType !== 'image/webp') throw new AssetProcessingError('IMAGE_DERIVATIVE_FORMAT_INVALID');
  return { normalized: { bytes: normalizedBytes, ...normalized }, preview: { bytes: previewBytes, ...preview } };
}

const sha256 = async (bytes) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map((item) => item.toString(16).padStart(2, '0')).join('');

export function derivativeKeys(asset) {
  const prefix = String(asset.storage_key || '').replace(/\/original$/, '');
  if (!prefix || !/^projects\/[0-9a-f-]{36}\/assets\/[0-9a-f-]{36}$/i.test(prefix)) throw new AssetProcessingError('ASSET_STORAGE_KEY_INVALID');
  return { normalizedKey: `${prefix}/normalized.png`, previewKey: `${prefix}/preview.webp` };
}

export async function processAssetDerivatives({ asset, originalBytes, env }) {
  if (asset.processing_state === 'READY') return { duplicate: true };
  const source = await inspectUploadedImage(originalBytes, env.IMAGES, asset.mime_type);
  const derivatives = await createPrivateDerivatives(originalBytes, env.IMAGES);
  const { normalizedKey, previewKey } = derivativeKeys(asset);
  // The generated bytes exist before any R2 write. Keys are deterministic, so
  // a retry overwrites an uncommitted partial attempt instead of creating copies.
  await env.MELSOU_ASSETS.put(normalizedKey, derivatives.normalized.bytes, { httpMetadata: { contentType: 'image/png', cacheControl: 'private, no-store' } });
  await env.MELSOU_ASSETS.put(previewKey, derivatives.preview.bytes, { httpMetadata: { contentType: 'image/webp', cacheControl: 'private, no-store' } });
  return {
    source,
    normalizedKey,
    previewKey,
    normalized: { mimeType: 'image/png', width: derivatives.normalized.width, height: derivatives.normalized.height, checksum: await sha256(derivatives.normalized.bytes) },
    preview: { mimeType: 'image/webp', width: derivatives.preview.width, height: derivatives.preview.height, checksum: await sha256(derivatives.preview.bytes) }
  };
}

const dbHeaders = (env) => ({ apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json' });
const safeErrorCode = (error) => String(error?.code || 'ASSET_PROCESSING_FAILED').replace(/[^A-Z0-9_:-]/gi, '_').slice(0, 120);

async function rpc(env, name, body) {
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/${name}`, { method: 'POST', headers: dbHeaders(env), body: JSON.stringify(body) });
  if (!response.ok) throw new AssetProcessingError('ASSET_PROCESSING_STATE_UNAVAILABLE');
  return response.json();
}

export async function processAssetJobs(env, limit = 3, requestedAssetId = null) {
  if (!env.MELSOU_ASSETS || !env.IMAGES || !env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return;
  for (let index = 0; index < limit; index += 1) {
    const asset = await rpc(env, 'melsou_claim_asset_processing', { p_asset_id: requestedAssetId });
    if (!asset) return;
    try {
      const object = await env.MELSOU_ASSETS.get(asset.storage_key);
      if (!object) throw new AssetProcessingError('ASSET_ORIGINAL_MISSING');
      const result = await processAssetDerivatives({ asset, originalBytes: await object.arrayBuffer(), env });
      if (!result.duplicate) {
        await rpc(env, 'melsou_complete_asset_processing', {
          p_asset_id: asset.id, p_source_width_px: result.source.width, p_source_height_px: result.source.height,
          p_normalized_key: result.normalizedKey, p_normalized_mime_type: result.normalized.mimeType,
          p_normalized_width_px: result.normalized.width, p_normalized_height_px: result.normalized.height, p_normalized_checksum: result.normalized.checksum,
          p_preview_key: result.previewKey, p_preview_mime_type: result.preview.mimeType,
          p_preview_width_px: result.preview.width, p_preview_height_px: result.preview.height, p_preview_checksum: result.preview.checksum
        });
      }
    } catch (error) {
      await rpc(env, 'melsou_fail_asset_processing', { p_asset_id: asset.id, p_error_code: safeErrorCode(error) });
    }
    if (requestedAssetId) return;
  }
}
