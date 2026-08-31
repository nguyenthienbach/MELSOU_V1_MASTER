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
async function archiveOne(env, token, job) {
  const render = job.order?.render_jobs?.find((item) => item.status === 'SUCCESS');
  const artifacts = render?.artifacts || {};
  const files = [
    ['cover_print_pdf_key', `${job.order.order_code}-cover.pdf`, 'application/pdf'],
    ['interior_spreads_pdf_key', `${job.order.order_code}-interior.pdf`, 'application/pdf'],
    ['order_manifest_key', `${job.order.order_code}-manifest.json`, 'application/json']
  ].filter(([key]) => artifacts[key]);
  if (!files.length || !env.MELSOU_ASSETS || !env.GOOGLE_DRIVE_ARCHIVE_FOLDER_ID) throw new Error('ARCHIVE_ARTIFACT_OR_CONFIGURATION_MISSING');
  const uploaded = [];
  for (const [artifactName, fileName, mimeType] of files) {
    const object = await env.MELSOU_ASSETS.get(artifacts[artifactName]); if (!object) throw new Error('ARCHIVE_ARTIFACT_MISSING');
    const boundary = `melsou-${crypto.randomUUID()}`;
    const metadata = JSON.stringify({ name: fileName, mimeType, parents: [env.GOOGLE_DRIVE_ARCHIVE_FOLDER_ID] });
    const body = new Blob([`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`, await object.arrayBuffer(), `\r\n--${boundary}--`]);
    const upload = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': `multipart/related; boundary=${boundary}` }, body });
    if (!upload.ok) throw new Error('GOOGLE_DRIVE_UPLOAD_FAILED');
    const file = await upload.json(); uploaded.push(file.webViewLink || `drive:${file.id}`);
  }
  await db(env, `archive_jobs?id=eq.${job.id}`, { method: 'PATCH', body: JSON.stringify({ status: 'SUCCESS', archive_uri: JSON.stringify(uploaded), attempts: Number(job.attempts || 0) + 1, error_code: null, updated_at: new Date().toISOString() }) });
}
async function processArchives(env, token) {
  if (!env.GOOGLE_DRIVE_ARCHIVE_FOLDER_ID || !env.MELSOU_ASSETS) return;
  const response = await db(env, 'archive_jobs?status=in.(QUEUED,FAILED)&order=created_at.asc&limit=5&select=id,attempts,order:orders(order_code,render_jobs(artifacts,status))');
  if (!response.ok) throw new Error('ARCHIVE_QUEUE_UNAVAILABLE');
  for (const job of await response.json()) {
    try { await archiveOne(env, token, job); }
    catch (error) { await db(env, `archive_jobs?id=eq.${job.id}`, { method: 'PATCH', body: JSON.stringify({ status: 'FAILED', attempts: Number(job.attempts || 0) + 1, error_code: String(error.message || 'ARCHIVE_FAILED').slice(0, 120), updated_at: new Date().toISOString() }) }); }
  }
}
async function processReports(env, token) {
  if (!env.GOOGLE_SHEETS_REPORTING_ID) return;
  const response = await db(env, 'reporting_outbox?delivered_at=is.null&order=created_at.asc&limit=50&select=id,event_type,aggregate_id,payload,created_at');
  if (!response.ok) throw new Error('REPORTING_OUTBOX_UNAVAILABLE');
  const events = await response.json(); if (!events.length) return;
  const rows = events.map((event) => [event.created_at, event.event_type, event.aggregate_id, event.payload.order_code || '', event.payload.amount_vnd || '', event.payload.completed_at || '']);
  const append = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${env.GOOGLE_SHEETS_REPORTING_ID}/values/Orders!A:F:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ values: rows }) });
  if (!append.ok) throw new Error('GOOGLE_SHEETS_APPEND_FAILED');
  const ids = events.map((event) => event.id).join(',');
  await db(env, `reporting_outbox?id=in.(${ids})`, { method: 'PATCH', body: JSON.stringify({ delivered_at: new Date().toISOString(), attempts: 1 }) });
}

export async function processOperations(env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return { skipped: 'SUPABASE_NOT_CONFIGURED' };
  const token = await googleToken(env, 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/spreadsheets');
  if (!token) return { skipped: 'GOOGLE_ARCHIVE_NOT_CONFIGURED' };
  await processArchives(env, token);
  await processReports(env, token);
  return { processed: true };
}
