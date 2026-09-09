const encoder = new TextEncoder();
const b64url = (value) => btoa(typeof value === 'string' ? value : String.fromCharCode(...new Uint8Array(value))).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
const supabaseHeaders = (env) => ({ apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json' });

function serviceAccount(env) {
  if (!env.GOOGLE_SERVICE_ACCOUNT_JSON) return null;
  try {
    const value = JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_JSON);
    return value.client_email && value.private_key ? value : null;
  } catch { return null; }
}
async function googleToken(env, scope) {
  const account = serviceAccount(env);
  if (!account) return null;
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))}.${b64url(JSON.stringify({ iss: account.client_email, scope, aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 300 }))}`;
  const der = Uint8Array.from(atob(account.private_key.replace(/-----(BEGIN|END) PRIVATE KEY-----|\s/g, '')), (char) => char.charCodeAt(0));
  const key = await crypto.subtle.importKey('pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const signature = b64url(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, encoder.encode(unsigned)));
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${unsigned}.${signature}` }) });
  if (!tokenResponse.ok) throw new Error('GOOGLE_TOKEN_FAILED');
  return (await tokenResponse.json()).access_token;
}
async function db(env, path, options = {}) {
  return fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, { ...options, headers: { ...supabaseHeaders(env), ...(options.headers || {}) } });
}
const nextRetryAt = (attempts) => new Date(Date.now() + Math.min(3600, (2 ** Math.max(1, attempts)) * 30) * 1000).toISOString();
async function expirePayments(env) {
  const response = await db(env, 'rpc/melsou_expire_payment_attempts', { method: 'POST', body: '{}' });
  if (!response.ok) throw new Error('PAYMENT_EXPIRY_JOB_FAILED');
  return Number(await response.json()) || 0;
}
async function cleanupAuthState(env) {
  const response = await db(env, 'rpc/melsou_cleanup_auth_state', { method: 'POST', body: '{}' });
  if (!response.ok) throw new Error('AUTH_STATE_CLEANUP_FAILED');
  return await response.json();
}
async function existingDriveFile(token, folderId, artifactKey) {
  const escapedFolder = folderId.replaceAll("'", "\\'");
  const escapedKey = artifactKey.replaceAll("'", "\\'");
  const query = `'${escapedFolder}' in parents and trashed=false and appProperties has { key='melsouArtifactKey' and value='${escapedKey}' }`;
  const params = new URLSearchParams({ q: query, spaces: 'drive', fields: 'files(id,webViewLink)', pageSize: '1' });
  const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error('GOOGLE_DRIVE_LOOKUP_FAILED');
  return (await response.json()).files?.[0] || null;
}
export async function archiveOne(env, token, job) {
  const render = job.order?.render_jobs?.find((item) => item.status === 'SUCCESS');
  const artifacts = render?.artifacts || {};
  const files = [
    ['cover_print_pdf_key', `${job.order.order_code}-cover.pdf`, 'application/pdf'],
    ['interior_spreads_pdf_key', `${job.order.order_code}-interior.pdf`, 'application/pdf'],
    ['order_manifest_key', `${job.order.order_code}-manifest.json`, 'application/json']
  ].filter(([key]) => artifacts[key]);
  const voice = job.order?.order_voice_selections;
  if (voice?.voice_mode === 'RECORD_ON_WEB' && voice.storage_key) {
    const extension = { 'audio/webm': 'webm', 'audio/ogg': 'ogg', 'audio/mp4': 'm4a', 'audio/wav': 'wav' }[voice.mime_type];
    if (!extension) throw new Error('ARCHIVE_VOICE_TYPE_UNSUPPORTED');
    artifacts.voice_storage_key = voice.storage_key;
    files.push(['voice_storage_key', `${job.order.order_code}-voice.${extension}`, voice.mime_type]);
  }
  if (!files.length || !env.MELSOU_ASSETS || !env.GOOGLE_DRIVE_ARCHIVE_FOLDER_ID) throw new Error('ARCHIVE_ARTIFACT_OR_CONFIGURATION_MISSING');
  const uploaded = [];
  for (const [artifactName, fileName, mimeType] of files) {
    const artifactKey = `${job.order.order_code}:${artifactName}`;
    const existing = await existingDriveFile(token, env.GOOGLE_DRIVE_ARCHIVE_FOLDER_ID, artifactKey);
    if (existing) { uploaded.push(existing.webViewLink || `drive:${existing.id}`); continue; }
    const object = await env.MELSOU_ASSETS.get(artifacts[artifactName]); if (!object) throw new Error('ARCHIVE_ARTIFACT_MISSING');
    const boundary = `melsou-${crypto.randomUUID()}`;
    const metadata = JSON.stringify({ name: fileName, mimeType, parents: [env.GOOGLE_DRIVE_ARCHIVE_FOLDER_ID], appProperties: { melsouArtifactKey: artifactKey } });
    const body = new Blob([`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`, await object.arrayBuffer(), `\r\n--${boundary}--`]);
    const upload = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': `multipart/related; boundary=${boundary}` }, body });
    if (!upload.ok) throw new Error('GOOGLE_DRIVE_UPLOAD_FAILED');
    const file = await upload.json(); uploaded.push(file.webViewLink || `drive:${file.id}`);
  }
  await db(env, `archive_jobs?id=eq.${job.id}`, { method: 'PATCH', body: JSON.stringify({ status: 'SUCCESS', archive_uri: JSON.stringify(uploaded), error_code: null, last_error: null, next_attempt_at: null, completed_at: new Date().toISOString(), updated_at: new Date().toISOString() }) });
}
async function processArchives(env, token) {
  if (!env.GOOGLE_DRIVE_ARCHIVE_FOLDER_ID || !env.MELSOU_ASSETS) return;
  for (let processed = 0; processed < 10; processed += 1) {
    const claim = await db(env, 'rpc/melsou_claim_archive_job', { method: 'POST', body: '{}' });
    if (!claim.ok) throw new Error('ARCHIVE_QUEUE_UNAVAILABLE');
    const job = await claim.json(); if (!job) break;
    const orderResponse = await db(env, `orders?id=eq.${job.order_id}&select=order_code,render_jobs(artifacts,status),order_voice_selections(voice_mode,storage_key,mime_type,checksum)&limit=1`);
    const [order] = orderResponse.ok ? await orderResponse.json() : [];
    try {
      if (!order) throw new Error('ARCHIVE_ORDER_MISSING');
      await archiveOne(env, token, { ...job, order });
    }
    catch (error) {
      const errorCode = String(error.message || 'ARCHIVE_FAILED').slice(0, 120); const exhausted = Number(job.attempts) >= Number(job.max_attempts);
      await db(env, `archive_jobs?id=eq.${job.id}`, { method: 'PATCH', body: JSON.stringify({ status: exhausted ? 'DEAD_LETTER' : 'FAILED', error_code: errorCode, last_error: errorCode, next_attempt_at: exhausted ? null : nextRetryAt(Number(job.attempts)), updated_at: new Date().toISOString() }) });
    }
  }
}
export async function processReports(env, token) {
  if (!env.GOOGLE_SHEETS_REPORTING_ID) return;
  const existingResponse = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${env.GOOGLE_SHEETS_REPORTING_ID}/values/Orders!A:A?majorDimension=COLUMNS`, { headers: { Authorization: `Bearer ${token}` } });
  if (!existingResponse.ok) throw new Error('GOOGLE_SHEETS_LOOKUP_FAILED');
  const existingIds = new Set(((await existingResponse.json()).values?.[0] || []).map(String));
  for (let processed = 0; processed < 50; processed += 1) {
    const claim = await db(env, 'rpc/melsou_claim_reporting_event', { method: 'POST', body: '{}' });
    if (!claim.ok) throw new Error('REPORTING_OUTBOX_UNAVAILABLE');
    const event = await claim.json(); if (!event) break;
    let delivered = existingIds.has(String(event.id));
    if (!delivered) {
      const row = [String(event.id), event.created_at, event.event_type, event.aggregate_id, event.payload.order_code || '', event.payload.amount_vnd || '', event.payload.completed_at || ''];
      const append = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${env.GOOGLE_SHEETS_REPORTING_ID}/values/Orders!A:G:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ values: [row] }) });
      delivered = append.ok;
      if (delivered) existingIds.add(String(event.id));
    }
    if (delivered) {
      await db(env, `reporting_outbox?id=eq.${event.id}`, { method: 'PATCH', body: JSON.stringify({ delivered_at: new Date().toISOString(), status: 'DELIVERED', last_error: null, next_attempt_at: null, updated_at: new Date().toISOString() }) });
    } else {
      const attempts = Number(event.attempts); const maxAttempts = Number(event.max_attempts); const exhausted = attempts >= maxAttempts;
      await db(env, `reporting_outbox?id=eq.${event.id}`, { method: 'PATCH', body: JSON.stringify({ status: exhausted ? 'DEAD_LETTER' : 'FAILED', last_error: 'GOOGLE_SHEETS_APPEND_FAILED', next_attempt_at: exhausted ? null : nextRetryAt(attempts), updated_at: new Date().toISOString() }) });
    }
  }
}

export async function processOperations(env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return { skipped: 'SUPABASE_NOT_CONFIGURED' };
  const [expiredPayments, authCleanup] = await Promise.all([expirePayments(env), cleanupAuthState(env)]);
  const token = await googleToken(env, 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/spreadsheets');
  if (!token) return { expiredPayments, authCleanup, skipped: 'GOOGLE_ARCHIVE_NOT_CONFIGURED' };
  await processArchives(env, token);
  await processReports(env, token);
  return { processed: true, expiredPayments, authCleanup };
}
