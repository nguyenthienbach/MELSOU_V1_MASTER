export class VoiceError extends Error {
  constructor(code, status = 400) { super(code); this.code = code; this.status = status; }
}

const allowedDeclared = new Set(['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/x-m4a', 'audio/wav', 'audio/wave', 'audio/x-wav']);
const ascii = (bytes, start, length) => String.fromCharCode(...bytes.slice(start, start + length));

export function inspectVoiceBytes(buffer, declaredType, reportedDurationMs, { maxBytes = 5 * 1024 * 1024, maxDurationSeconds } = {}) {
  const bytes = new Uint8Array(buffer);
  const declared = String(declaredType || '').split(';')[0].trim().toLowerCase();
  if (!allowedDeclared.has(declared)) throw new VoiceError('VOICE_TYPE_NOT_ALLOWED', 415);
  if (bytes.byteLength < 12) throw new VoiceError('VOICE_INVALID_CONTAINER', 415);
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1024 || bytes.byteLength > maxBytes) throw new VoiceError('VOICE_TOO_LARGE', 413);
  if (!Number.isFinite(maxDurationSeconds) || maxDurationSeconds <= 0) throw new VoiceError('VOICE_DURATION_NOT_CONFIGURED', 503);
  let mimeType;
  if (bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) mimeType = 'audio/webm';
  else if (ascii(bytes, 0, 4) === 'OggS') mimeType = 'audio/ogg';
  else if (ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 4) === 'WAVE') mimeType = 'audio/wav';
  else if (ascii(bytes, 4, 4) === 'ftyp') mimeType = 'audio/mp4';
  else throw new VoiceError('VOICE_INVALID_CONTAINER', 415);
  const compatible = mimeType === 'audio/wav' ? declared.includes('wav') || declared === 'audio/wave'
    : mimeType === 'audio/mp4' ? declared === 'audio/mp4' || declared === 'audio/x-m4a' : declared === mimeType;
  if (!compatible) throw new VoiceError('VOICE_MIME_MISMATCH', 415);
  const durationMs = Number(reportedDurationMs);
  if (!Number.isFinite(durationMs) || durationMs < 500 || durationMs > maxDurationSeconds * 1000) throw new VoiceError('VOICE_DURATION_INVALID', 400);
  return { mimeType, durationMs: Math.round(durationMs), size: bytes.byteLength };
}

const dbHeaders = (env) => ({ apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json' });
const db = (env, path, options = {}) => fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, { ...options, headers: { ...dbHeaders(env), ...(options.headers || {}) } });

export async function processVoiceCleanupJobs(env, limit = 5) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY || !env.MELSOU_ASSETS) return { skipped: 'VOICE_CLEANUP_NOT_CONFIGURED' };
  const enqueue = await db(env, 'rpc/melsou_enqueue_stale_voice_drafts', { method: 'POST', body: '{}' });
  if (!enqueue.ok) throw new Error('VOICE_STALE_DRAFT_ENQUEUE_FAILED');
  let processed = 0;
  while (processed < limit) {
    const claimResponse = await db(env, 'rpc/melsou_claim_voice_cleanup', { method: 'POST', body: '{}' });
    if (!claimResponse.ok) throw new Error('VOICE_CLEANUP_CLAIM_FAILED');
    const job = await claimResponse.json(); if (!job) break;
    try {
      const assetResponse = await db(env, `voice_assets?id=eq.${job.voice_asset_id}&select=id,storage_key&limit=1`);
      const [asset] = assetResponse.ok ? await assetResponse.json() : [];
      const referenceResponse = await db(env, `order_voice_selections?voice_asset_id=eq.${job.voice_asset_id}&select=order_id&limit=1`);
      if (!referenceResponse.ok) throw new Error('VOICE_REFERENCE_CHECK_FAILED');
      const retained = (await referenceResponse.json()).length > 0;
      if (asset && !retained) await env.MELSOU_ASSETS.delete(asset.storage_key);
      const complete = await db(env, 'rpc/melsou_complete_voice_cleanup', { method: 'POST', body: JSON.stringify({ p_job_id: job.id, p_retained: retained }) });
      if (!complete.ok) throw new Error('VOICE_CLEANUP_COMPLETE_FAILED');
      processed += 1;
    } catch (error) {
      await db(env, 'rpc/melsou_fail_voice_cleanup', { method: 'POST', body: JSON.stringify({ p_job_id: job.id, p_error: String(error.message || 'VOICE_CLEANUP_FAILED').slice(0, 120) }) });
      processed += 1;
    }
  }
  return { processed };
}
