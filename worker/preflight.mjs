const REQUIRED_SLOTS = Object.freeze({
  'first-love': ['image_01'], 'our-graduation': ['image_01', 'image_02'], 'besties-archive': ['image_01', 'image_02'],
  'somewhere-together': ['panorama_01'], 'birthday-letters': ['image_01', 'letter_01'], 'quiet-moments': ['image_01'],
  'memory-box': ['image_01'], 'melsou-editorial': ['image_01', 'headline_01']
});
const TEMPLATE_COMPATIBILITY = Object.freeze({
  'first-love': { sizes: ['A5_PORTRAIT'], pages: [12, 16, 24] }, 'our-graduation': { sizes: ['A5_PORTRAIT'], pages: [12, 16, 24] },
  'besties-archive': { sizes: ['A5_PORTRAIT'], pages: [12, 16, 24] }, 'somewhere-together': { sizes: ['A5_LANDSCAPE'], pages: [12, 16, 24] },
  'birthday-letters': { sizes: ['A5_PORTRAIT'], pages: [12, 16, 24] }, 'quiet-moments': { sizes: ['A5_PORTRAIT'], pages: [12, 16, 24] },
  'memory-box': { sizes: ['A5_PORTRAIT'], pages: [12, 16, 24] }, 'melsou-editorial': { sizes: ['A5_LANDSCAPE'], pages: [12, 16, 24] }
});
const printReady = (profile) => profile && profile.production_ready === true && ['finished_width_mm', 'finished_height_mm', 'cover_width_mm', 'cover_height_mm', 'bleed_mm', 'safe_margin_mm', 'gutter_warning_mm', 'dpi'].every((key) => Number.isFinite(Number(profile.configuration?.[key])) && Number(profile.configuration[key]) > 0) && ['color_profile', 'pdf_standard', 'cover_construction'].every((key) => typeof profile.configuration?.[key] === 'string' && profile.configuration[key].trim().length > 0);
const validSpotifyUrl = (value) => { try { const url = new URL(value); return url.protocol === 'https:' && ['open.spotify.com', 'spotify.com'].includes(url.hostname); } catch { return false; } };
const positivePixelDimension = (value) => Number.isInteger(Number(value)) && Number(value) > 0;

export function runPreflight({ document, assets = [], printProfile = null, requirePrintProfile = true }) {
  const blocking = []; const warnings = [];
  if (!document || typeof document !== 'object') return { status: 'BLOCKING_ERROR', blocking: ['PROJECT_DOCUMENT_INVALID'], warnings };
  const templateId = document.template?.template_id || document.template_id;
  const requiredSlots = REQUIRED_SLOTS[templateId];
  if (!requiredSlots) blocking.push('TEMPLATE_VERSION_UNAVAILABLE');
  const compatibility = TEMPLATE_COMPATIBILITY[templateId]; const configuration = document.configuration || {};
  if (compatibility && (!compatibility.sizes.includes(configuration.size) || !compatibility.pages.includes(Number(configuration.pages)))) blocking.push('TEMPLATE_CONFIGURATION_INCOMPATIBLE');
  const bindings = document.content_bindings || {};
  const knownAssets = new Map(assets.map((asset) => [asset.id, asset]));
  for (const slot of requiredSlots || []) {
    const binding = bindings[slot];
    if (!binding) { blocking.push(`MISSING_REQUIRED_SLOT:${slot}`); continue; }
    if (binding.asset_id) {
      const asset = knownAssets.get(binding.asset_id);
      if (!asset) blocking.push(`MISSING_ASSET:${slot}`);
      else if (asset.processing_state && asset.processing_state !== 'READY') blocking.push(`ASSET_PROCESSING_NOT_READY:${slot}`);
      else if (asset.processing_state === 'READY' && (!asset.normalized_key || asset.normalized_mime_type !== 'image/png' || !positivePixelDimension(asset.normalized_width_px) || !positivePixelDimension(asset.normalized_height_px))) blocking.push(`ASSET_DERIVATIVE_INVALID:${slot}`);
      else if (asset.status === 'TOO_LOW') blocking.push(`ASSET_TOO_LOW:${slot}`);
      else if (asset.status === 'WARNING') warnings.push(`ASSET_QUALITY_WARNING:${slot}`);
      else if (asset.status !== 'READY') blocking.push(`ASSET_NOT_READY:${slot}`);
    } else if (typeof binding.text !== 'string' || !binding.text.trim()) blocking.push(`MISSING_CONTENT:${slot}`);
  }
  if (document.options?.spotify_enabled && !validSpotifyUrl(document.options?.spotify_url || document.spotify_url || '')) blocking.push('INVALID_SPOTIFY_URL');
  if (requirePrintProfile && !printReady(printProfile)) blocking.push('TBD_PRINT_VENDOR');
  return { status: blocking.length ? 'BLOCKING_ERROR' : warnings.length ? 'WARNING' : 'PASS', blocking, warnings };
}
