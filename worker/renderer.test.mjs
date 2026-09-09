import test from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument } from 'pdf-lib';
import { renderOrder, templateCatalog, templateFor } from './renderer.mjs';

const tinyPng = Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='), (char) => char.charCodeAt(0));
const profile = { version: 'vendor-v1', production_ready: true, configuration: { finished_width_mm: 148, finished_height_mm: 210, cover_width_mm: 148, cover_height_mm: 210, bleed_mm: 3, safe_margin_mm: 5, gutter_warning_mm: 4, dpi: 300, color_profile: 'FOGRA39', pdf_standard: 'PDF/X-4', cover_construction: 'layflat' } };

test('renderer creates private, parseable PDF and immutable manifest from a snapshot', async () => {
  const reads = [];
  const objects = new Map([['projects/p/assets/a/normalized.png', tinyPng]]);
  const r2 = { async get(key) { reads.push(key); const value = objects.get(key); return value ? { arrayBuffer: async () => value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength) } : null; }, async put(key, value) { objects.set(key, value); } };
  const artifacts = await renderOrder({
    order: { order_code: 'MELM-2608-001' },
    snapshot: { id: 'snapshot-1', template_id: 'first-love', template_version: 1, document: { configuration: { pages: 12 }, cover: { title: 'A small beginning' }, options: { spotify_enabled: true, spotify_url: 'https://open.spotify.com/track/test' }, content_bindings: { image_01: { asset_id: 'a' } } } },
    profile, assets: [{ id: 'a', storage_key: 'projects/p/assets/a/original', mime_type: 'image/webp', checksum: 'original-checksum', status: 'READY', processing_state: 'READY', normalized_key: 'projects/p/assets/a/normalized.png', normalized_mime_type: 'image/png', normalized_checksum: 'normalized-checksum' }], env: { MELSOU_ASSETS: r2 }
  });
  assert.ok(objects.has(artifacts.cover_print_pdf_key)); assert.ok(objects.has(artifacts.interior_spreads_pdf_key)); assert.ok(objects.has(artifacts.order_manifest_key));
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
