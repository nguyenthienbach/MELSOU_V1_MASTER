export const TEMPLATE_IDS = Object.freeze([
  'first-love', 'our-graduation', 'besties-archive', 'somewhere-together',
  'birthday-letters', 'quiet-moments', 'memory-box', 'melsou-editorial'
]);
export const PACKAGE_CODES = Object.freeze(['MELODY', 'VOICE', 'SIGNATURE']);
export const CHECKPOINT_REASONS = Object.freeze(['STEP_CHANGE', 'PREVIEW', 'DESIGN_LOCK']);
const templateIds = new Set(TEMPLATE_IDS);
const packageCodes = new Set(PACKAGE_CODES);
const checkpointReasons = new Set(CHECKPOINT_REASONS);
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class ContractError extends Error {
  constructor(code, status = 400) {
    super(code);
    this.code = code;
    this.status = status;
  }
}

export function assertUuid(value, code = 'INVALID_ID') {
  const normalized = String(value || '');
  if (!uuidPattern.test(normalized)) throw new ContractError(code);
  return normalized;
}

function rejectEmbeddedBinary(value, depth = 0) {
  if (depth > 40) throw new ContractError('PROJECT_DOCUMENT_TOO_DEEP');
  if (typeof value === 'string') {
    if (/^(data:(?:image|audio|video|application\/octet-stream)|blob:)/i.test(value.trim())) {
      throw new ContractError('EMBEDDED_BINARY_NOT_ALLOWED');
    }
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) rejectEmbeddedBinary(item, depth + 1);
    return;
  }
  if (value && typeof value === 'object') {
    for (const item of Object.values(value)) rejectEmbeddedBinary(item, depth + 1);
  }
}

function validateSpotify(document) {
  const enabled = document?.options?.spotify_enabled;
  const url = document?.options?.spotify_url;
  if (!enabled && (url === null || url === undefined || url === '')) return;
  if (enabled !== true || typeof url !== 'string') throw new ContractError('INVALID_SPOTIFY_SELECTION');
  let parsed;
  try { parsed = new URL(url); } catch { throw new ContractError('INVALID_SPOTIFY_SELECTION'); }
  if (parsed.protocol !== 'https:' || parsed.hostname !== 'open.spotify.com' || !/^\/(track|album|playlist)\/[A-Za-z0-9]+\/?$/.test(parsed.pathname)) {
    throw new ContractError('INVALID_SPOTIFY_SELECTION');
  }
}

function validateVoice(document) {
  const voice = document?.voice;
  if (voice === undefined || voice === null) return;
  if (!voice || typeof voice !== 'object' || Array.isArray(voice) || !['RECORD_ON_WEB','RECORD_AT_HOME'].includes(voice.mode)) throw new ContractError('INVALID_VOICE_SELECTION');
  if (voice.mode === 'RECORD_ON_WEB') assertUuid(voice.asset_id, 'INVALID_VOICE_SELECTION');
  if (voice.mode === 'RECORD_AT_HOME' && voice.asset_id !== null && voice.asset_id !== undefined) throw new ContractError('INVALID_VOICE_SELECTION');
}

export function assertProjectDocument(document) {
  if (!document || typeof document !== 'object' || Array.isArray(document)) throw new ContractError('INVALID_PROJECT_DOCUMENT');
  const templateId = document?.template?.template_id || document?.template_id;
  if (!templateIds.has(templateId)) throw new ContractError('INVALID_PROJECT_DOCUMENT');
  const serialized = JSON.stringify(document);
  if (serialized.length > 2 * 1024 * 1024) throw new ContractError('PROJECT_DOCUMENT_TOO_LARGE', 413);
  rejectEmbeddedBinary(document);
  validateSpotify(document);
  validateVoice(document);
  return document;
}

export function assertCheckpointReason(value) {
  const reason = String(value || '');
  if (!checkpointReasons.has(reason)) throw new ContractError('INVALID_CHECKPOINT_REASON');
  return reason;
}

export function assertIdempotencyKey(value) {
  const key = String(value || '').trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{15,127}$/.test(key)) throw new ContractError('IDEMPOTENCY_KEY_REQUIRED');
  return key;
}

export function assertCartConfiguration(input) {
  if (!input || typeof input !== 'object' || !packageCodes.has(input.packageCode)) throw new ContractError('INVALID_CART_CONFIGURATION');
  if (!['A5_PORTRAIT', 'SQUARE', 'A6', 'A5_LANDSCAPE'].includes(input.size)) throw new ContractError('INVALID_CART_CONFIGURATION');
  if (![12, 16, 24].includes(Number(input.pages))) throw new ContractError('INVALID_CART_CONFIGURATION');
  if (typeof input.twin !== 'boolean' || ![1, 2].includes(Number(input.shipments)) || (!input.twin && Number(input.shipments) !== 1)) {
    throw new ContractError('INVALID_CART_CONFIGURATION');
  }
  return { packageCode: input.packageCode, size: input.size, pages: Number(input.pages), twin: input.twin, shipments: Number(input.shipments) };
}

const notificationKeys = new Set(['orderUpdates', 'paymentUpdates', 'productionUpdates', 'marketing']);
export function sanitizeAccountPatch(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new ContractError('INVALID_ACCOUNT_UPDATE');
  const result = {};
  if (Object.hasOwn(input, 'displayName')) {
    const displayName = String(input.displayName || '').trim();
    if (displayName.length < 1 || displayName.length > 120) throw new ContractError('INVALID_DISPLAY_NAME');
    result.display_name = displayName;
  }
  if (Object.hasOwn(input, 'notifications')) {
    if (!input.notifications || typeof input.notifications !== 'object' || Array.isArray(input.notifications)) throw new ContractError('INVALID_NOTIFICATION_PREFERENCES');
    const notifications = {};
    for (const [key, value] of Object.entries(input.notifications)) {
      if (!notificationKeys.has(key) || typeof value !== 'boolean') throw new ContractError('INVALID_NOTIFICATION_PREFERENCES');
      notifications[key] = value;
    }
    result.notification_preferences = notifications;
  }
  if (!Object.keys(result).length) throw new ContractError('EMPTY_ACCOUNT_UPDATE');
  return result;
}

function cleanText(value, field, maximum, required) {
  if (value === undefined && !required) return undefined;
  const text = String(value || '').trim();
  if ((required && !text) || text.length > maximum) throw new ContractError(`INVALID_BLOG_${field.toUpperCase()}`);
  return text;
}

export function normalizeBlogSlug(value) {
  const slug = String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 120);
  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new ContractError('INVALID_BLOG_SLUG');
  return slug;
}

export function sanitizeBlogPost(input, { partial = false } = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new ContractError('INVALID_BLOG_POST');
  const result = {};
  const required = !partial;
  const title = cleanText(input.title, 'title', 180, required);
  const excerpt = cleanText(input.excerpt, 'excerpt', 500, false);
  const content = cleanText(input.content, 'content', 100000, required);
  if (title !== undefined) result.title = title;
  if (excerpt !== undefined) result.excerpt = excerpt;
  if (content !== undefined) result.content = content;
  if (input.slug !== undefined || (required && title)) result.slug = normalizeBlogSlug(input.slug || title);
  if (input.status !== undefined) {
    if (!['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(input.status)) throw new ContractError('INVALID_BLOG_STATUS');
    result.status = input.status;
  } else if (required) result.status = 'DRAFT';
  if (input.coverAssetId !== undefined) result.cover_asset_id = input.coverAssetId === null ? null : assertUuid(input.coverAssetId, 'INVALID_BLOG_COVER_ASSET');
  if (input.category !== undefined) result.category = cleanText(input.category, 'category', 80, false) || null;
  if (input.tags !== undefined) {
    if (!Array.isArray(input.tags) || input.tags.length > 12) throw new ContractError('INVALID_BLOG_TAGS');
    result.tags = input.tags.map((tag) => cleanText(tag, 'tag', 40, true));
  }
  if (!Object.keys(result).length) throw new ContractError('EMPTY_BLOG_UPDATE');
  return result;
}

export function normalizeTrackingPhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length < 9 || digits.length > 15) throw new ContractError('INVALID_TRACKING_VERIFICATION');
  return digits;
}

export function sanitizeShipments(value) {
  if (!Array.isArray(value) || ![1, 2].includes(value.length)) throw new ContractError('INVALID_SHIPMENTS');
  return value.map((shipment) => {
    if (!shipment || typeof shipment !== 'object' || Array.isArray(shipment)) throw new ContractError('INVALID_SHIPMENTS');
    const recipient = String(shipment.recipient || '').trim();
    const phone = String(shipment.phone || '').trim();
    const address = String(shipment.address || '').trim();
    normalizeTrackingPhone(phone);
    if (!recipient || recipient.length > 100 || address.length < 5 || address.length > 500 || phone.length > 30) throw new ContractError('INVALID_SHIPMENTS');
    return { recipient, phone, address };
  });
}

export function sanitizeAddress(input, { partial = false } = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new ContractError('INVALID_ADDRESS');
  const result = {};
  const textFields = [['label', 60], ['recipient', 100], ['phone', 30], ['address', 500]];
  for (const [field, maximum] of textFields) {
    if (input[field] === undefined && partial) continue;
    const value = String(input[field] || '').trim();
    const minimum = field === 'address' ? 5 : 1;
    if (value.length < minimum || value.length > maximum) throw new ContractError('INVALID_ADDRESS');
    if (field === 'phone') normalizeTrackingPhone(value);
    result[field] = value;
  }
  if (input.isDefault !== undefined) {
    if (typeof input.isDefault !== 'boolean') throw new ContractError('INVALID_ADDRESS');
    result.is_default = input.isDefault;
  } else if (!partial) result.is_default = false;
  if (!Object.keys(result).length) throw new ContractError('EMPTY_ADDRESS_UPDATE');
  return result;
}

export function buildPaymentInstructions(order, env) {
  const mode = String(env.SEPAY_MODE || '').toUpperCase();
  if (!['TEST', 'LIVE'].includes(mode)) throw new ContractError('PAYMENT_MODE_NOT_CONFIGURED', 503);
  if (!env.SEPAY_BANK_ACCOUNT || !env.SEPAY_BANK_CODE) throw new ContractError('PAYMENT_NOT_CONFIGURED', 503);
  if (!order || !Number.isSafeInteger(Number(order.expected_amount_vnd)) || Number(order.expected_amount_vnd) <= 0 || !order.payment_code) {
    throw new ContractError('PAYMENT_EXPECTATION_INVALID', 500);
  }
  const qr = new URL('https://vietqr.app/img');
  qr.search = new URLSearchParams({ acc: env.SEPAY_BANK_ACCOUNT, bank: env.SEPAY_BANK_CODE, amount: String(order.expected_amount_vnd), des: order.payment_code }).toString();
  return {
    provider: 'SEPAY', mode, currency: 'VND', amount: Number(order.expected_amount_vnd),
    transferContent: order.payment_code, bankCode: env.SEPAY_BANK_CODE,
    accountNumber: env.SEPAY_BANK_ACCOUNT, accountName: env.SEPAY_ACCOUNT_NAME || null,
    expiresAt: order.payment_expires_at || null, qrImageUrl: qr.toString()
  };
}
