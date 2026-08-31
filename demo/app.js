const packages = [
  { id: 'MELODY', label: 'Melody', price: 159000, tag: 'FOR THE SONG', copy: 'Album layflat 12 trang, lời nhắn viết tay và Spotify QR.', perks: ['Spotify QR trên bìa sau', 'Lời nhắn cá nhân'] },
  { id: 'VOICE', label: 'Voice', price: 219000, tag: 'FOR THE VOICE', copy: 'Album layflat 12 trang, lời nhắn và module ghi âm vật lý.', perks: ['Module ghi âm vật lý', 'Tự thu sau khi nhận album'] },
  { id: 'SIGNATURE', label: 'Signature', price: 259000, tag: 'THE WHOLE STORY', copy: 'Album, Spotify QR, voice module, hộp Kraft và sticker.', perks: ['Spotify QR + voice module', 'Hộp Kraft & sticker'], best: true }
];
const templates = [
  ['first-love', 'First Love', 'romantic', '♡'], ['our-graduation', 'Our Graduation', 'scrapbook', '✦'],
  ['besties-archive', 'Besties Archive', 'playful', '☻'], ['somewhere-together', 'Somewhere Together', 'travel', '⌁'],
  ['birthday-letters', 'Birthday Letters', 'warm', '✉'], ['quiet-moments', 'Quiet Moments', 'minimal', '◌'],
  ['memory-box', 'Memory Box', 'nostalgic', '▣'], ['melsou-editorial', 'Melsou Editorial', 'editorial', '↗']
];
const state = JSON.parse(localStorage.getItem('melsou-demo') || 'null') || {
  packageId: 'SIGNATURE', size: 'A5_PORTRAIT', pages: 12, twin: false, shipments: 1,
  template: 'first-love', title: 'Những ngày mình còn trẻ', step: 1, assets: [], assetSlots: {}, textSlots: {}, note: '', coverTitle: 'somewhere between then & now', spotify: '', projectId: null
};
state.assetSlots ||= {};
state.textSlots ||= {};
state.draftKey ||= crypto.randomUUID();
const vnd = new Intl.NumberFormat('vi-VN');
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const slotRules = {
  'first-love': { image_01: 'Khoảnh khắc mở đầu' }, 'our-graduation': { image_01: 'Ảnh tốt nghiệp 01', image_02: 'Ảnh tốt nghiệp 02' },
  'besties-archive': { image_01: 'Ảnh bạn bè 01', image_02: 'Ảnh bạn bè 02' }, 'somewhere-together': { panorama_01: 'Ảnh phong cảnh ngang' },
  'birthday-letters': { image_01: 'Ảnh sinh nhật', letter_01: 'Lời chúc' }, 'quiet-moments': { image_01: 'Một khoảnh khắc nhỏ' },
  'memory-box': { image_01: 'Kỷ niệm muốn giữ' }, 'melsou-editorial': { image_01: 'Ảnh chủ đạo', headline_01: 'Tiêu đề biên tập' }
};
let runtime = null;
let supabaseClient = null;
let session = null;
let guestSyncTimer = null;
function money(value) { return `${vnd.format(value)}đ`; }
function selectedPackage() { return packages.find((item) => item.id === state.packageId); }
function sizeModifier() { return { A5_PORTRAIT: 0, SQUARE: 20000, A6: -20000, A5_LANDSCAPE: 10000 }[state.size]; }
function pageModifier() { return { 12: 0, 16: 30000, 24: 60000 }[state.pages]; }
function firstCopy() { return selectedPackage().price + sizeModifier() + pageModifier(); }
function quote() { const first = firstCopy(); const twin = state.twin ? Math.round(first * .75) : 0; const shipping = state.shipments * 30000; return { first, twin, shipping, total: first + twin + shipping }; }
function save() { const persisted = { ...state, assetSlots: {} }; localStorage.setItem('melsou-demo', JSON.stringify(persisted)); const status = $('#saveStatus'); if (status) { status.textContent = '● Đang lưu…'; setTimeout(() => { status.textContent = '● Đã lưu trên máy'; }, 250); } if (!session && runtime) { clearTimeout(guestSyncTimer); guestSyncTimer = setTimeout(() => { syncGuestDraft(); }, 700); } }
function assetsDatabase() { return new Promise((resolve, reject) => { const request = indexedDB.open('melsou-guest-drafts', 1); request.onupgradeneeded = () => request.result.createObjectStore('assets'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); }); }
async function storeLocalAsset(slot, dataUrl) { const db = await assetsDatabase(); await new Promise((resolve, reject) => { const transaction = db.transaction('assets', 'readwrite'); transaction.objectStore('assets').put(dataUrl, `${state.draftKey}:${slot}`); transaction.oncomplete = resolve; transaction.onerror = () => reject(transaction.error); }); db.close(); }
async function restoreLocalAssets() { try { const db = await assetsDatabase(); const slots = assetSlots(); await Promise.all(slots.map(([slot]) => new Promise((resolve) => { const request = db.transaction('assets').objectStore('assets').get(`${state.draftKey}:${slot}`); request.onsuccess = () => { if (request.result) state.assetSlots[slot] = request.result; resolve(); }; request.onerror = resolve; }))); db.close(); renderStudio(); } catch { /* A draft can still be created if browser storage is unavailable. */ } }
function currentSlots() { return slotRules[state.template] || {}; }
function assetSlots() { return Object.entries(currentSlots()).filter(([slot]) => !slot.includes('letter') && !slot.includes('headline')); }
function textSlots() { return Object.entries(currentSlots()).filter(([slot]) => slot.includes('letter') || slot.includes('headline')); }
function projectDocument(assetIds = {}) {
  const content_bindings = {};
  assetSlots().forEach(([slot]) => { if (assetIds[slot]) content_bindings[slot] = { asset_id: assetIds[slot] }; });
  textSlots().forEach(([slot]) => { content_bindings[slot] = { text: state.textSlots[slot] || '' }; });
  return { template: { template_id: state.template, version: 1 }, configuration: { size: state.size, pages: state.pages }, content_bindings, options: { spotify_enabled: Boolean(state.spotify), spotify_url: state.spotify || null }, cover: { title: state.coverTitle || '' } };
}
async function syncGuestDraft() {
  if (!runtime || session) return;
  const body = { title: state.title, document: projectDocument() };
  try {
    const response = state.guestProjectId ? await fetch(`/api/guest/projects/${state.guestProjectId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, expectedRevision: state.guestProjectRevision }) }) : await fetch('/api/guest/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!response.ok) return;
    const payload = await response.json(); const project = payload.project;
    state.guestProjectId = project.id; state.guestProjectRevision = project.revision;
    localStorage.setItem('melsou-demo', JSON.stringify({ ...state, assetSlots: {} }));
  } catch { /* Local-first editing continues if a connection is unavailable. */ }
}
async function claimGuestDrafts() {
  if (!session || !state.guestProjectId) return;
  try {
    const response = await api('/api/guest/projects/claim', { method: 'POST' }); if (!response.ok) return;
    const { projects } = await response.json(); const claimed = projects.find((project) => project.id === state.guestProjectId);
    if (claimed) { state.projectId = claimed.id; state.projectRevision = claimed.revision; delete state.guestProjectId; delete state.guestProjectRevision; save(); }
  } catch { /* Checkout will surface a retriable save error if claiming was interrupted. */ }
}

function renderPackages() {
  $('#packageGrid').innerHTML = packages.map((item) => `<article class="package-card ${item.id === state.packageId ? 'selected' : ''}" aria-label="Gói ${item.label}">${item.best ? '<span class="best-tag">Phù hợp nhất để tặng</span>' : ''}<div class="package-card-top"><p class="eyebrow">${item.tag}</p><span class="package-index">0${packages.indexOf(item) + 1}</span></div><h3>${item.label}</h3><div class="package-price"><strong>${money(item.price)}</strong><span>giá khởi điểm</span></div><p>${item.copy}</p><ul>${item.perks.map((perk) => `<li><i>↗</i>${perk}</li>`).join('')}</ul><button data-package="${item.id}" class="${item.id === state.packageId ? 'secondary-button' : 'ghost-button'}" aria-pressed="${item.id === state.packageId}">${item.id === state.packageId ? 'Đang chọn' : 'Chọn gói này'} <span>→</span></button></article>`).join('');
  $$('[data-package]').forEach((button) => button.addEventListener('click', () => { state.packageId = button.dataset.package; save(); renderPackages(); renderQuote(); renderStudio(); }));
}
function renderTemplates() {
  $('#templateGrid').innerHTML = templates.map(([id, title, style], index) => `<button class="template-card template-${index + 1} ${state.template === id ? 'selected' : ''}" data-template="${id}"><span class="template-art" aria-hidden="true"><i></i><i></i></span><span class="template-meta"><small>${style}</small><b>${title}</b></span>${state.template === id ? '<em>Đang chọn</em>' : ''}</button>`).join('');
  $$('[data-template]').forEach((button) => button.addEventListener('click', () => { state.template = button.dataset.template; save(); renderTemplates(); renderStudio(); }));
}
function renderQuote() {
  const q = quote(); const p = selectedPackage();
  $('#quoteLines').innerHTML = `<div><span>${p.label}</span><b>${money(p.price)}</b></div><div><span>${state.size === 'A5_PORTRAIT' ? 'A5 đứng' : state.size === 'SQUARE' ? 'Khổ vuông' : state.size === 'A6' ? 'A6' : 'A5 ngang'}</span><b>${sizeModifier() ? (sizeModifier() > 0 ? '+' : '') + money(sizeModifier()) : 'Đã gồm'}</b></div><div><span>${state.pages} trang</span><b>${pageModifier() ? '+' + money(pageModifier()) : 'Đã gồm'}</b></div>${state.twin ? `<div><span>Album Twin (75%)</span><b>${money(q.twin)}</b></div>` : ''}<div><span>Giao hàng × ${state.shipments}</span><b>${money(q.shipping)}</b></div>`;
  $('#quoteTotal').textContent = money(q.total);
}
function selectControls(label, options, selected, key) { return `<div class="field"><label>${label}</label><div class="choice-row">${options.map(([value, name]) => `<button class="choice ${String(selected) === String(value) ? 'active' : ''}" data-choice="${key}" data-value="${value}">${name}</button>`).join('')}</div></div>`; }
function studioPhoto(slot, label, position) {
  const source = state.assetSlots[slot];
  const templateArtwork = `assets/template-${state.template}.png`;
  return `<div class="album-polaroid ${position} ${source ? 'has-upload' : 'template-placeholder'}">${source ? `<img src="${source}" alt="${label}"/>` : `<img src="${templateArtwork}" alt="Minh họa phong cách ${label}"/><span><b>⌑</b><small>${label}</small></span>`}</div>`;
}
function albumSpreadPreview() {
  const images = assetSlots();
  const note = state.note || state.textSlots[textSlots()[0]?.[0]] || 'Cảm ơn vì đã luôn ở bên, ngay cả những lúc mình không biết cần được ở bên…';
  const first = images[0] || ['image_01', 'Ảnh đầu tiên'];
  const second = images[1] || first;
  return `<div class="album-preview-wrap"><p class="album-preview-label">Xem trước trang đôi album <b>· Mở phẳng 180°</b></p><div class="album-spread"><section class="album-page album-letter"><span class="album-page-number">01</span><p>${note}</p><small>${templates.find(([id]) => id === state.template)[1]}</small></section><i class="album-gutter"></i><section class="album-page album-photo-page">${studioPhoto(first[0], first[1], 'polaroid-one')}${studioPhoto(second[0], second[1], 'polaroid-two')}</section></div></div>`;
}
function renderStudio() {
  const content = $('#studioContent'); if (!content) return;
  const templateName = templates.find(([id]) => id === state.template)[1];
  const stepViews = {
    1: `<div class="studio-panel studio-configuration"><p class="eyebrow">BƯỚC 01 / 04</p><h2>Chọn dáng hình<br>cho câu chuyện này.</h2><p class="studio-lede">Giá thay đổi ngay khi bạn chọn. Bố cục ảnh vẫn được giữ an toàn cho in layflat.</p>${selectControls('1. Gói album', packages.map((item) => [item.id, `${item.label} · ${money(item.price)}`]), state.packageId, 'packageId')}${selectControls('2. Khổ album', [['A5_PORTRAIT','A5 đứng · chuẩn'],['SQUARE','Khổ vuông · +20k'],['A6','A6 mini · −20k'],['A5_LANDSCAPE','A5 ngang · +10k']], state.size, 'size')}${selectControls('3. Số trang ruột', [[12,'12 trang · tiêu chuẩn'],[16,'16 trang · +30k'],[24,'24 trang · +60k']], state.pages, 'pages')}<label class="switch-row"><input type="checkbox" id="twinToggle" ${state.twin ? 'checked' : ''}/><span><b>Album Twin</b><small>In thêm một cuốn giống hệt, bằng 75% giá cuốn đầu.</small></span></label>${state.twin ? selectControls('Số lần giao', [[1,'1 địa chỉ'],[2,'2 địa chỉ']], state.shipments, 'shipments') : ''}<div class="template-summary"><span>Template đang chọn</span><b>${templateName}</b><button id="jumpTemplates" class="underlined-link">Đổi template</button></div></div>`,
    2: `<div class="studio-panel studio-content-panel"><div class="studio-panel-copy"><p class="eyebrow">BƯỚC 02 / 04</p><h2>Để ký ức<br>được mở ra đẹp.</h2><p class="studio-lede">Mỗi ảnh sẽ xuất hiện như một trang được đặt có chủ ý, không phải một ô trống vô cảm.</p><div class="upload-stack">${assetSlots().map(([slot, label]) => `<label class="image-upload" data-image-upload="${slot}"><input type="file" data-image-slot="${slot}" accept="image/jpeg,image/png,image/webp,image/heic,image/heif"/><span class="upload-icon">${state.assetSlots[slot] ? '✓' : '⌑'}</span><span><b>${state.assetSlots[slot] ? `${label} đã sẵn sàng` : label}</b><small>Chạm để chọn hoặc kéo-thả ảnh vào đây · JPG, PNG, WebP, HEIC · tối đa 8 MB</small></span></label>`).join('')}</div>${textSlots().map(([slot, label]) => `<label class="field">${label}<textarea data-text-slot="${slot}" maxlength="400" placeholder="Viết điều bạn muốn giữ lại…">${state.textSlots[slot] || ''}</textarea></label>`).join('')}<label class="field">Lời nhắn <small>(tùy chọn)</small><textarea id="noteInput" maxlength="220" placeholder="Một ngày nào đó, chúng mình sẽ lại nhìn cuốn này và mỉm cười.">${state.note}</textarea></label></div>${albumSpreadPreview()}<p class="quiet-note studio-print-note">Mẫu ${templateName} khóa nhịp và vùng an toàn để ảnh, chữ luôn ổn khi in.</p></div>`,
    3: `<div class="studio-panel studio-cover-panel"><div><p class="eyebrow">BƯỚC 03 / 04</p><h2>Đặt một cái tên<br>cho kỷ niệm này.</h2><div class="cover-fields"><label>Tiêu đề bìa<textarea id="coverTitle" maxlength="60">${state.coverTitle}</textarea></label><label>Spotify link <small>(tùy chọn)</small><input id="spotifyUrl" type="url" value="${state.spotify}" placeholder="https://open.spotify.com/..." /></label><p class="quiet-note">QR Spotify chỉ xuất hiện ở bìa sau, theo đúng vùng template đã kiểm soát.</p></div></div><div class="cover-editor"><div class="mini-cover"><span>${state.coverTitle.replaceAll('\n','<br>')}</span><small>MELSOU · MEMORY EDITION</small></div><p>Ảnh bìa và tiêu đề được cân lại theo template <b>${templateName}</b>.</p></div></div>`,
    4: `<div class="studio-panel"><p class="eyebrow">BƯỚC 04 / 04</p><h2>Sẵn sàng để<br>mang kỷ niệm về nhà.</h2><div class="review-card"><div class="review-cover">${state.coverTitle.replaceAll('\n','<br>')}</div><div><span class="status-chip green">✓ SẴN SÀNG KIỂM TRA</span><h3>${state.title}</h3><p>${selectedPackage().label} · ${state.pages} trang · ${templateName}</p><ul><li>✓ Nội dung được ghim vào template đã chọn</li><li>✓ Giá được tính lại trên máy chủ khi tạo đơn</li><li>ⓘ File in chỉ được tạo sau thanh toán và prepress</li></ul></div></div><button class="primary-button" id="reviewContinue">Xem giá & tiếp tục <span>→</span></button></div>`
  };
  content.innerHTML = stepViews[state.step];
  $$('.choice').forEach((button) => button.addEventListener('click', () => { const key = button.dataset.choice; const value = button.dataset.value; state[key] = ['pages','shipments'].includes(key) ? Number(value) : value; save(); renderStudio(); renderQuote(); renderPackages(); }));
  $('#twinToggle')?.addEventListener('change', (event) => { state.twin = event.target.checked; state.shipments = state.twin ? 2 : 1; save(); renderStudio(); renderQuote(); });
  $('#jumpTemplates')?.addEventListener('click', () => { $('#studioDialog').close(); document.querySelector('#templates').scrollIntoView({ behavior: 'smooth' }); });
  const ingestImage = (slot, file) => { if (!file) return; if (file.size > 8 * 1024 * 1024) { alert('Melsou chỉ nhận ảnh dưới 8 MB.'); return; } const reader = new FileReader(); reader.onload = async () => { state.assetSlots[slot] = reader.result; await storeLocalAsset(slot, reader.result); save(); renderStudio(); }; reader.readAsDataURL(file); };
  $$('[data-image-slot]').forEach((picker) => picker.addEventListener('change', (event) => ingestImage(picker.dataset.imageSlot, event.target.files[0])));
  $$('[data-image-upload]').forEach((dropZone) => {
    dropZone.addEventListener('dragover', (event) => { event.preventDefault(); dropZone.classList.add('is-dragging'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('is-dragging'));
    dropZone.addEventListener('drop', (event) => { event.preventDefault(); dropZone.classList.remove('is-dragging'); ingestImage(dropZone.dataset.imageUpload, event.dataTransfer.files[0]); });
  });
  $$('[data-text-slot]').forEach((input) => input.addEventListener('input', (event) => { state.textSlots[input.dataset.textSlot] = event.target.value; save(); }));
  $('#noteInput')?.addEventListener('input', (event) => { state.note = event.target.value; save(); });
  $('#coverTitle')?.addEventListener('input', (event) => { state.coverTitle = event.target.value; save(); });
  $('#spotifyUrl')?.addEventListener('input', (event) => { state.spotify = event.target.value; save(); });
  $('#reviewContinue')?.addEventListener('click', () => $('#continueOrder').click());
  $('#openOwnerFromStudio')?.addEventListener('click', openOwner);
  $('#projectTitle') && ($('#projectTitle').value = state.title, $('#projectTitle').addEventListener('input', (event) => { state.title = event.target.value; save(); }));
  $$('.step').forEach((button) => { button.classList.toggle('active', Number(button.dataset.step) === state.step); button.addEventListener('click', () => { state.step = Number(button.dataset.step); save(); renderStudio(); }); });
}
function openStudio() { $('#studioDialog').showModal(); renderStudio(); renderQuote(); }
async function loadRuntime() {
  try {
    const response = await fetch('/api/public-config', { cache: 'no-store' });
    if (!response.ok) return;
    runtime = await response.json();
    if (runtime.supabaseUrl && runtime.supabaseAnonKey && window.supabase) {
      supabaseClient = window.supabase.createClient(runtime.supabaseUrl, runtime.supabaseAnonKey);
      ({ data: { session } } = await supabaseClient.auth.getSession());
      if (session) await claimGuestDrafts(); else await syncGuestDraft();
      supabaseClient.auth.onAuthStateChange(async (_event, nextSession) => { session = nextSession; if (session) await claimGuestDrafts(); });
    }
  } catch { /* The local visual server deliberately has no production API. */ }
}
async function api(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (session?.access_token) headers.set('Authorization', `Bearer ${session.access_token}`);
  return fetch(path, { ...options, headers });
}
async function requireGoogleLogin() {
  if (session) return true;
  if (!supabaseClient) { alert('Chưa có cấu hình Google Sign-In. Hãy hoàn tất Supabase trước khi bật đặt hàng.'); return false; }
  const { error } = await supabaseClient.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}${window.location.pathname}` } });
  if (error) alert('Không thể mở Google Sign-In. Vui lòng thử lại.');
  return false;
}
async function uploadSlot(projectId, slot, dataUrl) {
  if (state.assetIds?.[slot]) return state.assetIds[slot];
  const blob = await (await fetch(dataUrl)).blob();
  const response = await api(`/api/projects/${projectId}/assets`, { method: 'POST', headers: { 'Content-Type': blob.type || 'application/octet-stream' }, body: blob });
  if (!response.ok) throw new Error('IMAGE_UPLOAD_FAILED');
  const { asset } = await response.json();
  state.assetIds ||= {}; state.assetIds[slot] = asset.id; save();
  return asset.id;
}
async function syncProject() {
  const initialDocument = projectDocument();
  if (!state.projectId) {
    const created = await api('/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: state.title, document: initialDocument }) });
    if (!created.ok) throw new Error('PROJECT_CREATE_FAILED');
    const { project } = await created.json();
    state.projectId = project.id; state.projectRevision = project.revision; save();
  }
  const assetIds = {};
  for (const [slot] of assetSlots()) {
    if (!state.assetSlots[slot]) throw new Error(`MISSING_IMAGE:${slot}`);
    assetIds[slot] = await uploadSlot(state.projectId, slot, state.assetSlots[slot]);
  }
  const updated = await api(`/api/projects/${state.projectId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ expectedRevision: state.projectRevision, document: projectDocument(assetIds) }) });
  if (!updated.ok) throw new Error(updated.status === 409 ? 'PROJECT_CHANGED_ELSEWHERE' : 'PROJECT_SAVE_FAILED');
  const { project } = await updated.json(); state.projectRevision = project.revision; save();
  return state.projectId;
}
function shipmentFromForm(form, prefix = '') {
  return { recipient: form.elements[`${prefix}recipient`].value.trim(), phone: form.elements[`${prefix}phone`].value.trim(), address: form.elements[`${prefix}address`].value.trim() };
}
function showCheckout() {
  $('#checkoutIdentity').textContent = session?.user?.email ? `Đăng nhập bằng ${session.user.email}` : '';
  $('#secondShipment').checked = false; $('#secondShipment').closest('label').hidden = !state.twin;
  $('#secondAddress').innerHTML = '';
  $('#checkoutDialog').showModal();
}
function setSecondAddress(open) {
  $('#secondAddress').innerHTML = open ? '<div class="second-shipment"><p class="eyebrow">ĐỊA CHỈ CUỐN TWIN</p><label>Người nhận<input name="second_recipient" required maxlength="100" /></label><label>Số điện thoại<input name="second_phone" required maxlength="30" inputmode="tel" /></label><label>Địa chỉ giao hàng<textarea name="second_address" required maxlength="500"></textarea></label></div>' : '';
}
async function openOwner() {
  if (!await requireGoogleLogin()) return;
  const table = $('#ownerOrderTable'); table.innerHTML = '<p class="quiet-note">Đang tải dữ liệu…</p>'; $('#ownerDialog').showModal();
  const response = await api('/api/owner/orders');
  if (!response.ok) { table.innerHTML = '<p class="quiet-note">Tài khoản này không có quyền Owner hoặc dashboard chưa được cấu hình.</p>'; return; }
  const { orders } = await response.json(); const awaiting = orders.filter((order) => order.status === 'AWAITING_PAYMENT').length; const prepress = orders.filter((order) => order.status === 'PREPRESS_REVIEW').length;
  $('#ownerGreeting').textContent = `Có ${orders.length} đơn gần đây`;
  $('#ownerMetrics').innerHTML = `<article><span>Chờ thanh toán</span><b>${awaiting}</b><small>SePay đang đối soát</small></article><article><span>Chờ prepress</span><b>${prepress}</b><small>Chỉ Owner được duyệt</small></article><article><span>Đã thanh toán</span><b>${orders.filter((order) => order.status === 'PAID').length}</b><small>Chờ render</small></article><article><span>Khớp lỗi</span><b>${orders.filter((order) => order.status === 'PAYMENT_MISMATCH').length}</b><small>Cần kiểm tra</small></article>`;
  table.innerHTML = `<div class="order-row heading"><span>Mã đơn</span><span>Template</span><span>Trạng thái</span><span>Tổng</span></div>${orders.map((order) => `<div class="order-row"><span>${order.order_code}</span><span>${order.production_snapshots?.template_id || '—'}</span><span class="status-chip">${order.status}</span><span>${money(order.expected_amount_vnd)}</span></div>`).join('') || '<p class="quiet-note">Chưa có đơn hàng.</p>'}`;
}
async function placeOrder(event) {
  event.preventDefault();
  const button = $('#placeOrder'); const message = $('#checkoutMessage'); button.disabled = true; message.textContent = 'Đang kiểm tra thiết kế và tạo đơn…';
  try {
    const projectId = await syncProject(); const form = event.currentTarget;
    const first = shipmentFromForm(form); const secondSeparate = state.twin && $('#secondShipment').checked;
    const shipments = state.twin ? [first, secondSeparate ? shipmentFromForm(form, 'second_') : first] : [first];
    const response = await api('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId, configuration: { packageCode: state.packageId, size: state.size, pages: state.pages, twin: state.twin, shipments: state.shipments }, shipments }) });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'ORDER_CREATION_FAILED');
    const payment = runtime?.payment || {}; const bank = payment.accountNumber ? `Chuyển ${money(payload.order.expected_amount_vnd)} với nội dung ${payload.order.order_code} đến ${payment.accountNumber}${payment.bankCode ? ` (${payment.bankCode})` : ''}.` : `Đơn ${payload.order.order_code} đã được tạo. Thông tin chuyển khoản sẽ hiện khi SePay được cấu hình.`;
    message.textContent = `✓ Đơn ${payload.order.order_code} đã tạo. ${bank}`;
  } catch (error) {
    const readable = String(error.message || error).startsWith('MISSING_IMAGE') ? 'Bạn cần chọn đủ ảnh bắt buộc của template.' : error.message === 'TBD_PRINT_VENDOR' || error.message === 'PRINT_PROFILE_NOT_READY' ? 'Melsou chưa được bật hồ sơ in thực tế.' : error.message === 'PROJECT_CHANGED_ELSEWHERE' ? 'Thiết kế này vừa được chỉnh ở nơi khác. Vui lòng mở lại Studio.' : 'Chưa thể tạo đơn. Vui lòng kiểm tra lại thông tin và thử lại.';
    message.textContent = readable;
  } finally { button.disabled = false; }
}
function init() {
  renderPackages(); renderTemplates();
  $('#startDesign').addEventListener('click', openStudio); $('#heroDesign').addEventListener('click', openStudio); $('#editorialDesign').addEventListener('click', openStudio); $$('[data-open-studio]').forEach((button) => button.addEventListener('click', openStudio));
  $('#openTracking').addEventListener('click', () => $('#trackingDialog').showModal()); $('#footerTracking').addEventListener('click', () => $('#trackingDialog').showModal()); $('#openOwner').addEventListener('click', openOwner);
  $$('[data-close]').forEach((button) => button.addEventListener('click', () => button.closest('dialog').close()));
  $('#continueOrder').addEventListener('click', async () => { if (await requireGoogleLogin()) showCheckout(); });
  $('#secondShipment').addEventListener('change', (event) => setSecondAddress(event.target.checked));
  $('#checkoutForm').addEventListener('submit', placeOrder);
  $('#trackingDemo').addEventListener('click', async () => { const code = $('#trackingDialog input').value.trim(); const message = $('#trackingMessage'); if (!code) { message.textContent = 'Nhập mã đơn để tra cứu.'; return; } message.textContent = 'Đang tra cứu…'; try { const response = await fetch(`/api/tracking/${encodeURIComponent(code)}`); const payload = await response.json(); message.textContent = response.ok ? `${payload.order.orderCode}: ${payload.order.status}${payload.order.shipments.length ? ` · ${payload.order.shipments.map((shipment) => shipment.status).join(', ')}` : ''}` : 'Không tìm thấy đơn hàng.'; } catch { message.textContent = 'Chưa thể kết nối hệ thống tra cứu.'; } });
  loadRuntime();
  restoreLocalAssets();
}
init();
