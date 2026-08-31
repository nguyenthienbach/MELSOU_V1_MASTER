import test from 'node:test';
import assert from 'node:assert/strict';
import { processOperations } from './operations.mjs';

test('archive/reporting worker is inert until its server credentials are configured', async () => {
  assert.deepEqual(await processOperations({}), { skipped: 'SUPABASE_NOT_CONFIGURED' });
  assert.deepEqual(await processOperations({ SUPABASE_URL: 'https://db.test', SUPABASE_SERVICE_ROLE_KEY: 'test' }), { skipped: 'GOOGLE_ARCHIVE_NOT_CONFIGURED' });
});
