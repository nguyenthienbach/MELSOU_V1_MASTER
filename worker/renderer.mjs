const MM_TO_POINTS = 72 / 25.4;
const rendererVersion = 'melsou-renderer-v1';
const templateLoaders = Object.freeze({
  'first-love': () => import('../templates/first-love/template.json', { with: { type: 'json' } }),
  'our-graduation': () => import('../templates/our-graduation/template.json', { with: { type: 'json' } }),
  'besties-archive': () => import('../templates/besties-archive/template.json', { with: { type: 'json' } }),
  'somewhere-together': () => import('../templates/somewhere-together/template.json', { with: { type: 'json' } }),
  'birthday-letters': () => import('../templates/birthday-letters/template.json', { with: { type: 'json' } }),
  'quiet-moments': () => import('../templates/quiet-moments/template.json', { with: { type: 'json' } }),
  'memory-box': () => import('../templates/memory-box/template.json', { with: { type: 'json' } }),
  'melsou-editorial': () => import('../templates/melsou-editorial/template.json', { with: { type: 'json' } })
});
const palettes = Object.freeze({
  'first-love': ['#fbf6ef', '#a82323'], 'our-graduation': ['#f4efe1', '#63573f'], 'besties-archive': ['#f7e0d5', '#b14658'],
  'somewhere-together': ['#dce9e3', '#1e5e65'], 'birthday-letters': ['#f4e5be', '#9b4b2d'], 'quiet-moments': ['#f3f1ec', '#302d29'],
  'memory-box': ['#e8dfcf', '#705536'], 'melsou-editorial': ['#e1e3df', '#1a2426']
});
const dbHeaders = (env) => ({ apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json' });
const points = (millimeters) => Number(millimeters) * MM_TO_POINTS;
const color = (hex, rgb) => rgb(Number.parseInt(hex.slice(1, 3), 16) / 255, Number.parseInt(hex.slice(3, 5), 16) / 255, Number.parseInt(hex.slice(5, 7), 16) / 255);
const xml = (value) => String(value || '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

async function templateFor(id) {
  const loader = templateLoaders[id]; if (!loader) throw new Error('TEMPLATE_VERSION_UNAVAILABLE');
  return (await loader()).default;
}
function printGeometry(profile) {
  const c = profile?.configuration || {};
  const required = ['finished_width_mm', 'finished_height_mm', 'cover_width_mm', 'cover_height_mm', 'bleed_mm', 'safe_margin_mm', 'gutter_warning_mm', 'dpi'];
  if (!required.every((key) => Number(c[key]) > 0) || !['color_profile', 'pdf_standard', 'cover_construction'].every((key) => typeof c[key] === 'string' && c[key].trim())) throw new Error('TBD_PRINT_VENDOR');
  return { width: points(c.finished_width_mm), height: points(c.finished_height_mm), coverWidth: points(c.cover_width_mm), coverHeight: points(c.cover_height_mm), bleed: points(c.bleed_mm), safe: points(c.safe_margin_mm), gutter: points(c.gutter_warning_mm), dpi: Number(c.dpi), profile: c };
}
function wrappedLines(text, font, size, maxWidth) {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean); if (!words.length) return [];
  const lines = []; let line = '';
  for (const word of words) { const next = line ? `${line} ${word}` : word; if (font.widthOfTextAtSize(next, size) <= maxWidth || !line) line = next; else { lines.push(line); line = word; } }
  lines.push(line); return lines;
}
async function embeddedImage(pdf, asset, env) {
  if (!asset || !env.MELSOU_ASSETS) return null;
  const object = await env.MELSOU_ASSETS.get(asset.storage_key); if (!object) throw new Error(`ASSET_OBJECT_MISSING:${asset.id}`);
  const bytes = await object.arrayBuffer();
  if (asset.mime_type === 'image/jpeg') return pdf.embedJpg(bytes);
  if (asset.mime_type === 'image/png') return pdf.embedPng(bytes);
  throw new Error(`UNRENDERABLE_IMAGE_TYPE:${asset.mime_type}`);
}
function framePoints(frame, geometry, spread) {
  const width = spread ? geometry.width * 2 + geometry.bleed * 2 : geometry.coverWidth + geometry.bleed * 2;
  const height = spread ? geometry.height + geometry.bleed * 2 : geometry.coverHeight + geometry.bleed * 2;
  return { x: width * frame.x, y: height * (1 - frame.y - frame.height), width: width * frame.width, height: height * frame.height };
}
function drawText(page, text, frame, pdfFont, fontSize, ink, safe) {
  const lines = wrappedLines(text, pdfFont, fontSize, Math.max(1, frame.width));
  if (lines.length * (fontSize * 1.25) > frame.height) throw new Error('TEXT_OVERFLOW');
  lines.forEach((line, index) => page.drawText(line, { x: Math.max(frame.x, safe), y: frame.y + frame.height - fontSize * (index + 1.1), size: fontSize, font: pdfFont, color: ink }));
}
async function qrImage(pdf, url) {
  if (!url) return null;
  const module = await import('qrcode'); const qr = module.default || module;
  const dataUrl = await qr.toDataURL(url, { errorCorrectionLevel: 'M', margin: 1, width: 512 });
  return pdf.embedPng(Uint8Array.from(atob(dataUrl.split(',')[1]), (char) => char.charCodeAt(0)));
}
function renderPreviewSvg(orderCode, template, title, palette) {
  return `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="${palette[0]}"/><rect x="72" y="72" width="1056" height="486" rx="8" fill="none" stroke="${palette[1]}" stroke-width="3"/><text x="120" y="250" font-family="serif" font-size="64" fill="${palette[1]}">${xml(title || template.name)}</text><text x="120" y="322" font-family="sans-serif" font-size="22" fill="${palette[1]}">MELSOU · ${xml(orderCode)}</text><text x="120" y="510" font-family="sans-serif" font-size="18" fill="${palette[1]}">PRIVATE PREPRESS PREVIEW</text></svg>`;
}

export async function renderOrder({ order, snapshot, profile, assets, env }) {
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
  const template = await templateFor(snapshot.template_id); const geometry = printGeometry(profile);
  const palette = palettes[template.template_id] || palettes['quiet-moments']; const paper = color(palette[0], rgb); const ink = color(palette[1], rgb);
  const pdf = await PDFDocument.create(); const serif = await pdf.embedFont(StandardFonts.TimesRoman); const sans = await pdf.embedFont(StandardFonts.Helvetica);
  const bindings = snapshot.document?.content_bindings || {}; const assetsById = new Map(assets.map((asset) => [asset.id, asset])); const imageCache = new Map();
  const imageFor = async (binding) => { if (!binding?.asset_id) return null; if (!imageCache.has(binding.asset_id)) imageCache.set(binding.asset_id, embeddedImage(pdf, assetsById.get(binding.asset_id), env)); return imageCache.get(binding.asset_id); };
  const cover = pdf.addPage([geometry.coverWidth + geometry.bleed * 2, geometry.coverHeight + geometry.bleed * 2]); cover.drawRectangle({ x: 0, y: 0, width: cover.getWidth(), height: cover.getHeight(), color: paper });
  drawText(cover, snapshot.document?.cover?.title || snapshot.document?.cover_title || template.name, { x: geometry.safe, y: geometry.safe, width: cover.getWidth() - geometry.safe * 2, height: cover.getHeight() - geometry.safe * 2 }, serif, Math.min(36, geometry.coverWidth / 10), ink, geometry.safe);
  const pageCount = Number(snapshot.document?.configuration?.pages || snapshot.document?.pages || 12); const spreads = Math.max(1, Math.ceil(pageCount / 2));
  for (let pageIndex = 0; pageIndex < spreads; pageIndex += 1) {
    const page = pdf.addPage([geometry.width * 2 + geometry.bleed * 2, geometry.height + geometry.bleed * 2]); page.drawRectangle({ x: 0, y: 0, width: page.getWidth(), height: page.getHeight(), color: paper });
    page.drawLine({ start: { x: page.getWidth() / 2, y: 0 }, end: { x: page.getWidth() / 2, y: page.getHeight() }, thickness: 0.3, color: ink, opacity: 0.22 });
    for (const slot of template.spreads[0].slots) {
      const binding = bindings[slot.id]; const frame = framePoints(slot.frame, geometry, true);
      if (slot.type === 'image' && binding?.asset_id) { const image = await imageFor(binding); if (image) page.drawImage(image, { x: frame.x, y: frame.y, width: frame.width, height: frame.height }); }
      if (slot.type === 'text' && binding?.text) drawText(page, binding.text, frame, sans, Math.max(9, Math.min(16, frame.height / 5)), ink, geometry.safe);
    }
    page.drawText(`${pageIndex + 1}`, { x: page.getWidth() - geometry.safe, y: geometry.safe / 2, size: 8, font: sans, color: ink });
  }
  const spotify = snapshot.document?.options?.spotify_enabled ? snapshot.document?.options?.spotify_url : null; const qr = await qrImage(pdf, spotify);
  if (qr) cover.drawImage(qr, { x: cover.getWidth() - geometry.safe - 50, y: geometry.safe, width: 50, height: 50 });
  pdf.setTitle(`Melsou ${order.order_code}`); pdf.setCreator(rendererVersion); pdf.setProducer(rendererVersion); pdf.setSubject(profile.configuration.pdf_standard);
  const coverPdf = await PDFDocument.create(); const [coverPage] = await coverPdf.copyPages(pdf, [0]); coverPdf.addPage(coverPage);
  const interiorPdf = await PDFDocument.create(); const interiorPages = await interiorPdf.copyPages(pdf, Array.from({ length: pdf.getPageCount() - 1 }, (_unused, index) => index + 1)); interiorPages.forEach((page) => interiorPdf.addPage(page));
  [coverPdf, interiorPdf].forEach((output) => { output.setTitle(`Melsou ${order.order_code}`); output.setCreator(rendererVersion); output.setProducer(rendererVersion); output.setSubject(profile.configuration.pdf_standard); });
  const [coverBytes, interiorBytes] = await Promise.all([coverPdf.save({ useObjectStreams: false }), interiorPdf.save({ useObjectStreams: false })]); const baseKey = `orders/${order.order_code}/${rendererVersion}`;
  const manifest = { renderer_version: rendererVersion, order_code: order.order_code, snapshot_id: snapshot.id, template_id: snapshot.template_id, template_version: snapshot.template_version, print_profile_version: profile.version, color_profile: profile.configuration.color_profile, pdf_standard: profile.configuration.pdf_standard, cover_construction: profile.configuration.cover_construction, artifacts: { cover: `${baseKey}/cover_print.pdf`, interior: `${baseKey}/interior_spreads.pdf` }, assets: assets.map((asset) => ({ id: asset.id, checksum: asset.checksum, storage_key: asset.storage_key })) };
  await Promise.all([
    env.MELSOU_ASSETS.put(`${baseKey}/cover_print.pdf`, coverBytes, { httpMetadata: { contentType: 'application/pdf', cacheControl: 'private, no-store' } }),
    env.MELSOU_ASSETS.put(`${baseKey}/interior_spreads.pdf`, interiorBytes, { httpMetadata: { contentType: 'application/pdf', cacheControl: 'private, no-store' } }),
    env.MELSOU_ASSETS.put(`${baseKey}/preview.svg`, renderPreviewSvg(order.order_code, template, snapshot.document?.cover?.title, palette), { httpMetadata: { contentType: 'image/svg+xml', cacheControl: 'private, no-store' } }),
    env.MELSOU_ASSETS.put(`${baseKey}/order_manifest.json`, JSON.stringify(manifest), { httpMetadata: { contentType: 'application/json', cacheControl: 'private, no-store' } })
  ]);
  return { cover_print_pdf_key: `${baseKey}/cover_print.pdf`, interior_spreads_pdf_key: `${baseKey}/interior_spreads.pdf`, preview_svg_key: `${baseKey}/preview.svg`, order_manifest_key: `${baseKey}/order_manifest.json`, renderer_version: rendererVersion };
}

export async function processRenderJobs(env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY || !env.MELSOU_ASSETS) return { skipped: 'RENDERER_NOT_CONFIGURED' };
  const claim = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/melsou_claim_render_job`, { method: 'POST', headers: dbHeaders(env), body: '{}' }); if (!claim.ok) throw new Error('RENDER_CLAIM_FAILED');
  const job = await claim.json(); if (!job) return { processed: false };
  try {
    const orderResponse = await fetch(`${env.SUPABASE_URL}/rest/v1/orders?id=eq.${job.order_id}&select=id,order_code,snapshot:production_snapshots(id,project_id,document,template_id,template_version,print_profile_version)&limit=1`, { headers: dbHeaders(env) });
    const [order] = orderResponse.ok ? await orderResponse.json() : []; if (!order?.snapshot) throw new Error('ORDER_SNAPSHOT_MISSING');
    const [profileResponse, assetsResponse] = await Promise.all([
      fetch(`${env.SUPABASE_URL}/rest/v1/print_profiles?version=eq.${encodeURIComponent(order.snapshot.print_profile_version)}&production_ready=eq.true&select=version,configuration,production_ready&limit=1`, { headers: dbHeaders(env) }),
      fetch(`${env.SUPABASE_URL}/rest/v1/project_assets?project_id=eq.${order.snapshot.project_id}&select=id,storage_key,mime_type,checksum,status`, { headers: dbHeaders(env) })
    ]);
    const [profile] = profileResponse.ok ? await profileResponse.json() : []; const assets = assetsResponse.ok ? await assetsResponse.json() : [];
    const artifacts = await renderOrder({ order, snapshot: order.snapshot, profile, assets, env });
    const complete = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/melsou_finish_render`, { method: 'POST', headers: dbHeaders(env), body: JSON.stringify({ p_render_job_id: job.id, p_artifacts: artifacts }) }); if (!complete.ok) throw new Error('RENDER_COMPLETE_REJECTED');
    return { processed: true, jobId: job.id };
  } catch (error) {
    await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/melsou_fail_render`, { method: 'POST', headers: dbHeaders(env), body: JSON.stringify({ p_render_job_id: job.id, p_error_code: String(error.message || 'RENDER_FAILED').slice(0, 120) }) });
    return { processed: false, jobId: job.id, error: String(error.message || 'RENDER_FAILED') };
  }
}
