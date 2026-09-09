import test from 'node:test';
import assert from 'node:assert/strict';
import { archiveOne, processOperations, processReports } from './operations.mjs';

test('archive/reporting worker is inert until its server credentials are configured', async () => {
  assert.deepEqual(await processOperations({}), { skipped: 'SUPABASE_NOT_CONFIGURED' });
});

test('payment expiry runs without optional Google archive credentials', async (t) => {
  t.mock.method(globalThis, 'fetch', async (url) => {
    if (String(url).endsWith('/rpc/melsou_expire_payment_attempts')) return new Response('2', { status: 200 });
    if (String(url).endsWith('/rpc/melsou_cleanup_auth_state')) return new Response(JSON.stringify({ sessions: 1, challenges: 2 }), { status: 200 });
    throw new Error(`Unexpected fetch ${url}`);
  });
  assert.deepEqual(await processOperations({ SUPABASE_URL: 'https://db.test', SUPABASE_SERVICE_ROLE_KEY: 'test' }), { expiredPayments: 2, authCleanup: { sessions: 1, challenges: 2 }, skipped: 'GOOGLE_ARCHIVE_NOT_CONFIGURED' });
});

test('archive retry reuses an existing deterministic Drive artifact', async (t) => {
  let r2Reads = 0; let uploads = 0; let completed = false;
  t.mock.method(globalThis, 'fetch', async (url, init = {}) => {
    const value = String(url);
    if (value.includes('/drive/v3/files?')) return new Response(JSON.stringify({ files: [{ id: 'drive-1', webViewLink: 'https://drive.test/file/1' }] }), { status: 200 });
    if (value.includes('/upload/drive/')) { uploads += 1; return new Response('{}', { status: 200 }); }
    if (value.includes('/archive_jobs?')) { completed = JSON.parse(init.body).status === 'SUCCESS'; return new Response('{}', { status: 200 }); }
    throw new Error(`Unexpected fetch ${value}`);
  });
  await archiveOne({ SUPABASE_URL: 'https://db.test', SUPABASE_SERVICE_ROLE_KEY: 'service', GOOGLE_DRIVE_ARCHIVE_FOLDER_ID: 'folder', MELSOU_ASSETS: { async get() { r2Reads += 1; return null; } } }, 'token', {
    id: 'job-1', order: { order_code: 'MELM-2609-001', render_jobs: [{ status: 'SUCCESS', artifacts: { cover_print_pdf_key: 'orders/MELM-2609-001/v1/cover.pdf' } }] }
  });
  assert.equal(r2Reads, 0); assert.equal(uploads, 0); assert.equal(completed, true);
});

test('report retry marks an already appended outbox id delivered without appending twice', async (t) => {
  let claims = 0; let appends = 0; let delivered = false;
  t.mock.method(globalThis, 'fetch', async (url, init = {}) => {
    const value = String(url);
    if (value.includes('sheets.googleapis.com') && value.includes('Orders!A:A')) return new Response(JSON.stringify({ values: [['42']] }), { status: 200 });
    if (value.includes('sheets.googleapis.com') && init.method === 'POST') { appends += 1; return new Response('{}', { status: 200 }); }
    if (value.includes('/rpc/melsou_claim_reporting_event')) {
      claims += 1;
      return new Response(claims === 1 ? JSON.stringify({ id: 42, event_type: 'ORDER_PAID', aggregate_id: 'order-1', payload: {}, created_at: '2026-09-08T00:00:00Z', attempts: 2, max_attempts: 8 }) : 'null', { status: 200 });
    }
    if (value.includes('/reporting_outbox?')) { delivered = JSON.parse(init.body).status === 'DELIVERED'; return new Response('{}', { status: 200 }); }
    throw new Error(`Unexpected fetch ${value}`);
  });
  await processReports({ SUPABASE_URL: 'https://db.test', SUPABASE_SERVICE_ROLE_KEY: 'service', GOOGLE_SHEETS_REPORTING_ID: 'sheet' }, 'token');
  assert.equal(appends, 0); assert.equal(delivered, true);
});
