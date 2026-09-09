import test from 'node:test';
import assert from 'node:assert/strict';
import { runPreflight } from './preflight.mjs';
const profile = { production_ready: true, configuration: { finished_width_mm: 1, finished_height_mm: 1, cover_width_mm: 1, cover_height_mm: 1, bleed_mm: 1, safe_margin_mm: 1, gutter_warning_mm: 1, dpi: 300, color_profile: 'test', pdf_standard: 'PDF/X-test', cover_construction: 'vendor-test' } };
test('preflight blocks a missing vendor profile even when content is complete', () => {
  const result = runPreflight({ document: { template: { template_id: 'first-love' }, configuration: { size: 'A5_PORTRAIT', pages: 12 }, content_bindings: { image_01: { asset_id: 'a' } } }, assets: [{ id: 'a', status: 'READY' }] });
  assert.equal(result.status, 'BLOCKING_ERROR'); assert.ok(result.blocking.includes('TBD_PRINT_VENDOR'));
});
test('preflight passes complete First Love project with a ready profile', () => {
  const result = runPreflight({ document: { template: { template_id: 'first-love' }, configuration: { size: 'A5_PORTRAIT', pages: 12 }, content_bindings: { image_01: { asset_id: 'a' } }, options: { spotify_enabled: true, spotify_url: 'https://open.spotify.com/track/x' } }, assets: [{ id: 'a', status: 'READY' }], printProfile: profile });
  assert.deepEqual(result, { status: 'PASS', blocking: [], warnings: [] });
});
test('preflight rejects a locked template used with an incompatible size', () => {
  const result = runPreflight({ document: { template: { template_id: 'melsou-editorial' }, configuration: { size: 'A5_PORTRAIT', pages: 12 }, content_bindings: { image_01: { asset_id: 'a' }, headline_01: { text: 'A title' } } }, assets: [{ id: 'a', status: 'READY' }], printProfile: profile });
  assert.equal(result.status, 'BLOCKING_ERROR'); assert.ok(result.blocking.includes('TEMPLATE_CONFIGURATION_INCOMPATIBLE'));
});
test('preflight blocks pending processing and accepts a complete normalized derivative', () => {
  const document = { template: { template_id: 'first-love' }, configuration: { size: 'A5_PORTRAIT', pages: 12 }, content_bindings: { image_01: { asset_id: 'a' } } };
  const pending = runPreflight({ document, assets: [{ id: 'a', status: 'ORIGINAL_ONLY', processing_state: 'PENDING' }], printProfile: profile });
  assert.ok(pending.blocking.includes('ASSET_PROCESSING_NOT_READY:image_01'));
  const ready = runPreflight({ document, assets: [{ id: 'a', status: 'READY', processing_state: 'READY', normalized_key: 'private/normalized.png', normalized_mime_type: 'image/png', normalized_width_px: 2400, normalized_height_px: 1600 }], printProfile: profile });
  assert.equal(ready.status, 'PASS');
});
