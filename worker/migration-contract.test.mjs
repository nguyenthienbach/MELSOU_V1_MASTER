import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import test from 'node:test';

const migrationDirectory = new URL('../supabase/migrations/', import.meta.url);

async function migrationSql() {
  const files = (await readdir(migrationDirectory)).filter((file) => file.endsWith('.sql')).sort();
  return (await Promise.all(files.map((file) => readFile(new URL(file, migrationDirectory), 'utf8')))).join('\n').toLowerCase();
}

test('canonical V1 schema contains every required backend aggregate', async () => {
  const sql = await migrationSql();
  const tables = [
    'profiles', 'guest_sessions', 'projects', 'project_checkpoints', 'project_assets', 'template_versions',
    'pricing_versions', 'quotes', 'carts', 'cart_items', 'production_snapshots', 'orders', 'order_lines',
    'shipments', 'payment_attempts', 'payment_events', 'render_jobs', 'archive_jobs', 'reporting_outbox',
    'blog_posts', 'audit_logs', 'project_duo_members', 'project_slot_locks'
  ];
  for (const table of tables) assert.match(sql, new RegExp(`create table(?: if not exists)? public\\.${table}\\b`), table);
});

test('client-visible completion tables have RLS and privileged RPCs are service-only', async () => {
  const sql = await migrationSql();
  for (const table of ['project_checkpoints', 'quotes', 'carts', 'cart_items', 'payment_attempts', 'order_lines', 'order_events', 'customer_addresses', 'blog_posts', 'production_snapshots', 'payment_events', 'audit_logs']) {
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`), table);
  }
  for (const fn of ['melsou_update_profile', 'melsou_claim_guest_projects', 'melsou_create_project_checkpoint', 'melsou_set_project_trash', 'melsou_save_customer_address', 'melsou_delete_customer_address', 'melsou_upsert_cart_item', 'melsou_create_order_v2', 'melsou_process_sepay_payment', 'melsou_expire_payment_attempts', 'melsou_update_fulfillment', 'melsou_claim_archive_job', 'melsou_claim_reporting_event']) {
    assert.match(sql, new RegExp(`grant execute on function public\\.${fn}\\([^;]+ to service_role`), fn);
  }
});

test('database completion enforces idempotency, payment expiry and bounded retry', async () => {
  const sql = await migrationSql();
  assert.match(sql, /checkout_idempotency_key/);
  assert.match(sql, /guest_claimed_projects/);
  assert.match(sql, /payment_expires_at/);
  assert.match(sql, /provider_event_id text not null unique/);
  assert.match(sql, /attempts between 0 and max_attempts/);
  assert.match(sql, /production_snapshot_immutable/);
  assert.match(sql, /order_expectation_immutable/);
  assert.match(sql, /payment_expectation_immutable/);
  assert.match(sql, /invalid_order_status_transition/);
  assert.match(sql, /"melody":119000,"voice":159000,"signature":199000/);
});

test('Product Owner auth and voice migration is private, version-safe and service-only', async () => {
  const sql = await migrationSql();
  for (const table of ['app_users','native_credentials','native_sessions','auth_email_challenges','voice_assets','order_voice_selections','voice_cleanup_jobs']) {
    assert.match(sql, new RegExp(`create table(?: if not exists)? public\\.${table}\\b`), table);
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`), table);
  }
  for (const fn of ['melsou_register_native','melsou_native_login_success','melsou_native_session_user','melsou_recover_native_password','melsou_commit_voice','melsou_claim_voice_cleanup','melsou_create_order_v3']) {
    assert.match(sql, new RegExp(`revoke all on function public\\.${fn}\\(`), fn);
  }
  assert.match(sql, /password_hash text not null/);
  assert.match(sql, /token_hash text not null unique/);
  assert.match(sql, /order_voice_selections/);
  assert.match(sql, /order_voice_selection_immutable/);
  assert.match(sql, /voice_assets set status='cleaning'/);
  assert.match(sql, /revoke all on public\.voice_assets,public\.order_voice_selections from anon,authenticated/);
  assert.doesNotMatch(sql, /grant select on public\.voice_assets,public\.order_voice_selections to authenticated/);
  assert.doesNotMatch(sql, /password_plaintext|raw_session_token/);
});

test('new orders receive SePay-compatible payment codes without changing legacy references', async () => {
  const sql = await migrationSql();
  assert.match(sql, /new\.payment_code\s*:=\s*'mel'\s*\|\|\s*v_yymm\s*\|\|\s*lpad\(v_sequence::text,\s*4,\s*'0'\)/);
  assert.match(sql, /before insert on public\.orders/);
  assert.match(sql, /payment_code_sequence_exhausted/);
  assert.doesNotMatch(sql, /update\s+public\.orders\s+set\s+payment_code/);
});
