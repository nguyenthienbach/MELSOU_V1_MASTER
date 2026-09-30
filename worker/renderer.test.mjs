import test from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument } from 'pdf-lib';
import { assertCustomerProjectRenderReady, projectRenderCapabilityAudit, renderOrder, templateCatalog, templateFor } from './renderer.mjs';

const tinyPng = Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='), (char) => char.charCodeAt(0));
const profile = { version: 'vendor-v1', production_ready: true, configuration: { finished_width_mm: 148, finished_height_mm: 210, cover_width_mm: 148, cover_height_mm: 210, bleed_mm: 3, safe_margin_mm: 5, gutter_warning_mm: 4, dpi: 300, color_profile: 'FOGRA39', pdf_standard: 'PDF/X-4', cover_construction: 'layflat' } };

test('renderer creates private, parseable PDF and immutable manifest from a snapshot', async () => {
  const reads = [];
  const metadata = new Map();
  const objects = new Map([['projects/p/assets/a/normalized.png', tinyPng]]);
  const r2 = { async get(key) { reads.push(key); const value = objects.get(key); return value ? { arrayBuffer: async () => value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength) } : null; }, async put(key, value, options) { objects.set(key, value); metadata.set(key, options); } };
  const artifacts = await renderOrder({
    order: { order_code: 'MELM-2608-001' },
    snapshot: { id: 'snapshot-1', template_id: 'first-love', template_version: 1, document: { configuration: { pages: 12 }, cover: { title: 'A small beginning' }, options: { spotify_enabled: true, spotify_url: 'https://open.spotify.com/track/test' }, content_bindings: { image_01: { asset_id: 'a' } } } },
    profile, assets: [{ id: 'a', storage_key: 'projects/p/assets/a/original', mime_type: 'image/webp', checksum: 'original-checksum', status: 'READY', processing_state: 'READY', normalized_key: 'projects/p/assets/a/normalized.png', normalized_mime_type: 'image/png', normalized_checksum: 'normalized-checksum' }], env: { MELSOU_ASSETS: r2 }
  });
  assert.ok(objects.has(artifacts.cover_print_pdf_key)); assert.ok(objects.has(artifacts.interior_spreads_pdf_key)); assert.ok(objects.has(artifacts.order_manifest_key));
  assert.ok(objects.get(artifacts.cover_print_pdf_key).byteLength > 0);
  assert.ok(objects.get(artifacts.interior_spreads_pdf_key).byteLength > 0);
  assert.equal(metadata.get(artifacts.cover_print_pdf_key).httpMetadata.contentType, 'application/pdf');
  assert.equal(metadata.get(artifacts.cover_print_pdf_key).httpMetadata.cacheControl, 'private, no-store');
  const parsed = await PDFDocument.load(objects.get(artifacts.cover_print_pdf_key)); const interior = await PDFDocument.load(objects.get(artifacts.interior_spreads_pdf_key)); assert.equal(parsed.getPageCount(), 1); assert.ok(interior.getPageCount() >= 1);
  const manifest = JSON.parse(objects.get(artifacts.order_manifest_key)); assert.equal(manifest.snapshot_id, 'snapshot-1'); assert.equal(manifest.print_profile_version, 'vendor-v1');
  assert.deepEqual(reads, ['projects/p/assets/a/normalized.png']);
  assert.equal(manifest.assets[0].render_checksum, 'normalized-checksum');
});

test('template API source is the same immutable JSON used by the renderer', async () => {
  const template = await templateFor('first-love', 1);
  assert.equal(template.template_id, 'first-love');
  assert.ok(template.spreads[0].slots.some((slot) => slot.id === 'image_01'));
  const compatible = await templateCatalog({ size: 'A5_LANDSCAPE', pages: 12 });
  assert.deepEqual(compatible.map((item) => item.template_id).sort(), ['melsou-editorial', 'somewhere-together']);
  const twelvePage = await templateCatalog({ pages: 12 });
  assert.ok(twelvePage.length > 0);
  assert.ok(twelvePage.every((item) => item.compatible.some((entry) => entry.page_counts.includes(12))));
  await assert.rejects(() => templateFor('first-love', 99), /TEMPLATE_VERSION_UNAVAILABLE/);
});

test('customer PDF export remains fail-closed until the canonical renderer has full Studio fidelity', () => {
  const audit = projectRenderCapabilityAudit();
  assert.equal(audit.canonical_snapshot, true);
  assert.equal(audit.private_r2_assets, true);
  for (const capability of ['vietnamese_unicode_fonts', 'per_spread_layout', 'crop_pan_zoom', 'rotation', 'rounded_frame_mask', 'oval_frame_mask', 'multiline_studio_text', 'package_specific_content']) {
    assert.equal(audit[capability], false, capability);
  }
  assert.equal(audit.customer_download_ready, false);
  assert.throws(() => assertCustomerProjectRenderReady(), /PROJECT_RENDER_FIDELITY_NOT_READY/);
});

test('fidelity fixture with Vietnamese, transforms, masks and extra spread is rejected for customer export', () => {
  const fixture = {
    configuration: { pages: 16, packageCode: 'SIGNATURE' },
    editor_payload: {
      spreads: [
        { elements: [{ type: 'photo', crop: { x: 0.2, y: 0.1 }, zoom: 1.8, rotate: 12, frame: 'rounded' }, { type: 'text', text: 'Kỷ niệm của chúng mình\nDòng thứ hai', rotate: -4 }] },
        { elements: [{ type: 'photo', frame: 'oval' }] }
      ]
    }
  };
  assert.ok(fixture.editor_payload.spreads.length > 1);
  assert.throws(() => assertCustomerProjectRenderReady(fixture), /PROJECT_RENDER_FIDELITY_NOT_READY/);
});
