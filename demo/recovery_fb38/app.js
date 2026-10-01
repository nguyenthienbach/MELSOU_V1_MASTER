/* ============================================================
   🌟 MELSOU MASTER FRONTEND ENGINE V12.0 (REAL SUPABASE GOOGLE OAUTH) 🌟
============================================================ */

const SCHEMA_VERSION = 'v12.0_real_supabase_google_oauth';
const EXTRA_SPREAD_PRICE = 15000; // 15.000đ / 1 trang đôi (2 trang ruột)
var appliedCartVoucher = null;

const STICKER_SETS = [
  // 0: Cảm xúc & Facebook Reactions
  ['💖', '❤️‍🔥', '🥰', '😍', '🥺', '💌', '🧸', '💍', '💐', '🌹', '🍒', '🍓', '✨', '💫', '🌟', '💞'],
  // 1: Hoa khô & Lá ép Vintage
  ['🌸', '🌺', '🌻', '🌷', '🌼', '🌿', '🍃', '🍂', '🍁', '🍀', '🌾', '🕯️', '📜', '🏷️', '📮', '🔖'],
  // 2: Kỷ niệm & Du lịch
  ['📷', '🎞️', '✈️', '🏖️', '🌅', '☕', '🧋', '🎂', '🎈', '🎀', '🎧', '🎵', '🎸', '🚗', '🎡', '🎉'],
  // 3: Cute Icons & Thú cưng
  ['🐱', '🐶', '🐰', '🐻', '🐼', '🐣', '🦄', '🧁', '🍩', '🍫', '🎨', '🌈', '👑', '🪄', '🍓', '🍭'],
  // 4: Sáp niêm phong & Wax Seal
  ['🔴', '📮', '🏷️', '🎀', '🔖', '📜', '💍', '✨']
];

const TEMPLATES_DATA = [
  {
    id: 'first-love',
    nameVi: 'Tình đầu trong veo',
    nameEn: 'Pure First Love',
    taglineVi: 'Tình yêu đầu, góc quán quen và những lời tỏ tình giấu kín',
    taglineEn: 'First love, warm familiar cafe corners, and secret sweet confessions',
    tagVi: 'Chọn mẫu này →',
    tagEn: 'Use this template →',
    coverImg: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=800&auto=format&fit=crop&q=80',
    spread1: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&auto=format&fit=crop&q=80',
    spread2: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80',
    title: 'FIRST LOVE',
    quoteVi: 'Mỗi ánh nhìn là một lần tim rung lên khe khẽ.',
    quoteEn: 'Every glance makes my heart skip a gentle beat.',
    quote: 'Mỗi ánh nhìn là một lần tim rung lên khe khẽ.'
  },
  {
    id: 'graduation',
    nameVi: 'Mùa tốt nghiệp',
    nameEn: 'Graduation Memories',
    taglineVi: 'Kỷ yếu thanh xuân, tà áo cử nhân và hoa tươi trao tay',
    taglineEn: 'Graduation memories, graduation gowns, and fresh hand-tied bouquets',
    tagVi: 'Chọn mẫu này →',
    tagEn: 'Use this template →',
    coverImg: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80',
    spread1: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=600&auto=format&fit=crop&q=80',
    spread2: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&auto=format&fit=crop&q=80',
    title: 'OUR GRADUATION',
    quoteVi: 'Thanh xuân rực rỡ nhất dưới khoảng trời sân trường.',
    quoteEn: 'Youth shines brightest under our cherished campus skies.',
    quote: 'Thanh xuân rực rỡ nhất dưới khoảng trời sân trường.'
  },
  {
    id: 'besties',
    nameVi: 'Hội bạn thân',
    nameEn: 'Best Friends',
    taglineVi: 'Tụ họp nhóm bạn thân, máy ảnh film và tiếng cười rộn rã',
    taglineEn: 'Gathering with best friends, film cameras, and joyful laughter',
    tagVi: 'Chọn mẫu này →',
    tagEn: 'Use this template →',
    coverImg: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&auto=format&fit=crop&q=80',
    spread1: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&auto=format&fit=crop&q=80',
    spread2: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80',
    title: 'BESTIES ARCHIVE',
    quoteVi: 'Không cần hẹn trước, gặp nhau là rôm rả cả ngày.',
    quoteEn: 'No plans needed; just being together makes the whole day bright.',
    quote: 'Không cần hẹn trước, gặp nhau là rôm rả cả ngày.'
  },
  {
    id: 'somewhere',
    nameVi: 'Hành trình bên nhau',
    nameEn: 'Our Journey',
    taglineVi: 'Khung cảnh hoàng hôn biển và những cung đường xa xôi',
    taglineEn: 'Sunset ocean vistas and scenic roads traveled together',
    tagVi: 'Chọn mẫu này →',
    tagEn: 'Use this template →',
    coverImg: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
    spread1: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&auto=format&fit=crop&q=80',
    spread2: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80',
    title: 'SOMEWHERE TOGETHER',
    quoteVi: 'Đi đâu cũng được, miễn là được đi cùng nhau.',
    quoteEn: 'Anywhere is fine, as long as we are together.',
    quote: 'Đi đâu cũng được, miễn là được đi cùng nhau.'
  },
  {
    id: 'memory-box',
    nameVi: 'Hộp kỷ vật hoài niệm',
    nameEn: 'Memory Box Album',
    taglineVi: 'Giấy Kraft mộc mạc lưu giữ những điều trân quý',
    taglineEn: 'Rustic Kraft paper preserving your most cherished moments',
    tagVi: 'Chọn mẫu này →',
    tagEn: 'Use this template →',
    coverImg: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&auto=format&fit=crop&q=80',
    spread1: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&auto=format&fit=crop&q=80',
    spread2: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80',
    title: 'MEMORY BOX',
    quoteVi: 'Lưu giữ nguyên vẹn những gì đáng trân quý nhất.',
    quoteEn: 'Preserving what is most precious close to heart.',
    quote: 'Lưu giữ nguyên vẹn những gì đáng trân quý nhất.'
  },
  {
    id: 'sweet-romance',
    nameVi: 'Tình nồng say',
    nameEn: 'Sweet Romance',
    taglineVi: 'Tone đỏ rượu vang Burgundy và hoa hồng nhung ấm áp',
    taglineEn: 'Warm burgundy wine tones paired with velvet red roses',
    tagVi: 'Chọn mẫu này →',
    tagEn: 'Use this template →',
    coverImg: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=800&auto=format&fit=crop&q=80',
    spread1: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&auto=format&fit=crop&q=80',
    spread2: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
    title: 'SWEET ROMANCE',
    quoteVi: 'Tình yêu như ly rượu vang, càng ủ lâu càng nồng nàn.',
    quoteEn: 'Love is like vintage wine, growing richer with every passing year.',
    quote: 'Tình yêu như ly rượu vang, càng ủ lâu càng nồng nàn.'
  },
  {
    id: 'fandom',
    nameVi: 'Đêm hòa nhạc',
    nameEn: 'Concert Era',
    taglineVi: 'Ánh đèn sân khấu rực rỡ và giai điệu thần tượng hòa ca',
    taglineEn: 'Vibrant stage lights, crowd cheers, and unforgettable anthems',
    tagVi: 'Chọn mẫu này →',
    tagEn: 'Use this template →',
    coverImg: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
    spread1: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
    spread2: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&auto=format&fit=crop&q=80',
    title: 'CONCERT ERA',
    quoteVi: 'Hòa mình vào biển ánh sáng và khúc ca tuổi trẻ.',
    quoteEn: 'Immerse in a sea of lights and the soundtrack of our youth.',
    quote: 'Hòa mình vào biển ánh sáng và khúc ca tuổi trẻ.'
  },
  {
    id: 'healing',
    nameVi: 'Năm tháng thanh xuân',
    nameEn: 'Cherished Youth',
    taglineVi: 'Tone xanh lá chữa lành, tìm về an yên trong tâm hồn',
    taglineEn: 'Calming botanical greenery bringing peace and gentle memories',
    tagVi: 'Chọn mẫu này →',
    tagEn: 'Use this template →',
    coverImg: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&auto=format&fit=crop&q=80',
    spread1: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=80',
    spread2: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&auto=format&fit=crop&q=80',
    title: 'SILENT HEALING',
    quoteVi: 'Tìm lại sự tĩnh lặng giữa nhịp sống hối hả.',
    quoteEn: 'Finding quiet peace and stillness amidst the rush of life.',
    quote: 'Tìm lại sự tĩnh lặng giữa nhịp sống hối hả.'
  }
];

// ════════ 📐 CANONICAL ALBUM FORMAT STATE (FB77) ════════
const ALBUM_FORMATS = {
  'ratio-portrait': {
    id: 'a5-portrait',
    ratioClass: 'ratio-portrait',
    cardId: 'sizeCardA5',
    nameVi: 'A5 Đứng',
    nameEn: 'A5 Portrait',
    dimsVi: '15 × 21 cm',
    dimsEn: '15 × 21 cm',
    singleWidth: 330,
    singleHeight: 460,
    spreadWidth: 672,
    spreadHeight: 460,
    priceDelta: 0
  },
  'ratio-square': {
    id: 'square-20',
    ratioClass: 'ratio-square',
    cardId: 'sizeCardSquare',
    nameVi: 'Khổ Vuông',
    nameEn: 'Square 20×20',
    dimsVi: '20 × 20 cm',
    dimsEn: '20 × 20 cm',
    singleWidth: 440,
    singleHeight: 440,
    spreadWidth: 892,
    spreadHeight: 440,
    priceDelta: 0
  },
  'ratio-landscape': {
    id: 'a5-landscape',
    ratioClass: 'ratio-landscape',
    cardId: 'sizeCardLandscape',
    nameVi: 'A5 Ngang',
    nameEn: 'A5 Landscape',
    dimsVi: '21 × 15 cm',
    dimsEn: '21 × 15 cm',
    singleWidth: 490,
    singleHeight: 350,
    spreadWidth: 992,
    spreadHeight: 350,
    priceDelta: 0
  },
  'ratio-mini': {
    id: 'a6-mini',
    ratioClass: 'ratio-mini',
    cardId: 'sizeCardMini',
    nameVi: 'A6 Mini',
    nameEn: 'A6 Mini',
    dimsVi: '10 × 15 cm',
    dimsEn: '10 × 15 cm',
    singleWidth: 320,
    singleHeight: 480,
    spreadWidth: 652,
    spreadHeight: 480,
    priceDelta: 0
  }
};

// ════════════════════════════════════════════════════════════
// 📐 FB85: UNIFIED CONTAINER & VIEWPORT RESPONSIVE ARCHITECTURE
// ════════════════════════════════════════════════════════════
function getViewportTier() {
  const w = window.innerWidth;
  if (w < 768) return 'compact'; // Mobile (< 768px)
  if (w < 1180) return 'medium'; // Tablet (768px - 1179.98px)
  return 'wide'; // Desktop (>= 1180px)
}

function isMobileViewport() {
  return window.innerWidth < 768;
}

function isTabletViewport() {
  const w = window.innerWidth;
  return w >= 768 && w < 1180;
}

function isDesktopViewport() {
  return window.innerWidth >= 1180;
}

function syncResponsiveDeviceClasses() {
  if (typeof document === 'undefined' || !document.body) return;
  const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  const tier = getViewportTier();

  document.body.classList.toggle('tier-compact', tier === 'compact');
  document.body.classList.toggle('tier-medium', tier === 'medium');
  document.body.classList.toggle('tier-wide', tier === 'wide');
  document.body.classList.toggle('is-touch-device', isTouch);
  document.body.classList.toggle('is-pointer-device', !isTouch);
}

function getCurrentAlbumFormat() {
  const sc = (typeof ALBUM_DATA !== 'undefined' && ALBUM_DATA.sizeClass) || 'ratio-portrait';
  return ALBUM_FORMATS[sc] || ALBUM_FORMATS['ratio-portrait'];
}

function getFreshAlbumData() {
  return {
    version: SCHEMA_VERSION,
    title: 'Bản thiết kế mới',
    quote: '',
    salutation: 'Gửi người thương,',
    message: '',
    signature: '— melsou —',
    letterFont: "'Lora', serif",
    inkColor: '#1A1A1A',
    spotifyUrl: null,
    spotifyTrack: null,
    spotifyTrackId: null,
    spotifyTrackObj: null,
    spotifyArtwork: null,
    spotifyCodeImg: null,
    spotifyEmbed: null,
    package: 'signature',
    basePrice: 199000,
    sizeAdj: 0,
    sizeClass: 'ratio-portrait',
    albumFormat: {
      id: 'a5-portrait',
      ratioClass: 'ratio-portrait',
      widthMm: 150,
      heightMm: 210,
      orientation: 'portrait',
      priceDelta: 0
    },
    extraSpreadsCount: 0,
    activeSpreadIndex: 0,
    recordedAudioBlob: null,
    isHomeRecording: false,
    activePhotoSlot: null,
    photoTransforms: {},
    userGallery: [],
    spreads: [
      {
        id: 'cover',
        name: 'Bìa Trước',
        isClosedCover: true,
        coverImg: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=800&auto=format&fit=crop&q=80',
        elements: []
      },
      {
        id: 'spread-1',
        name: 'Trang 2–3',
        leftType: 'spotify-hero',
        elements: []
      },
      {
        id: 'spread-2',
        name: 'Trang 4–5',
        elements: []
      },
      {
        id: 'spread-3',
        name: 'Trang 6–7',
        elements: []
      },
      {
        id: 'spread-4',
        name: 'Trang 8–9',
        elements: []
      },
      {
        id: 'spread-5',
        name: 'Trang 10–11',
        leftType: 'handwritten-letter',
        elements: []
      },
      {
        id: 'back-cover',
        name: 'Bìa Sau',
        isClosedBack: true,
        backImg: '',
        elements: []
      }
    ],
    cart: []
  };
}

let ALBUM_DATA = getFreshAlbumData();

// ── LOCALSTORAGE SAFE SYNC ──
// ── INDEXEDDB PERSISTENCE HELPER (FB92: Unlimited Quota Local Draft Store) ──
const MELSOU_IDB_NAME = 'melsou_studio_v1';
const MELSOU_IDB_STORE = 'drafts';
let melsouIdbInstance = null;

function getMelsouIdb() {
  if (melsouIdbInstance) return Promise.resolve(melsouIdbInstance);
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(MELSOU_IDB_NAME, 1);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(MELSOU_IDB_STORE)) {
          db.createObjectStore(MELSOU_IDB_STORE, { keyPath: 'id' });
        }
      };
      req.onsuccess = (e) => {
        melsouIdbInstance = e.target.result;
        resolve(melsouIdbInstance);
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function melsouEnsureDataUrl(url) {
  if (!url || typeof url !== 'string' || !url.startsWith('blob:')) return url;
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result || url);
      reader.onerror = () => resolve(url);
      reader.readAsDataURL(blob);
    });
  } catch {
    return url;
  }
}

async function melsouSaveDraftToDb(draft) {
  try {
    const db = await getMelsouIdb();
    if (!db) return;

    let persistentDraft = draft;
    try {
      const serialized = JSON.stringify(draft);
      if (serialized && serialized.includes('"blob:')) {
        persistentDraft = JSON.parse(serialized);
        if (Array.isArray(persistentDraft.userGallery)) {
          persistentDraft.userGallery = await Promise.all(
            persistentDraft.userGallery.map(u => (typeof u === 'string' && u.startsWith('blob:')) ? melsouEnsureDataUrl(u) : u)
          );
        }
        if (Array.isArray(persistentDraft.spreads)) {
          for (const s of persistentDraft.spreads) {
            if (s.coverImg && s.coverImg.startsWith('blob:')) s.coverImg = await melsouEnsureDataUrl(s.coverImg);
            if (s.backImg && s.backImg.startsWith('blob:')) s.backImg = await melsouEnsureDataUrl(s.backImg);
            if (Array.isArray(s.elements)) {
              for (const el of s.elements) {
                if (el.img && el.img.startsWith('blob:')) el.img = await melsouEnsureDataUrl(el.img);
              }
            }
          }
        }
      }
    } catch {
      persistentDraft = draft;
    }

    const tx = db.transaction(MELSOU_IDB_STORE, 'readwrite');
    const store = tx.objectStore(MELSOU_IDB_STORE);
    store.put({ id: 'active_draft', data: persistentDraft, updatedAt: Date.now() });
  } catch (e) {
    console.warn('[Melsou IDB] save error:', e);
  }
}

async function melsouLoadDraftFromDb() {
  try {
    const db = await getMelsouIdb();
    if (!db) return null;
    return new Promise((resolve) => {
      const tx = db.transaction(MELSOU_IDB_STORE, 'readonly');
      const store = tx.objectStore(MELSOU_IDB_STORE);
      const req = store.get('active_draft');
      req.onsuccess = () => resolve(req.result?.data || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

function prepareDraftForLocalStorage(draft) {
  if (!draft || typeof draft !== 'object') return draft;
  const clone = JSON.parse(JSON.stringify(draft));
  if (Array.isArray(clone.userGallery)) {
    clone.userGallery = clone.userGallery.filter(url => typeof url === 'string' && !url.startsWith('blob:'));
  }
  if (Array.isArray(clone.spreads)) {
    clone.spreads.forEach(s => {
      if (typeof s.coverImg === 'string' && s.coverImg.startsWith('blob:')) {
        s.coverImg = '';
        s._coverImgPending = true;
      }
      if (typeof s.backImg === 'string' && s.backImg.startsWith('blob:')) {
        s.backImg = '';
        s._backImgPending = true;
      }
      if (Array.isArray(s.elements)) {
        s.elements.forEach(el => {
          if (typeof el.img === 'string' && el.img.startsWith('blob:')) {
            el.img = '';
            el._imgPending = true;
          }
        });
      }
    });
  }
  return clone;
}

function pruneHeavyData(data) {
  if (!data || typeof data !== 'object') return data;
  const clone = JSON.parse(JSON.stringify(data));
  if (Array.isArray(clone.userGallery)) {
    clone.userGallery = clone.userGallery.filter(url => !url.startsWith('data:') && !url.startsWith('blob:')).slice(0, 10);
  }
  if (Array.isArray(clone.spreads)) {
    clone.spreads.forEach(s => {
      if (s.coverImg && ((s.coverImg.startsWith('data:') && s.coverImg.length > 50000) || s.coverImg.startsWith('blob:'))) {
        if (s.coverImg.startsWith('blob:')) s._coverImgPending = true;
        s.coverImg = '';
      }
      if (s.backImg && ((s.backImg.startsWith('data:') && s.backImg.length > 50000) || s.backImg.startsWith('blob:'))) {
        if (s.backImg.startsWith('blob:')) s._backImgPending = true;
        s.backImg = '';
      }
      if (Array.isArray(s.elements)) {
        s.elements.forEach(el => {
          if (el.img && ((el.img.startsWith('data:') && el.img.length > 50000) || el.img.startsWith('blob:'))) {
            if (el.img.startsWith('blob:')) el._imgPending = true;
            el.img = '';
          }
        });
      }
    });
  }
  return clone;
}

// ── LOCALSTORAGE & INDEXEDDB SAFE SYNC ──
function autoSaveToLocalStorage() {
  try {
    ALBUM_DATA.version = SCHEMA_VERSION;
    melsouSaveDraftToDb(ALBUM_DATA);
    try {
      localStorage.setItem('melsou_active_draft', JSON.stringify(prepareDraftForLocalStorage(ALBUM_DATA)));
    } catch (quotaErr) {
      try {
        localStorage.setItem('melsou_active_draft', JSON.stringify(pruneHeavyData(prepareDraftForLocalStorage(ALBUM_DATA))));
      } catch (_) {}
    }
    // The auth bridge is deliberately notified after the browser backup succeeds.
    // It mirrors the draft to the server using the opaque guest session; it never
    // treats localStorage as proof that somebody is signed in.
    window.melsouOnDraftChanged?.();
  } catch(e) {}
}

// Explicit, narrow integration surface for the authentication/persistence bridge.
// `let ALBUM_DATA` is not a window property, so do not access it indirectly.
window.melsouGetActiveDraft = () => ALBUM_DATA;
window.melsouApplyCanonicalDraft = (draft) => {
  if (!draft || !Array.isArray(draft.spreads)) return false;
  // A project revision is design data, not cart ownership. Preserve only the
  // cart already established in this browser/session and ignore legacy carts
  // that may still exist inside an older canonical editor payload.
  const activeCart = Array.isArray(ALBUM_DATA?.cart) ? ALBUM_DATA.cart : [];
  const currentData = ALBUM_DATA || {};
  const designDraft = Object.assign({}, draft);
  delete designDraft.cart;

  // SAFELY PRESERVE LOCAL IMAGES: If incoming draft has null/empty image for an element/cover,
  // but current local data has a valid image, retain the local image!
  if (Array.isArray(designDraft.spreads) && Array.isArray(currentData.spreads)) {
    designDraft.spreads.forEach((spread, sIdx) => {
      const curSpread = currentData.spreads[sIdx];
      if (!curSpread) return;
      const isValidLocalSource = (src) => typeof src === 'string' && src && !src.startsWith('blob:');
      if (!spread.coverImg && isValidLocalSource(curSpread.coverImg)) spread.coverImg = curSpread.coverImg;
      if (!spread.backImg && isValidLocalSource(curSpread.backImg)) spread.backImg = curSpread.backImg;
      if (Array.isArray(spread.elements) && Array.isArray(curSpread.elements)) {
        spread.elements.forEach(el => {
          const curEl = curSpread.elements.find(e => String(e.id) === String(el.id));
          if (curEl && isValidLocalSource(curEl.img) && !el.img) {
            el.img = curEl.img;
            if (curEl.crop && !el.crop) el.crop = curEl.crop;
          }
        });
      }
    });
  }

  // Preserve userGallery
  if (Array.isArray(currentData.userGallery) && currentData.userGallery.length > 0) {
    const existing = new Set(designDraft.userGallery || []);
    const mergedGallery = [...(designDraft.userGallery || [])];
    currentData.userGallery.forEach(img => {
      if (!existing.has(img)) {
        mergedGallery.push(img);
        existing.add(img);
      }
    });
    designDraft.userGallery = mergedGallery;
  }

  ALBUM_DATA = Object.assign(getFreshAlbumData(), designDraft, { cart: activeCart });
  ALBUM_DATA.spreads.forEach(s => normalizeElementsToSafeArea(s));
  ALBUM_DATA.extraSpreadsCount = ALBUM_DATA.spreads.filter(s => s.isCustomAdded).length;
  melsouSaveDraftToDb(ALBUM_DATA);
  try {
    localStorage.setItem('melsou_active_draft', JSON.stringify(prepareDraftForLocalStorage(ALBUM_DATA)));
  } catch (quotaErr) {
    try {
      localStorage.setItem('melsou_active_draft', JSON.stringify(pruneHeavyData(prepareDraftForLocalStorage(ALBUM_DATA))));
    } catch (_) {}
  }
  if (studioWorkspaceInitialized && typeof renderStudioWorkspace === 'function') renderStudioWorkspace();
  if (typeof updateCartBadge === 'function') updateCartBadge();
  return true;
};

function loadFromLocalStorage() {
  try {
    const saved = localStorage.getItem('melsou_active_draft');
    if (saved) {
      let parsed = JSON.parse(saved);
      if (parsed.version === SCHEMA_VERSION && parsed.spreads && parsed.spreads.length >= 7) {
        parsed = prepareDraftForLocalStorage(parsed);
        ALBUM_DATA = Object.assign(getFreshAlbumData(), parsed);
        if (!ALBUM_DATA.albumFormat) {
          const sc = ALBUM_DATA.sizeClass || 'ratio-portrait';
          ALBUM_DATA.albumFormat = ALBUM_FORMATS[sc] || ALBUM_FORMATS['ratio-portrait'];
        }
        if (Array.isArray(ALBUM_DATA.spreads)) {
          ALBUM_DATA.spreads.forEach(s => normalizeElementsToSafeArea(s));
        }
      }
    }
  } catch(e) {}
  if (!ALBUM_DATA) ALBUM_DATA = getFreshAlbumData();

  // Asynchronously hydrate any full images stored in IndexedDB
  if (typeof window !== 'undefined') {
    melsouLoadDraftFromDb().then(idbDraft => {
      if (idbDraft && Array.isArray(idbDraft.spreads) && idbDraft.version === SCHEMA_VERSION) {
        let hasNewImages = false;
        idbDraft.spreads.forEach((s, sIdx) => {
          const curSpread = ALBUM_DATA.spreads?.[sIdx];
          if (!curSpread) return;
          const needsHydration = (val) => !val || (typeof val === 'string' && val.startsWith('blob:'));
          if (needsHydration(curSpread.coverImg) && s.coverImg && !s.coverImg.startsWith('blob:')) {
            curSpread.coverImg = s.coverImg;
            curSpread._coverImgPending = false;
            hasNewImages = true;
          }
          if (needsHydration(curSpread.backImg) && s.backImg && !s.backImg.startsWith('blob:')) {
            curSpread.backImg = s.backImg;
            curSpread._backImgPending = false;
            hasNewImages = true;
          }
          if (Array.isArray(s.elements) && Array.isArray(curSpread.elements)) {
            s.elements.forEach(el => {
              const curEl = curSpread.elements.find(e => String(e.id) === String(el.id));
              if (curEl && needsHydration(curEl.img) && el.img && !el.img.startsWith('blob:')) {
                curEl.img = el.img;
                curEl._imgPending = false;
                hasNewImages = true;
              }
            });
          }
        });
        if (Array.isArray(idbDraft.userGallery) && idbDraft.userGallery.length > (ALBUM_DATA.userGallery?.length || 0)) {
          ALBUM_DATA.userGallery = idbDraft.userGallery;
          hasNewImages = true;
        }
        if (hasNewImages && studioWorkspaceInitialized && typeof renderStudioWorkspace === 'function') {
          renderStudioWorkspace();
        }
      }
    }).catch(() => {});
  }
}

// ── STUDIO CURSIVE FONTS LAZY LOADER ──
let studioCursiveFontsPromise = null;
let studioWorkspaceInitialized = false;
function loadStudioCursiveFonts() {
  if (studioCursiveFontsPromise) return studioCursiveFontsPromise;
  studioCursiveFontsPromise = new Promise((resolve) => {
    if (typeof document === 'undefined') return resolve();
    const existing = document.getElementById('studioCursiveFontsLink');
    if (existing) {
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => resolve()).catch(() => resolve());
      } else {
        resolve();
      }
      return;
    }
    const link = document.createElement('link');
    link.id = 'studioCursiveFontsLink';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@600;700&family=Caveat:wght@600;700&display=swap';
    link.onload = () => {
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => resolve()).catch(() => resolve());
      } else {
        resolve();
      }
    };
    link.onerror = () => resolve();
    document.head.appendChild(link);
  });
  return studioCursiveFontsPromise;
}
window.loadStudioCursiveFonts = loadStudioCursiveFonts;

function ensureStudioInitialized() {
  initTemplateCards();
  if (studioWorkspaceInitialized) return;
  studioWorkspaceInitialized = true;
  renderStudioWorkspace();
  initStudioTouchGestures();
}

// ── NAVIGATION & PAGES ──
function showPage(pageId) {
  if (pageId === 'studio') {
    loadStudioCursiveFonts();
    ensureStudioInitialized();
    setTimeout(() => applyStudioTranslations(currentAppLanguage), 20);
  }
  autoSaveToLocalStorage();
  document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
  const target = document.getElementById('page-' + pageId);
  if (target) target.classList.add('active');
  if (pageId === 'home') {
    target?.querySelectorAll(':scope > .hero, :scope > section').forEach((section) => { section.style.display = ''; });
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (pageId === 'studio') {
    document.body.classList.add('in-studio');
    document.body.classList.add('studio-mode-active');
    document.body.classList.add('page-studio-active');
    renderStudioWorkspace();
    adjustMobileStageScale();
    if (isMobileViewport()) {
      collapseFilmstripTray();
    }
  } else {
    document.body.classList.remove('in-studio');
    document.body.classList.remove('studio-mode-active');
    document.body.classList.remove('page-studio-active');
    if (pageId === 'home') {
      syncHeroLiveBook();
    }
  }
}

function scrollToSection(sectionId) {
  showPage('home');
  setTimeout(() => {
    const el = document.getElementById(sectionId);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }, 100);
}

// ── USER AUTH & DROPDOWN ──
let currentUser = { id: '', name: '', username: '', email: '', avatar: '', role: 'CUSTOMER', loggedIn: false };
window.currentUser = currentUser;
let pendingAuthContext = null;

/* ============================================================
   🔐 MELSOU LOGIN UI & CODEX AUTH INTEGRATION INTERFACE
   - Phục vụ 100% Frontend UI/UX: Modal, nút Google, loading, error, success
   - Backend Google OAuth / Supabase Auth do Codex kết nối sau
============================================================ */

const MelsouAuth = {
  state: 'idle', // 'idle' | 'loading' | 'authenticating' | 'success' | 'error' | 'cancelled'

  // 1. Hook khởi chạy khi người dùng bấm nút "Tiếp tục với Google"
  startGoogleSignIn() {
    this.setLoginState('loading');
    console.log('[MelsouAuth] startGoogleSignIn() triggered -> Awaiting backend Codex connection.');

    // Chuyển tiếp sự kiện cho Codex nếu đã định nghĩa hook
    if (typeof window.codexHandleGoogleSignIn === 'function') {
      window.codexHandleGoogleSignIn();
    } else if (typeof window.onGoogleSignIn === 'function') {
      window.onGoogleSignIn();
    } else {
      // Safe preview UX fallback (trở lại trạng thái idle sau 1.2s, không giả lập tài khoản)
      setTimeout(() => {
        if (this.state === 'loading') {
          this.setLoginState('idle');
        }
      }, 1200);
    }
  },

  // 2. Hàm điều khiển trạng thái UI (Codex dùng hàm này để drive giao diện)
  setLoginState(state, errorMsg = '') {
    this.state = state;
    const btn = document.getElementById('googleSignInBtn');
    const btnText = document.getElementById('googleSignInBtnText');
    const spinner = document.getElementById('googleSignInSpinner');
    const errorBox = document.getElementById('authModalErrorBox');
    const errorMsgEl = document.getElementById('authModalErrorMessage');

    if (state === 'idle') {
      if (btn) { btn.disabled = false; btn.style.opacity = '1'; btn.style.cursor = 'pointer'; }
      if (spinner) spinner.style.display = 'none';
      if (btnText) btnText.textContent = 'Tiếp tục với Google';
      if (errorBox) errorBox.style.display = 'none';
    } else if (state === 'loading' || state === 'authenticating') {
      if (btn) { btn.disabled = true; btn.style.opacity = '0.7'; btn.style.cursor = 'not-allowed'; }
      if (spinner) spinner.style.display = 'inline-block';
      if (btnText) btnText.textContent = 'Đang kết nối với Google...';
      if (errorBox) errorBox.style.display = 'none';
    } else if (state === 'error') {
      if (btn) { btn.disabled = false; btn.style.opacity = '1'; btn.style.cursor = 'pointer'; }
      if (spinner) spinner.style.display = 'none';
      if (btnText) btnText.textContent = 'Tiếp tục với Google';
      if (errorBox) {
        errorBox.style.display = 'flex';
        if (errorMsgEl) errorMsgEl.textContent = errorMsg || 'Không thể đăng nhập. Vui lòng thử lại.';
      }
    } else if (state === 'cancelled') {
      this.setLoginState('idle');
    } else if (state === 'success') {
      this.setLoginState('idle');
      closeAuthModal();
    }
  },

  // 3. Hàm cập nhật session khi Codex xác thực thành công
  handleAuthSuccess(user) {
    currentUser = {
      loggedIn: true,
      id: user?.id || '',
      name: user?.name || user?.user_metadata?.full_name || 'Khách hàng',
      username: user?.username || user?.name || '',
      email: user?.email || '',
      avatar: user?.avatar || user?.user_metadata?.avatar_url || '',
      role: String(user?.role || 'CUSTOMER').toUpperCase()
    };
    window.currentUser = currentUser;
    updateHeaderUserUI();
    this.setLoginState('success');
  },

  logout() {
    currentUser = { id: '', name: '', username: '', email: '', avatar: '', role: 'CUSTOMER', loggedIn: false };
    window.currentUser = currentUser;
    if (typeof closeOwnerDashboardModal === 'function') closeOwnerDashboardModal();
    if (typeof closeBlogAdminModal === 'function') closeBlogAdminModal();
    if (typeof closeOwnerSupportInbox === 'function') closeOwnerSupportInbox();
    // The real Supabase sign-out is supplied by auth-client.js. This UI method
    // only clears presentation state; browser storage never establishes identity.
    window.codexHandleLogout?.();
    updateHeaderUserUI();
    const menu = document.getElementById('userDropdownMenu');
    if (menu) menu.classList.remove('open');
  }
};

// Global shorthand hooks for Codex & UI
function startGoogleSignIn() { MelsouAuth.startGoogleSignIn(); }
function onGoogleSignIn() { MelsouAuth.startGoogleSignIn(); }

function initUserAuthState() {
  // Authentication state comes only from Supabase in auth-client.js.
  // Never restore a name/email from localStorage as an authenticated account.
  updateHeaderUserUI();
}

function toggleUserDropdown(e) {
  if (e) e.stopPropagation();
  const menu = document.getElementById('userDropdownMenu');
  if (currentUser.loggedIn) {
    if (menu) menu.classList.toggle('open');
  } else {
    if (menu) menu.classList.remove('open');
    openAuthModal('login', { type: 'account' });
  }
}

function switchAuthTab(tab) {
  const tabsContainer = document.getElementById('authMainTabs');
  const btnLogin = document.getElementById('authTabBtnLogin');
  const btnRegister = document.getElementById('authTabBtnRegister');
  const panelLogin = document.getElementById('authPanelLogin');
  const panelRegister = document.getElementById('authPanelRegister');
  const panelForgot = document.getElementById('authPanelForgot');
  const heading = document.getElementById('authModalHeading');
  const subheading = document.getElementById('authModalSubheading');
  const errorBox = document.getElementById('authModalErrorBox');
  const errorMsg = document.getElementById('authModalErrorMessage');

  if (errorBox) errorBox.style.display = 'none';
  if (errorMsg) errorMsg.textContent = '';

  if (tab === 'login') {
    if (tabsContainer) tabsContainer.style.display = 'flex';
    if (btnLogin) btnLogin.classList.add('active');
    if (btnRegister) btnRegister.classList.remove('active');
    if (panelLogin) panelLogin.classList.add('active');
    if (panelRegister) panelRegister.classList.remove('active');
    if (panelForgot) panelForgot.classList.remove('active');
    if (heading) heading.textContent = currentAppLanguage === 'en' ? 'Melsou Account' : 'Tài khoản Melsou';
    if (subheading) subheading.textContent = currentAppLanguage === 'en' ? 'Log in to save your designs and track print orders' : 'Đăng nhập để lưu trữ bản thiết kế và theo dõi đơn in ấn';
  } else if (tab === 'register') {
    if (tabsContainer) tabsContainer.style.display = 'flex';
    if (btnLogin) btnLogin.classList.remove('active');
    if (btnRegister) btnRegister.classList.add('active');
    if (panelLogin) panelLogin.classList.remove('active');
    if (panelRegister) panelRegister.classList.add('active');
    if (panelForgot) panelForgot.classList.remove('active');
    if (heading) heading.textContent = currentAppLanguage === 'en' ? 'Create Account' : 'Đăng ký tài khoản';
    if (subheading) subheading.textContent = currentAppLanguage === 'en' ? 'Join Melsou to preserve your cherished memories' : 'Tạo tài khoản để lưu trữ không giới hạn bản thiết kế của bạn';
  } else if (tab === 'forgot') {
    if (tabsContainer) tabsContainer.style.display = 'none';
    if (panelLogin) panelLogin.classList.remove('active');
    if (panelRegister) panelRegister.classList.remove('active');
    if (panelForgot) panelForgot.classList.add('active');
    if (heading) heading.textContent = currentAppLanguage === 'en' ? 'Reset Password' : 'Đặt lại mật khẩu';
    if (subheading) subheading.textContent = currentAppLanguage === 'en' ? 'Enter your registered email to receive reset instructions' : 'Nhập email để nhận liên kết đặt lại mật khẩu từ hệ thống';
  }
}

function togglePasswordVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    if (btn) btn.textContent = '🙈';
  } else {
    input.type = 'password';
    if (btn) btn.textContent = '👁️';
  }
}

function handleUsernameLoginSubmit() {
  const userInput = document.getElementById('loginUsernameInput');
  const passInput = document.getElementById('loginPasswordInput');
  const username = userInput ? userInput.value.trim() : '';
  const password = passInput ? passInput.value : '';
  const errorBox = document.getElementById('authModalErrorBox');
  const errorMsg = document.getElementById('authModalErrorMessage');

  if (errorBox) errorBox.style.display = 'none';
  if (errorMsg) errorMsg.textContent = '';

  if (!username || !password) {
    if (errorBox) errorBox.style.display = 'flex';
    if (errorMsg) errorMsg.textContent = currentAppLanguage === 'en' ? 'Please enter both username and password' : 'Vui lòng nhập đầy đủ tên tài khoản và mật khẩu';
    return;
  }

  // Contract hook for Codex backend
  if (typeof window.codexHandleNativeLogin === 'function') {
    window.codexHandleNativeLogin({ username, password }).catch(() => {});
  } else {
    window.codexOnAuthError(currentAppLanguage === 'en' ? 'Backend authentication is unavailable.' : 'Backend xác thực chưa sẵn sàng.');
  }
}

function handleUsernameRegisterSubmit() {
  const userInput = document.getElementById('regUsernameInput');
  const passInput = document.getElementById('regPasswordInput');
  const confirmInput = document.getElementById('regConfirmPasswordInput');
  const username = userInput ? userInput.value.trim() : '';
  const password = passInput ? passInput.value : '';
  const confirmPassword = confirmInput ? confirmInput.value : '';
  const errorBox = document.getElementById('authModalErrorBox');
  const errorMsg = document.getElementById('authModalErrorMessage');

  if (errorBox) errorBox.style.display = 'none';
  if (errorMsg) errorMsg.textContent = '';

  if (!username || !password || !confirmPassword) {
    if (errorBox) errorBox.style.display = 'flex';
    if (errorMsg) errorMsg.textContent = currentAppLanguage === 'en' ? 'Please fill in all registration fields' : 'Vui lòng điền đầy đủ tất cả thông tin đăng ký';
    return;
  }
  if (username.length < 3 || username.length > 30) {
    if (errorBox) errorBox.style.display = 'flex';
    if (errorMsg) errorMsg.textContent = currentAppLanguage === 'en' ? 'Username must be between 3 and 30 characters' : 'Tên tài khoản phải từ 3 đến 30 ký tự';
    return;
  }
  if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
    if (errorBox) errorBox.style.display = 'flex';
    if (errorMsg) errorMsg.textContent = currentAppLanguage === 'en' ? 'Username contains invalid characters (letters, numbers, underscores and dots only)' : 'Tên tài khoản chỉ được chứa chữ cái, số, dấu gạch dưới hoặc dấu chấm';
    return;
  }
  if (password.length < 12 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    if (errorBox) errorBox.style.display = 'flex';
    if (errorMsg) errorMsg.textContent = currentAppLanguage === 'en' ? 'Password must be at least 12 characters and contain a letter and a number' : 'Mật khẩu phải có tối thiểu 12 ký tự, gồm chữ và số';
    return;
  }
  if (password !== confirmPassword) {
    if (errorBox) errorBox.style.display = 'flex';
    if (errorMsg) errorMsg.textContent = currentAppLanguage === 'en' ? 'Passwords do not match.' : 'Mật khẩu xác nhận không khớp.';
    return;
  }

  // Contract hook for Codex backend
  if (typeof window.codexHandleNativeRegister === 'function') {
    window.codexHandleNativeRegister({ username, password }).catch(() => {});
  } else {
    window.codexOnAuthError(currentAppLanguage === 'en' ? 'Backend authentication is unavailable.' : 'Backend xác thực chưa sẵn sàng.');
  }
}

function handleLinkEmailSubmit() {
  const input = document.getElementById('settingsLinkEmailInput');
  const email = input ? input.value.trim() : '';
  if (!email || !email.includes('@')) {
    showToast(currentAppLanguage === 'en' ? 'Please enter a valid email address' : 'Vui lòng nhập địa chỉ email hợp lệ');
    return;
  }
  if (typeof window.codexHandleLinkEmail === 'function') {
    window.codexHandleLinkEmail({ email });
  } else {
    showToast(currentAppLanguage === 'en' ? `Email linked: "${email}" (Simulated - Waiting for Codex API)` : `Đã liên kết email: "${email}" (Mô phỏng - Chờ Codex kết nối API)`);
    const statusEl = document.getElementById('settingsLinkedEmailStatus');
    if (statusEl) {
      statusEl.textContent = email;
      statusEl.style.color = '#16a34a';
    }
    if (currentUser) currentUser.email = email;
    updateHeaderUserUI();
  }
}

// Global contract callbacks for Codex authentication
window.codexOnAuthSuccess = function(userData) {
  if (!userData) return;
  const returnContext = pendingAuthContext;
  pendingAuthContext = null;
  currentUser = {
    loggedIn: true,
    isGuest: false,
    id: userData.id || '',
    name: userData.username || userData.name || 'Khách hàng',
    username: userData.username || userData.name || '',
    email: userData.email || '',
    role: String(userData.role || 'CUSTOMER').toUpperCase()
  };
  window.currentUser = currentUser;
  updateHeaderUserUI();
  closeAuthModal();
  showToast(currentAppLanguage === 'en' ? `Welcome back, ${currentUser.name}!` : `Chào mừng bạn quay lại, ${currentUser.name}!`);
  if (returnContext?.type === 'checkout' && ALBUM_DATA.cart && ALBUM_DATA.cart.length > 0) {
    openCheckoutModal();
  } else if (returnContext?.type === 'blog' && returnContext.slug) {
    const blogPath = `/blog/${encodeURIComponent(returnContext.slug)}`;
    if (window.location.pathname !== blogPath) window.history.replaceState({ view: 'blog-detail', slug: returnContext.slug }, '', blogPath);
    window.updateBlogInteractionsAuthUI?.();
    requestAnimationFrame(() => {
      window.scrollTo({ top: Number(returnContext.scrollY || 0), behavior: 'auto' });
      const inputId = returnContext.kind === 'reply' && returnContext.commentId
        ? `blogReplyInput-${returnContext.commentId}`
        : 'blogCommentInput';
      document.getElementById(inputId)?.focus({ preventScroll: true });
    });
  }
};

// ── 🛡️ USER-FRIENDLY ERROR MAPPING ENGINE (UI TASK 06) ──
function getUserFriendlyErrorMessage(error, defaultFallback = '') {
  let rawCode = '';
  let rawMessage = '';

  if (typeof error === 'string') {
    rawCode = error.trim();
    rawMessage = error.trim();
  } else if (error && typeof error === 'object') {
    rawCode = String(error.code || error.error || '').trim();
    rawMessage = String(error.message || '').trim();
    // If code is empty but message is an identifier like UNAUTHENTICATED or MISSING_REQUIRED_SLOT
    if (!rawCode && rawMessage && /^[A-Za-z0-9_:-]+$/.test(rawMessage)) {
      rawCode = rawMessage;
    }
  }

  // Developer logging (never swallow)
  console.error('[Melsou Technical Error]', {
    code: rawCode,
    message: rawMessage,
    originalError: error
  });

  const isEn = (typeof currentAppLanguage !== 'undefined' && currentAppLanguage === 'en');
  const codeUpper = (rawCode || rawMessage).toUpperCase();
  const msgUpper = rawMessage.toUpperCase();
  const matches = (target) => codeUpper === target || msgUpper === target || codeUpper.startsWith(target + ':') || msgUpper.startsWith(target + ':') || codeUpper.startsWith(target) || msgUpper.startsWith(target);

  // Canonical Melsou Error Mappings
  if (matches('INVALID_SHIPMENTS') || matches('INVALID_SHIPMENT')) {
    return isEn ? 'Please check and verify your shipping details.' : 'Vui lòng kiểm tra lại thông tin giao hàng.';
  }
  if (matches('UNAUTHENTICATED') || matches('UNAUTHORIZED') || matches('AUTH_EXPIRED')) {
    return isEn ? 'Your session has expired. Please log in again.' : 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
  }
  if (matches('PREFLIGHT_BLOCKING_ERROR')) {
    return isEn ? 'Your design is missing some required content.' : 'Thiết kế của bạn còn thiếu một số nội dung bắt buộc.';
  }
  if (matches('MISSING_REQUIRED_SLOT')) {
    return isEn ? 'A required slot in your design is still empty.' : 'Một vị trí bắt buộc trong thiết kế vẫn chưa có nội dung.';
  }
  if (codeUpper === 'PAYMENT_NOT_CONFIGURED' || codeUpper === 'PAYMENT_MODE_NOT_CONFIGURED') {
    return isEn ? 'Payment system is currently under maintenance.' : 'Hệ thống thanh toán SePay đang được bảo trì.';
  }
  if (codeUpper === 'ORDER_NOT_CREATED') {
    return isEn ? 'Order could not be created. Please try again.' : 'Đơn hàng chưa được tạo. Vui lòng thử lại.';
  }
  if (codeUpper === 'INVALID_CREDENTIALS' || codeUpper === 'INVALID_PASSWORD') {
    return isEn ? 'Incorrect username or password.' : 'Tên đăng nhập hoặc mật khẩu không chính xác.';
  }
  if (codeUpper === 'INVALID_USERNAME') {
    return isEn ? 'This username is invalid.' : 'Tên tài khoản không hợp lệ.';
  }
  if (codeUpper === 'WEAK_PASSWORD') {
    return isEn ? 'The password does not meet the security requirements.' : 'Mật khẩu chưa đáp ứng yêu cầu bảo mật.';
  }
  if (codeUpper === 'USERNAME_TAKEN' || codeUpper === 'DUPLICATE_USERNAME' || codeUpper === 'USERNAME_EXISTS' || codeUpper === 'USER_ALREADY_EXISTS') {
    return isEn ? 'This username is already taken. Please choose another.' : 'Tên tài khoản này đã được sử dụng. Vui lòng chọn tên khác.';
  }
  if (codeUpper === 'RATE_LIMIT_NOT_CONFIGURED') {
    return isEn ? 'Rate limit protection is not configured on server.' : 'Máy chủ chưa cấu hình bảo vệ chống brute-force.';
  }
  if (codeUpper === 'RATE_LIMITED' || codeUpper === 'TOO_MANY_REQUESTS') {
    return isEn ? 'Too many requests. Please try again in a few moments.' : 'Bạn đã thao tác quá nhanh. Vui lòng thử lại sau giây lát.';
  }
  if (codeUpper === 'RECOVERY_EMAIL_REQUIRED') {
    return isEn ? 'Account does not have a linked recovery email.' : 'Tài khoản chưa liên kết email khôi phục.';
  }
  if (codeUpper === 'PROJECT_DOCUMENT_TOO_LARGE' || codeUpper === 'PAYLOAD_TOO_LARGE') {
    return isEn ? 'Design file is too large. Please reduce photo sizes.' : 'Kích thước tệp thiết kế quá lớn. Vui lòng giảm dung lượng ảnh.';
  }
  if (codeUpper === 'ASSET_UPLOAD_FAILED') {
    return isEn ? 'Failed to upload photo to server. Please try again.' : 'Tải ảnh lên máy chủ không thành công. Vui lòng thử lại.';
  }
  if (codeUpper === 'INVALID_CART_CONFIGURATION') {
    return isEn ? 'Invalid cart configuration.' : 'Thông tin cấu hình giỏ hàng không hợp lệ.';
  }
  if (codeUpper === 'INVALID_SPOTIFY_SELECTION') {
    return isEn ? 'Selected Spotify song is invalid.' : 'Bài hát Spotify đã chọn không hợp lệ.';
  }
  if (codeUpper === 'INVALID_SPOTIFY_QUERY') {
    return isEn ? 'Please enter a song title or artist.' : 'Vui lòng nhập tên bài hát hoặc ca sĩ.';
  }
  if (codeUpper === 'INVALID_SPOTIFY_TRACK_URL') {
    return isEn ? 'Invalid Spotify track link.' : 'Đường dẫn bài hát Spotify không hợp lệ.';
  }
  if (codeUpper === 'SPOTIFY_NOT_CONFIGURED') {
    return isEn ? 'Spotify is temporarily unavailable.' : 'Tính năng kết nối Spotify đang tạm thời gián đoạn.';
  }
  if (codeUpper === 'SPOTIFY_RATE_LIMITED') {
    return isEn ? 'Spotify search is busy. Please try again shortly.' : 'Tìm kiếm Spotify đang bận. Vui lòng thử lại sau giây lát.';
  }
  if (codeUpper === 'SPOTIFY_TRACK_NOT_FOUND') {
    return isEn ? 'Spotify track not found.' : 'Không tìm thấy bài hát Spotify tương ứng.';
  }
  if (codeUpper === 'SPOTIFY_NOT_ALLOWED_FOR_PACKAGE') {
    return isEn ? 'Spotify is not included in the Voice package.' : 'Gói Voice không bao gồm tính năng Spotify.';
  }
  if (codeUpper === 'SPOTIFY_CODE_GENERATION_FAILED') {
    return isEn ? 'Spotify Code could not be generated for this track.' : 'Không thể tạo mã Spotify cho bài hát này.';
  }
  if (codeUpper === 'REVISION_CONFLICT') {
    return isEn ? 'Design was updated elsewhere. Please refresh.' : 'Bản thiết kế đã cập nhật từ nơi khác. Vui lòng tải lại.';
  }
  if (codeUpper === 'INVALID_VOICE_SELECTION') {
    return isEn ? 'Voice recording is invalid.' : 'Tệp thu âm giọng nói không hợp lệ.';
  }
  if (codeUpper.includes('NETWORK_ERROR') || rawMessage.includes('Failed to fetch')) {
    return isEn ? 'Cannot connect to server. Please check your internet connection.' : 'Không thể kết nối máy chủ. Vui lòng kiểm tra lại đường truyền internet.';
  }

  // If rawCode/rawMessage looks like a technical error code (UPPERCASE, ContractError, etc.)
  const isTechnicalCode = /^[A-Z0-9_:-]+$/.test(rawCode) || /^[A-Z0-9_:-]+$/.test(rawMessage) || /^(ContractError|Error|TypeError|SyntaxError):/.test(rawMessage);
  if (isTechnicalCode) {
    return defaultFallback || (isEn ? 'An error occurred while processing. Please try again.' : 'Đã có lỗi xảy ra trong quá trình xử lý. Vui lòng thử lại.');
  }

  // If already a human-friendly string (contains spaces and lowercase letters)
  return rawMessage || defaultFallback || (isEn ? 'An error occurred. Please try again.' : 'Đã có lỗi xảy ra. Vui lòng thử lại.');
}

window.getUserFriendlyErrorMessage = getUserFriendlyErrorMessage;
window.addEventListener('melsou-spotify-code-updated', () => {
  if (typeof syncHeroLiveBook === 'function') syncHeroLiveBook();
});

window.codexOnAuthError = function(errMsg) {
  const errorBox = document.getElementById('authModalErrorBox');
  const errorMsg = document.getElementById('authModalErrorMessage');
  if (errorBox) errorBox.style.display = 'flex';
  const friendly = getUserFriendlyErrorMessage(errMsg, currentAppLanguage === 'en' ? 'Authentication failed. Please try again.' : 'Không thể xác thực. Vui lòng thử lại.');
  if (errorMsg) errorMsg.textContent = friendly;
};

function handleForgotPasswordSubmit() {
  const emailInput = document.getElementById('forgotEmailInput');
  const email = emailInput ? emailInput.value.trim() : '';
  const errorBox = document.getElementById('authModalErrorBox');
  const errorMsg = document.getElementById('authModalErrorMessage');

  if (!email) {
    if (errorBox) errorBox.style.display = 'flex';
    if (errorMsg) errorMsg.textContent = currentAppLanguage === 'en' ? 'Please enter your email address' : 'Vui lòng nhập địa chỉ email của bạn';
    return;
  }

  if (typeof window.codexHandleForgotPassword === 'function') {
    window.codexHandleForgotPassword({ email });
  } else {
    if (errorBox) errorBox.style.display = 'flex';
    if (errorMsg) errorMsg.textContent = currentAppLanguage === 'en' ? 'Backend authentication is not connected yet.' : 'Backend xác thực chưa được kết nối.';
  }
}

function openAuthModal(tab = 'login', returnContext = { type: 'account' }) {
  pendingAuthContext = returnContext;
  MelsouAuth.setLoginState('idle');
  switchAuthTab(tab);
  const modal = document.getElementById('authModal');
  if (modal) {
    modal.removeAttribute('inert');
    modal.setAttribute('aria-hidden', 'false');
    modal.querySelectorAll('input').forEach((input) => { input.disabled = false; });
    modal.classList.add('open');
    modal.style.display = 'flex';
  }
  document.body.style.overflow = 'hidden';
}

function closeAuthModal() {
  pendingAuthContext = null;
  MelsouAuth.setLoginState('idle');
  const modal = document.getElementById('authModal');
  if (modal) {
    modal.querySelectorAll('input').forEach((input) => { input.disabled = true; });
    modal.setAttribute('aria-hidden', 'true');
    modal.setAttribute('inert', '');
    modal.classList.remove('open');
    modal.style.display = 'none';
  }
  document.body.style.overflow = '';
}

/* ============================================================
   📜 POLICY MODALS CONTROLLER (PRIVACY & WARRANTY / TERMS)
   ============================================================ */
const policyModalState = {
  parentModal: null,
  previousScrollY: 0,
  previousPath: null
};

function openPrivacyPolicyModal(event) {
  if (event) {
    if (typeof event.preventDefault === 'function') event.preventDefault();
    if (typeof event.stopPropagation === 'function') event.stopPropagation();
  }
  const authModal = document.getElementById('authModal');
  const isAuthOpen = authModal && (authModal.classList.contains('open') || authModal.style.display === 'flex');

  if (isAuthOpen) {
    policyModalState.parentModal = 'authModal';
  } else {
    policyModalState.parentModal = null;
    policyModalState.previousScrollY = window.scrollY || window.pageYOffset || 0;
    policyModalState.previousPath = window.location.pathname + window.location.search + window.location.hash;
    try {
      window.history.pushState({ modal: 'privacyPolicyModal' }, '', '/chinh-sach-bao-mat');
    } catch (e) {}
  }

  const modal = document.getElementById('privacyPolicyModal');
  if (modal) {
    modal.classList.add('open');
    modal.classList.add('policy-modal-backdrop');
    modal.style.display = 'flex';
    modal.setAttribute('aria-modal', 'true');
    document.body.style.overflow = 'hidden';
    const firstBtn = modal.querySelector('.modal-close-btn') || modal.querySelector('button');
    if (firstBtn) firstBtn.focus();
  }
}

function closePrivacyPolicyModal(skipHistory) {
  const modal = document.getElementById('privacyPolicyModal');
  if (modal) {
    modal.classList.remove('open');
    modal.style.display = 'none';
  }
  handlePolicyModalClosed('privacyPolicyModal', skipHistory);
}

function openWarrantyPolicyModal(event) {
  if (event) {
    if (typeof event.preventDefault === 'function') event.preventDefault();
    if (typeof event.stopPropagation === 'function') event.stopPropagation();
  }
  const authModal = document.getElementById('authModal');
  const isAuthOpen = authModal && (authModal.classList.contains('open') || authModal.style.display === 'flex');

  if (isAuthOpen) {
    policyModalState.parentModal = 'authModal';
  } else {
    policyModalState.parentModal = null;
    policyModalState.previousScrollY = window.scrollY || window.pageYOffset || 0;
    policyModalState.previousPath = window.location.pathname + window.location.search + window.location.hash;
    try {
      window.history.pushState({ modal: 'warrantyPolicyModal' }, '', '/chinh-sach-bao-hanh');
    } catch (e) {}
  }

  const modal = document.getElementById('warrantyPolicyModal');
  if (modal) {
    modal.classList.add('open');
    modal.classList.add('policy-modal-backdrop');
    modal.style.display = 'flex';
    modal.setAttribute('aria-modal', 'true');
    document.body.style.overflow = 'hidden';
    const firstBtn = modal.querySelector('.modal-close-btn') || modal.querySelector('button');
    if (firstBtn) firstBtn.focus();
  }
}

function closeWarrantyPolicyModal(skipHistory) {
  const modal = document.getElementById('warrantyPolicyModal');
  if (modal) {
    modal.classList.remove('open');
    modal.style.display = 'none';
  }
  handlePolicyModalClosed('warrantyPolicyModal', skipHistory);
}

function handlePolicyModalClosed(modalId, skipHistory) {
  const wasDirect = !!window.__policyModalDirectAccess;
  const parent = policyModalState.parentModal;
  const prevScroll = policyModalState.previousScrollY || 0;
  const prevPath = policyModalState.previousPath;

  policyModalState.parentModal = null;

  if (parent === 'authModal') {
    // Return to auth modal cleanly, keep inputs intact and body scroll locked
    document.body.style.overflow = 'hidden';
    return;
  }

  // Restore body scroll
  document.body.style.overflow = '';

  if (wasDirect) {
    window.__policyModalDirectAccess = false;
    if (!skipHistory) {
      if (window.history.length > 1) {
        window.history.back();
        setTimeout(() => {
          if (window.location.pathname.includes('chinh-sach')) {
            try {
              window.history.replaceState({}, '', '/');
            } catch (e) {}
            if (typeof showPage === 'function') showPage('home');
          }
        }, 200);
      } else {
        try {
          window.history.replaceState({}, '', '/');
        } catch (e) {}
        if (typeof showPage === 'function') showPage('home');
      }
    }
  } else {
    // Return to previous path & scroll position
    if (!skipHistory && window.location.pathname.includes('chinh-sach')) {
      try {
        window.history.replaceState({}, '', prevPath || '/');
      } catch (e) {}
    }
    window.scrollTo({ top: prevScroll, behavior: 'instant' });
  }
}

// Global exposure
window.openPrivacyPolicyModal = openPrivacyPolicyModal;
window.closePrivacyPolicyModal = closePrivacyPolicyModal;
window.openWarrantyPolicyModal = openWarrantyPolicyModal;
window.closeWarrantyPolicyModal = closeWarrantyPolicyModal;

// Listen for browser back/forward buttons
window.addEventListener('popstate', function () {
  const privacyModal = document.getElementById('privacyPolicyModal');
  const warrantyModal = document.getElementById('warrantyPolicyModal');
  if (privacyModal && (privacyModal.classList.contains('open') || privacyModal.style.display === 'flex')) {
    closePrivacyPolicyModal(true);
  }
  if (warrantyModal && (warrantyModal.classList.contains('open') || warrantyModal.style.display === 'flex')) {
    closeWarrantyPolicyModal(true);
  }
});

function updateHeaderUserUI() {
  const authBtn = document.getElementById('headerAuthBtn');
  const dict = (typeof MELSOU_I18N !== 'undefined' && MELSOU_I18N[currentAppLanguage]) ? MELSOU_I18N[currentAppLanguage] : null;
  const label = dict?.authBtnLabel || (currentAppLanguage === 'en' ? 'Account' : 'Tài khoản');
  if (authBtn) {
    authBtn.innerHTML = (currentUser && currentUser.loggedIn)
      ? `👤 <span class="auth-btn-label" id="headerAuthBtnLabel">${currentUser.name}</span>`
      : `👤 <span class="auth-btn-label" id="headerAuthBtnLabel">${label}</span>`;
  }
  const dName = document.getElementById('dropdownUserName');
  const dEmail = document.getElementById('dropdownUserEmail');
  if (dName) dName.textContent = currentUser?.name || (currentAppLanguage === 'en' ? 'Customer' : 'Khách hàng');
  if (dEmail) dEmail.textContent = currentUser?.email || '';
  const ownerLink = document.getElementById('udLinkOwnerDashboard');
  const mndOwnerItem = document.getElementById('mndItemOwnerDashboard');
  const isOwner = Boolean(currentUser && currentUser.loggedIn && currentUser.role === 'OWNER');
  if (ownerLink) {
    ownerLink.style.display = isOwner ? 'block' : 'none';
  }
  if (mndOwnerItem) {
    mndOwnerItem.style.display = isOwner ? 'block' : 'none';
  }
  if (isOwner) {
    window.refreshWordPressConnectionStatus?.();
  }
  if (typeof updateBlogInteractionsAuthUI === 'function') {
    updateBlogInteractionsAuthUI();
  }
}

// ════════════════════════════════════════════════════════════
// 👑 OWNER DASHBOARD & WORDPRESS CMS FRONTEND CONTROLLER
// ════════════════════════════════════════════════════════════
// [Security Notice] Trạng thái OWNER phía frontend chỉ dùng để hiển thị UI.
// Mọi endpoint OWNER/WordPress vẫn phải được backend xác thực session và role độc lập.
let wordPressConnectionState = {
  connected: false,
  site: '',
  message: 'Chưa thiết lập liên kết WordPress OAuth.'
};

window.codexSetWordPressConnectionStatus = function(state = {}) {
  wordPressConnectionState = { ...wordPressConnectionState, ...state };
  const badge = document.getElementById('wpConnectionBadge');
  const details = document.getElementById('wpConnectionDetails');
  const btn = document.getElementById('wpConnectBtn');
  if (!badge) return;

  if (wordPressConnectionState.connected) {
    badge.className = 'wp-status-badge connected';
    badge.innerHTML = '🟢 Đã kết nối';
    if (details) details.textContent = wordPressConnectionState.site ? `Trang web: ${wordPressConnectionState.site}` : 'Đã kết nối với WordPress CMS';
    if (btn) btn.innerHTML = 'Kết nối lại WordPress';
  } else {
    badge.className = 'wp-status-badge disconnected';
    badge.innerHTML = '⚪ Chưa kết nối';
    if (details) details.textContent = wordPressConnectionState.message || 'Chưa thiết lập liên kết WordPress OAuth';
    if (btn) btn.innerHTML = 'Kết nối WordPress';
  }
};

window.refreshWordPressConnectionStatus = async function() {
  if (!currentUser || !currentUser.loggedIn || currentUser.role !== 'OWNER') return;
  try {
    let status = null;
    if (typeof window.codexGetWordPressStatus === 'function') {
      status = await window.codexGetWordPressStatus();
    } else {
      const res = await fetch('/api/owner/wordpress/status', {
        headers: { Accept: 'application/json' },
        credentials: 'include'
      });
      if (res.ok) status = await res.json();
    }
    if (status && typeof status.connected === 'boolean') {
      window.codexSetWordPressConnectionStatus({
        connected: status.connected,
        site: status.site || status.site_name || status.site_url || '',
        message: status.message || (status.connected ? 'Đã kết nối' : 'Chưa thiết lập liên kết WordPress OAuth')
      });
    }
  } catch (e) {
    console.warn('[Melsou] refreshWordPressConnectionStatus failed:', e?.message);
  }
};

window.openOwnerDashboardModal = function() {
  if (!currentUser || !currentUser.loggedIn || currentUser.role !== 'OWNER') {
    console.warn('[Melsou Security] Access denied: OWNER role required.');
    alert('Chức năng này chỉ dành riêng cho Quản trị viên (OWNER).');
    return;
  }
  const dropdown = document.getElementById('userDropdownMenu');
  if (dropdown) dropdown.classList.remove('open');
  const modal = document.getElementById('ownerDashboardModal');
  if (modal) {
    modal.classList.add('open');
    modal.style.display = 'flex';
  }
  // Khi mở Dashboard, trạng thái kết nối luôn được lấy từ backend
  window.refreshWordPressConnectionStatus?.();
  // Khởi tạo và tải danh sách kiểm duyệt bình luận Blog cho OWNER
  window.initOwnerBlogCommentsModeration?.();
};

window.closeOwnerDashboardModal = function() {
  const modal = document.getElementById('ownerDashboardModal');
  if (modal) {
    modal.classList.remove('open');
    modal.style.display = 'none';
  }
};

window.onWordPressConnectClick = function() {
  if (!currentUser || !currentUser.loggedIn || currentUser.role !== 'OWNER') {
    console.warn('[Melsou Security] Access denied: OWNER role required.');
    alert('Chức năng này chỉ dành riêng cho Quản trị viên (OWNER).');
    return;
  }
  // [Security Notice] Nút kết nối chỉ gọi window.codexHandleWordPressConnect();
  // không tự tạo authorization URL và không chứa client secret/token.
  try {
    if (typeof window.codexHandleWordPressConnect === 'function') {
      window.codexHandleWordPressConnect();
    } else {
      console.info('[Melsou] window.codexHandleWordPressConnect hook ready for backend integration');
    }
  } catch (err) {
    console.error('[Melsou] WordPress connect error:', err);
  }
};

window.handleWordPressOAuthCallbackPage = async function() {
  const modal = document.getElementById('wpOAuthCallbackModal');
  const icon = document.getElementById('wpOAuthStatusIcon');
  const heading = document.getElementById('wpOAuthHeading');
  const message = document.getElementById('wpOAuthMessage');
  const detailsBox = document.getElementById('wpOAuthDetailsBox');
  const actionBtn = document.getElementById('wpOAuthActionBtn');

  if (modal) {
    modal.classList.add('open');
    modal.style.display = 'flex';
  }

  const urlParams = new URLSearchParams(window.location.search);
  const code = (urlParams.get('code') || '').trim();
  const state = (urlParams.get('state') || '').trim();
  const error = (urlParams.get('error') || '').trim();
  const errorDesc = (urlParams.get('error_description') || urlParams.get('message') || '').trim();

  if (error) {
    if (icon) icon.textContent = '❌';
    if (heading) heading.textContent = 'Kết nối WordPress thất bại';
    if (message) message.textContent = 'Quá trình xác thực WordPress OAuth đã bị từ chối hoặc gặp lỗi từ nhà cung cấp.';
    if (detailsBox) {
      detailsBox.style.display = 'block';
      detailsBox.textContent = `Lỗi: ${errorDesc || error}`;
    }
    if (actionBtn) {
      actionBtn.style.display = 'inline-flex';
      actionBtn.textContent = 'Quay về trang chủ';
      actionBtn.onclick = () => { window.location.href = '/'; };
    }
    return;
  }

  // Bắt buộc phải có cả code và state hợp lệ (không rỗng). Nếu thiếu, tuyệt đối không gọi backend.
  if (!code || !state) {
    if (icon) icon.textContent = '⚠️';
    if (heading) heading.textContent = 'Thiếu tham số xác thực OAuth';
    if (message) message.textContent = 'Phản hồi OAuth không hợp lệ: Yêu cầu phải có đầy đủ cả mã ủy quyền (code) và chuỗi bảo mật (state).';
    if (detailsBox) {
      detailsBox.style.display = 'block';
      const missing = [];
      if (!code) missing.push('code');
      if (!state) missing.push('state');
      detailsBox.textContent = `Tham số bị thiếu hoặc rỗng: [${missing.join(', ')}]. Để phòng chống tấn công CSRF, yêu cầu không được chuyển tiếp tới backend.`;
    }
    if (actionBtn) {
      actionBtn.style.display = 'inline-flex';
      actionBtn.textContent = 'Quay về trang chủ';
      actionBtn.onclick = () => { window.location.href = '/'; };
    }
    return; // Dừng ngay, tuyệt đối không gọi backend
  }

  if (icon) icon.textContent = '⏳';
  if (heading) heading.textContent = 'Đang hoàn tất kết nối WordPress...';
  if (message) message.textContent = 'Đang gửi authorization code và state tới máy chủ Melsou để xác thực an toàn...';

  try {
    let result = null;
    if (typeof window.codexHandleWordPressOAuthCallback === 'function') {
      result = await window.codexHandleWordPressOAuthCallback({ code, state });
    } else {
      const response = await fetch('/api/wordpress/oauth/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code, state })
      });
      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.message || errJson.error || `HTTP error ${response.status}`);
      }
      result = await response.json();
    }

    // Không hiển thị thành công chỉ vì hook resolve.
    // Chỉ hiển thị thành công khi backend trả response xác nhận connected: true.
    if (!result || result.connected !== true) {
      const errMsg = result?.message || result?.error || 'Backend từ chối liên kết WordPress hoặc phản hồi connected: false.';
      throw new Error(errMsg);
    }

    // Không mặc định site là melsoucms.wordpress.com; site phải lấy từ response backend.
    const siteName = result.site || result.site_name || result.site_url || '';
    if (icon) icon.textContent = '✅';
    if (heading) heading.textContent = 'Kết nối WordPress thành công!';
    if (message) {
      message.textContent = siteName
        ? `Website Melsou đã kết nối an toàn với WordPress (${siteName}). Các bài viết sẽ tự động đồng bộ.`
        : 'Website Melsou đã kết nối an toàn với WordPress CMS. Các bài viết sẽ tự động đồng bộ.';
    }
    if (detailsBox) {
      detailsBox.style.display = 'block';
      detailsBox.textContent = siteName
        ? `Trạng thái: Đã kết nối · Site: ${siteName}`
        : 'Trạng thái: Đã kết nối thành công';
    }
    window.codexSetWordPressConnectionStatus({
      connected: true,
      site: siteName,
      message: siteName ? `Đã kết nối với ${siteName}` : 'Đã kết nối'
    });
    if (actionBtn) {
      actionBtn.style.display = 'inline-flex';
      actionBtn.textContent = 'Tới OWNER Dashboard';
      actionBtn.onclick = () => {
        closeWpOAuthCallbackModal();
        if (currentUser && currentUser.loggedIn && currentUser.role === 'OWNER') {
          openOwnerDashboardModal();
        } else {
          window.location.href = '/';
        }
      };
    }
  } catch (err) {
    if (icon) icon.textContent = '❌';
    if (heading) heading.textContent = 'Kết nối WordPress không thành công';
    if (message) message.textContent = 'Không thể hoàn tất ủy quyền WordPress qua máy chủ backend.';
    if (detailsBox) {
      detailsBox.style.display = 'block';
      detailsBox.textContent = `Chi tiết lỗi: ${err.message || 'Lỗi mạng hoặc máy chủ từ chối xác thực.'}`;
    }
    if (actionBtn) {
      actionBtn.style.display = 'inline-flex';
      actionBtn.textContent = 'Thử lại';
      actionBtn.onclick = () => { window.location.reload(); };
    }
  }
};

window.closeWpOAuthCallbackModal = function() {
  const modal = document.getElementById('wpOAuthCallbackModal');
  if (modal) {
    modal.classList.remove('open');
    modal.style.display = 'none';
  }
};

window.goToOwnerDashboardFromOAuth = function() {
  closeWpOAuthCallbackModal();
  if (currentUser && currentUser.loggedIn && currentUser.role === 'OWNER') {
    openOwnerDashboardModal();
  } else {
    window.location.href = '/';
  }
};


function toggleMobileNavMenu() {
  const drawer = document.getElementById('mobileNavDrawer');
  if (!drawer) return;
  drawer.classList.toggle('open');
  if (drawer.classList.contains('open')) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
}

function closeMobileNavMenu() {
  const drawer = document.getElementById('mobileNavDrawer');
  if (!drawer) return;
  drawer.classList.remove('open');
  document.body.style.overflow = '';
}

function mobileNavGo(page) {
  toggleMobileNavMenu();
  showPage(page);
}

function mobileNavScroll(sectionId) {
  toggleMobileNavMenu();
  scrollToSection(sectionId);
}

function performLogout(e) {
  if (e) e.stopPropagation();
  MelsouAuth.logout();
}


function resumeDraftStudio(title) {
  ALBUM_DATA.title = title;
  closeDraftsManagerModal();
  showPage('studio');
}

// ── TEMPLATES & HOVER ANIMATION ──
let templateCardsInitialized = false;
function initTemplateCards(force = false) {
  if (templateCardsInitialized && !force) return;
  const grid = document.getElementById('templatesGridContainer');
  const onbGrid = document.getElementById('onboardingTmplGrid');
  if (!grid) return;

  const isEn = (currentAppLanguage === 'en');
  const html = TEMPLATES_DATA.map((t, idx) => {
    const title = isEn ? (t.nameEn || t.title) : (t.nameVi || t.title);
    const tagline = isEn ? (t.taglineEn || t.taglineVi) : (t.taglineVi || t.taglineEn);
    const tag = isEn ? 'Use this template →' : 'Chọn mẫu này →';
    const quote = isEn ? (t.quoteEn || t.quote) : (t.quoteVi || t.quote);
    return `
      <div class="art-tmpl-card" onmouseenter="startTemplateCardCarousel(${idx})" onmouseleave="stopTemplateCardCarousel(${idx})" onclick="loadTemplateToStudio('${title.replace(/'/g, "\\'")}', '${quote.replace(/'/g, "\\'")}', '${t.coverImg}')">
        <div class="art-tmpl-preview-box" id="tmplPreviewBox_${idx}">
          <div class="art-tmpl-slide active-slide" id="tSlide_${idx}_0">
            <img src="${t.coverImg}" class="bg-cover" alt="${title}" loading="lazy" width="800" height="600">
            <div class="art-polaroid-1"><img src="${t.spread1}" alt="" loading="lazy" width="600" height="400"></div>
            <div class="art-polaroid-2"><img src="${t.spread2}" alt="" loading="lazy" width="600" height="400"></div>
          </div>
          <div class="art-tmpl-slide" id="tSlide_${idx}_1">
            <img src="${t.spread1}" class="bg-cover" alt="" loading="lazy" width="600" height="400">
            <div style="position:absolute;bottom:12px;left:12px;background:rgba(0,0,0,0.7);color:white;padding:4px 8px;border-radius:4px;font-size:10px">${isEn ? 'Layout Spread 1' : 'Bố cục ruột trang 1'}</div>
          </div>
          <div class="art-tmpl-slide" id="tSlide_${idx}_2">
            <img src="${t.spread2}" class="bg-cover" alt="" loading="lazy" width="600" height="400">
            <div style="position:absolute;bottom:12px;left:12px;background:rgba(0,0,0,0.7);color:white;padding:4px 8px;border-radius:4px;font-size:10px">${isEn ? 'Letter & Sound' : 'Trang thư &amp; Nhạc'}</div>
          </div>
        </div>
        <div class="art-tmpl-info">
          <div class="art-tmpl-title">${title}</div>
          <div class="art-tmpl-tagline">${tagline}</div>
          <span class="art-tmpl-tag">${tag}</span>
        </div>
      </div>
    `;
  }).join('');

  grid.innerHTML = html;
  if (onbGrid) onbGrid.innerHTML = html;
  templateCardsInitialized = true;
}

const tmplIntervals = {};
function startTemplateCardCarousel(idx) {
  let step = 0;
  tmplIntervals[idx] = setInterval(() => {
    step = (step + 1) % 3;
    for (let s = 0; s < 3; s++) {
      const slide = document.getElementById(`tSlide_${idx}_${s}`);
      if (slide) slide.classList.toggle('active-slide', s === step);
    }
  }, 1200);
}

function stopTemplateCardCarousel(idx) {
  clearInterval(tmplIntervals[idx]);
  for (let s = 0; s < 3; s++) {
    const slide = document.getElementById(`tSlide_${idx}_${s}`);
    if (slide) slide.classList.toggle('active-slide', s === 0);
  }
}

// ── HERO LIVE SYNC (SILENT AUTO-FLIP) ──
let heroStep = 0;
function syncHeroLiveBook() {
  const left = document.getElementById('heroLeftContent');
  const right = document.getElementById('heroRightContent');
  if (!left || !right) return;

  const isEn = (currentAppLanguage === 'en');
  const heroPhotoStyle = (source, gradient) => studioWorkspaceInitialized && source
    ? `background-image:url('${source}')`
    : `background:${gradient}`;
  if (heroStep === 0) {
    const heroCover = (ALBUM_DATA.spreads && ALBUM_DATA.spreads[0] && ALBUM_DATA.spreads[0].coverImg) || TEMPLATES_DATA[0].coverImg;
    const heroTitle = ALBUM_DATA.title || (isEn ? 'Artistic Photobook' : 'Album Kỷ Niệm');
    const heroQuote = ALBUM_DATA.quote || (isEn ? 'Snapshots of happiness that never fade.' : 'Mở phẳng 180° liền trang · Kỷ vật tình yêu');
    left.innerHTML = `<div style="font-family:'Pacifico',cursive;font-size:22px;color:var(--yellow)">melsou</div><div><div style="font-family:'Lora',serif;font-size:20px;font-weight:700">${heroTitle}</div><div style="font-size:11.5px;font-style:italic;opacity:0.8;margin-top:4px">"${heroQuote}"</div></div><div style="font-size:10px;opacity:0.7">${isEn ? '180° Layflat Hardcover · Click to flip 3D →' : 'Bìa cứng mở phẳng 180° · Bấm để lật 3D →'}</div>`;
    right.innerHTML = `<div class="pb-polaroid" style="transform:rotate(2deg)"><div class="pb-washi-corner" style="top:-6px;left:50%;transform:translateX(-50%)"></div><div class="hero-book-photo" style="${heroPhotoStyle(heroCover, 'linear-gradient(135deg,#f5c2c2,#f6e7b0)')}"></div></div><div style="display:flex;align-items:center;gap:6px;font-size:10px;font-weight:700;margin:0;color:var(--dark)"><span>🎵</span> Spotify</div>`;
  } else if (heroStep === 1) {
    const songName = (ALBUM_DATA.spotifyTrack || (isEn ? 'Until I Found You' : 'Giai Điệu Kỷ Niệm')).split('—')[0];
    const img1 = (ALBUM_DATA.userGallery && ALBUM_DATA.userGallery[0]) || TEMPLATES_DATA[0].spread1;
    const img2 = (ALBUM_DATA.userGallery && ALBUM_DATA.userGallery[1]) || TEMPLATES_DATA[0].spread2;
    left.innerHTML = `<div style="font-size:10px;font-weight:800;color:var(--red)">OUR TIMES</div><div style="font-size:18px;font-weight:700;margin-bottom:4px">${isEn ? 'Cherished Melody' : 'Giai Điệu Kỷ Niệm'}</div><div style="display:flex;align-items:center;gap:6px;font-size:10px;font-weight:700;margin-top:10px;color:var(--dark)"><span>🎵</span> ${songName}</div>`;
    right.innerHTML = `<div class="pb-polaroid" style="transform:rotate(-3deg)"><div style="height:110px;${heroPhotoStyle(img1, 'linear-gradient(135deg,#dbeafe,#fce7f3)')};background-position:center;background-size:cover"></div></div><div class="pb-polaroid" style="transform:rotate(3deg);margin-top:6px"><div style="height:110px;${heroPhotoStyle(img2, 'linear-gradient(135deg,#fef3c7,#e9d5ff)')};background-position:center;background-size:cover"></div></div>`;
  } else {
    const img3 = (ALBUM_DATA.userGallery && ALBUM_DATA.userGallery[2]) || TEMPLATES_DATA[1].spread1;
    const msg = ALBUM_DATA.message || (isEn ? 'Every page holds a cherished piece of our journey together...' : 'Mỗi trang sách này là một phần tuổi trẻ tuyệt đẹp của chúng ta... 💖');
    left.innerHTML = `<span style="font-family:'Pacifico',cursive;color:var(--red);font-size:16px">${ALBUM_DATA.salutation || (isEn ? 'Dearest,' : 'Gửi người thương,')}</span><p style="font-family:${ALBUM_DATA.letterFont};color:${ALBUM_DATA.inkColor};font-size:11px;font-style:italic;line-height:1.6;margin-top:4px">${msg.slice(0, 110)}...</p><div style="font-size:9.5px;color:var(--gray);text-align:right;margin-top:8px">${ALBUM_DATA.signature}</div>`;
    right.innerHTML = `<div class="pb-polaroid" style="height:100%"><div style="height:100%;${heroPhotoStyle(img3, 'linear-gradient(135deg,#fecdd3,#fde68a)')};background-position:center;background-size:cover;border-radius:2px"></div></div>`;
  }
}

function startHeroAutoFlip() {
  setInterval(() => {
    heroStep = (heroStep + 1) % 3;
    syncHeroLiveBook();
  }, 4500);
}

// ── STORYTELLING VALUE CARDS ──
const VALUE_STORIES = [
  {
    icon: '01',
    iconBg: 'var(--red-light)',
    badge: 'GIÁ TRỊ ĐỘC BẢN · 01/04',
    title: 'Không gian sáng tạo tinh tế',
    experience: 'Bạn không cần kỹ năng đồ họa phức tạp để tạo nên một cuốn album đẹp. Không gian của Melsou được sắp xếp sẵn theo tỷ lệ vàng và bố cục thoáng đạt, nhường trọn vẹn sự chú ý cho câu chuyện của bạn.',
    craft: 'Melsou ứng dụng công nghệ bình trang liền mạch 180° cùng lưới căn chỉnh thông minh. Người dùng chỉ cần thả ảnh vào khung, hệ thống sẽ tự động tối ưu hóa vùng an toàn in ấn (print-safe area) để không làm mất góc ảnh khi hoàn thiện.'
  },
  {
    icon: '02',
    iconBg: 'rgba(109,158,81,0.15)',
    badge: 'GIÁ TRỊ ĐỘC BẢN · 02/04',
    title: 'Cá nhân hóa trong vài thao tác',
    experience: 'Gói trọn chuyến đi hay năm tháng thanh xuân chỉ sau ít phút trải nghiệm. Bạn có thể tự tay chọn màu bìa, dán sticker hoài niệm, viết lời đề tặng và quan sát toàn bộ album qua góc nhìn 3D trực quan.',
    craft: 'Mỗi thao tác biên tập được xử lý mượt mà và lưu trữ tọa độ chuẩn hóa. Toàn bộ thiết kế được giữ riêng tư trên thiết bị của bạn cho đến khi bạn quyết định gửi in.'
  },
  {
    icon: '03',
    iconBg: 'var(--red-light)',
    badge: 'GIÁ TRỊ ĐỘC BẢN · 03/04',
    title: 'Đánh thức ký ức đa giác quan',
    experience: 'Hình ảnh ghi lại ánh mắt, còn âm thanh lưu giữ nhịp đập cảm xúc. Mỗi trang photobook Melsou không chỉ để nhìn ngắm, mà còn biết ngân vang bản nhạc quen thuộc hay giọng nói ấm áp của người thương.',
    craft: 'Sự kết hợp giữa công nghệ in mã QR / Soundwave Spotify sắc nét và module vi mạch ghi âm vật lý ISD1820 tích hợp tinh tế bên trong bìa sau, cho phép người nhận cất lên tiếng nói mộc mạc bất cứ khi nào mở sách.'
  },
  {
    icon: '04',
    iconBg: 'rgba(109,158,81,0.15)',
    badge: 'GIÁ TRỊ ĐỘC BẢN · 04/04',
    title: 'Không gian riêng tư cho kỷ niệm',
    experience: 'Những lời thì thầm riêng tư và hình ảnh kỷ niệm thuộc về riêng bạn. Melsou tôn trọng sự an toàn thông tin bằng phương thức lưu trữ độc bản và bảo mật.',
    craft: 'Âm thanh giọng nói được lưu trữ trực tiếp trên chip nhớ phần cứng ngoại tuyến (off-grid hardware), không đẩy lên máy chủ đám mây công cộng, loại trừ hoàn toàn nguy cơ rò rỉ dữ liệu nhạy cảm.'
  }
];

function openValueStoryModal(idx) {
  const data = VALUE_STORIES[idx];
  if (!data) return;
  const modal = document.getElementById('valueStoryModal');
  if (!modal) return;
  const iconEl = document.getElementById('vsmIcon');
  if (iconEl) {
    iconEl.textContent = data.icon;
    iconEl.style.background = data.iconBg;
  }
  const badgeEl = document.getElementById('vsmBadge');
  if (badgeEl) badgeEl.textContent = data.badge;
  const titleEl = document.getElementById('vsmTitle');
  if (titleEl) titleEl.textContent = data.title;
  const expEl = document.getElementById('vsmExperience');
  if (expEl) expEl.textContent = data.experience;
  const craftEl = document.getElementById('vsmCraft');
  if (craftEl) craftEl.textContent = data.craft;
  modal.classList.add('open');
}

function closeValueStoryModal() {
  const modal = document.getElementById('valueStoryModal');
  if (modal) modal.classList.remove('open');
}

// ── TEMPLATE ONBOARDING ──
function openTemplateOnboardingModal() {
  initTemplateCards();
  document.getElementById('templateOnboardingModal').classList.add('open');
}
function closeTemplateOnboardingModal() { document.getElementById('templateOnboardingModal').classList.remove('open'); }

function loadTemplateToStudio(name, quote, coverImg) {
  closeTemplateOnboardingModal();
  ALBUM_DATA.title = name;
  ALBUM_DATA.quote = quote || '';
  if (coverImg && ALBUM_DATA.spreads && ALBUM_DATA.spreads[0]) {
    ALBUM_DATA.spreads[0].coverImg = coverImg;
    window.melsouOnImageAssigned?.({ slotKey: 'coverImg', source: coverImg });
  }
  // FB87: Hard Rule - All interior freestyle spreads must be BLANK for EVERY template
  if (Array.isArray(ALBUM_DATA.spreads)) {
    ALBUM_DATA.spreads.forEach((s, idx) => {
      if (idx > 0 && idx < ALBUM_DATA.spreads.length - 1) {
        s.elements = [];
      }
    });
  }
  autoSaveToLocalStorage();
  showPage('studio');
  showToast(currentAppLanguage === 'en' ? `Applied template: ${name}` : `Đã áp dụng mẫu: ${name}`);
}

// ── STUDIO WORKSPACE ──
function renderStudioWorkspace() {
  renumberSpreads();
  renderActiveSpread();
  renderFilmstripTray();
  renderUserGalleryTray();
  renderPresetStickers();
  updateStudioPriceDisplay();
  applyAudioGating();
  renderSpotifyOfficialEmbed();
  if (typeof applyStudioTranslations === 'function') {
    applyStudioTranslations(currentAppLanguage);
  }
}

function renumberSpreads() {
  let pageCounter = 2;
  const isEn = (currentAppLanguage === 'en');
  ALBUM_DATA.spreads.forEach((spread, idx) => {
    if (idx === 0) {
      spread.name = isEn ? 'Front Cover' : 'Bìa Trước';
      spread.isClosedCover = true;
    } else if (idx === ALBUM_DATA.spreads.length - 1) {
      spread.name = isEn ? 'Back Cover' : 'Bìa Sau';
      spread.isClosedBack = true;
    } else {
      spread.isClosedCover = false;
      spread.isClosedBack = false;
      spread.name = isEn ? `Pages ${pageCounter}–${pageCounter + 1}` : `Trang ${pageCounter}–${pageCounter + 1}`;
      pageCounter += 2;
    }
  });
}

function updateStudioPriceDisplay() {
  const extraCost = (ALBUM_DATA.extraSpreadsCount || 0) * EXTRA_SPREAD_PRICE;
  const total = ALBUM_DATA.basePrice + ALBUM_DATA.sizeAdj + extraCost;
  const el = document.getElementById('studioLiveTotalPrice');
  if (el) el.textContent = total.toLocaleString('vi-VN') + 'đ';
}

function switchStudioMode(mode) { if (mode === 'flip') openFlipbookModal(); }

function switchCanvaTab(tabIndex) {
  document.querySelectorAll('.canva-nav-tab').forEach((tab, idx) => tab.classList.toggle('active', idx === tabIndex));
  document.querySelectorAll('.canva-tab-content').forEach((content, idx) => content.classList.toggle('active', idx === tabIndex));
  closePhotoToolbar();

  if (tabIndex === 0) jumpToSpread(0);
  else if (tabIndex === 4) jumpToSpread(Math.min(5, ALBUM_DATA.spreads.length - 2));
  else if (tabIndex === 5) jumpToSpread(ALBUM_DATA.package === 'melody' ? 1 : ALBUM_DATA.spreads.length - 1);
}

// ════════════════════════════════════════════════════════════
// 🚀 DYNAMIC STUDIO MODULE LOADER (BATCH 2 PERFORMANCE)
// ════════════════════════════════════════════════════════════
function ensureStudioCss() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('melsouStudioCss')) return;
  const link = document.createElement('link');
  link.id = 'melsouStudioCss';
  link.rel = 'stylesheet';
  link.href = '/studio.css';
  document.head.appendChild(link);
}
window.ensureStudioCss = ensureStudioCss;

function ensureHeroAnimationReady() {
  if (typeof document === 'undefined') return;
  const book = document.querySelector('.hero-book-3d');
  if (book) book.classList.add('hero-animation-ready');
}
if (typeof window !== 'undefined') {
  if (document.readyState === 'complete') {
    requestAnimationFrame(ensureHeroAnimationReady);
  } else {
    window.addEventListener('load', () => requestAnimationFrame(ensureHeroAnimationReady));
  }
}

let studioModulePromise = null;
function ensureStudioModule() {
  ensureStudioCss();
  if (window.__studioModuleLoaded) return Promise.resolve();
  if (studioModulePromise) return studioModulePromise;
  studioModulePromise = new Promise((resolve, reject) => {
    if (typeof document === "undefined") return resolve();
    const script = document.createElement("script");
    script.src = "/studio.js";
    script.async = true;
    script.onload = () => {
      if (!window.MelsouStudio) {
        studioModulePromise = null;
        reject(new Error("studio.js loaded without registering the MelsouStudio contract"));
        return;
      }
      window.__studioModuleLoaded = true;
      resolve();
    };
    script.onerror = () => {
      studioModulePromise = null;
      reject(new Error("Failed to load studio.js"));
    };
    document.head.appendChild(script);
  });
  return studioModulePromise;
}
window.ensureStudioModule = ensureStudioModule;

// Helper hook for asset binding verification (worker/fb90-asset-binding.test.mjs)
function __melsouAssetBindingHook(slotKey, url) {
  window.melsouOnImageAssigned?.({ slotKey, source: url });
}

// Safe stubs for studio resizing before studio loads
function recalculateDrawerAvailableHeight() {
  if (window.__recalculateDrawerAvailableHeight) window.__recalculateDrawerAvailableHeight();
}
function adjustMobileStageScale() {
  if (window.__adjustMobileStageScale) window.__adjustMobileStageScale();
}

// Dynamic proxies for studio triggers
const _origOpenTemplateOnboardingModal = openTemplateOnboardingModal;
openTemplateOnboardingModal = function(...args) {
  ensureStudioModule().then(() => {
    _origOpenTemplateOnboardingModal(...args);
  });
};
window.openTemplateOnboardingModal = openTemplateOnboardingModal;

const _origShowPage = showPage;
showPage = function(pageId, ...args) {
  if (pageId === "studio") {
    ensureStudioModule().then(() => {
      _origShowPage(pageId, ...args);
      window.MelsouStudio.checkFirstVisit();
      window.MelsouStudio.updateUndoRedoButtons();
    });
    return;
  }
  _origShowPage(pageId, ...args);
};
window.showPage = showPage;

function toggleCart() {
  ensureStudioModule().then(() => {
    if (typeof window.toggleCartReal === "function") window.toggleCartReal();
    else {
      const d = document.getElementById("cartDrawer");
      if (d) d.classList.toggle("open");
    }
  });
}
window.toggleCart = toggleCart;

function openFlipbookModal() {
  ensureStudioModule().then(() => {
    if (typeof window.openFlipbookModalReal === "function") window.openFlipbookModalReal();
  });
}
window.openFlipbookModal = openFlipbookModal;

function openOwnerDashboardModal() {
  ensureStudioModule().then(() => {
    const modal = document.getElementById("ownerDashboardModal");
    if (modal) modal.classList.add("open");
  });
}
window.openOwnerDashboardModal = openOwnerDashboardModal;

function selectPackage(...args) {
  ensureStudioModule().then(() => {
    if (typeof window.selectPackageReal === "function") window.selectPackageReal(...args);
    else if (typeof window.selectPackage === "function") window.selectPackage(...args);
  });
}
window.selectPackage = selectPackage;

function handleStorefrontGlobalClick(e) {
  if (!e.target.closest('.user-menu-wrapper')) {
    const userMenu = document.getElementById('userDropdownMenu');
    if (userMenu) userMenu.classList.remove('open');
  }
}

function handleGlobalClick(e) {
  handleStorefrontGlobalClick(e);
  window.MelsouStudio?.handleGlobalClick(e);
}

function handleGlobalKey(e) {
  if (!e || (e.key !== 'Escape' && e.keyCode !== 27)) return;

  const storefrontModals = [
    ['privacyPolicyModal', closePrivacyPolicyModal],
    ['warrantyPolicyModal', closeWarrantyPolicyModal],
    ['authModal', closeAuthModal],
    ['blogArticleReaderModal', closeBlogArticleReader],
    ['settingsModal', closeSettingsModal],
    ['valueStoryModal', closeValueStoryModal],
    ['templateOnboardingModal', closeTemplateOnboardingModal],
    ['customerReviewModal', closeReviewModal],
    ['customerReviewIneligibleModal', closeReviewIneligibleModal]
  ];

  for (const [id, close] of storefrontModals) {
    const modal = document.getElementById(id);
    if (modal && (modal.classList.contains('open') || modal.style.display === 'flex')) {
      close();
      return;
    }
  }

  const ownerDashboard = document.getElementById('ownerDashboardModal');
  if (ownerDashboard && (ownerDashboard.classList.contains('open') || ownerDashboard.style.display === 'flex')) {
    window.closeOwnerDashboardModal();
    return;
  }
  const oauthCallback = document.getElementById('wpOAuthCallbackModal');
  if (oauthCallback && (oauthCallback.classList.contains('open') || oauthCallback.style.display === 'flex')) {
    window.closeWpOAuthCallbackModal();
    return;
  }

  window.MelsouStudio?.handleGlobalKey(e);
}

window.handleGlobalClick = handleGlobalClick;
window.handleGlobalKey = handleGlobalKey;

// Preload studio.js only when intent is aimed at a Studio-capable action.
if (typeof window !== "undefined") {
  const studioIntentSelector = [
    '[onclick*="openTemplateOnboardingModal"]',
    '[onclick*="selectPackage"]',
    '[onclick*="loadTemplateToStudio"]',
    "[onclick*=\"showPage('studio')\"]",
    '#btnHeroFlipbook'
  ].join(', ');
  const onIntent = () => {
    ensureStudioModule();
    document.querySelectorAll(studioIntentSelector).forEach(btn => {
      btn.removeEventListener('pointerenter', onIntent);
      btn.removeEventListener('focus', onIntent);
    });
  };
  const bindIntent = () => {
    document.querySelectorAll(studioIntentSelector).forEach(btn => {
      btn.addEventListener('pointerenter', onIntent, { passive: true, once: true });
      btn.addEventListener('focus', onIntent, { passive: true, once: true });
    });
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindIntent, { once: true });
  } else {
    bindIntent();
  }
}

// ── SETTINGS MODAL & THEME SWITCHER (FB10) ──
function openSettingsModal() {
  const modal = document.getElementById('settingsModal');
  if (modal) modal.classList.add('open');
}
function closeSettingsModal() {
  const modal = document.getElementById('settingsModal');
  if (modal) modal.classList.remove('open');
}

function showToast(message, duration = 3000) {
  let toast = document.getElementById('melsouGlobalToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'melsouGlobalToast';
    toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#1e293b;color:#f8fafc;padding:10px 20px;border-radius:30px;font-size:12.5px;font-weight:600;box-shadow:0 10px 25px rgba(0,0,0,0.25);z-index:99999;pointer-events:none;opacity:0;transition:opacity 0.25s ease, transform 0.25s ease;display:flex;align-items:center;gap:8px;max-width:min(calc(100vw - 32px), 440px);box-sizing:border-box;';
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<span>${message}</span>`;
  toast.style.opacity = '1';
  toast.style.transform = 'translateX(-50%) translateY(0)';
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(10px)';
  }, duration);
}

function changeTheme(themeName) {
  if (themeName === 'warm') {
    document.documentElement.style.setProperty('--bg', '#f4ede2');
    document.documentElement.style.setProperty('--dark', '#2b2319');
    document.body.style.backgroundColor = '#f4ede2';
  } else if (themeName === 'dark') {
    document.documentElement.style.setProperty('--bg', '#18181b');
    document.documentElement.style.setProperty('--dark', '#f4f4f5');
    document.documentElement.style.setProperty('--gray-l', '#27272a');
    document.body.style.backgroundColor = '#18181b';
    document.body.style.color = '#f4f4f5';
  } else {
    document.documentElement.style.removeProperty('--bg');
    document.documentElement.style.removeProperty('--dark');
    document.documentElement.style.removeProperty('--gray-l');
    document.body.style.backgroundColor = '';
    document.body.style.color = '';
  }
}

let is2FAEnabled = false;

function saveSettingsProfile() {
  const inp = document.getElementById('settingsProfileNameInput');
  const val = inp ? inp.value.trim() : '';
  if (!val) {
    showToast('Vui lòng nhập tên hiển thị');
    return;
  }
  showToast(`Đã lưu tên: "${val}" (Mô phỏng UI - Chờ Codex kết nối API)`);
}

function saveSettingsPassword() {
  const inp = document.getElementById('settingsNewPasswordInput');
  const val = inp ? inp.value : '';
  if (!val || val.length < 6) {
    showToast('Mật khẩu mới phải có tối thiểu 6 ký tự');
    return;
  }
  showToast('Đã gửi yêu cầu đổi mật khẩu (Mô phỏng UI - Chờ Codex kết nối API)');
  inp.value = '';
}

function toggleSettings2FA() {
  is2FAEnabled = !is2FAEnabled;
  const statusEl = document.getElementById('settings2faStatus');
  if (statusEl) {
    statusEl.textContent = is2FAEnabled ? 'Đang bật (TOTP)' : 'Đang tắt';
    statusEl.style.color = is2FAEnabled ? '#16a34a' : '#6b7280';
    statusEl.style.fontWeight = is2FAEnabled ? '700' : 'normal';
  }
  showToast(is2FAEnabled ? 'Đã bật 2FA (Mô phỏng UI - Chờ Codex kết nối Supabase 2FA)' : 'Đã tắt xác thực 2FA');
}


// ── ⬆️ BACK TO TOP ENGINE (FB45) ──
let backToTopScrollTimeout = null;
function initBackToTop() {
  const btn = document.getElementById('backToTopBtn');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      btn.classList.add('show');
      btn.classList.add('visible');
      btn.classList.add('is-scrolling');
      if (backToTopScrollTimeout) clearTimeout(backToTopScrollTimeout);
      backToTopScrollTimeout = setTimeout(() => {
        btn.classList.remove('is-scrolling');
      }, 300);
    } else {
      btn.classList.remove('show');
      btn.classList.remove('visible');
      btn.classList.remove('is-scrolling');
      if (backToTopScrollTimeout) clearTimeout(backToTopScrollTimeout);
    }
  }, { passive: true });
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}


// ── 📱 MOBILE RESPONSIVE ENGINE & TOUCH GESTURES ──
function toggleMobileSidebar() {
  const sidebar = document.getElementById('canvaSidebarEl');
  if (sidebar) {
    sidebar.classList.toggle('collapsed');
    document.body.classList.toggle('drawer-open', !sidebar.classList.contains('collapsed'));
  }
}

// FB82: Bounding height calculation for left side drawer above filmstrip

// ── 🌐 MELSOU I18N SYSTEM (BILINGUAL VI / EN) ──
let currentAppLanguage = 'vi';
try {
  const saved = localStorage.getItem('melsou_language');
  if (saved === 'en' || saved === 'vi') currentAppLanguage = saved;
} catch(e) {}


function updateAdaptiveCtaText() {
  const ctaBtn = document.getElementById('navCtaBtn');
  if (!ctaBtn) return;
  const isWide = window.innerWidth >= 1400;
  if (currentAppLanguage === 'en') {
    ctaBtn.textContent = isWide ? 'Start Creating Album' : 'Create Album';
  } else {
    ctaBtn.textContent = isWide ? 'Bắt đầu tạo album' : 'Tạo album';
  }
}
window.addEventListener('resize', () => {
  syncResponsiveDeviceClasses();
  updateAdaptiveCtaText();
  adjustMobileStageScale();
  recalculateDrawerAvailableHeight();
});

const MELSOU_I18N = {
  vi: {
    // Topbar & Header
    topbarBadge: 'DỰ ÁN DOANH NGHIỆP GIẢ ĐỊNH',
    topbarPromoFull: 'Tặng kèm mã QR nhạc Spotify & Hộp quà Kraft cao cấp khi thiết kế album tại Melsou!',
    topbarAction: 'Tạo ngay →',
    navAbout: 'Về Melsou',
    navValues: 'Giá trị độc bản',
    navPricing: 'Gói sản phẩm',
    navTemplates: 'Thư viện Template',
    navReviews: 'Đánh giá',
    navBlog: 'Câu chuyện',
    navTracking: 'Tra cứu đơn hàng',
    authBtnLabel: 'Tài khoản',
    cartBtnLabel: 'Giỏ hàng',

    // Hero Section
    heroBadge: 'Album ảnh liền trang 180° kết hợp thanh âm',
    heroTitle: 'Gói tâm tình',
    heroTitleAccent: 'trong dáng hình thanh âm',
    heroDesc: 'Chiếc máy ảnh có thể giữ lại hình dáng khoảnh khắc, nhưng lại vô tình bỏ quên âm thanh. Melsou hòa quyện giai điệu (melody) và kỷ vật (souvenir) để mỗi trang ảnh không chỉ đẹp, mà còn biết cất lời.',
    btnStartStudio: 'Bắt đầu tạo album',
    btn3DFlip: 'Xem 3D',
    heroTrustOffgrid: 'Bảo mật vật lý off-grid',
    heroTrustLayflat: 'Mở phẳng 180° liền trang',
    heroTrustSpotify: 'Mã QR nhạc Spotify',

    // Values Section
    valSectionTitle: 'Bốn giá trị tạo nên trải nghiệm độc bản',
    valSectionDesc: 'Khám phá cách Melsou kết nối hình ảnh và thanh âm vào từng trang sách.',
    valCardTitle0: 'Không gian sáng tạo tinh tế',
    valCardDesc0: 'Một không gian tinh tế đã được mở ra sẵn, không cần đắn đo về bố cục. Melsou được sắp xếp nhẹ nhàng để nhường chỗ cho kỷ niệm của bạn tự do lên tiếng.',
    valCardMore0: 'Khám phá câu chuyện →',
    valCardTitle1: 'Cá nhân hóa trong vài thao tác',
    valCardDesc1: 'Tự tay gói ghém từng kỷ niệm và ngắm nhìn chúng thành hình qua góc nhìn lật trang 3D chân thực. Giữ trọn vẹn sự riêng tư cho những cảm xúc của bạn.',
    valCardMore1: 'Khám phá câu chuyện →',
    valCardTitle2: 'Đánh thức ký ức đa giác quan',
    valCardDesc2: 'Kỷ niệm không nên chỉ nằm yên trên giấy. Ở Melsou, những rung động được giữ lại qua độ nhám mộc mạc của mặt giấy và thanh âm của người thương.',
    valCardMore2: 'Khám phá câu chuyện →',
    valCardTitle3: 'Không gian riêng tư cho kỷ niệm',
    valCardDesc3: 'Mọi lời nhắn gửi và thanh âm được lưu giữ trực tiếp trên vi mạch vật lý. Không máy chủ đám mây, không rò rỉ dữ liệu, an toàn tuyệt đối.',
    valCardMore3: 'Khám phá câu chuyện →',

    // Pricing Section
    pricingTitle: 'Gói sản phẩm',
    pkgFeaturedBadge: '✦ Được nhiều khách lựa chọn nhất',
    pkgMelodyLabel: 'MELODY ALBUM',
    pkgMelodyNote: 'Nhỏ gọn, mở phẳng liền trang kèm mã nhạc Spotify độc bản',
    pkgMelodyFeat1: 'Album mở phẳng 180° liền trang cao cấp (không rách gáy)',
    pkgMelodyFeat2: 'Tùy chọn khổ ảnh: Vuông 20×20cm hoặc A5 Đứng',
    pkgMelodyFeat3: 'In mã sóng nhạc Spotify Soundwave Scannable Code',
    pkgMelodyFeat4: 'Tặng kèm hộp quà Kraft mộc mạc + Thiệp tay',
    btnSelectMelody: 'Chọn gói này',

    pkgVoiceLabel: 'VOICE ALBUM',
    pkgVoiceNote: 'Chạm để lắng nghe giọng nói thật lưu trên vi mạch vật lý',
    pkgVoiceFeat1: 'Album mở phẳng 180° liền trang cao cấp',
    pkgVoiceFeat2: 'Module âm thanh ISD1820 tích hợp ở bìa sau',
    pkgVoiceFeat3: 'Tự thu âm tại nhà (nút REC) hoặc gửi file Melsou nạp sẵn',
    pkgVoiceFeat4: 'Bảo mật vật lý off-grid 100%, không lưu cloud',
    btnSelectVoice: 'Chọn gói này',

    pkgSignatureLabel: 'SIGNATURE COMBO',
    pkgSignatureNote: 'Trọn bộ trải nghiệm hình ảnh + âm thanh',
    pkgSignatureFeat1: 'Trọn vẹn tính năng gói Melody (Mở phẳng 180° + Spotify)',
    pkgSignatureFeat2: 'Trọn vẹn tính năng gói Voice (Module ghi âm ISD1820)',
    pkgSignatureFeat3: 'Khổ sách lớn: A5 Đứng hoặc Khổ Vuông 20×20cm',
    pkgSignatureFeat4: 'Hộp quà Kraft Signature kèm ruy băng & hoa khô Vintage',
    pkgSignatureFeat5: 'Bảo hành 1 đổi 1 trong 7 ngày nếu lỗi phần cứng',
    btnSelectSignature: 'Chọn gói Combo tốt nhất →',

    // Templates Section
    tplLibraryHeading: 'Thư Viện Template Mẫu',
    tplLibrarySubheading: '8 bộ mẫu nghệ thuật độc bản — Rê chuột để xem hoạt họa Bìa & Ruột bên trong!',

    // Studio & Toolbar
    stStep1: 'Chọn gói & mẫu',
    stStep2: 'Thiết kế album',
    stStep3: 'Xem trước 3D',
    stStep4: 'Đặt in',
    btnModeEdit: 'Chế Độ Thiết Kế',
    btnModeFlip: 'Xem 3D',
    studioBtnOrder: 'Thêm vào giỏ hàng',
    btnExportDesign: '⬇ Tải PDF album',
    studioCloudSync: 'Đã lưu',
    btnTopSafeGuides: 'Vùng an toàn',

    // Studio Tabs
    cNavTab0: '<span>📐</span>Khổ & Gói',
    cNavTab1: '<span>🎨</span>Bố cục',
    cNavTab2: '<span>📸</span>Ảnh',
    cNavTab3: '<span>✨</span>Sticker',
    cNavTab4: '<span>✒️</span>Lời nhắn',
    cNavTab5: '<span>🎵</span>Âm thanh',

    // Mobile more menu
    msmSafeGuides: 'Vùng an toàn in',
    msmDownloadPdf: '⬇ Tải PDF album',
    msmUndo: '↶ Hoàn tác',
    msmRedo: '↷ Làm lại',

    // Reviews & Blog
    reviewsHeading: 'Ý kiến từ người dùng trải nghiệm Melsou',
    reviewsSubheading: 'Cảm nhận chân thực từ những người dùng đã trực tiếp thiết kế và trải nghiệm album Melsou',
    reviewsBadge: 'CẢM NHẬN KHÁCH HÀNG',
    reviewsDisclaimer: '* Đánh giá được thu thập từ những khách hàng đã trực tiếp thiết kế và cầm trên tay album hoàn thiện.',
    btnWriteReview: 'Viết đánh giá',
    blogBadge: 'GÓC KỶ NIỆM & CHUYỆN KỂ',
    blogHeading: 'Chuyện của Melsou',
    blogSubheading: 'Cảm hứng chế tác, bí quyết sắp xếp ảnh và những câu chuyện lưu giữ ký ức qua năm tháng',

    // Cart Drawer
    cartSelectAll: 'Chọn tất cả',
    cartTotalLabel: 'Tổng thanh toán:',
    cartDiscountLabel: 'Ưu đãi áp dụng:',

    // Footer
    footerHeadingProducts: 'Sản Phẩm',
    footerHeadingSupport: 'Hỗ Trợ',
    footerHeadingBrand: 'Thương Hiệu',
    footerSocialHeading: 'KẾT NỐI VỚI MELSOU',
    footerLinkContactPhone: 'Liên hệ xưởng (0931.940.512)',
    footerLinkMelody: 'Gói Melody',
    footerLinkVoice: 'Gói Voice',
    footerLinkSignature: 'Gói Signature',
    footerLinkTemplates: 'Thư viện Template',
    footerLinkTracking: 'Tra cứu đơn hàng',
    footerLinkWarranty: 'Chính sách bảo hành',
    footerLinkPrivacy: 'Chính sách bảo mật',
    footerLinkAbout: 'Về Melsou',
    footerLinkValues: 'Giá trị cốt lõi',
    footerLinkWorkshop: 'Xưởng in TP.HCM',
    footerCopyDetails: 'Xưởng chế tác tại TP.HCM · Bảo hành 1–1 trong 7 ngày',

    // Auth Modal (FB58)
    authModalHeading: 'Tài khoản Melsou',
    authModalSubheading: 'Đăng nhập để lưu trữ bản thiết kế và theo dõi đơn in ấn',
    authTabLogin: 'Đăng nhập',
    authTabRegister: 'Đăng ký',
    lblLoginUsername: 'Tên tài khoản',
    lblLoginPassword: 'Mật khẩu',
    authForgotPwLink: 'Quên mật khẩu?',
    btnSubmitLogin: 'Đăng nhập',
    lblRegUsername: 'Tên tài khoản (tối thiểu 3 ký tự)',
    lblRegPassword: 'Mật khẩu (tối thiểu 12 ký tự, gồm chữ và số)',
    lblRegConfirmPassword: 'Nhập lại mật khẩu',
    btnSubmitRegister: 'Tạo tài khoản',
    forgotPwHeading: 'Quên mật khẩu',
    forgotPwDesc: 'Khôi phục tài khoản sẽ được hỗ trợ sau khi bạn liên kết email trong mục Hồ sơ tài khoản. Nếu bạn đã liên kết email, vui lòng liên hệ bộ phận hỗ trợ hoặc thử lại sau khi hệ thống kết nối máy chủ hoàn tất.',
    forgotPwBackLink: '← Quay lại đăng nhập',
    lblLinkedEmailHeading: 'Email liên kết',
    lblLinkedEmailDesc: 'Dùng để khôi phục mật khẩu và nhận hóa đơn',
    btnSettingsLinkEmail: 'Thêm email',
    flipbookSound: '🔊 Âm thanh',
    flipbookExport: '⬇ Lưu về máy',
    voiceRecTimerPrefix: '⏱️ Thời lượng',
    voiceRecTimerDefault: '⏱️ Thời lượng: 00:00 / 00:30',
    authTermsDisclaimer: 'Bằng việc tiếp tục, bạn đồng ý với <a href="/chinh-sach-bao-mat" target="_blank" onclick="openPrivacyPolicyModal(event)" style="color:var(--red);font-weight:700">Chính sách bảo mật</a> và <a href="/chinh-sach-bao-hanh" target="_blank" onclick="openWarrantyPolicyModal(event)" style="color:var(--red);font-weight:700">Chính sách bảo hành</a> của Melsou.'
  },
  en: {
    // Topbar & Header
    topbarBadge: 'MOCK BUSINESS PROJECT',
    topbarPromoFull: 'Free Spotify Scannable Code & luxury Kraft gift box included with every album at Melsou!',
    topbarAction: 'Create now →',
    navAbout: 'About us',
    navValues: 'Unique Values',
    navPricing: 'Packages',
    navTemplates: 'Template Library',
    navReviews: 'User Reviews',
    navBlog: 'Blog',
    navTracking: 'Track Order',
    authBtnLabel: 'Account',
    cartBtnLabel: 'Cart',

    // Hero Section
    heroBadge: '180° Seamless Layflat Photobook with Sound',
    heroTitle: 'Cherish feelings',
    heroTitleAccent: 'in the shape of sound',
    heroDesc: 'Cameras capture visual silhouettes, but often leave voices behind. melsou fuses melody and souvenir so every printed page sings its own heartfelt tune.',
    btnStartStudio: 'Start Creating Album',
    btn3DFlip: 'View 3D',
    heroTrustOffgrid: 'Off-Grid Physical Privacy',
    heroTrustLayflat: '180° Seamless Layflat',
    heroTrustSpotify: 'Spotify Scannable Code',

    // Values Section
    valSectionTitle: 'Four Core Values Defining a Bespoke Experience',
    valSectionDesc: 'Discover how Melsou binds photographs and soundwaves into each artisan page.',
    valCardTitle0: 'Deliberate Creative Space',
    valCardDesc0: 'An intuitive workspace is thoughtfully prepared without layout anxiety. Melsou arranges elements lightly so your memories speak freely.',
    valCardMore0: 'Explore story →',
    valCardTitle1: 'Effortless Personalization',
    valCardDesc1: 'Handcraft each precious memory and watch it unfold through our authentic 3D interactive flipbook. Complete emotional privacy guaranteed.',
    valCardMore1: 'Explore story →',
    valCardTitle2: 'Multi-Sensory Memory Awakening',
    valCardDesc2: 'Memories should never stay dormant on flat paper. At Melsou, nostalgia is preserved through the textured grain of fine paper and beloved voices.',
    valCardMore2: 'Explore story →',
    valCardTitle3: 'Off-Grid Intimacy for Moments',
    valCardDesc3: 'All personal messages and recorded voices are stored directly onto a physical integrated circuit. No cloud leakage, totally safe.',
    valCardMore3: 'Explore story →',

    // Pricing Section
    pricingTitle: 'Packages',
    pkgFeaturedBadge: '✦ Most Popular Choice',
    pkgMelodyLabel: 'MELODY ALBUM',
    pkgMelodyNote: 'Compact, seamless layflat with personalized Spotify code',
    pkgMelodyFeat1: 'Premium 180° seamless layflat album (zero gutter split)',
    pkgMelodyFeat2: 'Size options: Square 20×20cm or A5 Portrait',
    pkgMelodyFeat3: 'Custom Spotify Soundwave Scannable Code printed',
    pkgMelodyFeat4: 'Complementary Kraft gift box + Handwritten card',
    btnSelectMelody: 'Select package',

    pkgVoiceLabel: 'VOICE ALBUM',
    pkgVoiceNote: 'Touch to hear real voices stored on physical microchips',
    pkgVoiceFeat1: 'Premium 180° seamless layflat album',
    pkgVoiceFeat2: 'Integrated ISD1820 audio module in back cover',
    pkgVoiceFeat3: 'Record at home (REC button) or send audio for Melsou preloading',
    pkgVoiceFeat4: '100% off-grid physical privacy, zero cloud storage',
    btnSelectVoice: 'Select package',

    pkgSignatureLabel: 'SIGNATURE COMBO',
    pkgSignatureNote: 'Complete visual + audio experience',
    pkgSignatureFeat1: 'All Melody features (180° layflat + Spotify code)',
    pkgSignatureFeat2: 'All Voice features (ISD1820 recording module)',
    pkgSignatureFeat3: 'Large sizes: A5 Portrait or Square 20×20cm',
    pkgSignatureFeat4: 'Signature Kraft gift box with ribbon & vintage dried flowers',
    pkgSignatureFeat5: '7-day 1-to-1 replacement warranty for hardware defects',
    btnSelectSignature: 'Select Best Combo →',

    // Templates Section
    tplLibraryHeading: 'Template Library',
    tplLibrarySubheading: '8 bespoke artistic templates — Hover to preview Cover & Inside spreads!',

    // Studio & Toolbar
    stStep1: 'Choose package & template',
    stStep2: 'Design album',
    stStep3: '3D Preview',
    stStep4: 'Order print',
    btnModeEdit: 'Design Mode',
    btnModeFlip: 'View 3D',
    studioBtnOrder: 'Add to Cart',
    btnExportDesign: '⬇ Download PDF Album',
    studioCloudSync: 'Saved',
    btnTopSafeGuides: 'Safe Margins',

    // Studio Tabs
    cNavTab0: '<span>📐</span>Size & Pkg',
    cNavTab1: '<span>🎨</span>Layout',
    cNavTab2: '<span>📸</span>Photos',
    cNavTab3: '<span>✨</span>Stickers',
    cNavTab4: '<span>✒️</span>Message',
    cNavTab5: '<span>🎵</span>Audio',

    // Mobile more menu
    msmSafeGuides: 'Print Safe Margins',
    msmDownloadPdf: '⬇ Download PDF Album',
    msmUndo: '↶ Undo',
    msmRedo: '↷ Redo',

    // Reviews & Blog
    reviewsHeading: 'Reflections from Melsou Creators',
    reviewsSubheading: 'Authentic thoughts from customers who designed and held their own Melsou albums',
    reviewsBadge: 'CUSTOMER REVIEWS',
    reviewsDisclaimer: '* Reviews gathered from customers who designed and received their handcrafted albums.',
    btnWriteReview: 'Write Review',
    blogBadge: 'STORIES & MEMORIES',
    blogHeading: 'The Melsou Journal',
    blogSubheading: 'Artisan craftsmanship, layout ideas, and heartwarming memories preserved through time',

    // Cart Drawer
    cartSelectAll: 'Select all',
    cartTotalLabel: 'Total Payment:',
    cartDiscountLabel: 'Discount applied:',

    // Footer
    footerHeadingProducts: 'Products',
    footerHeadingSupport: 'Support',
    footerHeadingBrand: 'Brand',
    footerSocialHeading: 'CONNECT WITH MELSOU',
    footerLinkContactPhone: 'Workshop Contact (0931.940.512)',
    footerLinkMelody: 'Melody Package',
    footerLinkVoice: 'Voice Package',
    footerLinkSignature: 'Signature Combo',
    footerLinkTemplates: 'Template Library',
    footerLinkTracking: 'Track Order',
    footerLinkWarranty: 'Warranty Policy',
    footerLinkPrivacy: 'Privacy Policy',
    footerLinkAbout: 'About Melsou',
    footerLinkValues: 'Core Values',
    footerLinkWorkshop: 'HCMC Workshop',
    footerCopyDetails: 'Artisan workshop in HCMC · 1-to-1 replacement warranty in 7 days',

    // Auth Modal (FB58)
    authModalHeading: 'Melsou Account',
    authModalSubheading: 'Log in to save your photobook designs and track print orders',
    authTabLogin: 'Log in',
    authTabRegister: 'Register',
    lblLoginUsername: 'Username',
    lblLoginPassword: 'Password',
    authForgotPwLink: 'Forgot password?',
    btnSubmitLogin: 'Log in',
    lblRegUsername: 'Username (minimum 3 characters)',
    lblRegPassword: 'Password (minimum 12 characters, letters and numbers)',
    lblRegConfirmPassword: 'Confirm password',
    btnSubmitRegister: 'Create Account',
    forgotPwHeading: 'Forgot Password',
    forgotPwDesc: 'Account recovery will be available after linking an email in your Account Profile. If you have already linked your email, please contact support or try again once server connection is ready.',
    forgotPwBackLink: '← Back to log in',
    lblLinkedEmailHeading: 'Linked Email',
    lblLinkedEmailDesc: 'Used for password recovery and receiving digital receipts',
    btnSettingsLinkEmail: 'Link Email',
    flipbookSound: '🔊 Sound',
    flipbookExport: '⬇ Save to device',
    voiceRecTimerPrefix: '⏱️ Duration',
    voiceRecTimerDefault: '⏱️ Duration: 00:00 / 00:30',
    authTermsDisclaimer: 'By continuing, you agree to Melsou\'s <a href="/chinh-sach-bao-mat" target="_blank" onclick="openPrivacyPolicyModal(event)" style="color:var(--red);font-weight:700">Privacy Policy</a> and <a href="/chinh-sach-bao-hanh" target="_blank" onclick="openWarrantyPolicyModal(event)" style="color:var(--red);font-weight:700">Warranty Policy</a>.'
  }
};


function applyStudioTranslations(lang) {
  const isEn = (lang === 'en');

  // Topbar steps & buttons
  const s1 = document.getElementById('stStep1Text'); if (s1) s1.textContent = isEn ? '1. Size & Pkg' : '1. Chọn gói & mẫu';
  const s2 = document.getElementById('stStep2Text'); if (s2) s2.textContent = isEn ? '2. Design' : '2. Thiết kế album';
  const s3 = document.getElementById('stStep3Text'); if (s3) s3.textContent = isEn ? '3. 3D Preview' : '3. Xem trước 3D';
  const s4 = document.getElementById('stStep4Text'); if (s4) s4.textContent = isEn ? '4. Checkout' : '4. Đặt in';
  const bEdit = document.getElementById('btnModeEdit'); if (bEdit) bEdit.textContent = isEn ? 'Design Mode' : 'Chế Độ Thiết Kế';
  const bFlip = document.getElementById('btnModeFlip'); if (bFlip) bFlip.textContent = isEn ? 'View 3D' : 'Xem 3D';
  const bSafe = document.getElementById('btnTopSafeGuides'); if (bSafe) bSafe.textContent = isEn ? 'Safe Margins' : 'Vùng an toàn';
  const bCloud = document.getElementById('studioCloudSyncText'); if (bCloud) bCloud.textContent = isEn ? 'Saved' : 'Đã lưu';
  const bAddCart = document.getElementById('btnStudioAddToCart'); if (bAddCart) bAddCart.textContent = isEn ? 'Add to Cart' : 'Thêm vào giỏ hàng';
  const bExp = document.getElementById('btnExportDesign'); if (bExp) bExp.textContent = isEn ? '⬇ Download PDF' : '⬇ Tải PDF album';

  // Rail labels (left sidebar buttons)
  const railLabels = document.querySelectorAll('.studio-rail .rail-label');
  const enRails = ['Size & Pkg', 'Layout', 'Photos', 'Stickers', 'Message', 'Audio'];
  const viRails = ['Khổ & Gói', 'Bố cục', 'Ảnh', 'Sticker', 'Lời nhắn', 'Âm thanh'];
  railLabels.forEach((el, idx) => {
    if (idx < (isEn ? enRails.length : viRails.length)) {
      el.textContent = isEn ? enRails[idx] : viRails[idx];
    }
  });

  // Flyout Drawer Title
  const drawerTitle = document.getElementById('flyoutDrawerTitle');
  const activeTabIdx = ALBUM_DATA.activeCanvaTab || 0;
  const enDrawerTitles = ['Size & Package', 'Preset Layouts', 'Photos & Media', 'Stickers & Deco', 'Handwritten Letter', 'Audio & Music'];
  const viDrawerTitles = ['Khổ & Gói', 'Bố cục & Khung ảnh', 'Ảnh của bạn', 'Sticker trang trí', 'Lời nhắn thủ bút', 'Giai điệu & Lời thoại'];
  if (drawerTitle) {
    drawerTitle.textContent = isEn ? enDrawerTitles[activeTabIdx] : viDrawerTitles[activeTabIdx];
  }

  const textReplacements = isEn ? [
    ['1. Chọn Gói Sản Phẩm', '1. Choose Photobook Package'],
    ['2. Khổ Album & Kích Thước Thật', '2. Album Format & Actual Size'],
    ['2. Khổ Album &amp; Kích Thước Thật', '2. Album Format & Actual Size'],
    ['Gói Signature Combo · 199k', 'Signature Combo Package · 199k'],
    ['Gói Melody · 119k', 'Melody Package · 119k'],
    ['Gói Voice · 159k', 'Voice Package · 159k'],
    ['⏱️ Thời lượng: 00:00 / 00:30', '⏱️ Duration: 00:00 / 00:30'],
    ['🔊 Âm thanh', '🔊 Sound'],
    ['⬇ Lưu về máy', '⬇ Save to device'],
    ['Gói Melody', 'Melody Album'],
    ['Gói Voice', 'Voice Album'],
    ['Full: Spotify + Voice Chip + Quà', 'Full: Spotify + Voice Chip + Gifts'],
    ['A5 Đứng', 'A5 Portrait'],
    ['Khổ Vuông', 'Square Format'],
    ['A5 Ngang', 'A5 Landscape'],
    ['A6 Mini', 'A6 Mini Pocket'],
    ['Thêm Trang Đôi Mở Rộng', 'Add Extra Interior Spreads'],
    ['➕ Thêm 1 Trang Đôi Liền Kề (+15.000đ / 2 trang)', '➕ Add 1 Extra Spread (+15,000đ / 2 pages)'],
    ['Khung Ảnh Canva (Canva Frames)', 'Canva Photo Frames'],
    ['🔲 Bo Tròn', '🔲 Rounded'],
    ['⭕ Khung Tròn', '⭕ Circle'],
    ['Bố Cục Ảnh Mẫu (Preset Layouts)', 'Preset Photo Layouts'],
    ['Chèn khung mẫu & tự động phân bổ ảnh:', 'Insert layout and auto-distribute photos:'],
    ['1 Ảnh Lớn', '1 Large Hero'],
    ['2 Ảnh Ngang', '2 Horizontal'],
    ['3 Ảnh Phối', '3 Collage'],
    ['4 Ảnh Lưới', '4 Grid'],
    ['Tiện Ích Sắp Xếp & In Ấn', 'Arrangement & Print Tools'],
    ['🔀 Trộn Ảnh Nhanh', '🔀 Quick Shuffle'],
    ['📏 Vùng An Toàn In', '📏 Print Safe Margins'],
    ['Văn Bản & Lời Tựa', 'Text Box & Captions'],
    ['🔤 Thêm Hộp Văn Bản (Text Box)', '🔤 Add Text Box'],
    ['Tải Ảnh Của Bạn Lên', 'Upload Your Photos'],
    ['📸 Chọn ảnh từ máy tính (Kéo thả vào ô)', '📸 Choose photos from device (Drag & drop)'],
    ['Kho Ảnh Kỷ Niệm (Kéo thả vào ô)', 'Memory Gallery (Drag & drop into slots)'],
    ['1. Sáng Tạo Sticker Riêng', '1. Create Custom Stickers'],
    ['✨ Cắt Sticker Từ Ảnh Của Bạn', '✨ Cut Sticker From Your Photo'],
    ['➕ Tải sticker PNG trong suốt từ máy', '➕ Upload Transparent PNG Sticker'],
    ['2. Thư Viện Sticker Sáng Tạo', '2. Creative Sticker Library'],
    ['Sticker của bạn đã tạo:', 'Your created stickers:'],
    ['1. Lời Mở Đầu Bức Thư', '1. Salutation Presets'],
    ['💌 Gửi người thương', '💌 To my beloved'],
    ['👯 Gửi bạn thân', '👯 To my bestie'],
    ['🎓 Gửi 12A3', '🎓 To class 12A3'],
    ['🏡 Gửi gia đình', '🏡 To my family'],
    ['✨ Gửi tôi', '✨ To myself'],
    ['2. Chọn Font Chữ Viết Tay', '2. Handwriting Font'],
    ['Dancing Script (Uốn Lượn Dễ Thương)', 'Dancing Script (Playful & Cute)'],
    ['Caveat (Chữ Tay Tự Nhiên)', 'Caveat (Natural Handwriting)'],
    ['Pacifico (Ngọt Ngào Đáng Yêu)', 'Pacifico (Sweet & Charming)'],
    ['Lora (Thơ Mộng & Cổ Điển)', 'Lora (Poetic & Classic)'],
    ['Playfair Display (Sang Trọng)', 'Playfair Display (Elegant)'],
    ['Montserrat (Hiện Đại & Thanh Thoát)', 'Montserrat (Modern & Clean)'],
    ['3. Màu Mực Bút Máy', '3. Fountain Pen Ink'],
    ['4. Nội Dung Lời Nhắn', '4. Message Content'],
    ['5. Chữ Ký & Địa Điểm / Ngày Tháng', '5. Signature & Date / Location'],
    ['1. Chọn Nhạc Spotify Cho Album', '1. Choose Spotify Track'],
    ['Tìm bài hát hoặc ca sĩ:', 'Search song or artist:'],
    ['Chưa có bài hát nào được chọn', 'No track selected yet'],
    ['Hãy gõ tên bài hát ở trên để tìm hoặc dán đường dẫn Spotify', 'Type song title above to search or paste a Spotify link'],
    ['Hoặc dán trực tiếp đường dẫn Spotify', 'Or paste Spotify direct link'],
    ['✓ Đã liên kết mã Spotify Soundwave', '✓ Linked Spotify Soundwave Scannable Code'],
    ['2. Thu Âm Giọng Nói Thật (ISD1820)', '2. Real Voice Recording (ISD1820)'],
    ['Tôi muốn tự thu âm tại nhà sau khi nhận album', 'I want to record at home after receiving album'],
    ['Xưởng sẽ gửi kèm chip ISD1820 và hướng dẫn tự nạp giọng nói.', 'Workshop will ship the ISD1820 module with audio recording instructions.'],
    ['🎙️ Thu Âm', '🎙️ Record'],
    ['🔄 Thu Lại', '🔄 Re-record'],
    ['▶️ Nghe Thử', '▶️ Preview'],
    ['Nâng cấp Signature Combo →', 'Upgrade to Signature Combo →'],
    ['Vùng an toàn in', 'Print Safe Margins'],
    ['⬇ Tải PDF album', '⬇ Download PDF Album'],
    ['↶ Hoàn tác', '↶ Undo'],
    ['↷ Làm lại', '↷ Redo'],
    ['🎯 Căn Giữa', '🎯 Center'],
    ['📷 Đổi Ảnh', '📷 Replace Photo'],
    ['Tất cả các trang', 'All pages'],
    ['🗑️ Xóa trang đôi này (-15.000đ)', '🗑️ Remove this spread (-15,000₫)'],
    ['Xóa trang đôi này (-15.000đ)', 'Remove this spread (-15,000₫)'],
    ['Bạn muốn đổi khổ album?', 'Change Album Format?'],
    ['Xóa trang đôi?', 'Remove Spread?']
  ] : [
    ['1. Choose Photobook Package', '1. Chọn Gói Sản Phẩm'],
    ['Melody Album', 'Gói Melody'],
    ['Voice Album', 'Gói Voice'],
    ['Full: Spotify + Voice Chip + Gifts', 'Full: Spotify + Voice Chip + Quà'],
    ['2. Album Dimensions & Sizes', '2. Khổ Album & Kích Thước Thật'],
    ['A5 Portrait', 'A5 Đứng'],
    ['Square Format', 'Khổ Vuông'],
    ['A5 Landscape', 'A5 Ngang'],
    ['A6 Mini Pocket', 'A6 Mini'],
    ['Add Extra Interior Spreads', 'Thêm Trang Đôi Mở Rộng'],
    ['➕ Add 1 Extra Spread (+15,000đ / 2 pages)', '➕ Thêm 1 Trang Đôi Liền Kề (+15.000đ / 2 trang)'],
    ['Canva Photo Frames', 'Khung Ảnh Canva (Canva Frames)'],
    ['🔲 Rounded', '🔲 Bo Tròn'],
    ['⭕ Circle', '⭕ Khung Tròn'],
    ['Preset Photo Layouts', 'Bố Cục Ảnh Mẫu (Preset Layouts)'],
    ['Insert layout and auto-distribute photos:', 'Chèn khung mẫu & tự động phân bổ ảnh:'],
    ['1 Large Hero', '1 Ảnh Lớn'],
    ['2 Horizontal', '2 Ảnh Ngang'],
    ['3 Collage', '3 Ảnh Phối'],
    ['4 Grid', '4 Ảnh Lưới'],
    ['Arrangement & Print Tools', 'Tiện Ích Sắp Xếp & In Ấn'],
    ['🔀 Quick Shuffle', '🔀 Trộn Ảnh Nhanh'],
    ['📏 Print Safe Margins', '📏 Vùng An Toàn In'],
    ['Text Box & Captions', 'Văn Bản & Lời Tựa'],
    ['🔤 Add Text Box', '🔤 Thêm Hộp Văn Bản (Text Box)'],
    ['Upload Your Photos', 'Tải Ảnh Của Bạn Lên'],
    ['📸 Choose photos from device (Drag & drop)', '📸 Chọn ảnh từ máy tính (Kéo thả vào ô)'],
    ['Memory Gallery (Drag & drop into slots)', 'Kho Ảnh Kỷ Niệm (Kéo thả vào ô)'],
    ['1. Create Custom Stickers', '1. Sáng Tạo Sticker Riêng'],
    ['✨ Cut Sticker From Your Photo', '✨ Cắt Sticker Từ Ảnh Của Bạn'],
    ['➕ Upload Transparent PNG Sticker', '➕ Tải sticker PNG trong suốt từ máy'],
    ['2. Creative Sticker Library', '2. Thư Viện Sticker Sáng Tạo'],
    ['Your created stickers:', 'Sticker của bạn đã tạo:'],
    ['1. Salutation Presets', '1. Lời Mở Đầu Bức Thư'],
    ['💌 To my beloved', '💌 Gửi người thương'],
    ['👯 To my bestie', '👯 Gửi bạn thân'],
    ['🎓 To class 12A3', '🎓 Gửi 12A3'],
    ['🏡 To my family', '🏡 Gửi gia đình'],
    ['✨ To myself', '✨ Gửi tôi'],
    ['2. Handwriting Font', '2. Chọn Font Chữ Viết Tay'],
    ['Dancing Script (Playful & Cute)', 'Dancing Script (Uốn Lượn Dễ Thương)'],
    ['Caveat (Natural Handwriting)', 'Caveat (Chữ Tay Tự Nhiên)'],
    ['Pacifico (Sweet & Charming)', 'Pacifico (Ngọt Ngào Đáng Yêu)'],
    ['Lora (Poetic & Classic)', 'Lora (Thơ Mộng & Cổ Điển)'],
    ['Playfair Display (Elegant)', 'Playfair Display (Sang Trọng)'],
    ['Montserrat (Modern & Clean)', 'Montserrat (Hiện Đại & Thanh Thoát)'],
    ['3. Fountain Pen Ink', '3. Màu Mực Bút Máy'],
    ['4. Message Content', '4. Nội Dung Lời Nhắn'],
    ['5. Signature & Date / Location', '5. Chữ Ký & Địa Điểm / Ngày Tháng'],
    ['1. Choose Spotify Track', '1. Chọn Nhạc Spotify Cho Album'],
    ['Search song or artist:', 'Tìm bài hát hoặc ca sĩ:'],
    ['No track selected yet', 'Chưa có bài hát nào được chọn'],
    ['Type song title above to search or paste a Spotify link', 'Hãy gõ tên bài hát ở trên để tìm hoặc dán đường dẫn Spotify'],
    ['Or paste Spotify direct link', 'Hoặc dán trực tiếp đường dẫn Spotify'],
    ['✓ Linked Spotify Soundwave Scannable Code', '✓ Đã liên kết mã Spotify Soundwave'],
    ['2. Real Voice Recording (ISD1820)', '2. Thu Âm Giọng Nói Thật (ISD1820)'],
    ['I want to record at home after receiving album', 'Tôi muốn tự thu âm tại nhà sau khi nhận album'],
    ['Workshop will ship the ISD1820 module with audio recording instructions.', 'Xưởng sẽ gửi kèm chip ISD1820 và hướng dẫn tự nạp giọng nói.'],
    ['🎙️ Record', '🎙️ Thu Âm'],
    ['🔄 Re-record', '🔄 Thu Lại'],
    ['▶️ Preview', '▶️ Nghe Thử'],
    ['Upgrade to Signature Combo →', 'Nâng cấp Signature Combo →'],
    ['Print Safe Margins', 'Vùng an toàn in'],
    ['⬇ Download PDF Album', '⬇ Tải PDF album'],
    ['↶ Undo', '↶ Hoàn tác'],
    ['↷ Redo', '↷ Làm lại'],
    ['🎯 Center', '🎯 Căn Giữa'],
    ['📷 Replace Photo', '📷 Đổi Ảnh'],
    ['All pages', 'Tất cả các trang'],
    ['🗑️ Remove this spread (-15,000₫)', '🗑️ Xóa trang đôi này (-15.000đ)'],
    ['Remove this spread (-15,000₫)', 'Xóa trang đôi này (-15.000đ)'],
    ['Change Album Format?', 'Bạn muốn đổi khổ album?'],
    ['Remove Spread?', 'Xóa trang đôi?'],
    ['2. Album Format & Actual Size', '2. Khổ Album & Kích Thước Thật'],
    ['Signature Combo Package · 199k', 'Gói Signature Combo · 199k'],
    ['Melody Package · 119k', 'Gói Melody · 119k'],
    ['Voice Package · 159k', 'Gói Voice · 159k'],
    ['⏱️ Duration: 00:00 / 00:30', '⏱️ Thời lượng: 00:00 / 00:30'],
    ['🔊 Sound', '🔊 Âm thanh'],
    ['⬇ Save to device', '⬇ Lưu về máy']
  ];

  const studio = document.getElementById('page-studio');
  if (studio) {
    const walker = document.createTreeWalker(studio, NodeFilter.SHOW_TEXT, null, false);
    let node;
    while (node = walker.nextNode()) {
      const p = node.parentElement;
      if (!p || ['SCRIPT', 'STYLE'].includes(p.tagName)) continue;
      const curTxt = node.textContent.trim();
      for (const [from, to] of textReplacements) {
        if (curTxt === from) {
          node.textContent = to;
          break;
        }
      }
    }
  }

  const pkgBadge = document.getElementById('studioPackageBadge');
  if (pkgBadge) {
    const pkg = (typeof ALBUM_DATA !== 'undefined' && ALBUM_DATA.package) || 'signature';
    pkgBadge.textContent = isEn
      ? (pkg === 'melody' ? 'Melody Package · 119k' : (pkg === 'voice' ? 'Voice Package · 159k' : 'Signature Combo Package · 199k'))
      : (pkg === 'melody' ? 'Gói Melody · 119k' : (pkg === 'voice' ? 'Gói Voice · 159k' : 'Gói Signature Combo · 199k'));
  }

  const fbmSound = document.getElementById('fbmSoundToggleBtn');
  if (fbmSound) {
    fbmSound.textContent = isEn ? '🔊 Sound' : '🔊 Âm thanh';
    fbmSound.title = isEn ? 'Toggle flip sound' : 'Bật/Tắt âm thanh lật trang';
  }
  const fbmExp = document.getElementById('fbmExportDesignBtn');
  if (fbmExp) fbmExp.textContent = isEn ? '⬇ Save to device' : '⬇ Lưu về máy';
  const vTimer = document.getElementById('voiceRecTimer');
  if (vTimer && vTimer.textContent.includes('00:00 / 00:30')) {
    vTimer.textContent = isEn ? '⏱️ Duration: 00:00 / 00:30' : '⏱️ Thời lượng: 00:00 / 00:30';
  }

  // Sticker subtabs
  const stkAll = document.getElementById('stkTabBtnAll'); if (stkAll) stkAll.textContent = isEn ? 'All' : 'Tất cả';
  const stk0 = document.getElementById('stkTabBtn0'); if (stk0) stk0.textContent = isEn ? '❤️ Emotions' : '❤️ Cảm Xúc';
  const stk1 = document.getElementById('stkTabBtn1'); if (stk1) stk1.textContent = isEn ? '🌸 Dried Flowers' : '🌸 Hoa Khô';
  const stk2 = document.getElementById('stkTabBtn2'); if (stk2) stk2.textContent = isEn ? '📸 Memories' : '📸 Kỷ Niệm';
  const stk4 = document.getElementById('stkTabBtn4'); if (stk4) stk4.textContent = isEn ? '🔴 Wax Seals' : '🔴 Sáp Niêm Phong';

  // Input placeholders
  const studioSecMap = {
    lblCanvaFramesTitle: isEn ? 'Canva Photo Frames' : 'Khung Ảnh Canva',
    lblPresetLayoutsTitle: isEn ? 'Preset Photo Layouts' : 'Bố Cục Ảnh Mẫu',
    btnAddTextBoxAction: isEn ? '🔤 Add Text Box' : '🔤 Thêm Hộp Văn Bản',
    lblSignatureDateTitle: isEn ? '5. Signature & Date' : '5. Chữ Ký & Ngày Tháng'
  };
  Object.keys(studioSecMap).forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = studioSecMap[id];
  });

  const spotInput = document.getElementById('spotifySearchInput');
  if (spotInput) spotInput.placeholder = 'https://open.spotify.com/track/...';
  const spotLbl = document.getElementById('lblSpotifyInputTitle');
  if (spotLbl) spotLbl.textContent = isEn ? 'Paste Spotify song link:' : 'Dán liên kết bài hát Spotify:';
  const spotHelper = document.getElementById('lblSpotifyHelperText');
  if (spotHelper) spotHelper.innerHTML = isEn ? '💡 <span>Open Spotify → Share → Copy link</span>' : '💡 <span>Mở Spotify → Chia sẻ → Sao chép liên kết</span>';
  const spotEmptyTitle = document.getElementById('lblSpotifyEmptyTitle');
  if (spotEmptyTitle) spotEmptyTitle.textContent = isEn ? 'No song selected yet' : 'Chưa có bài hát nào được chọn';
  const spotEmptyDesc = document.getElementById('lblSpotifyEmptyDesc');
  if (spotEmptyDesc) spotEmptyDesc.textContent = isEn ? 'Paste Spotify song link above to connect' : 'Dán đường dẫn bài hát Spotify ở trên để liên kết';
  const btnChangeSong = document.getElementById('btnChangeSpotifySong');
  if (btnChangeSong) btnChangeSong.textContent = isEn ? 'Change' : 'Đổi bài';
  const sigInput = document.getElementById('sidebarSignatureInput');
  if (sigInput) sigInput.placeholder = isEn ? '— Sign name / Date —' : '— Ký tên / Ngày tháng —';
}

function applyHomepageModalTranslations(lang) {
  const isEn = (lang === 'en');
  const somBadge = document.getElementById('somStepBadge');
  if (somBadge) somBadge.textContent = isEn ? 'STUDIO GUIDE · 01/03' : 'HƯỚNG DẪN STUDIO · 01/03';
  const somTitle = document.getElementById('somStepTitle');
  if (somTitle) somTitle.textContent = isEn ? 'Creative Toolbar on the Left' : 'Thanh công cụ sáng tạo bên trái';
  const somDesc = document.getElementById('somStepDesc');
  if (somDesc) somDesc.textContent = isEn ? 'Here you can add spreads, upload photos, place stickers, write personal notes, and select a Spotify song.' : 'Tại đây bạn có thể thêm trang đôi, tải ảnh kỷ niệm, dán sticker trang trí, viết lời nhắn tặng và chọn bài hát Spotify cho album.';
  const somNext = document.getElementById('somNextBtn');
  if (somNext) somNext.textContent = isEn ? 'Next (1/3) →' : 'Tiếp tục (1/3) →';

  // Chat widget
  const chatStatus = document.getElementById('chatOnlineStatusText');
  if (chatStatus) chatStatus.textContent = isEn ? 'Online' : 'Đang trực tuyến';

  // Account dropdown
  const accLinks = document.querySelectorAll('.nav-dropdown a');
  if (accLinks && accLinks.length >= 3) {
    if (isEn) {
      accLinks[0].innerHTML = 'Your Designs';
      accLinks[1].innerHTML = 'Your Orders';
      accLinks[2].innerHTML = 'Log out';
    } else {
      accLinks[0].innerHTML = 'Bản thiết kế của bạn';
      accLinks[1].innerHTML = 'Đơn hàng của bạn';
      accLinks[2].innerHTML = 'Đăng xuất';
    }
  }
}


function updateSettingsLangUI(lang) {
  const viBtns = [document.getElementById('settingsLangViBtn'), document.getElementById('mndLangViBtn')];
  const enBtns = [document.getElementById('settingsLangEnBtn'), document.getElementById('mndLangEnBtn')];
  viBtns.forEach(btn => {
    if (btn) {
      btn.classList.toggle('active', lang === 'vi');
      btn.textContent = lang === 'vi' ? 'Tiếng Việt ✓' : 'Tiếng Việt';
    }
  });
  enBtns.forEach(btn => {
    if (btn) {
      btn.classList.toggle('active', lang === 'en');
      btn.textContent = lang === 'en' ? 'English ✓' : 'English';
    }
  });
}

function applyMobileDrawerTranslations(lang) {
  const isEn = (lang === 'en');
  const mndMenuTitle = document.getElementById('mndMenuTitle');
  if (mndMenuTitle) mndMenuTitle.textContent = isEn ? 'Melsou Menu' : 'Menu Melsou';

  const mndLangLabel = document.getElementById('mndLangLabel');
  if (mndLangLabel) mndLangLabel.textContent = isEn ? 'Language:' : 'Ngôn ngữ:';

  const mndMap = {
    mndLinkHome: isEn ? 'Home' : 'Trang chủ',
    mndLinkAbout: isEn ? 'About Melsou' : 'Về Melsou',
    mndLinkValues: isEn ? 'Four Unique Values' : 'Bốn giá trị độc bản',
    mndLinkPricing: isEn ? 'Packages' : 'Gói sản phẩm',
    mndLinkTemplates: isEn ? 'Template Library' : 'Thư viện Template',
    mndLinkReviews: isEn ? 'User Reviews' : 'Trải nghiệm người dùng',
    mndLinkBlog: isEn ? 'Blog' : 'Câu chuyện',
    mndLinkTracking: isEn ? 'Track Order' : 'Tra cứu đơn hàng',
    mndCtaBtn: isEn ? 'Start Creating Album' : 'Bắt đầu tạo album'
  };
  Object.keys(mndMap).forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = mndMap[id];
  });

  const settingsHead = document.getElementById('lblSettingsLanguageHeading');
  if (settingsHead) settingsHead.textContent = isEn ? 'Display Language' : 'Ngôn ngữ hiển thị';
  const settingsDesc = document.getElementById('lblSettingsLanguageDesc');
  if (settingsDesc) settingsDesc.textContent = isEn ? 'Choose Vietnamese or English' : 'Chọn Tiếng Việt hoặc Tiếng Anh';
  const settingsGrpA = document.getElementById('lblSettingsGroupA');
  if (settingsGrpA) settingsGrpA.textContent = isEn ? 'A. INTERFACE & EFFECTS' : 'A. GIAO DIỆN & HIỆU ỨNG';

  const udDrafts = document.getElementById('udLinkDrafts');
  if (udDrafts) udDrafts.textContent = isEn ? 'Your Saved Drafts' : 'Bản thiết kế của bạn';
  const udOrders = document.getElementById('udLinkOrders');
  if (udOrders) udOrders.textContent = isEn ? 'Your Orders' : 'Đơn hàng của bạn';
  const udLogout = document.getElementById('udLinkLogout');
  if (udLogout) udLogout.textContent = isEn ? 'Sign Out' : 'Đăng xuất';

  const cartBtn = document.getElementById('headerCartBtn');
  if (cartBtn) {
    cartBtn.title = isEn ? 'Cart' : 'Giỏ hàng';
    cartBtn.setAttribute('aria-label', cartBtn.title);
  }
}

function switchLanguage(lang) {
  currentAppLanguage = lang;
  applyMobileDrawerTranslations(lang);
  updateSettingsLangUI(lang);
  const isEn = (lang === 'en');

  const shortPromo = document.querySelector('.topbar-short-text');
  if (shortPromo) {
    shortPromo.textContent = isEn ? 'Free Spotify Code & Kraft Box' : 'Tặng mã Spotify & Hộp Kraft';
  }

  const bio = document.getElementById('footerBrandBio');
  if (bio) {
    bio.textContent = isEn ? 'Cherish feelings in the shape of sound. Where melody meets memory, and printed pages sing.' : 'Gói tâm tình trong dáng hình thanh âm. Nơi giai điệu gặp gỡ kỷ niệm, và mỗi trang ảnh biết cất lời.';
  }

  const blogCats = {
    blogCatAll: isEn ? 'All Articles' : 'Tất cả bài viết'
  };
  Object.keys(blogCats).forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = blogCats[id];
  });
  if (typeof renderBlogCategories === 'function') renderBlogCategories();
  try {
    localStorage.setItem('melsou_language', lang);
  } catch(e) {}

  const viBtn = document.getElementById('langViBtn');
  const enBtn = document.getElementById('langEnBtn');
  if (viBtn) viBtn.classList.toggle('active', lang === 'vi');
  if (enBtn) enBtn.classList.toggle('active', lang === 'en');

  const dict = MELSOU_I18N[lang] || MELSOU_I18N.vi;

  // Header Nav & Topbar
  const topBadge = document.getElementById('i18nTopbarBadge');
  if (topBadge) topBadge.textContent = dict.topbarBadge;
  const topPromo = document.getElementById('i18nTopbarPromoFull');
  if (topPromo) topPromo.textContent = dict.topbarPromoFull;
  const topAct = document.getElementById('i18nTopbarAction');
  if (topAct) topAct.textContent = dict.topbarAction;

  const navMap = {
    navLinkAbout: dict.navAbout,
    navLinkValues: dict.navValues,
    navLinkPricing: dict.navPricing,
    navLinkTemplates: dict.navTemplates,
    navLinkReviews: dict.navReviews,
    navLinkBlog: dict.navBlog,
    navLinkTracking: dict.navTracking
  };
  Object.keys(navMap).forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = navMap[id];
  });

  const authLabel = document.getElementById('headerAuthBtnLabel');
  if (authLabel && (!currentUser || !currentUser.loggedIn || currentUser.isGuest)) {
    authLabel.textContent = dict.authBtnLabel;
  }
  const cartLabel = document.getElementById('headerCartBtnLabel');
  if (cartLabel) {
    cartLabel.textContent = dict.cartBtnLabel || (lang === 'vi' ? 'Giỏ hàng' : 'Cart');
  }

  // Hero Section
  const heroBadge = document.getElementById('heroEducationalBadge');
  if (heroBadge && heroBadge.textContent !== dict.heroBadge) heroBadge.textContent = dict.heroBadge;
  const heroBase = document.getElementById('heroTitleBase');
  if (heroBase && heroBase.textContent !== dict.heroTitle) heroBase.textContent = dict.heroTitle;
  const heroAccent = document.getElementById('heroTitleAccent');
  if (heroAccent && heroAccent.textContent !== dict.heroTitleAccent) heroAccent.textContent = dict.heroTitleAccent;
  const heroDesc = document.getElementById('heroSubheadlineText');
  if (heroDesc) {
    if (lang === 'en') {
      if (heroDesc.textContent !== dict.heroDesc) heroDesc.textContent = dict.heroDesc;
    } else {
      const defaultViDesc = 'Chiếc máy ảnh có thể giữ lại hình dáng khoảnh khắc, nhưng lại vô tình bỏ quên âm thanh. <strong>Melsou</strong> hòa quyện <em>giai điệu (melody)</em> và <em>kỷ vật (souvenir)</em> để mỗi trang ảnh không chỉ đẹp, mà còn biết cất lời.';
      if (heroDesc.innerHTML !== defaultViDesc) heroDesc.innerHTML = defaultViDesc;
    }
  }
  const btnStart = document.getElementById('btnHeroStartStudio');
  if (btnStart && btnStart.textContent !== dict.btnStartStudio) btnStart.textContent = dict.btnStartStudio;
  const btnFlip = document.getElementById('btnHeroFlipbook');
  if (btnFlip && btnFlip.textContent !== dict.btn3DFlip) btnFlip.textContent = dict.btn3DFlip;

  // Hero Trust Items
  const trustOffgrid = document.getElementById('heroTrustOffgrid');
  if (trustOffgrid && trustOffgrid.textContent !== dict.heroTrustOffgrid) trustOffgrid.textContent = dict.heroTrustOffgrid;
  const trustLayflat = document.getElementById('heroTrustLayflat');
  if (trustLayflat && trustLayflat.textContent !== dict.heroTrustLayflat) trustLayflat.textContent = dict.heroTrustLayflat;
  const trustSpotify = document.getElementById('heroTrustSpotify');
  if (trustSpotify && trustSpotify.textContent !== dict.heroTrustSpotify) trustSpotify.textContent = dict.heroTrustSpotify;

  // Values Section
  const valTitle = document.getElementById('valSectionTitle');
  if (valTitle) valTitle.textContent = dict.valSectionTitle;
  const valDesc = document.getElementById('valSectionDesc');
  if (valDesc) valDesc.textContent = dict.valSectionDesc;
  for (let i = 0; i <= 3; i++) {
    const t = document.getElementById(`valCardTitle${i}`);
    if (t && dict[`valCardTitle${i}`]) t.textContent = dict[`valCardTitle${i}`];
    const d = document.getElementById(`valCardDesc${i}`);
    if (d && dict[`valCardDesc${i}`]) d.textContent = dict[`valCardDesc${i}`];
    const m = document.getElementById(`valCardMore${i}`);
    if (m && dict[`valCardMore${i}`]) m.textContent = dict[`valCardMore${i}`];
  }

  // Pricing Section
  const prTitle = document.getElementById('pricingTitle');
  if (prTitle) prTitle.textContent = dict.pricingTitle;

  const pricingIdMap = {
    pkgFeaturedBadge: dict.pkgFeaturedBadge,
    pkgMelodyLabel: dict.pkgMelodyLabel,
    pkgMelodyNote: dict.pkgMelodyNote,
    pkgMelodyFeat1: dict.pkgMelodyFeat1,
    pkgMelodyFeat2: dict.pkgMelodyFeat2,
    pkgMelodyFeat3: dict.pkgMelodyFeat3,
    pkgMelodyFeat4: dict.pkgMelodyFeat4,
    btnSelectMelody: dict.btnSelectMelody,
    pkgVoiceLabel: dict.pkgVoiceLabel,
    pkgVoiceNote: dict.pkgVoiceNote,
    pkgVoiceFeat1: dict.pkgVoiceFeat1,
    pkgVoiceFeat2: dict.pkgVoiceFeat2,
    pkgVoiceFeat3: dict.pkgVoiceFeat3,
    pkgVoiceFeat4: dict.pkgVoiceFeat4,
    btnSelectVoice: dict.btnSelectVoice,
    pkgSignatureLabel: dict.pkgSignatureLabel,
    pkgSignatureNote: dict.pkgSignatureNote,
    pkgSignatureFeat1: dict.pkgSignatureFeat1,
    pkgSignatureFeat2: dict.pkgSignatureFeat2,
    pkgSignatureFeat3: dict.pkgSignatureFeat3,
    pkgSignatureFeat4: dict.pkgSignatureFeat4,
    pkgSignatureFeat5: dict.pkgSignatureFeat5,
    btnSelectSignature: dict.btnSelectSignature
  };
  Object.keys(pricingIdMap).forEach(id => {
    const el = document.getElementById(id);
    if (el && pricingIdMap[id]) el.textContent = pricingIdMap[id];
  });

  // Templates Section
  const tplHeading = document.getElementById('tplLibraryHeading');
  if (tplHeading) tplHeading.textContent = dict.tplLibraryHeading;
  const tplSub = document.getElementById('tplLibrarySubheading');
  if (tplSub) tplSub.textContent = dict.tplLibrarySubheading;

  // FB76: Synchronize Template Cards and Onboarding Modal in realtime
  if (templateCardsInitialized) initTemplateCards(true);
  const onbT = document.getElementById('onboardingModalTitle');
  if (onbT) onbT.textContent = isEn ? 'Choose a Starting Design Template' : 'Chọn mẫu thiết kế mở đầu';
  const onbD = document.getElementById('onboardingModalDesc');
  if (onbD) onbD.textContent = isEn ? 'Select 1 of 8 artistic styles to load layouts and start customizing:' : 'Chọn 1 trong 8 phong cách nghệ thuật để nạp ngay bố cục và bắt đầu tùy biến:';

  // Studio & Toolbar
  const s1 = document.getElementById('stStep1Text');
  if (s1) s1.textContent = dict.stStep1;
  const s2 = document.getElementById('stStep2Text');
  if (s2) s2.textContent = dict.stStep2;
  const s3 = document.getElementById('stStep3Text');
  if (s3) s3.textContent = dict.stStep3;
  const s4 = document.getElementById('stStep4Text');
  if (s4) s4.textContent = dict.stStep4;
  const bEdit = document.getElementById('btnModeEdit');
  if (bEdit) bEdit.textContent = dict.btnModeEdit;
  const bFlip = document.getElementById('btnModeFlip');
  if (bFlip) bFlip.textContent = dict.btnModeFlip;
  const btnStudioOrder = document.getElementById('btnStudioAddToCart');
  if (btnStudioOrder) btnStudioOrder.textContent = dict.studioBtnOrder;
  const btnExport = document.getElementById('btnExportDesign');
  if (btnExport) btnExport.textContent = dict.btnExportDesign;
  const cloudSync = document.getElementById('studioCloudSyncText');
  if (cloudSync) cloudSync.textContent = dict.studioCloudSync;
  const btnSafeGuides = document.getElementById('btnTopSafeGuides');
  if (btnSafeGuides) btnSafeGuides.textContent = dict.btnTopSafeGuides;

  // Studio tabs
  for (let i = 0; i <= 5; i++) {
    const tab = document.getElementById(`cNavTab${i}`);
    if (tab && dict[`cNavTab${i}`]) tab.innerHTML = dict[`cNavTab${i}`];
  }

  // Mobile More Menu Items
  const msmGuides = document.getElementById('msmItemSafeGuides');
  if (msmGuides) msmGuides.textContent = dict.msmSafeGuides;
  const msmPdf = document.getElementById('msmItemDownloadPdf');
  if (msmPdf) msmPdf.textContent = dict.msmDownloadPdf;
  const msmUndoEl = document.getElementById('msmItemUndo');
  if (msmUndoEl) msmUndoEl.textContent = dict.msmUndo;
  const msmRedoEl = document.getElementById('msmItemRedo');
  if (msmRedoEl) msmRedoEl.textContent = dict.msmRedo;

  // Reviews & Blog
  const revBadge = document.getElementById('i18nReviewsBadge');
  if (revBadge) revBadge.textContent = dict.reviewsBadge;
  const revHeading = document.getElementById('i18nReviewsHeading') || document.getElementById('reviewsHeading');
  if (revHeading) revHeading.textContent = dict.reviewsHeading;
  const revSub = document.getElementById('i18nReviewsSubheading') || document.getElementById('reviewsSubheading');
  if (revSub) revSub.textContent = dict.reviewsSubheading;
  const revDisclaimer = document.getElementById('i18nReviewsDisclaimer');
  if (revDisclaimer) revDisclaimer.textContent = dict.reviewsDisclaimer;
  const btnRev = document.getElementById('btnOpenWriteReview') || document.getElementById('btnOpenReviewModal');
  if (btnRev) btnRev.textContent = dict.btnWriteReview;
  const blogBadge = document.getElementById('i18nBlogBadge');
  if (blogBadge) blogBadge.textContent = dict.blogBadge;
  const blogHeading = document.getElementById('i18nBlogHeading');
  if (blogHeading) blogHeading.textContent = dict.blogHeading;
  const blogSub = document.getElementById('i18nBlogSubheading');
  if (blogSub) blogSub.textContent = dict.blogSubheading;

  // Cart Drawer
  const cSelAll = document.getElementById('cartSelectAllLabel');
  if (cSelAll) cSelAll.textContent = dict.cartSelectAll;
  const cTot = document.getElementById('cartTotalLabel');
  if (cTot) cTot.textContent = dict.cartTotalLabel;
  const cDisc = document.getElementById('cartDiscountLabel');
  if (cDisc) cDisc.textContent = dict.cartDiscountLabel;

  // Footer
  const fHeadings = ['footerHeadingProducts', 'footerHeadingSupport', 'footerHeadingBrand', 'footerSocialHeading'];
  fHeadings.forEach(id => {
    const el = document.getElementById(id);
    if (el && dict[id]) el.textContent = dict[id];
  });
  const fLinks = [
    'footerLinkMelody', 'footerLinkVoice', 'footerLinkSignature', 'footerLinkTemplates',
    'footerLinkTracking', 'footerLinkWarranty', 'footerLinkPrivacy', 'footerLinkAbout',
    'footerLinkValues', 'footerLinkWorkshop', 'footerCopyDetails', 'footerLinkContactPhone'
  ];
  fLinks.forEach(id => {
    const el = document.getElementById(id);
    if (el && dict[id]) el.textContent = dict[id];
  });

  // Auth Modal & Settings Linked Email (FB58)
  const authHeading = document.getElementById('authModalHeading');
  if (authHeading && dict.authModalHeading) authHeading.textContent = dict.authModalHeading;
  const authSubheading = document.getElementById('authModalSubheading');
  if (authSubheading && dict.authModalSubheading) authSubheading.textContent = dict.authModalSubheading;
  const tabLogin = document.getElementById('authTabBtnLogin');
  if (tabLogin && dict.authTabLogin) tabLogin.textContent = dict.authTabLogin;
  const tabReg = document.getElementById('authTabBtnRegister');
  if (tabReg && dict.authTabRegister) tabReg.textContent = dict.authTabRegister;
  const lblLogUser = document.getElementById('lblLoginUsername');
  if (lblLogUser && dict.lblLoginUsername) lblLogUser.textContent = dict.lblLoginUsername;
  const lblLogPass = document.getElementById('lblLoginPassword');
  if (lblLogPass && dict.lblLoginPassword) lblLogPass.textContent = dict.lblLoginPassword;
  const forgotLink = document.getElementById('authForgotPwLink');
  if (forgotLink && dict.authForgotPwLink) forgotLink.textContent = dict.authForgotPwLink;
  const btnSubLogin = document.getElementById('btnSubmitLogin');
  if (btnSubLogin && dict.btnSubmitLogin) btnSubLogin.textContent = dict.btnSubmitLogin;
  const lblRegUser = document.getElementById('lblRegUsername');
  if (lblRegUser && dict.lblRegUsername) lblRegUser.textContent = dict.lblRegUsername;
  const lblRegPass = document.getElementById('lblRegPassword');
  if (lblRegPass && dict.lblRegPassword) lblRegPass.textContent = dict.lblRegPassword;
  const lblRegConf = document.getElementById('lblRegConfirmPassword');
  if (lblRegConf && dict.lblRegConfirmPassword) lblRegConf.textContent = dict.lblRegConfirmPassword;
  const btnSubReg = document.getElementById('btnSubmitRegister');
  if (btnSubReg && dict.btnSubmitRegister) btnSubReg.textContent = dict.btnSubmitRegister;
  const fHeading = document.getElementById('forgotPwHeading');
  if (fHeading && dict.forgotPwHeading) fHeading.textContent = dict.forgotPwHeading;
  const fDesc = document.getElementById('forgotPwDesc');
  if (fDesc && dict.forgotPwDesc) fDesc.textContent = dict.forgotPwDesc;
  const fBack = document.getElementById('forgotPwBackLink');
  if (fBack && dict.forgotPwBackLink) fBack.textContent = dict.forgotPwBackLink;
  const lblLinkedMail = document.getElementById('lblLinkedEmailHeading');
  if (lblLinkedMail && dict.lblLinkedEmailHeading) lblLinkedMail.textContent = dict.lblLinkedEmailHeading;
  const lblLinkedMailDesc = document.getElementById('lblLinkedEmailDesc');
  if (lblLinkedMailDesc && dict.lblLinkedEmailDesc) lblLinkedMailDesc.textContent = dict.lblLinkedEmailDesc;
  const btnSetLinkEmail = document.getElementById('btnSettingsLinkEmail');
  if (btnSetLinkEmail && dict.btnSettingsLinkEmail) btnSetLinkEmail.textContent = dict.btnSettingsLinkEmail;
  const authDisclaimer = document.getElementById('authTermsDisclaimer');
  if (authDisclaimer && dict.authTermsDisclaimer) {
    authDisclaimer.innerHTML = dict.authTermsDisclaimer;
  }

  // Speed Dial Translations (FB71)
  const sdBtn = document.getElementById('sdMainBtn');
  if (sdBtn) {
    sdBtn.setAttribute('title', isEn ? 'Support' : 'Hỗ trợ');
    sdBtn.setAttribute('aria-label', isEn ? 'Support' : 'Hỗ trợ');
  }
  const sdmChat = document.getElementById('sdmChatText');
  if (sdmChat) sdmChat.textContent = isEn ? 'Live Chat' : 'Chat trực tiếp';
  const sdmZalo = document.getElementById('sdmZaloText');
  if (sdmZalo) sdmZalo.textContent = isEn ? 'Zalo Chat' : 'Nhắn Zalo';
  const sdmHotline = document.getElementById('sdmHotlineText');
  if (sdmHotline) sdmHotline.textContent = isEn ? 'Hotline: 0931.940.512' : 'Hotline: 0931.940.512';

  // Settings Modal Detailed Translations (FB67)
  const settingsDetailMap = {
    settingsModalTitle: isEn ? 'System Settings' : 'Cài đặt hệ thống',
    settingsModalSub: isEn ? 'Customize interface, account security and privacy' : 'Tùy chỉnh giao diện, bảo mật tài khoản và quyền riêng tư',
    lblSettingsGroupA: isEn ? 'A. INTERFACE & EFFECTS' : 'A. GIAO DIỆN & HIỆU ỨNG',
    lblSettingsLanguageHeading: isEn ? 'Display Language' : 'Ngôn ngữ hiển thị',
    lblSettingsLanguageDesc: isEn ? 'Choose Vietnamese or English' : 'Chọn Tiếng Việt hoặc Tiếng Anh',
    lblSettingsThemeHeading: isEn ? 'Display Theme' : 'Chế độ hiển thị',
    lblSettingsThemeDesc: isEn ? 'Choose standard white paper or dark background' : 'Lựa chọn tone màu chuẩn giấy trắng hoặc nền tối',
    optThemeLight: isEn ? 'Light Mode' : 'Giao diện Sáng',
    optThemeDark: isEn ? 'Dark Mode' : 'Giao diện Tối',
    optThemeWarm: isEn ? 'Warm Paper Tone' : 'Tone Giấy Ấm',
    lblSettingsSoundHeading: isEn ? '3D Page Flip Sound' : 'Âm thanh lật sách 3D',
    lblSettingsSoundDesc: isEn ? 'Play paper rustle sound when flipping pages' : 'Phát tiếng sột soạt giấy khi lật trang',
    lblSettingsGroupB: isEn ? 'B. ACCOUNT & SECURITY' : 'B. TÀI KHOẢN & BẢO MẬT',
    lblSettingsProfileHeading: isEn ? 'Personal Profile' : 'Thông tin cá nhân',
    btnSaveSettingsProfile: isEn ? 'Update' : 'Cập nhật',
    lblLinkedEmailHeading: isEn ? 'Linked Email' : 'Email liên kết',
    lblLinkedEmailDesc: isEn ? 'Used for password recovery and receiving digital receipts' : 'Dùng để khôi phục mật khẩu và nhận hóa đơn',
    btnSettingsLinkEmail: isEn ? 'Link Email' : 'Thêm email',
    lblSettingsPasswordHeading: isEn ? 'Change Password' : 'Đổi mật khẩu',
    btnSaveSettingsPassword: isEn ? 'Save Password' : 'Lưu mật khẩu',
    lblSettings2faHeading: isEn ? 'Two-Factor Authentication (2FA)' : 'Xác thực hai yếu tố (2FA)',
    lblSettings2faDesc: isEn ? 'Protect account with verification code on sign-in' : 'Bảo vệ tài khoản bằng mã xác nhận khi đăng nhập',
    btnToggleSettings2FA: isEn ? 'Enable' : 'Kích hoạt',
    lblSettingsGroupC: isEn ? 'C. NOTIFICATIONS' : 'C. CÀI ĐẶT THÔNG BÁO',
    lblSettingsPushHeading: isEn ? 'Browser Notifications' : 'Thông báo trình duyệt',
    lblSettingsPushDesc: isEn ? 'Real-time updates on printing progress and parcel dispatch' : 'Nhận cập nhật tiến độ in ấn và giao hàng theo thời gian thực',
    lblSettingsEmailHeading: isEn ? 'Email Notifications' : 'Thông báo qua Email',
    lblSettingsEmailDesc: isEn ? 'Send print receipts and tracking codes to your inbox' : 'Gửi biên lai đặt in và mã theo dõi bưu cục vào hòm thư',
    lblSettingsGroupD: isEn ? 'D. PRIVACY & HARDWARE' : 'D. QUYỀN RIÊNG TƯ & THIẾT BỊ',
    lblSettingsMicHeading: isEn ? 'Microphone Access' : 'Quyền truy cập Microphone',
    lblSettingsMicDesc: isEn ? 'Record directly onto physical ISD1820 sound module' : 'Sử dụng để thu âm trực tiếp vào module chip ISD1820',
    lblSettingsCameraHeading: isEn ? 'Camera & Photo Library Access' : 'Quyền truy cập máy ảnh và thư viện ảnh',
    lblSettingsCameraDesc: isEn ? 'Upload photos from device to album pages' : 'Tải ảnh từ điện thoại/máy tính lên trang sách',
    lblSettingsGeoHeading: isEn ? 'Location Data' : 'Dữ liệu vị trí',
    lblSettingsGeoDesc: isEn ? 'Melsou never tracks GPS coordinates; EXIF geo-tags stripped' : 'Melsou không theo dõi tọa độ GPS; loại bỏ EXIF địa lý để bảo vệ riêng tư',
    lblSettingsGeoStatus: isEn ? 'Not collected' : 'Không thu thập',
    lblSettingsCacheHeading: isEn ? 'Local Draft Storage' : 'Bộ nhớ nháp trên thiết bị này',
    lblSettingsCacheDesc: isEn ? 'Clear local cache to reset draft back to default' : 'Xóa dữ liệu lưu tạm nếu muốn đặt lại trang sách về mặc định',
    btnClearStudioCache: isEn ? 'Clear Local Draft Cache' : 'Xóa bản thảo cục bộ',
    btnCloseSettingsModal: isEn ? 'Close Settings' : 'Đóng cài đặt'
  };
  Object.keys(settingsDetailMap).forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = settingsDetailMap[id];
  });
  const profInput = document.getElementById('settingsProfileNameInput');
  if (profInput) profInput.placeholder = isEn ? 'Display name...' : 'Tên hiển thị...';
  const passInput = document.getElementById('settingsNewPasswordInput');
  if (passInput) passInput.placeholder = isEn ? 'New password (min 6 chars)...' : 'Mật khẩu mới (tối thiểu 6 ký tự)...';
  const statusEmail = document.getElementById('settingsLinkedEmailStatus');
  if (statusEmail && (statusEmail.textContent === 'Chưa liên kết' || statusEmail.textContent === 'Not linked')) {
    statusEmail.textContent = isEn ? 'Not linked' : 'Chưa liên kết';
  }
  const status2fa = document.getElementById('settings2faStatus');
  if (status2fa && (status2fa.textContent === 'Đang tắt' || status2fa.textContent === 'Disabled')) {
    status2fa.textContent = isEn ? 'Disabled' : 'Đang tắt';
  }
  document.querySelectorAll('.settings-api-badge').forEach(b => {
    b.textContent = isEn ? 'Pending API connection' : 'Chờ Codex kết nối API';
  });
  document.querySelectorAll('.settings-permission-badge').forEach(b => {
    b.textContent = isEn ? 'On demand' : 'Khi cần dùng';
  });

  // Cart Drawer Title & CTA (FB67)
  const cartHeadEl = document.querySelector('.cart-drawer-header h3');
  if (cartHeadEl) cartHeadEl.textContent = isEn ? 'Your Shopping Cart' : 'Giỏ hàng của bạn';
  const btnCheckoutEl = document.querySelector('.btn-checkout');
  if (btnCheckoutEl) btnCheckoutEl.textContent = isEn ? 'Proceed to Checkout →' : 'Tiến hành đặt hàng →';

  updateAdaptiveCtaText();

  applyStudioTranslations(lang);
  applyHomepageModalTranslations(lang);

  syncHeroLiveBook();
  if (typeof renderReviewsList === 'function') renderReviewsList();
  if (typeof renderCustomerReviews === 'function') renderCustomerReviews();
  if (typeof renderPublicBlog === 'function') renderPublicBlog();

  window.MelsouStudio?.refreshLanguage(lang);
}

// ── INIT ON LOAD ──
syncResponsiveDeviceClasses();
initUserAuthState();
loadFromLocalStorage();
startHeroAutoFlip();
if (currentAppLanguage !== 'vi') switchLanguage(currentAppLanguage);
initBackToTop();

// ============================================================
// 🌟 FB46: REAL CUSTOMER REVIEW SYSTEM & CONTRACT HOOKS
// ============================================================
var currentReviewRating = 5;
var currentReviewMedia = [];

function handleOpenWriteReview() {
  let isEligible = false;
  if (typeof window.codexCheckReviewEligibility === 'function') {
    try {
      const res = window.codexCheckReviewEligibility(currentUser);
      isEligible = res && (res.eligible === true || res === true);
    } catch(e) {
      console.warn('codexCheckReviewEligibility error:', e);
    }
  } else {
    // Default contract check: customer must have at least 1 completed order or design
    isEligible = !!(currentUser && currentUser.loggedIn && currentUser.orders && currentUser.orders.length > 0);
  }

  if (isEligible) {
    const modal = document.getElementById('customerReviewModal');
    if (modal) modal.classList.add('open');
  } else {
    const ineligModal = document.getElementById('customerReviewIneligibleModal');
    if (ineligModal) ineligModal.classList.add('open');
  }
}

function closeReviewModal() {
  const m = document.getElementById('customerReviewModal');
  if (m) m.classList.remove('open');
}

function closeReviewIneligibleModal() {
  const m = document.getElementById('customerReviewIneligibleModal');
  if (m) m.classList.remove('open');
}

function setReviewRating(stars) {
  currentReviewRating = stars;
  const container = document.getElementById('reviewStarSelector');
  if (!container) return;
  const spans = container.querySelectorAll('span');
  spans.forEach((s, idx) => {
    s.style.opacity = idx < stars ? '1' : '0.3';
  });
}

function handleReviewMediaSelect(e) {
  const files = Array.from(e.target.files || []);
  const previewList = document.getElementById('reviewMediaPreviewList');
  if (!previewList) return;

  files.forEach(file => {
    currentReviewMedia.push(file);
    const url = URL.createObjectURL(file);
    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:relative;display:inline-block';
    
    if (file.type.startsWith('video/')) {
      wrap.innerHTML = `<video src="${url}" style="width:54px;height:54px;border-radius:8px;object-fit:cover;border:1px solid var(--gray-l)"></video>`;
    } else {
      wrap.innerHTML = `<img src="${url}" style="width:54px;height:54px;border-radius:8px;object-fit:cover;border:1px solid var(--gray-l)" />`;
    }
    const removeBtn = document.createElement('button');
    removeBtn.innerHTML = '✕';
    removeBtn.style.cssText = 'position:absolute;top:-5px;right:-5px;background:rgba(0,0,0,0.65);color:white;border:none;border-radius:50%;width:16px;height:16px;font-size:10px;cursor:pointer;display:flex;align-items:center;justify-content:center';
    removeBtn.onclick = () => {
      wrap.remove();
      currentReviewMedia = currentReviewMedia.filter(f => f !== file);
    };
    wrap.appendChild(removeBtn);
    previewList.appendChild(wrap);
  });
}

function submitCustomerReview() {
  const title = document.getElementById('reviewTitleInput')?.value.trim();
  const content = document.getElementById('reviewContentInput')?.value.trim();
  const pkg = document.getElementById('reviewPackageSelect')?.value || 'Signature Edition';

  if (!title || !content) {
    showToast('Vui lòng điền tiêu đề và nội dung đánh giá');
    return;
  }

  const reviewPayload = {
    rating: currentReviewRating,
    title,
    content,
    package: pkg,
    media: currentReviewMedia,
    authorName: currentUser?.name || 'Khách hàng Melsou',
    createdAt: new Date().toISOString()
  };

  if (typeof window.codexSubmitReview === 'function') {
    try {
      window.codexSubmitReview(reviewPayload);
      showToast('✅ Đã gửi đánh giá thành công! Cảm ơn bạn đã đóng góp cho Melsou.');
    } catch(e) {
      console.warn('codexSubmitReview error:', e);
      showToast('Đã ghi nhận đánh giá của bạn (Chờ kết nối kiểm duyệt từ backend).');
    }
  } else {
    showToast('Đã ghi nhận đánh giá của bạn (Chờ kết nối kiểm duyệt từ backend).');
  }

  closeReviewModal();
  // Clear inputs
  if (document.getElementById('reviewTitleInput')) document.getElementById('reviewTitleInput').value = '';
  if (document.getElementById('reviewContentInput')) document.getElementById('reviewContentInput').value = '';
  if (document.getElementById('reviewMediaPreviewList')) document.getElementById('reviewMediaPreviewList').innerHTML = '';
  currentReviewMedia = [];
}

function renderCustomerReviews() {
  const grid = document.getElementById('customerReviewsGrid');
  if (!grid) return;

  let reviews = [];
  if (typeof window.codexGetApprovedReviews === 'function') {
    try {
      reviews = window.codexGetApprovedReviews() || [];
    } catch(e) {
      console.warn('codexGetApprovedReviews error:', e);
    }
  }

  const isEn = (currentAppLanguage === 'en');
  if (!reviews || reviews.length === 0) {
    grid.innerHTML = `
      <div class="review-empty-state">
        <h3 style="font-size:18px;font-weight:700;color:var(--dark);margin-bottom:6px">${isEn ? 'First authentic reviews are being gathered' : 'Những đánh giá chân thực đầu tiên đang được chuẩn bị'}</h3>
        <p style="font-size:13.5px;color:var(--gray);max-width:540px;margin:0 auto">
          ${isEn ? 'Melsou treasures every customer moment and emotion. Experience Melsou and be among the first to share your thoughts!' : 'Melsou trân trọng từng khoảnh khắc và cảm xúc của khách hàng. Hãy trải nghiệm và trở thành một trong những người đầu tiên chia sẻ cảm nhận!'}
        </p>
      </div>`;
    return;
  }

  grid.innerHTML = reviews.map(rev => `
    <div class="customer-review-card">
      <div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <div class="review-stars">${'⭐'.repeat(rev.rating || 5)}</div>
          <span class="review-badge-verified">${isEn ? '✓ Verified Melsou Experience' : '✓ Đã trải nghiệm Melsou'}</span>
        </div>
        <h3 style="font-size:15px;font-weight:700;color:var(--dark);margin-bottom:6px">${rev.title || ''}</h3>
        <p style="font-size:13.5px;line-height:1.65;color:#374151;font-style:italic">"${rev.content || ''}"</p>
        ${rev.mediaUrls && rev.mediaUrls.length > 0 ? `
          <div class="review-media-gallery">
            ${rev.mediaUrls.map(url => `<img src="${url}" alt="review pic" />`).join('')}
          </div>` : ''}
      </div>
      <div style="display:flex;align-items:center;gap:12px;margin-top:18px;border-top:1px solid #f3f4f6;padding-top:14px">
        <div style="width:38px;height:38px;border-radius:50%;background:var(--red-light);color:var(--red);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px">
          ${(rev.authorName || 'KH').substring(0, 2).toUpperCase()}
        </div>
        <div>
          <strong style="display:block;font-size:13.5px;color:var(--dark)">${rev.authorName || (isEn ? 'Customer' : 'Khách hàng')}</strong>
          <span style="font-size:11.5px;color:var(--gray)">${rev.package || (isEn ? 'Photobook Package' : 'Gói photobook')}</span>
        </div>
      </div>
    </div>`).join('');
}


// ============================================================
// 📖 FB47: BLOG / MEMORY JOURNAL STOREFRONT & READER MODAL
// ============================================================
var activeBlogCategory = 'all';
var currentLoadedBlogPosts = [];
var currentBlogPage = 1;
var currentBlogTotalPages = 1;
var currentBlogCategories = [];
var blogSearchQuery = '';
var blogListRequestId = 0;
var blogSsrFingerprint = '';

function blogPostsFingerprint(posts) {
  return JSON.stringify((Array.isArray(posts) ? posts : []).map((post) => [
    post?.slug || '',
    post?.modifiedAt || '',
    plainWordPressText(post?.title || ''),
    plainWordPressText(post?.excerpt || ''),
    plainWordPressText(post?.content || ''),
    safeBlogImageUrl(post?.featuredImage || ''),
    post?.category?.id || ''
  ]));
}

function hydrateSsrBlogPosts() {
  const payload = document.getElementById('melsouSsrBlogPosts');
  if (!payload) return false;
  try {
    const parsed = JSON.parse(payload.textContent || '{}');
    const posts = Array.isArray(parsed.posts)
      ? parsed.posts.filter((post) => post && /^[a-z0-9-]+$/.test(String(post.slug || '')))
      : [];
    currentLoadedBlogPosts = posts;
    currentBlogPage = Number(parsed.pagination?.page) || 1;
    currentBlogTotalPages = Number(parsed.pagination?.totalPages) || 1;
    blogSsrFingerprint = blogPostsFingerprint(posts);
    return true;
  } catch (error) {
    console.warn('Invalid SSR Blog payload:', error);
    return false;
  }
}

function escapeBlogHtml(value) {
  return String(value || '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

function safeBlogImageUrl(value) {
  const fallback = 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600';
  if (!value) return fallback;
  try {
    const parsed = new URL(String(value || ''), window.location.origin);
    if (parsed.protocol !== 'https:') return fallback;
    if (parsed.hostname.includes('wordpress.com') && !parsed.searchParams.has('w')) {
      parsed.searchParams.set('w', '600');
      parsed.searchParams.set('strip', 'all');
    }
    return parsed.href;
  } catch {
    return fallback;
  }
}

function sanitizeWordPressHtml(html) {
  const documentValue = new DOMParser().parseFromString(String(html || ''), 'text/html');
  documentValue.querySelectorAll('script,style,iframe,object,embed,form').forEach((node) => node.remove());
  documentValue.body.querySelectorAll('*').forEach((node) => {
    Array.from(node.attributes).forEach((attribute) => {
      if (/^on/i.test(attribute.name) || attribute.name === 'srcdoc') node.removeAttribute(attribute.name);
      if ((attribute.name === 'href' || attribute.name === 'src') && /^javascript:/i.test(attribute.value.trim())) node.removeAttribute(attribute.name);
    });
  });
  return documentValue.body.innerHTML;
}
window.sanitizeWordPressHtml = sanitizeWordPressHtml;

function plainWordPressText(html) {
  const documentValue = new DOMParser().parseFromString(String(html || ''), 'text/html');
  return documentValue.body.textContent.trim();
}

async function renderBlogCategories() {
  const container = document.getElementById('blogCategoryTabs');
  if (!container || typeof window.codexGetPublishedCategories !== 'function') return;
  try {
    const result = await window.codexGetPublishedCategories();
    currentBlogCategories = result.categories || [];
    const allLabel = currentAppLanguage === 'en' ? 'All Articles' : 'Tất cả bài viết';
    container.replaceChildren();
    const allButton = document.createElement('button');
    allButton.className = `sal-chip${activeBlogCategory === 'all' ? ' active' : ''}`;
    allButton.id = 'blogCatAll';
    allButton.textContent = allLabel;
    allButton.addEventListener('click', () => filterBlogCategory('all', allButton));
    container.append(allButton);
    currentBlogCategories.forEach((category) => {
      const button = document.createElement('button');
      button.className = `sal-chip${String(activeBlogCategory) === String(category.id) ? ' active' : ''}`;
      button.textContent = plainWordPressText(category.name);
      button.addEventListener('click', () => filterBlogCategory(String(category.id), button));
      container.append(button);
    });
    if (activeBlogCategory !== 'all' && !currentBlogCategories.some((category) => String(category.id) === String(activeBlogCategory))) {
      filterBlogCategory('all', container.querySelector('#blogCatAll'));
    }
  } catch (error) {
    console.warn('codexGetPublishedCategories error:', error);
  }
}

function filterBlogCategory(category, btn) {
  activeBlogCategory = category;
  const container = document.getElementById('blogCategoryTabs');
  if (container) {
    const chips = container.querySelectorAll('.sal-chip');
    chips.forEach(c => c.classList.remove('active'));
    if (btn) btn.classList.add('active');
  }
  renderPublicBlog(category, 1);
  const track = document.getElementById('publicBlogList');
  if (track) {
    track.scrollLeft = 0;
    track.scrollTo({ left: 0, behavior: 'instant' });
  }
}

function resetBlogSearchState() {
  blogSearchQuery = '';
  const input = document.getElementById('blog-search-query');
  const clearBtn = document.getElementById('blogSearchClearBtn');
  if (input) {
    input.value = '';
    input.defaultValue = '';
  }
  if (clearBtn) {
    clearBtn.style.display = 'none';
  }
}

function handleBlogSearch(val) {
  const cleanVal = String(val || '').trim();
  const clearBtn = document.getElementById('blogSearchClearBtn');
  if (!cleanVal) {
    blogSearchQuery = '';
    if (clearBtn) clearBtn.style.display = 'none';
  } else {
    blogSearchQuery = cleanVal.toLowerCase();
    if (clearBtn) clearBtn.style.display = 'block';
  }
  renderFilteredBlogPosts();
  const track = document.getElementById('publicBlogList');
  if (track) {
    track.scrollLeft = 0;
    track.scrollTo({ left: 0, behavior: 'instant' });
  }
}

function clearBlogSearch() {
  const input = document.getElementById('blog-search-query');
  if (input) {
    input.value = '';
    input.focus();
  }
  handleBlogSearch('');
}

function getFilteredBlogPosts() {
  return currentLoadedBlogPosts.filter((post) => {
    const matchesCategory = activeBlogCategory === 'all' ||
      String(post.category?.id) === String(activeBlogCategory) ||
      post.category?.slug === activeBlogCategory;
    if (!matchesCategory) return false;

    if (!blogSearchQuery) return true;
    const titleMatch = post.title && post.title.toLowerCase().includes(blogSearchQuery);
    const excerptMatch = post.excerpt && plainWordPressText(post.excerpt).toLowerCase().includes(blogSearchQuery);
    const contentMatch = post.content && plainWordPressText(post.content).toLowerCase().includes(blogSearchQuery);
    return Boolean(titleMatch || excerptMatch || contentMatch);
  });
}

async function renderPublicBlog(category = 'all', page = 1) {
  const list = document.getElementById('publicBlogList');
  if (!list) return;
  const requestId = ++blogListRequestId;
  const isEn = (currentAppLanguage === 'en');
  if (!currentLoadedBlogPosts || !currentLoadedBlogPosts.length) {
    list.innerHTML = `<div class="blog-empty-state"><div style="font-size:32px;margin-bottom:10px">⏳</div><p>${isEn ? 'Loading stories...' : 'Đang tải những câu chuyện...'}</p></div>`;
  }
  if (typeof window.codexGetPublishedPosts !== 'function') return;
  let result;
  try { result = await window.codexGetPublishedPosts({ page, perPage: 12, category }); }
  catch (error) {
    if (requestId !== blogListRequestId) return;
    console.warn('codexGetPublishedPosts error:', error);
    if (currentLoadedBlogPosts.length > 0) return;
    list.innerHTML = `<div class="blog-empty-state"><p>${isEn ? 'Stories are temporarily unavailable. Please try again later.' : 'Câu chuyện đang tạm thời chưa tải được. Vui lòng thử lại sau.'}</p></div>`;
    return;
  }
  if (requestId !== blogListRequestId) return;
  const allPosts = result.posts || [];
  currentBlogPage = result.pagination?.page || page;
  currentBlogTotalPages = result.pagination?.totalPages || 1;
  const nextPosts = page > 1 ? currentLoadedBlogPosts.concat(allPosts) : allPosts;
  const nextFingerprint = blogPostsFingerprint(nextPosts);
  currentLoadedBlogPosts = nextPosts;
  if (page === 1 && category === 'all' && !blogSearchQuery && blogSsrFingerprint === nextFingerprint) {
    blogSsrFingerprint = '';
    updateBlogCarouselArrows();
    return;
  }
  blogSsrFingerprint = '';
  renderFilteredBlogPosts();
}

function renderFilteredBlogPosts() {
  const list = document.getElementById('publicBlogList');
  const loadMoreWrap = document.getElementById('blogLoadMoreWrap');
  if (!list) return;
  const isEn = (currentAppLanguage === 'en');
  const filtered = getFilteredBlogPosts();

  if (filtered.length === 0) {
    const emptyMsg = blogSearchQuery
      ? (isEn ? 'No matching stories found.' : 'Không tìm thấy câu chuyện phù hợp.')
      : (isEn ? 'The first stories of Melsou are being prepared...' : 'Những câu chuyện đầu tiên của Melsou đang được chuẩn bị...');
    const emptySub = blogSearchQuery
      ? (isEn ? 'Try another keyword or select "All stories"' : 'Vui lòng thử từ khóa khác hoặc chọn "Tất cả bài viết"')
      : (isEn ? 'We will soon share cherished stories from Melsou.' : 'Chúng tôi sẽ sớm chia sẻ những câu chuyện từ xưởng in Melsou đến bạn.');
    list.innerHTML = `
      <div class="blog-empty-state" style="width:100%;grid-column:1/-1">
        <h3 style="font-size:17.5px;font-weight:700;color:var(--dark);margin-bottom:6px">${emptyMsg}</h3>
        <p style="font-size:13px;color:var(--gray);max-width:500px;margin:0 auto;line-height:1.6">${emptySub}</p>
      </div>`;
    if (loadMoreWrap) {
      loadMoreWrap.style.display = 'none';
      loadMoreWrap.innerHTML = '';
    }
    updateBlogCarouselArrows();
    return;
  }

  list.innerHTML = filtered.filter((post) => /^[a-z0-9-]+$/.test(String(post?.slug || ''))).map((post) => `
    <article class="blog-card-item">
      <a href="/blog/${escapeBlogHtml(post.slug)}" class="blog-card-link">
        <div class="blog-card-image-wrap">
          <img src="${escapeBlogHtml(safeBlogImageUrl(post.featuredImage))}" alt="${escapeBlogHtml(plainWordPressText(post.title))}" class="blog-card-img" loading="lazy" width="360" height="225" />
        </div>
        <div class="blog-card-body">
          <div>
            <div class="blog-card-meta">
              <span class="blog-card-category">${escapeBlogHtml(plainWordPressText(post.category?.name || 'Kỷ vật'))}</span>
              <span class="blog-card-date">${post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('vi-VN') : ''}</span>
            </div>
            <h3 class="blog-card-title">${escapeBlogHtml(plainWordPressText(post.title))}</h3>
            <p class="blog-card-excerpt">${escapeBlogHtml(plainWordPressText(post.excerpt))}</p>
          </div>
          <div class="blog-card-footer">
            <span class="blog-card-cta">Đọc tiếp câu chuyện →</span>
          </div>
        </div>
      </a>
    </article>`).join('');

  if (loadMoreWrap) {
    if (currentBlogPage < currentBlogTotalPages) {
      loadMoreWrap.style.display = 'flex';
      loadMoreWrap.style.justifyContent = 'center';
      loadMoreWrap.style.marginTop = '24px';
      loadMoreWrap.innerHTML = `
        <button class="btn-outline" onclick="loadMoreBlogPosts()" style="padding:10px 24px;border-radius:100px;font-size:13.5px;font-weight:700">
          ${isEn ? 'Load more stories' : 'Xem thêm bài viết'}
        </button>
      `;
    } else {
      loadMoreWrap.style.display = 'none';
      loadMoreWrap.innerHTML = '';
    }
  }

  updateBlogCarouselArrows();
}

function scrollBlogCarousel(direction) {
  const track = document.getElementById('publicBlogList');
  if (!track) return;
  const card = track.querySelector('.blog-card-item');
  const scrollAmount = card ? (card.offsetWidth + 24) : 384;
  track.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
  setTimeout(updateBlogCarouselArrows, 350);
}

function updateBlogCarouselArrows() {
  const track = document.getElementById('publicBlogList');
  const prevBtn = document.getElementById('blogCarouselPrevBtn');
  const nextBtn = document.getElementById('blogCarouselNextBtn');
  if (!track || !prevBtn || !nextBtn) return;
  if (window.innerWidth <= 768) {
    prevBtn.style.display = 'none';
    nextBtn.style.display = 'none';
    return;
  }
  const canScroll = track.scrollWidth > track.clientWidth + 8;
  if (!canScroll) {
    prevBtn.style.display = 'none';
    nextBtn.style.display = 'none';
    return;
  }
  prevBtn.style.display = 'flex';
  nextBtn.style.display = 'flex';
  prevBtn.disabled = track.scrollLeft <= 10;
  nextBtn.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 10;
}

if (typeof window !== 'undefined') {
  window.addEventListener('resize', () => {
    updateBlogCarouselArrows();
    renderFilteredBlogPosts();
  }, { passive: true });
}

function openBlogArticleReader(postIdx) {
  const post = currentLoadedBlogPosts[postIdx];
  if (!post) return;
  window.location.assign(`/blog/${encodeURIComponent(post.slug)}`);
}

function closeBlogArticleReader() {
  const modal = document.getElementById('blogArticleReaderModal');
  if (modal) modal.classList.remove('open');
  if (window.location.pathname.startsWith('/blog/')) {
    window.location.assign('/#blog-section');
  }
}

// ============================================================
// 📖 FB91: BLOG INTERACTIONS & COMMENTS SYSTEM CONTROLLER
// ============================================================
var blogInteractionsState = {
  activeSlug: null,
  liked: false,
  likeCount: 0,
  commentCount: 0,
  shareCount: 0,
  viewCount: 0,
  commentsOpen: true,
  sort: 'top', // 'top' | 'latest'
  comments: [],
  nextCursor: null,
  loadingComments: false,
  loadingMore: false,
  summaryRequestId: 0,
  summaryLoading: false,
  summaryError: '',
  pendingPostLike: false,
  pendingCommentLikes: new Set(),
  pendingShares: new Set(),
  replies: {}, // commentId -> { comments: [], nextCursor: null, loading: false, expanded: false }
  draft: null  // { type: 'comment' | 'reply', commentId?: string, content: string, slug: string }
};

// Local dev in-memory mock store for preview when no database credentials exist
let localBlogDevStore = null;

function getLocalBlogDevStore(slug) {
  if (!localBlogDevStore || localBlogDevStore.slug !== slug) {
    localBlogDevStore = {
      slug,
      liked: false,
      likeCount: 0,
      shareCount: 0,
      views: 0,
      comments: [],
      replies: {}
    };
  }
  return localBlogDevStore;
}

function handleLocalDevMock(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const urlObj = new URL(`http://localhost${path}`);
  const pathname = urlObj.pathname;
  const slugMatch = pathname.match(/^\/blog\/([^/]+)/);
  const slug = slugMatch ? decodeURIComponent(slugMatch[1]) : 'default';
  const store = getLocalBlogDevStore(slug);

  if (pathname.endsWith('/interactions') && method === 'GET') {
    return {
      post_slug: slug,
      liked: store.liked,
      like_count: store.likeCount,
      comment_count: store.comments.length,
      reply_count: Object.values(store.replies).reduce((acc, arr) => acc + arr.length, 0),
      share_count: store.shareCount,
      view_count: store.views,
      unique_view_count: store.views
    };
  }

  if (pathname.match(/^\/blog\/[^/]+\/like$/) && method === 'POST') {
    const body = JSON.parse(options.body || '{}');
    store.liked = !!body.liked;
    store.likeCount = Math.max(0, store.likeCount + (body.liked ? 1 : -1));
    return { post_slug: slug, liked: store.liked, like_count: store.likeCount };
  }

  if (pathname.match(/^\/blog\/[^/]+\/view$/) && method === 'POST') {
    store.views += 1;
    return { post_slug: slug, recorded: true, view_count: store.views, unique_view_count: store.views };
  }

  if (pathname.match(/^\/blog\/[^/]+\/share$/) && method === 'POST') {
    store.shareCount += 1;
    return { post_slug: slug, recorded: true, share_count: store.shareCount };
  }

  // Comments list
  if (pathname.match(/^\/blog\/[^/]+\/comments$/) && method === 'GET') {
    const limit = parseInt(urlObj.searchParams.get('limit') || '5', 10);
    const cursor = parseInt(urlObj.searchParams.get('cursor') || '0', 10);
    const sort = urlObj.searchParams.get('sort') || 'top';
    let sorted = store.comments.map(c => ({ ...c }));
    if (sort === 'top') {
      sorted.sort((a, b) => b.like_count - a.like_count);
    } else {
      sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    const slice = sorted.slice(cursor, cursor + limit);
    const nextCursor = cursor + limit < sorted.length ? String(cursor + limit) : null;
    return { post_slug: slug, sort, limit, comments: slice, next_cursor: nextCursor };
  }

  // Create comment
  if (pathname.match(/^\/blog\/[^/]+\/comments$/) && method === 'POST') {
    const body = JSON.parse(options.body || '{}');
    const authorName = currentUser?.name || 'Khách hàng Melsou';
    const newComment = {
      id: `mock-c-${Date.now()}`,
      post_slug: slug,
      author_name: authorName,
      content: body.content,
      created_at: new Date().toISOString(),
      like_count: 0,
      reply_count: 0,
      liked: false,
      can_edit: true,
      status: 'visible'
    };
    store.comments.unshift(newComment);
    return { comment: { ...newComment } };
  }

  // Replies list
  const repliesMatch = pathname.match(/\/comments\/([^/]+)\/replies$/);
  if (repliesMatch && method === 'GET') {
    const commentId = decodeURIComponent(repliesMatch[1]);
    const list = (store.replies[commentId] || []).map(r => ({ ...r }));
    const limit = parseInt(urlObj.searchParams.get('limit') || '3', 10);
    const cursor = parseInt(urlObj.searchParams.get('cursor') || '0', 10);
    const slice = list.slice(cursor, cursor + limit);
    const nextCursor = cursor + limit < list.length ? String(cursor + limit) : null;
    return { comments: slice, next_cursor: nextCursor };
  }

  // Create reply
  if (repliesMatch && method === 'POST') {
    const commentId = decodeURIComponent(repliesMatch[1]);
    const body = JSON.parse(options.body || '{}');
    const authorName = currentUser?.name || 'Khách hàng Melsou';
    const newReply = {
      id: `mock-r-${Date.now()}`,
      post_slug: slug,
      parent_comment_id: commentId,
      author_name: authorName,
      content: body.content,
      created_at: new Date().toISOString(),
      like_count: 0,
      reply_count: 0,
      liked: false,
      can_edit: true,
      status: 'visible'
    };
    if (!store.replies[commentId]) store.replies[commentId] = [];
    store.replies[commentId].push(newReply);
    const root = store.comments.find(c => c.id === commentId);
    if (root) root.reply_count = (root.reply_count || 0) + 1;
    return { comment: newReply };
  }

  // Comment like
  const commentLikeMatch = pathname.match(/\/comments\/([^/]+)\/like$/);
  if (commentLikeMatch && method === 'POST') {
    const commentId = decodeURIComponent(commentLikeMatch[1]);
    const body = JSON.parse(options.body || '{}');
    let target = store.comments.find(c => c.id === commentId);
    if (!target) {
      for (const arr of Object.values(store.replies)) {
        target = arr.find(r => r.id === commentId);
        if (target) break;
      }
    }
    if (target) {
      target.liked = !!body.liked;
      target.like_count = Math.max(0, (target.like_count || 0) + (body.liked ? 1 : -1));
      return { comment_id: commentId, liked: target.liked, like_count: target.like_count };
    }
    return { comment_id: commentId, liked: body.liked, like_count: body.liked ? 1 : 0 };
  }

  // Comment edit (PATCH)
  const commentSingleMatch = pathname.match(/\/comments\/([^/]+)$/);
  if (commentSingleMatch && method === 'PATCH') {
    const commentId = decodeURIComponent(commentSingleMatch[1]);
    const body = JSON.parse(options.body || '{}');
    let target = store.comments.find(c => c.id === commentId);
    if (!target) {
      for (const arr of Object.values(store.replies)) {
        target = arr.find(r => r.id === commentId);
        if (target) break;
      }
    }
    if (target) {
      target.content = body.content;
      return { comment: { ...target } };
    }
    throw new Error('COMMENT_NOT_FOUND');
  }

  // Comment delete (DELETE)
  if (commentSingleMatch && method === 'DELETE') {
    const commentId = decodeURIComponent(commentSingleMatch[1]);
    const commentIndex = store.comments.findIndex(c => c.id === commentId);
    if (commentIndex !== -1) {
      const removed = store.comments.splice(commentIndex, 1)[0];
      delete store.replies[commentId];
      return { comment: { ...removed, status: 'deleted' } };
    }
    for (const [parentId, arr] of Object.entries(store.replies)) {
      const replyIndex = arr.findIndex(r => r.id === commentId);
      if (replyIndex !== -1) {
        const removed = arr.splice(replyIndex, 1)[0];
        const root = store.comments.find(c => c.id === parentId);
        if (root) root.reply_count = Math.max(0, (root.reply_count || 0) - 1);
        return { comment: { ...removed, status: 'deleted' } };
      }
    }
    throw new Error('COMMENT_NOT_FOUND');
  }

  // OWNER comment moderation (PATCH /owner/blog/comments/:commentId)
  const ownerModMatch = pathname.match(/^\/owner\/blog\/comments\/([^/]+)$/);
  if (ownerModMatch && (method === 'PATCH' || method === 'DELETE')) {
    const commentId = decodeURIComponent(ownerModMatch[1]);
    const body = JSON.parse(options.body || '{}');
    const newStatus = method === 'DELETE' ? 'deleted' : (body.status || 'hidden');
    let target = store.comments.find(c => c.id === commentId);
    if (!target) {
      for (const arr of Object.values(store.replies)) {
        target = arr.find(r => r.id === commentId);
        if (target) break;
      }
    }
    if (target) {
      target.status = newStatus;
      return { comment: { ...target, status: newStatus } };
    }
    return { comment: { id: commentId, status: newStatus } };
  }

  // OWNER comments list (GET /owner/blog/comments)
  if (pathname === '/owner/blog/comments' && method === 'GET') {
    const postSlug = urlObj.searchParams.get('post_slug') || null;
    const filterStatus = urlObj.searchParams.get('status') || 'all';
    const limit = parseInt(urlObj.searchParams.get('limit') || '50', 10);
    let all = [];
    const stores = typeof localBlogDevStore !== 'undefined' ? [localBlogDevStore] : [store];
    for (const s of stores) {
      if (postSlug && s.slug && s.slug !== postSlug) continue;
      for (const c of s.comments || []) {
        all.push({ ...c, post_slug: s.slug || postSlug || 'bai-viet', is_reply: false });
      }
      for (const [parentId, arr] of Object.entries(s.replies || {})) {
        for (const r of arr || []) {
          all.push({ ...r, post_slug: s.slug || postSlug || 'bai-viet', parent_comment_id: parentId, is_reply: true });
        }
      }
    }
    if (filterStatus !== 'all') {
      all = all.filter(c => (c.status || 'visible') === filterStatus);
    }
    all.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const slice = all.slice(0, limit);
    return { comments: slice, limit, next_cursor: null, status: filterStatus, post_slug: postSlug };
  }

  throw new Error('NOT_FOUND');
}

const isLocalDevHost = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname.endsWith('.local')
);

async function blogFetchApi(path, options = {}) {
  try {
    const res = await fetch(`/api${path}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      // Mock fallback is strictly restricted to local development when database is not configured
      if (isLocalDevHost && (data.error === 'LOCAL_API_FAILURE' || res.status === 404 || path.includes('mock-'))) {
        return handleLocalDevMock(path, options);
      }
      const err = new Error(data.error || `API request failed (${res.status})`);
      err.status = res.status;
      err.body = data;
      throw err;
    }
    return data;
  } catch (netErr) {
    if (netErr.status) throw netErr;
    if (isLocalDevHost) {
      return handleLocalDevMock(path, options);
    }
    throw netErr;
  }
}

function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const BLOG_UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidBlogUuid(id) {
  return typeof id === 'string' && BLOG_UUID_REGEX.test(id.trim());
}

const ALLOWED_OWNER_MOD_ACTIONS = new Set(['visible', 'hidden', 'deleted']);

function normalizeOwnerModAction(action) {
  if (action === 'hidden') return 'hidden';
  if (action === 'visible') return 'visible';
  if (action === 'deleted') return 'deleted';
  return null;
}

function formatBlogTimeAgo(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  if (isNaN(diffMs) || diffMs < 0) return 'Vừa xong';
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'Vừa xong';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return date.toLocaleDateString('vi-VN');
}

function getBlogAuthorInitials(name) {
  if (!name || typeof name !== 'string') return 'M';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'M';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function renderBlogPostInteractions() {
  const likeBtn = document.getElementById('blogPostLikeBtn');
  const likeLabel = document.getElementById('blogPostLikeLabel');
  const likeCountEl = document.getElementById('blogPostLikeCount');
  const commentCountEl = document.getElementById('blogPostCommentCount');
  const shareCountEl = document.getElementById('blogPostShareCount');
  const headerCountEl = document.getElementById('blogCommentsHeaderCount');
  const commentInput = document.getElementById('blogCommentInput');
  const commentSubmit = document.getElementById('blogCommentSubmitBtn');
  const guestHint = document.getElementById('blogCommentGuestHint');
  const interactionsBar = document.getElementById('blogPostInteractionsBar');
  let statusEl = document.getElementById('blogInteractionsStatus');
  if (!statusEl && interactionsBar) {
    statusEl = document.createElement('div');
    statusEl.id = 'blogInteractionsStatus';
    statusEl.setAttribute('role', 'status');
    statusEl.setAttribute('aria-live', 'polite');
    statusEl.style.cssText = 'width:100%;font-size:12px;text-align:center;margin-top:6px;color:#8a6b5d';
    interactionsBar.appendChild(statusEl);
  }
  if (statusEl) {
    statusEl.textContent = blogInteractionsState.summaryLoading
      ? 'Đang tải tương tác…'
      : blogInteractionsState.summaryError;
    statusEl.style.display = statusEl.textContent ? '' : 'none';
    statusEl.style.color = blogInteractionsState.summaryError ? '#b42318' : '#8a6b5d';
  }

  if (commentInput) {
    commentInput.disabled = !blogInteractionsState.commentsOpen;
    commentInput.placeholder = blogInteractionsState.commentsOpen
      ? 'Chia sẻ cảm nghĩ của bạn về câu chuyện này...'
      : 'Bình luận cho bài viết này hiện đã được đóng.';
  }
  if (commentSubmit) commentSubmit.disabled = !blogInteractionsState.commentsOpen;
  if (!blogInteractionsState.commentsOpen && guestHint) {
    guestHint.style.display = 'block';
    guestHint.textContent = 'Bình luận cho bài viết này hiện đã được đóng.';
  }

  if (likeBtn) {
    likeBtn.disabled = blogInteractionsState.pendingPostLike;
    likeBtn.setAttribute('aria-busy', blogInteractionsState.pendingPostLike ? 'true' : 'false');
    if (blogInteractionsState.liked) {
      likeBtn.classList.add('liked');
      likeBtn.setAttribute('aria-pressed', 'true');
      if (likeLabel) likeLabel.textContent = 'Đã thích';
    } else {
      likeBtn.classList.remove('liked');
      likeBtn.setAttribute('aria-pressed', 'false');
      if (likeLabel) likeLabel.textContent = 'Thích';
    }
  }

  if (likeCountEl) {
    likeCountEl.textContent = blogInteractionsState.likeCount > 0 ? blogInteractionsState.likeCount.toLocaleString('vi-VN') : '0';
    likeCountEl.style.display = blogInteractionsState.likeCount > 0 ? 'inline' : 'none';
  }

  if (commentCountEl) {
    commentCountEl.textContent = blogInteractionsState.commentCount > 0 ? blogInteractionsState.commentCount.toLocaleString('vi-VN') : '0';
    commentCountEl.style.display = blogInteractionsState.commentCount > 0 ? 'inline' : 'none';
  }

  if (shareCountEl) {
    shareCountEl.textContent = blogInteractionsState.shareCount > 0 ? blogInteractionsState.shareCount.toLocaleString('vi-VN') : '0';
    shareCountEl.style.display = blogInteractionsState.shareCount > 0 ? 'inline' : 'none';
  }

  if (headerCountEl) {
    headerCountEl.textContent = blogInteractionsState.commentCount > 0 ? blogInteractionsState.commentCount.toLocaleString('vi-VN') : '0';
  }
}

async function refreshBlogPostInteractionsSummary(slug) {
  const targetSlug = slug || blogInteractionsState.activeSlug;
  if (!targetSlug) return null;
  const summaryRequestId = ++blogInteractionsState.summaryRequestId;
  blogInteractionsState.summaryLoading = true;
  blogInteractionsState.summaryError = '';
  renderBlogPostInteractions();

  try {
    let summary;
    if (typeof window.codexGetBlogInteractions === 'function') {
      summary = await window.codexGetBlogInteractions(targetSlug);
    } else {
      summary = await blogFetchApi(`/blog/${encodeURIComponent(targetSlug)}/interactions`);
    }
    if (blogInteractionsState.activeSlug !== targetSlug || blogInteractionsState.summaryRequestId !== summaryRequestId) return summary;
    blogInteractionsState.liked = !!summary.liked;
    blogInteractionsState.likeCount = summary.like_count || 0;
    blogInteractionsState.commentCount = summary.comment_count || 0;
    blogInteractionsState.shareCount = summary.share_count || 0;
    blogInteractionsState.viewCount = summary.view_count || 0;
    blogInteractionsState.commentsOpen = summary.comments_open !== false;
    blogInteractionsState.summaryLoading = false;
    blogInteractionsState.summaryError = '';
    renderBlogPostInteractions();
    return summary;
  } catch (err) {
    if (blogInteractionsState.activeSlug !== targetSlug || blogInteractionsState.summaryRequestId !== summaryRequestId) return null;
    blogInteractionsState.summaryLoading = false;
    blogInteractionsState.summaryError = 'Không thể tải tương tác. Vui lòng thử lại.';
    renderBlogPostInteractions();
    return null;
  }
}

async function initBlogInteractions(slug) {
  if (!slug) return;
  blogInteractionsState.activeSlug = slug;
  blogInteractionsState.liked = false;
  blogInteractionsState.likeCount = 0;
  blogInteractionsState.commentCount = 0;
  blogInteractionsState.shareCount = 0;
  blogInteractionsState.commentsOpen = true;
  blogInteractionsState.comments = [];
  blogInteractionsState.nextCursor = null;
  blogInteractionsState.replies = {};
  blogInteractionsState.summaryLoading = true;
  blogInteractionsState.summaryError = '';
  blogInteractionsState.pendingPostLike = false;
  blogInteractionsState.pendingCommentLikes.clear();
  blogInteractionsState.pendingShares.clear();

  const interactionsBar = document.getElementById('blogPostInteractionsBar');
  const commentsSection = document.getElementById('blogCommentsSection');
  if (interactionsBar) interactionsBar.style.display = '';
  if (commentsSection) commentsSection.style.display = '';

  updateBlogInteractionsAuthUI();
  renderBlogPostInteractions();

  // 1. Record view (fire and forget)
  blogFetchApi(`/blog/${encodeURIComponent(slug)}/view`, { method: 'POST' }).catch(() => {});

  // 2. Fetch interaction stats
  refreshBlogPostInteractionsSummary(slug);

  // 3. Load initial comments
  loadBlogComments({ reset: true });
}

async function handleBlogPostLikeClick() {
  const slug = blogInteractionsState.activeSlug;
  if (!slug || blogInteractionsState.pendingPostLike) return;
  const prevLiked = blogInteractionsState.liked;
  const prevCount = blogInteractionsState.likeCount;
  const newLiked = !prevLiked;

  // Optimistic UI update
  blogInteractionsState.liked = newLiked;
  blogInteractionsState.likeCount = Math.max(0, prevCount + (newLiked ? 1 : -1));
  blogInteractionsState.pendingPostLike = true;
  renderBlogPostInteractions();

  try {
    const res = await blogFetchApi(`/blog/${encodeURIComponent(slug)}/like`, {
      method: 'POST',
      body: JSON.stringify({ liked: newLiked })
    });
    if (blogInteractionsState.activeSlug !== slug) return;
    blogInteractionsState.liked = !!res.liked;
    blogInteractionsState.likeCount = res.like_count ?? blogInteractionsState.likeCount;
    renderBlogPostInteractions();
  } catch (err) {
    // Rollback
    if (blogInteractionsState.activeSlug !== slug) return;
    blogInteractionsState.liked = prevLiked;
    blogInteractionsState.likeCount = prevCount;
    renderBlogPostInteractions();
    showToast(currentAppLanguage === 'en' ? 'Unable to update like. Please try again.' : 'Không thể cập nhật lượt thích. Vui lòng thử lại.');
  } finally {
    if (blogInteractionsState.activeSlug === slug) {
      blogInteractionsState.pendingPostLike = false;
      renderBlogPostInteractions();
    }
  }
}

function scrollToBlogComments() {
  const section = document.getElementById('blogCommentsSection');
  if (section) {
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const input = document.getElementById('blogCommentInput');
    if (input) setTimeout(() => input.focus(), 350);
  }
}

function handleBlogShareClick(event) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  const slug = blogInteractionsState.activeSlug;
  if (!slug) return;

  const isMobile = window.innerWidth <= 640;
  if (isMobile && navigator.share) {
    navigator.share({
      title: document.title || 'Melsou Journal',
      url: window.location.href
    }).then(() => {
      recordBlogShareMetric('native_share');
    }).catch((err) => {
      if (err.name !== 'AbortError') {
        toggleBlogSharePopover();
      }
    });
    return;
  }

  toggleBlogSharePopover();
}

function toggleBlogSharePopover() {
  const popover = document.getElementById('blogSharePopover');
  const btn = document.getElementById('blogPostShareBtn');
  if (!popover) return;
  const isOpen = popover.classList.toggle('open');
  if (btn) btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
}

function closeBlogSharePopover() {
  const popover = document.getElementById('blogSharePopover');
  const btn = document.getElementById('blogPostShareBtn');
  if (popover) popover.classList.remove('open');
  if (btn) btn.setAttribute('aria-expanded', 'false');
}

document.addEventListener('click', function(e) {
  const wrapper = document.getElementById('blogShareWrapper');
  if (wrapper && !wrapper.contains(e.target)) {
    closeBlogSharePopover();
  }
});

async function executeBlogShare(type) {
  closeBlogSharePopover();
  const slug = blogInteractionsState.activeSlug;
  if (!slug) return;

  if (type === 'copy_link') {
    const url = window.location.href;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        showToast('Đã sao chép liên kết bài viết!');
      }).catch(() => {
        fallbackCopyText(url);
      });
    } else {
      fallbackCopyText(url);
    }
    recordBlogShareMetric('copy_link');
  } else if (type === 'facebook') {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, 'fb-share', 'width=600,height=500,toolbar=0,menubar=0');
    recordBlogShareMetric('facebook');
  }
}

function fallbackCopyText(text) {
  const t = document.createElement('textarea');
  t.value = text;
  t.style.position = 'fixed';
  t.style.opacity = '0';
  document.body.appendChild(t);
  t.select();
  try {
    document.execCommand('copy');
    showToast('Đã sao chép liên kết bài viết!');
  } catch {
    showToast('Không thể tự động sao chép. Vui lòng copy URL trên thanh địa chỉ.');
  }
  document.body.removeChild(t);
}

async function recordBlogShareMetric(shareType) {
  const slug = blogInteractionsState.activeSlug;
  const pendingKey = `${slug}:${shareType}`;
  if (!slug || blogInteractionsState.pendingShares.has(pendingKey)) return;
  blogInteractionsState.pendingShares.add(pendingKey);
  try {
    const res = await blogFetchApi(`/blog/${encodeURIComponent(slug)}/share`, {
      method: 'POST',
      body: JSON.stringify({ share_type: shareType })
    });
    if (blogInteractionsState.activeSlug === slug && res.share_count !== undefined) {
      blogInteractionsState.shareCount = res.share_count;
      renderBlogPostInteractions();
    }
  } catch {
    showToast('Không thể ghi nhận lượt chia sẻ lúc này.');
  } finally {
    blogInteractionsState.pendingShares.delete(pendingKey);
  }
}

function changeBlogCommentSort(sort) {
  if (blogInteractionsState.sort === sort) return;
  blogInteractionsState.sort = sort;
  const topBtn = document.getElementById('blogSortTopBtn');
  const latestBtn = document.getElementById('blogSortLatestBtn');
  if (topBtn && latestBtn) {
    if (sort === 'top') {
      topBtn.classList.add('active');
      topBtn.setAttribute('aria-selected', 'true');
      latestBtn.classList.remove('active');
      latestBtn.setAttribute('aria-selected', 'false');
    } else {
      latestBtn.classList.add('active');
      latestBtn.setAttribute('aria-selected', 'true');
      topBtn.classList.remove('active');
      topBtn.setAttribute('aria-selected', 'false');
    }
  }
  loadBlogComments({ reset: true });
}

function handleBlogCommentInput(textarea) {
  const charCount = document.getElementById('blogCommentCharCount');
  const len = textarea.value.length;
  if (charCount) charCount.textContent = `${len} / 2000`;
}

let pendingCommentEdits = new Set();
let pendingCommentDeletions = new Set();
let pendingModerations = new Set();
let ownerBlogModerationState = {
  posts: [],
  selectedSlug: '',
  selectedStatus: 'all',
  comments: [],
  nextCursor: null,
  loading: false,
  loadingMore: false,
  requestSeq: 0
};

async function loadBlogComments({ reset = false } = {}) {
  const slug = blogInteractionsState.activeSlug;
  if (!slug) return;
  const listEl = document.getElementById('blogCommentsList');
  const pagEl = document.getElementById('blogCommentsPagination');
  const loadMoreBtn = document.getElementById('blogCommentsLoadMoreBtn');
  const spinner = document.getElementById('blogCommentsLoadMoreSpinner');
  const moreText = document.getElementById('blogCommentsLoadMoreText');

  const isMobile = window.innerWidth <= 640;
  const limit = isMobile ? 3 : 5;

  if (reset) {
    blogInteractionsState.loadingComments = true;
    blogInteractionsState.comments = [];
    blogInteractionsState.nextCursor = null;
    if (listEl) {
      listEl.innerHTML = `
        <div class="blog-skeleton-item"><div class="blog-skeleton-circle"></div><div class="blog-skeleton-lines"><div class="blog-skeleton-line" style="width:30%"></div><div class="blog-skeleton-line" style="width:90%"></div><div class="blog-skeleton-line" style="width:60%"></div></div></div>
        <div class="blog-skeleton-item"><div class="blog-skeleton-circle"></div><div class="blog-skeleton-lines"><div class="blog-skeleton-line" style="width:25%"></div><div class="blog-skeleton-line" style="width:85%"></div></div></div>
      `;
    }
    if (pagEl) pagEl.style.display = 'none';
  } else {
    blogInteractionsState.loadingMore = true;
    if (spinner) spinner.style.display = 'inline-block';
    if (loadMoreBtn) loadMoreBtn.disabled = true;
  }

  const cursor = reset ? 0 : (blogInteractionsState.nextCursor || 0);

  try {
    const res = await blogFetchApi(`/blog/${encodeURIComponent(slug)}/comments?limit=${limit}&cursor=${cursor}&sort=${blogInteractionsState.sort}`);
    if (blogInteractionsState.activeSlug !== slug) return;
    const incoming = Array.isArray(res.comments) ? res.comments : [];
    blogInteractionsState.comments = reset ? incoming : blogInteractionsState.comments.concat(incoming);
    blogInteractionsState.nextCursor = res.next_cursor || null;

    renderBlogCommentsList();

    if (pagEl) {
      if (blogInteractionsState.nextCursor !== null) {
        pagEl.style.display = 'block';
        if (moreText) moreText.textContent = 'Xem thêm bình luận';
      } else {
        pagEl.style.display = 'none';
      }
    }
  } catch (err) {
    if (reset && listEl) {
      listEl.innerHTML = `
        <div class="blog-comments-empty">
          <div class="blog-comments-empty-icon">⚠️</div>
          <p>Không thể tải bình luận. Vui lòng thử lại.</p>
          <button type="button" class="btn-outline" style="margin-top:10px;border-radius:9999px;padding:6px 16px;font-size:12.5px" onclick="loadBlogComments({ reset: true })">Thử lại</button>
        </div>
      `;
    } else {
      showToast('Không thể tải thêm bình luận.');
    }
  } finally {
    blogInteractionsState.loadingComments = false;
    blogInteractionsState.loadingMore = false;
    if (spinner) spinner.style.display = 'none';
    if (loadMoreBtn) loadMoreBtn.disabled = false;
  }
}

function loadMoreBlogComments() {
  if (blogInteractionsState.nextCursor === null || blogInteractionsState.loadingMore) return;
  loadBlogComments({ reset: false });
}

function setupBlogCommentsDelegation() {
  const listEl = document.getElementById('blogCommentsList');
  if (!listEl || listEl._delegationAttached) return;
  listEl._delegationAttached = true;
  listEl.addEventListener('click', (e) => {
    const btn = e.target && typeof e.target.closest === 'function'
      ? e.target.closest('button[data-action][data-comment-id]')
      : null;
    if (!btn) return;
    const action = btn.getAttribute('data-action');
    const rawCommentId = btn.getAttribute('data-comment-id');
    const commentId = rawCommentId ? rawCommentId.trim() : '';
    if (!isValidBlogUuid(commentId)) return;
    if (action === 'reply') {
      toggleInlineReplyBox(commentId);
    }
  });
}

function renderBlogCommentsList() {
  const listEl = document.getElementById('blogCommentsList');
  if (!listEl) return;
  setupBlogCommentsDelegation();

  const comments = blogInteractionsState.comments || [];
  const validComments = comments.filter(c => c && isValidBlogUuid(c.id));
  if (validComments.length === 0) {
    listEl.innerHTML = `
      <div class="blog-comments-empty">
        <div class="blog-comments-empty-icon">💬</div>
        <p>Chưa có bình luận nào. Hãy là người đầu tiên chia sẻ cảm nghĩ.</p>
      </div>
    `;
    return;
  }

  let html = '';
  for (const c of validComments) {
    const safeId = escapeHtml(c.id);
    const initials = getBlogAuthorInitials(c.author_name);
    const timeAgo = formatBlogTimeAgo(c.created_at);
    const likeActive = c.liked ? 'liked' : '';
    const hasReplies = (c.reply_count || 0) > 0;
    const replyCountText = hasReplies ? `Xem ${c.reply_count} phản hồi` : '';

    html += `
      <div class="blog-comment-item" id="blogComment-${safeId}" data-id="${safeId}">
        <div class="blog-comment-main">
          <div class="blog-avatar-circle" title="${escapeHtml(c.author_name)}">${escapeHtml(initials)}</div>
          <div class="blog-comment-content-wrap">
            <div class="blog-comment-author-row">
              <span class="blog-comment-author-name">${escapeHtml(c.author_name || 'Khách hàng')}</span>
              <span class="blog-comment-time">${escapeHtml(timeAgo)}</span>
            </div>
            <div class="blog-comment-body-text" id="blogCommentBody-${safeId}">${escapeHtml(c.content)}</div>

            <!-- Inline Edit Box for comment -->
            <div class="blog-inline-edit-box" id="blogCommentEditBox-${safeId}" style="display:none">
              <textarea class="blog-edit-textarea" id="blogCommentEditTextarea-${safeId}" maxlength="2000" rows="3" placeholder="Chỉnh sửa bình luận..."></textarea>
              <div class="blog-edit-actions">
                <button type="button" class="btn-outline blog-edit-cancel-btn" id="blogCommentCancelEditBtn-${safeId}" onclick="cancelEditBlogComment('${safeId}', false)">Hủy</button>
                <button type="button" class="btn-primary blog-edit-save-btn" id="blogCommentSaveEditBtn-${safeId}" onclick="saveEditBlogComment('${safeId}', false)">Lưu</button>
              </div>
              <div class="blog-edit-error" id="blogCommentEditError-${safeId}" style="display:none"></div>
            </div>

            <div class="blog-comment-actions-row">
              <button type="button" class="blog-comment-like-btn ${likeActive}" onclick="handleBlogCommentLikeClick('${safeId}')" aria-label="Thích bình luận" aria-pressed="${c.liked ? 'true' : 'false'}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
                <span class="blog-comment-like-count">${c.like_count > 0 ? c.like_count : 'Thích'}</span>
              </button>
              <button type="button" class="blog-comment-reply-btn" data-action="reply" data-comment-id="${safeId}">
                Trả lời
              </button>
              ${c.can_edit ? `
                <button type="button" class="blog-comment-action-link blog-comment-edit-btn" id="blogCommentEditBtn-${safeId}" onclick="startEditBlogComment('${safeId}', false)">Sửa</button>
                <button type="button" class="blog-comment-action-link blog-comment-del-btn" id="blogCommentDelBtn-${safeId}" onclick="deleteBlogComment('${safeId}', false)">Xóa</button>
              ` : ''}
              ${hasReplies ? `
                <button type="button" class="blog-view-replies-btn" id="blogViewRepliesBtn-${safeId}" onclick="toggleCommentReplies('${safeId}')">
                  <span class="reply-label">${replyCountText}</span>
                  <span class="chevron">▼</span>
                </button>
              ` : ''}
            </div>

            <!-- Inline Reply Form for this comment -->
            <div class="blog-inline-reply-box" id="blogInlineReplyBox-${safeId}">
              <textarea class="blog-reply-textarea" id="blogReplyInput-${safeId}" placeholder="Nhập phản hồi của bạn..." rows="2" maxlength="2000"></textarea>
              <div class="blog-reply-actions">
                <button type="button" class="blog-reply-cancel-btn" onclick="toggleInlineReplyBox('${safeId}')">Hủy</button>
                <button type="button" class="btn-primary blog-reply-submit-btn" id="blogReplySubmitBtn-${safeId}" onclick="submitBlogReply('${safeId}')">Gửi</button>
              </div>
            </div>

            <!-- Replies Container (Max 2 Levels) -->
            <div class="blog-comment-replies" id="blogRepliesContainer-${safeId}">
              <!-- Dynamic replies -->
            </div>
          </div>
        </div>
      </div>
    `;
  }
  listEl.innerHTML = html;
}

async function submitBlogComment() {
  const input = document.getElementById('blogCommentInput');
  const submitBtn = document.getElementById('blogCommentSubmitBtn');
  if (!input) return;
  if (!blogInteractionsState.commentsOpen) {
    showToast('Bình luận cho bài viết này hiện đã được đóng.');
    return;
  }
  const content = input.value.trim();
  if (!content) {
    input.focus();
    return;
  }

  const slug = blogInteractionsState.activeSlug;
  if (!slug) return;

  const isLoggedIn = currentUser && currentUser.loggedIn && !currentUser.isGuest;
  if (!isLoggedIn) {
    // Preserve draft text
    blogInteractionsState.draft = { type: 'comment', content, slug };
    try {
      sessionStorage.setItem(`melsou_blog_draft_${slug}`, JSON.stringify(blogInteractionsState.draft));
    } catch {}
    showToast('Vui lòng đăng nhập để gửi bình luận.');
    openAuthModal('login', { type: 'blog', kind: 'comment', slug, scrollY: window.scrollY });
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Đang gửi...';

  try {
    const res = await blogFetchApi(`/blog/${encodeURIComponent(slug)}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content })
    });
    input.value = '';
    handleBlogCommentInput(input);
    blogInteractionsState.draft = null;
    try { sessionStorage.removeItem(`melsou_blog_draft_${slug}`); } catch {}

    if (res.comment) {
      const newComment = { ...res.comment, can_edit: true };
      blogInteractionsState.comments.unshift(newComment);
      blogInteractionsState.commentCount += 1;
      renderBlogPostInteractions();
      renderBlogCommentsList();
      showToast('Đã gửi bình luận thành công!');
    }
  } catch (err) {
    if (err.status === 401) {
      blogInteractionsState.draft = { type: 'comment', content, slug };
      showToast('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      openAuthModal('login', { type: 'blog', kind: 'comment', slug, scrollY: window.scrollY });
    } else {
      showToast(err.body?.error === 'INVALID_COMMENT' ? 'Bình luận không hợp lệ.' : 'Không thể gửi bình luận. Vui lòng thử lại.');
    }
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Gửi bình luận';
  }
}

function findCommentAuthor(commentId) {
  if (!commentId) return null;
  const root = blogInteractionsState?.comments?.find(c => c.id === commentId);
  if (root) return root.author_name || null;
  if (blogInteractionsState?.replies) {
    for (const arr of Object.values(blogInteractionsState.replies)) {
      const list = Array.isArray(arr) ? arr : (Array.isArray(arr?.comments) ? arr.comments : []);
      const r = list.find(x => x.id === commentId);
      if (r) return r.author_name || null;
    }
  }
  return null;
}

function toggleInlineReplyBox(commentId, authorName) {
  if (!isValidBlogUuid(commentId)) return;
  if (!blogInteractionsState.commentsOpen) {
    showToast('Bình luận cho bài viết này hiện đã được đóng.');
    return;
  }
  const box = document.getElementById(`blogInlineReplyBox-${commentId}`);
  if (!box) return;
  const isOpen = box.classList.toggle('open');
  if (isOpen) {
    const input = document.getElementById(`blogReplyInput-${commentId}`);
    if (input) {
      const resolvedAuthor = authorName || findCommentAuthor(commentId);
      input.placeholder = resolvedAuthor ? `Phản hồi cho ${resolvedAuthor}...` : 'Nhập phản hồi của bạn...';
      input.focus();
    }
  }
}

async function toggleCommentReplies(commentId) {
  if (!isValidBlogUuid(commentId)) return;
  const container = document.getElementById(`blogRepliesContainer-${commentId}`);
  const btn = document.getElementById(`blogViewRepliesBtn-${commentId}`);
  if (!container || !btn) return;

  const isOpen = container.classList.toggle('open');
  btn.classList.toggle('expanded', isOpen);

  const rootComment = blogInteractionsState.comments.find(c => c.id === commentId);
  const count = rootComment ? rootComment.reply_count : 0;
  const label = btn.querySelector('.reply-label');
  if (label) {
    label.textContent = isOpen ? (count > 0 ? `Ẩn ${count} phản hồi` : 'Ẩn phản hồi') : (count > 0 ? `Xem ${count} phản hồi` : 'Xem phản hồi');
  }

  if (isOpen && !blogInteractionsState.replies[commentId]) {
    await loadCommentReplies(commentId, { reset: true });
  }
}

async function loadCommentReplies(commentId, { reset = false } = {}) {
  if (!isValidBlogUuid(commentId)) return;
  const slug = blogInteractionsState.activeSlug;
  if (!slug) return;
  const container = document.getElementById(`blogRepliesContainer-${commentId}`);
  if (!container) return;

  if (reset) {
    blogInteractionsState.replies[commentId] = { comments: [], nextCursor: null, loading: true };
    container.innerHTML = `<div class="blog-skeleton-line" style="width:70%;margin:8px 0"></div>`;
  }

  const state = blogInteractionsState.replies[commentId] || { comments: [], nextCursor: null };
  const cursor = reset ? 0 : (state.nextCursor || 0);

  try {
    const res = await blogFetchApi(`/blog/${encodeURIComponent(slug)}/comments/${encodeURIComponent(commentId)}/replies?limit=3&cursor=${cursor}&sort=${blogInteractionsState.sort}`);
    const incoming = Array.isArray(res.comments) ? res.comments : [];
    state.comments = reset ? incoming : state.comments.concat(incoming);
    state.nextCursor = res.next_cursor || null;
    state.loading = false;
    blogInteractionsState.replies[commentId] = state;

    renderRepliesContainer(commentId);
  } catch (err) {
    state.loading = false;
    if (reset) {
      container.innerHTML = `<p style="font-size:12.5px;color:#ef4444">Không thể tải phản hồi.</p>`;
    }
  }
}

function renderRepliesContainer(commentId) {
  if (!isValidBlogUuid(commentId)) return;
  const container = document.getElementById(`blogRepliesContainer-${commentId}`);
  const state = blogInteractionsState.replies[commentId];
  if (!container || !state) return;

  const safeParentId = escapeHtml(commentId);
  let html = '';
  for (const r of state.comments) {
    if (!r || !isValidBlogUuid(r.id)) continue;
    const safeReplyId = escapeHtml(r.id);
    const initials = getBlogAuthorInitials(r.author_name);
    const timeAgo = formatBlogTimeAgo(r.created_at);
    const likeActive = r.liked ? 'liked' : '';

    html += `
      <div class="blog-reply-item" id="blogReply-${safeReplyId}">
        <div class="blog-avatar-circle" title="${escapeHtml(r.author_name)}">${escapeHtml(initials)}</div>
        <div class="blog-comment-content-wrap">
          <div class="blog-comment-author-row">
            <span class="blog-comment-author-name">${escapeHtml(r.author_name || 'Khách hàng')}</span>
            <span class="blog-comment-time">${escapeHtml(timeAgo)}</span>
          </div>
          <div class="blog-comment-body-text" id="blogReplyBody-${safeReplyId}">${escapeHtml(r.content)}</div>

          <!-- Inline Edit Box for reply -->
          <div class="blog-inline-edit-box" id="blogReplyEditBox-${safeReplyId}" style="display:none">
            <textarea class="blog-edit-textarea" id="blogReplyEditTextarea-${safeReplyId}" maxlength="2000" rows="2" placeholder="Chỉnh sửa phản hồi..."></textarea>
            <div class="blog-edit-actions">
              <button type="button" class="btn-outline blog-edit-cancel-btn" id="blogReplyCancelEditBtn-${safeReplyId}" onclick="cancelEditBlogComment('${safeReplyId}', true, '${safeParentId}')">Hủy</button>
              <button type="button" class="btn-primary blog-edit-save-btn" id="blogReplySaveEditBtn-${safeReplyId}" onclick="saveEditBlogComment('${safeReplyId}', true, '${safeParentId}')">Lưu</button>
            </div>
            <div class="blog-edit-error" id="blogReplyEditError-${safeReplyId}" style="display:none"></div>
          </div>

          <div class="blog-comment-actions-row">
            <button type="button" class="blog-comment-like-btn ${likeActive}" onclick="handleBlogReplyLikeClick('${safeParentId}', '${safeReplyId}')" aria-label="Thích phản hồi">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
              <span class="blog-comment-like-count">${r.like_count > 0 ? r.like_count : 'Thích'}</span>
            </button>
            <button type="button" class="blog-comment-reply-btn" data-action="reply" data-comment-id="${safeParentId}">
              Trả lời
            </button>
            ${r.can_edit ? `
              <button type="button" class="blog-comment-action-link blog-comment-edit-btn" id="blogReplyEditBtn-${safeReplyId}" onclick="startEditBlogComment('${safeReplyId}', true, '${safeParentId}')">Sửa</button>
              <button type="button" class="blog-comment-action-link blog-comment-del-btn" id="blogReplyDelBtn-${safeReplyId}" onclick="deleteBlogComment('${safeReplyId}', true, '${safeParentId}')">Xóa</button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  if (state.nextCursor !== null) {
    html += `
      <div class="blog-reply-more-wrap">
        <button type="button" class="blog-reply-more-btn" onclick="loadCommentReplies('${safeParentId}', { reset: false })">
          Xem thêm phản hồi...
        </button>
      </div>
    `;
  }

  container.innerHTML = html;
}

async function submitBlogReply(commentId) {
  if (!isValidBlogUuid(commentId)) return;
  const input = document.getElementById(`blogReplyInput-${commentId}`);
  const btn = document.getElementById(`blogReplySubmitBtn-${commentId}`);
  if (!input) return;
  if (!blogInteractionsState.commentsOpen) {
    showToast('Bình luận cho bài viết này hiện đã được đóng.');
    return;
  }
  const content = input.value.trim();
  if (!content) {
    input.focus();
    return;
  }

  const slug = blogInteractionsState.activeSlug;
  if (!slug) return;

  const isLoggedIn = currentUser && currentUser.loggedIn && !currentUser.isGuest;
  if (!isLoggedIn) {
    blogInteractionsState.draft = { type: 'reply', commentId, content, slug };
    showToast('Vui lòng đăng nhập để gửi phản hồi.');
    openAuthModal('login', { type: 'blog', kind: 'reply', commentId, slug, scrollY: window.scrollY });
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.textContent = '...';
  }

  try {
    const res = await blogFetchApi(`/blog/${encodeURIComponent(slug)}/comments/${encodeURIComponent(commentId)}/replies`, {
      method: 'POST',
      body: JSON.stringify({ content })
    });
    input.value = '';
    toggleInlineReplyBox(commentId);
    blogInteractionsState.draft = null;

    if (res.comment) {
      if (!blogInteractionsState.replies[commentId]) {
        blogInteractionsState.replies[commentId] = { comments: [], nextCursor: null };
      }
      const newReply = { ...res.comment, can_edit: true };
      blogInteractionsState.replies[commentId].comments.push(newReply);

      // Increment root comment's reply_count
      const rootComment = blogInteractionsState.comments.find(c => c.id === commentId);
      if (rootComment) {
        rootComment.reply_count = (rootComment.reply_count || 0) + 1;
      }
      renderBlogPostInteractions();

      // Ensure container is open
      const container = document.getElementById(`blogRepliesContainer-${commentId}`);
      const viewBtn = document.getElementById(`blogViewRepliesBtn-${commentId}`);
      if (container) container.classList.add('open');
      if (viewBtn) viewBtn.classList.add('expanded');

      renderRepliesContainer(commentId);
      showToast('Đã gửi phản hồi thành công!');
    }
  } catch (err) {
    if (err.status === 401) {
      blogInteractionsState.draft = { type: 'reply', commentId, content, slug };
      showToast('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      openAuthModal('login', { type: 'blog', kind: 'reply', commentId, slug, scrollY: window.scrollY });
    } else {
      showToast(err.body?.error === 'INVALID_COMMENT' ? 'Phản hồi không hợp lệ.' : 'Không thể gửi phản hồi. Vui lòng thử lại.');
    }
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Gửi';
    }
  }
}

async function handleBlogCommentLikeClick(commentId) {
  if (!isValidBlogUuid(commentId)) return;
  const slug = blogInteractionsState.activeSlug;
  if (!slug || blogInteractionsState.pendingCommentLikes.has(commentId)) return;
  const comment = blogInteractionsState.comments.find(c => c.id === commentId);
  if (!comment) return;

  const prevLiked = comment.liked;
  const prevCount = comment.like_count;
  const newLiked = !prevLiked;
  blogInteractionsState.pendingCommentLikes.add(commentId);

  comment.liked = newLiked;
  comment.like_count = Math.max(0, prevCount + (newLiked ? 1 : -1));

  // Update specific comment DOM
  const commentEl = document.getElementById(`blogComment-${commentId}`);
  if (commentEl) {
    const likeBtn = commentEl.querySelector('.blog-comment-like-btn');
    const countSpan = commentEl.querySelector('.blog-comment-like-count');
    if (likeBtn) {
      likeBtn.disabled = true;
      likeBtn.setAttribute('aria-busy', 'true');
      likeBtn.classList.toggle('liked', newLiked);
      likeBtn.setAttribute('aria-pressed', newLiked ? 'true' : 'false');
    }
    if (countSpan) {
      countSpan.textContent = comment.like_count > 0 ? comment.like_count : 'Thích';
    }
  }

  try {
    const res = await blogFetchApi(`/blog/${encodeURIComponent(slug)}/comments/${encodeURIComponent(commentId)}/like`, {
      method: 'POST',
      body: JSON.stringify({ liked: newLiked })
    });
    if (blogInteractionsState.activeSlug !== slug) return;
    comment.liked = !!res.liked;
    comment.like_count = res.like_count ?? comment.like_count;
    if (commentEl) {
      const likeBtn = commentEl.querySelector('.blog-comment-like-btn');
      const countSpan = commentEl.querySelector('.blog-comment-like-count');
      if (likeBtn) {
        likeBtn.classList.toggle('liked', comment.liked);
        likeBtn.setAttribute('aria-pressed', comment.liked ? 'true' : 'false');
      }
      if (countSpan) countSpan.textContent = comment.like_count > 0 ? comment.like_count : 'Thích';
    }
  } catch (err) {
    if (blogInteractionsState.activeSlug !== slug) return;
    // Rollback
    comment.liked = prevLiked;
    comment.like_count = prevCount;
    if (commentEl) {
      const likeBtn = commentEl.querySelector('.blog-comment-like-btn');
      const countSpan = commentEl.querySelector('.blog-comment-like-count');
      if (likeBtn) {
        likeBtn.classList.toggle('liked', prevLiked);
        likeBtn.setAttribute('aria-pressed', prevLiked ? 'true' : 'false');
      }
      if (countSpan) countSpan.textContent = prevCount > 0 ? prevCount : 'Thích';
    }
    showToast('Không thể cập nhật lượt thích bình luận.');
  } finally {
    blogInteractionsState.pendingCommentLikes.delete(commentId);
    const currentEl = document.getElementById(`blogComment-${commentId}`);
    const currentBtn = currentEl?.querySelector('.blog-comment-like-btn');
    if (currentBtn) {
      currentBtn.disabled = false;
      currentBtn.setAttribute('aria-busy', 'false');
    }
  }
}

async function handleBlogReplyLikeClick(rootCommentId, replyId) {
  if (!isValidBlogUuid(rootCommentId) || !isValidBlogUuid(replyId)) return;
  const slug = blogInteractionsState.activeSlug;
  if (!slug || blogInteractionsState.pendingCommentLikes.has(replyId)) return;
  const replies = blogInteractionsState.replies[rootCommentId]?.comments;
  if (!replies) return;
  const reply = replies.find(r => r.id === replyId);
  if (!reply) return;

  const prevLiked = reply.liked;
  const prevCount = reply.like_count;
  const newLiked = !prevLiked;
  blogInteractionsState.pendingCommentLikes.add(replyId);

  reply.liked = newLiked;
  reply.like_count = Math.max(0, prevCount + (newLiked ? 1 : -1));

  const replyEl = document.getElementById(`blogReply-${replyId}`);
  if (replyEl) {
    const likeBtn = replyEl.querySelector('.blog-comment-like-btn');
    const countSpan = replyEl.querySelector('.blog-comment-like-count');
    if (likeBtn) {
      likeBtn.classList.toggle('liked', newLiked);
      likeBtn.disabled = true;
      likeBtn.setAttribute('aria-busy', 'true');
    }
    if (countSpan) countSpan.textContent = reply.like_count > 0 ? reply.like_count : 'Thích';
  }

  try {
    const res = await blogFetchApi(`/blog/${encodeURIComponent(slug)}/comments/${encodeURIComponent(replyId)}/like`, {
      method: 'POST',
      body: JSON.stringify({ liked: newLiked })
    });
    if (blogInteractionsState.activeSlug !== slug) return;
    reply.liked = !!res.liked;
    reply.like_count = res.like_count ?? reply.like_count;
  } catch {
    if (blogInteractionsState.activeSlug !== slug) return;
    reply.liked = prevLiked;
    reply.like_count = prevCount;
    if (replyEl) {
      const likeBtn = replyEl.querySelector('.blog-comment-like-btn');
      const countSpan = replyEl.querySelector('.blog-comment-like-count');
      if (likeBtn) likeBtn.classList.toggle('liked', prevLiked);
      if (countSpan) countSpan.textContent = prevCount > 0 ? prevCount : 'Thích';
    }
    showToast('Không thể cập nhật lượt thích phản hồi.');
  } finally {
    blogInteractionsState.pendingCommentLikes.delete(replyId);
    const currentEl = document.getElementById(`blogReply-${replyId}`);
    const currentBtn = currentEl?.querySelector('.blog-comment-like-btn');
    if (currentBtn) {
      currentBtn.disabled = false;
      currentBtn.setAttribute('aria-busy', 'false');
    }
  }
}

function updateBlogInteractionsAuthUI() {
  if (typeof blogInteractionsState === 'undefined' || !blogInteractionsState) return;
  const avatarInitials = document.getElementById('blogCommentUserAvatarInitials');
  const guestHint = document.getElementById('blogCommentGuestHint');
  const isLoggedIn = currentUser && currentUser.loggedIn && !currentUser.isGuest;

  if (avatarInitials) {
    avatarInitials.textContent = isLoggedIn ? getBlogAuthorInitials(currentUser.name) : 'M';
  }

  if (guestHint) {
    guestHint.style.display = blogInteractionsState.commentsOpen && isLoggedIn ? 'none' : 'block';
    guestHint.textContent = blogInteractionsState.commentsOpen
      ? 'Đăng nhập để tham gia bình luận và phản hồi.'
      : 'Bình luận cho bài viết này hiện đã được đóng.';
  }

  // Restore draft if any
  const slug = blogInteractionsState.activeSlug;
  if (!slug) return;

  let draft = blogInteractionsState.draft;
  if (!draft) {
    try {
      const saved = sessionStorage.getItem(`melsou_blog_draft_${slug}`);
      if (saved) draft = JSON.parse(saved);
    } catch {}
  }

  if (draft && draft.slug === slug && draft.content) {
    if (draft.type === 'comment') {
      const input = document.getElementById('blogCommentInput');
      if (input && !input.value) {
        input.value = draft.content;
        handleBlogCommentInput(input);
      }
    } else if (draft.type === 'reply' && draft.commentId) {
      toggleInlineReplyBox(draft.commentId);
      const input = document.getElementById(`blogReplyInput-${draft.commentId}`);
      if (input && !input.value) {
        input.value = draft.content;
      }
    }
  }
}

// ════════ ✏️ BLOG COMMENTS INLINE EDIT & DELETE HANDLERS ════════

function startEditBlogComment(id, isReply, parentId) {
  if (!isValidBlogUuid(id) || (isReply && !isValidBlogUuid(parentId))) return;
  // Cross-lock: if comment is currently being deleted or edited, return
  if (pendingCommentDeletions.has(id) || pendingCommentEdits.has(id)) return;

  const prefix = isReply ? 'blogReply' : 'blogComment';
  const bodyEl = document.getElementById(`${prefix}Body-${id}`);
  const editBox = document.getElementById(`${prefix}EditBox-${id}`);
  const textarea = document.getElementById(`${prefix}EditTextarea-${id}`);
  const errorEl = document.getElementById(`${prefix}EditError-${id}`);
  if (!editBox || !textarea) return;

  let currentContent = '';
  if (isReply) {
    const replies = blogInteractionsState.replies[parentId]?.comments;
    const r = replies?.find(x => x.id === id);
    currentContent = r ? r.content : (bodyEl ? bodyEl.textContent : '');
  } else {
    const c = blogInteractionsState.comments.find(x => x.id === id);
    currentContent = c ? c.content : (bodyEl ? bodyEl.textContent : '');
  }

  textarea.value = currentContent;
  if (errorEl) {
    errorEl.style.display = 'none';
    errorEl.textContent = '';
  }
  if (bodyEl) bodyEl.style.display = 'none';
  editBox.style.display = 'block';
  textarea.focus();
}

function cancelEditBlogComment(id, isReply, parentId) {
  if (!isValidBlogUuid(id) || (isReply && !isValidBlogUuid(parentId))) return;
  const prefix = isReply ? 'blogReply' : 'blogComment';
  const bodyEl = document.getElementById(`${prefix}Body-${id}`);
  const editBox = document.getElementById(`${prefix}EditBox-${id}`);
  const errorEl = document.getElementById(`${prefix}EditError-${id}`);
  if (bodyEl) bodyEl.style.display = '';
  if (editBox) editBox.style.display = 'none';
  if (errorEl) {
    errorEl.style.display = 'none';
    errorEl.textContent = '';
  }
}

async function saveEditBlogComment(id, isReply, parentId) {
  if (!isValidBlogUuid(id) || (isReply && !isValidBlogUuid(parentId))) return;
  // Cross-lock: if comment is being deleted or already saving edit, return
  if (pendingCommentDeletions.has(id) || pendingCommentEdits.has(id)) return;

  const prefix = isReply ? 'blogReply' : 'blogComment';
  const bodyEl = document.getElementById(`${prefix}Body-${id}`);
  const editBox = document.getElementById(`${prefix}EditBox-${id}`);
  const textarea = document.getElementById(`${prefix}EditTextarea-${id}`);
  const saveBtn = document.getElementById(`${prefix}SaveEditBtn-${id}`);
  const cancelBtn = document.getElementById(`${prefix}CancelEditBtn-${id}`);
  const delBtn = document.getElementById(`${prefix}DelBtn-${id}`);
  const errorEl = document.getElementById(`${prefix}EditError-${id}`);

  if (!textarea) return;
  const content = textarea.value.trim();
  if (!content) {
    if (errorEl) {
      errorEl.textContent = 'Nội dung bình luận không được để trống.';
      errorEl.style.display = 'block';
    }
    textarea.focus();
    return;
  }
  if (content.length > 2000) {
    if (errorEl) {
      errorEl.textContent = 'Bình luận tối đa 2000 ký tự.';
      errorEl.style.display = 'block';
    }
    return;
  }

  const slug = blogInteractionsState.activeSlug;
  if (!slug) return;

  pendingCommentEdits.add(id);
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = 'Đang lưu...';
  }
  if (cancelBtn) cancelBtn.disabled = true;
  if (delBtn) delBtn.disabled = true;
  if (textarea) textarea.disabled = true;
  if (errorEl) {
    errorEl.style.display = 'none';
    errorEl.textContent = '';
  }

  try {
    let res;
    if (typeof window.codexUpdateBlogComment === 'function') {
      res = await window.codexUpdateBlogComment(slug, id, content);
    } else {
      res = await blogFetchApi(`/blog/${encodeURIComponent(slug)}/comments/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ content })
      });
    }

    const updatedContent = res?.comment?.content || content;

    // Update in state
    if (isReply) {
      const replies = blogInteractionsState.replies[parentId]?.comments;
      const target = replies?.find(x => x.id === id);
      if (target) target.content = updatedContent;
    } else {
      const target = blogInteractionsState.comments.find(x => x.id === id);
      if (target) target.content = updatedContent;
    }

    // Update in DOM safely via textContent (no innerHTML)
    if (bodyEl) {
      bodyEl.textContent = updatedContent;
      bodyEl.style.display = '';
    }
    if (editBox) editBox.style.display = 'none';

    showToast('Đã lưu thay đổi bình luận!');
  } catch (err) {
    if (errorEl) {
      errorEl.textContent = err.body?.error === 'INVALID_COMMENT' ? 'Bình luận không hợp lệ.' : 'Không thể lưu bình luận. Vui lòng thử lại.';
      errorEl.style.display = 'block';
    } else {
      showToast('Không thể lưu bình luận. Vui lòng thử lại.');
    }
  } finally {
    pendingCommentEdits.delete(id);
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Lưu';
    }
    if (cancelBtn) cancelBtn.disabled = false;
    if (delBtn) delBtn.disabled = false;
    if (textarea) textarea.disabled = false;
  }
}

async function deleteBlogComment(id, isReply, parentId) {
  if (!isValidBlogUuid(id) || (isReply && !isValidBlogUuid(parentId))) return;
  // Cross-lock: if comment is being edited or already being deleted, return
  if (pendingCommentEdits.has(id) || pendingCommentDeletions.has(id)) return;

  const confirmMsg = isReply
    ? 'Bạn có chắc chắn muốn xóa phản hồi này?'
    : 'Bạn có chắc chắn muốn xóa bình luận này?';
  if (!window.confirm(confirmMsg)) return;

  const slug = blogInteractionsState.activeSlug;
  if (!slug) return;

  const prefix = isReply ? 'blogReply' : 'blogComment';
  const delBtn = document.getElementById(`${prefix}DelBtn-${id}`);
  const editBtn = document.getElementById(`${prefix}EditBtn-${id}`);
  const saveBtn = document.getElementById(`${prefix}SaveEditBtn-${id}`);
  const cancelBtn = document.getElementById(`${prefix}CancelEditBtn-${id}`);

  pendingCommentDeletions.add(id);
  if (delBtn) {
    delBtn.disabled = true;
    delBtn.textContent = 'Đang xóa...';
  }
  if (editBtn) editBtn.disabled = true;
  if (saveBtn) saveBtn.disabled = true;
  if (cancelBtn) cancelBtn.disabled = true;

  try {
    if (typeof window.codexDeleteBlogComment === 'function') {
      await window.codexDeleteBlogComment(slug, id);
    } else {
      await blogFetchApi(`/blog/${encodeURIComponent(slug)}/comments/${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
    }

    if (isReply) {
      // Remove reply from local state
      const state = blogInteractionsState.replies[parentId];
      if (state && Array.isArray(state.comments)) {
        state.comments = state.comments.filter(r => r.id !== id);
      }
      // Decrement root comment's reply count
      const root = blogInteractionsState.comments.find(c => c.id === parentId);
      if (root) {
        root.reply_count = Math.max(0, (root.reply_count || 0) - 1);
      }
      // Finding 2: Deleting reply does NOT reduce commentCount
      renderBlogPostInteractions();
      renderRepliesContainer(parentId);

      // Update reply button count text
      const viewBtn = document.getElementById(`blogViewRepliesBtn-${parentId}`);
      if (viewBtn) {
        const count = root ? root.reply_count : 0;
        const isOpen = document.getElementById(`blogRepliesContainer-${parentId}`)?.classList.contains('open');
        const label = viewBtn.querySelector('.reply-label');
        if (label) {
          label.textContent = isOpen ? (count > 0 ? `Ẩn ${count} phản hồi` : 'Ẩn phản hồi') : (count > 0 ? `Xem ${count} phản hồi` : 'Xem phản hồi');
        }
        if (count === 0) {
          viewBtn.style.display = 'none';
        }
      }
    } else {
      // Remove root comment from local state
      blogInteractionsState.comments = blogInteractionsState.comments.filter(c => c.id !== id);
      delete blogInteractionsState.replies[id];
      // Finding 2: Deleting root reduces commentCount by exactly 1
      blogInteractionsState.commentCount = Math.max(0, blogInteractionsState.commentCount - 1);

      renderBlogPostInteractions();
      renderBlogCommentsList();
    }

    showToast('Đã xóa bình luận thành công!');
  } catch (err) {
    showToast('Không thể xóa bình luận. Vui lòng thử lại.');
  } finally {
    pendingCommentDeletions.delete(id);
    const currDelBtn = document.getElementById(`${prefix}DelBtn-${id}`);
    const currEditBtn = document.getElementById(`${prefix}EditBtn-${id}`);
    const currSaveBtn = document.getElementById(`${prefix}SaveEditBtn-${id}`);
    const currCancelBtn = document.getElementById(`${prefix}CancelEditBtn-${id}`);
    if (currDelBtn) {
      currDelBtn.disabled = false;
      currDelBtn.textContent = 'Xóa';
    }
    if (currEditBtn) currEditBtn.disabled = false;
    if (currSaveBtn) currSaveBtn.disabled = false;
    if (currCancelBtn) currCancelBtn.disabled = false;
  }
}

// ════════ 👑 OWNER BLOG COMMENTS MODERATION ════════

function setupOwnerBlogCommentsDelegation() {
  const listEl = document.getElementById('ownerBlogCommentsList');
  if (!listEl || listEl._delegationAttached) return;
  listEl._delegationAttached = true;
  listEl.addEventListener('click', (e) => {
    const btn = e.target && typeof e.target.closest === 'function'
      ? e.target.closest('button[data-action][data-comment-id]')
      : null;
    if (!btn) return;
    if (btn.disabled || btn.getAttribute('aria-busy') === 'true') return;

    const rawCommentId = btn.getAttribute('data-comment-id');
    const commentId = rawCommentId ? rawCommentId.trim() : '';
    if (!isValidBlogUuid(commentId)) return;

    const rawAction = btn.getAttribute('data-action');
    const targetStatus = normalizeOwnerModAction(rawAction);
    if (!targetStatus) return;

    executeOwnerCommentModeration(commentId, targetStatus);
  });
}

const BLOG_POST_NAMED_ENTITIES = {
  nbsp: '\u00A0',
  amp: '&',
  quot: '"',
  apos: "'",
  lt: '<',
  gt: '>',
  ndash: '–',
  mdash: '—',
  hellip: '…',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
  copy: '©',
  reg: '®',
  trade: '™',
  deg: '°',
  plusmn: '±',
  times: '×',
  divide: '÷',
  cent: '¢',
  pound: '£',
  euro: '€',
  yen: '¥',
  sect: '§',
  bull: '•'
};

const BLOG_HTML_ENTITY_REGEX = /&(?:#(\d+)|#[xX]([0-9a-fA-F]+)|([a-zA-Z0-9]+));/g;

function decodeBlogFilterTitle(raw) {
  if (!raw) return '';
  const str = String(raw);

  // Single-pass decoding: prevents double-decoding produced entities (e.g. &#38;lt; -> &lt;)
  const decoded = str.replace(BLOG_HTML_ENTITY_REGEX, (match, dec, hex, name) => {
    if (dec !== undefined) {
      try {
        const cp = parseInt(dec, 10);
        if (cp > 0 && cp <= 0x10FFFF) return String.fromCodePoint(cp);
      } catch (_) {}
      return match;
    }
    if (hex !== undefined) {
      try {
        const cp = parseInt(hex, 16);
        if (cp > 0 && cp <= 0x10FFFF) return String.fromCodePoint(cp);
      } catch (_) {}
      return match;
    }
    if (name !== undefined) {
      if (Object.prototype.hasOwnProperty.call(BLOG_POST_NAMED_ENTITIES, name)) {
        return BLOG_POST_NAMED_ENTITIES[name];
      }
      try {
        if (typeof document !== 'undefined' && typeof document.createElement === 'function') {
          const textarea = document.createElement('textarea');
          textarea.innerHTML = '&' + name + ';';
          const val = textarea.value;
          if (val && val !== '&' + name + ';') return val;
        }
      } catch (_) {}
      return match;
    }
    return match;
  });

  // Normalize \u00A0 (non-breaking space) to regular space and collapse redundant whitespace
  return decoded.replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim();
}
window.decodeBlogFilterTitle = decodeBlogFilterTitle;

async function initOwnerBlogCommentsModeration() {
  if (!currentUser || !currentUser.loggedIn || currentUser.role !== 'OWNER') {
    console.warn('[Melsou Security] Access denied: OWNER role required.');
    return;
  }

  setupOwnerBlogCommentsDelegation();

  const postSelect = document.getElementById('ownerBlogFilterPostSelect');
  const statusSelect = document.getElementById('ownerBlogFilterStatusSelect');
  if (!postSelect) return;

  if (typeof postSelect.replaceChildren === 'function') {
    postSelect.replaceChildren();
  } else {
    postSelect.children = [];
  }
  const loadingOption = document.createElement('option');
  loadingOption.value = '';
  loadingOption.textContent = '-- Đang tải danh sách bài viết... --';
  postSelect.appendChild(loadingOption);

  try {
    let postsData;
    if (typeof window.codexGetPublishedPosts === 'function') {
      postsData = await window.codexGetPublishedPosts({ perPage: 50 });
    } else {
      postsData = await blogFetchApi('/blog?per_page=50');
    }

    const posts = Array.isArray(postsData?.posts) ? postsData.posts : (Array.isArray(postsData) ? postsData : []);
    ownerBlogModerationState.posts = posts;

    if (typeof postSelect.replaceChildren === 'function') {
      postSelect.replaceChildren();
    } else {
      postSelect.children = [];
    }

    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Tất cả bài viết';
    postSelect.appendChild(defaultOption);

    for (const p of posts) {
      const option = document.createElement('option');
      option.value = p.slug || '';
      option.textContent = decodeBlogFilterTitle(p.title || p.slug || '');
      postSelect.appendChild(option);
    }

    // Prefer active post slug if in blogInteractionsState and valid
    if (blogInteractionsState?.activeSlug && posts.some(p => p.slug === blogInteractionsState.activeSlug)) {
      postSelect.value = blogInteractionsState.activeSlug;
      ownerBlogModerationState.selectedSlug = blogInteractionsState.activeSlug;
    } else {
      postSelect.value = '';
      ownerBlogModerationState.selectedSlug = '';
    }

    if (statusSelect) {
      statusSelect.value = ownerBlogModerationState.selectedStatus || 'all';
    }

    loadOwnerBlogComments({ reset: true });
  } catch (err) {
    if (typeof postSelect.replaceChildren === 'function') {
      postSelect.replaceChildren();
    } else {
      postSelect.children = [];
    }
    const fallbackOption = document.createElement('option');
    fallbackOption.value = '';
    fallbackOption.textContent = 'Tất cả bài viết';
    postSelect.appendChild(fallbackOption);
    loadOwnerBlogComments({ reset: true });
  }
}

function onOwnerBlogFilterPostChange() {
  if (!currentUser || !currentUser.loggedIn || currentUser.role !== 'OWNER') return;
  const select = document.getElementById('ownerBlogFilterPostSelect');
  if (!select) return;
  ownerBlogModerationState.selectedSlug = select.value || '';
  loadOwnerBlogComments({ reset: true });
}

function onOwnerBlogFilterStatusChange() {
  if (!currentUser || !currentUser.loggedIn || currentUser.role !== 'OWNER') return;
  const select = document.getElementById('ownerBlogFilterStatusSelect');
  if (!select) return;
  ownerBlogModerationState.selectedStatus = select.value || 'all';
  loadOwnerBlogComments({ reset: true });
}

function refreshOwnerBlogComments() {
  if (!currentUser || !currentUser.loggedIn || currentUser.role !== 'OWNER') return;
  const postSelect = document.getElementById('ownerBlogFilterPostSelect');
  const statusSelect = document.getElementById('ownerBlogFilterStatusSelect');
  if (postSelect) ownerBlogModerationState.selectedSlug = postSelect.value || '';
  if (statusSelect) ownerBlogModerationState.selectedStatus = statusSelect.value || 'all';
  loadOwnerBlogComments({ reset: true });
}

function loadMoreOwnerBlogComments() {
  if (!currentUser || !currentUser.loggedIn || currentUser.role !== 'OWNER') return;
  if (ownerBlogModerationState.loadingMore || !ownerBlogModerationState.nextCursor) return;
  loadOwnerBlogComments({ reset: false });
}

function showOwnerBlogCommentsLoading() {
  const loading = document.getElementById('ownerBlogCommentsLoading');
  const error = document.getElementById('ownerBlogCommentsError');
  const empty = document.getElementById('ownerBlogCommentsEmpty');
  const listWrap = document.getElementById('ownerBlogCommentsListWrap');
  if (loading) loading.style.display = 'block';
  if (error) error.style.display = 'none';
  if (empty) empty.style.display = 'none';
  if (listWrap) listWrap.style.display = 'none';
}

function showOwnerBlogCommentsError(msg) {
  const loading = document.getElementById('ownerBlogCommentsLoading');
  const error = document.getElementById('ownerBlogCommentsError');
  const errorText = document.getElementById('ownerBlogCommentsErrorText');
  const empty = document.getElementById('ownerBlogCommentsEmpty');
  const listWrap = document.getElementById('ownerBlogCommentsListWrap');
  if (loading) loading.style.display = 'none';
  if (error) {
    error.style.display = 'block';
    if (errorText) errorText.textContent = msg || 'Không thể tải bình luận.';
  }
  if (empty) empty.style.display = 'none';
  if (listWrap) listWrap.style.display = 'none';
}

function showOwnerBlogCommentsEmpty() {
  const loading = document.getElementById('ownerBlogCommentsLoading');
  const error = document.getElementById('ownerBlogCommentsError');
  const empty = document.getElementById('ownerBlogCommentsEmpty');
  const listWrap = document.getElementById('ownerBlogCommentsListWrap');
  if (loading) loading.style.display = 'none';
  if (error) error.style.display = 'none';
  if (empty) empty.style.display = 'block';
  if (listWrap) listWrap.style.display = 'none';
}

async function loadOwnerBlogComments({ reset = true } = {}) {
  if (!currentUser || !currentUser.loggedIn || currentUser.role !== 'OWNER') return;

  // Stale response tracking (anti-race for rapid filter changes)
  ownerBlogModerationState.requestSeq = (ownerBlogModerationState.requestSeq || 0) + 1;
  const currentSeq = ownerBlogModerationState.requestSeq;

  const card = document.getElementById('ownerBlogCommentsModerationCard');
  const loadMoreBtn = document.getElementById('ownerBlogCommentsLoadMoreBtn');
  const loadMoreSpinner = document.getElementById('ownerBlogCommentsLoadMoreSpinner');
  const loadMoreText = document.getElementById('ownerBlogCommentsLoadMoreText');

  if (card) card.setAttribute('aria-busy', 'true');

  if (reset) {
    ownerBlogModerationState.loading = true;
    ownerBlogModerationState.comments = [];
    ownerBlogModerationState.nextCursor = null;
    showOwnerBlogCommentsLoading();
  } else {
    ownerBlogModerationState.loadingMore = true;
    if (loadMoreBtn) {
      loadMoreBtn.disabled = true;
      loadMoreBtn.setAttribute('aria-busy', 'true');
    }
    if (loadMoreSpinner) loadMoreSpinner.style.display = 'inline-block';
    if (loadMoreText) loadMoreText.textContent = 'Đang tải...';
  }

  const postSlug = ownerBlogModerationState.selectedSlug || null;
  const status = ownerBlogModerationState.selectedStatus || 'all';
  const cursor = reset ? null : (ownerBlogModerationState.nextCursor || null);

  try {
    if (typeof window.codexListOwnerBlogComments !== 'function') {
      showOwnerBlogCommentsError('Thiếu hook window.codexListOwnerBlogComments. Vui lòng kiểm tra tích hợp.');
      return;
    }

    const res = await window.codexListOwnerBlogComments({
      postSlug,
      status,
      limit: 50,
      cursor,
      sort: 'newest'
    });

    // Drop stale response
    if (currentSeq !== ownerBlogModerationState.requestSeq) return;

    const incoming = Array.isArray(res?.comments) ? res.comments : [];
    ownerBlogModerationState.comments = reset ? incoming : ownerBlogModerationState.comments.concat(incoming);
    ownerBlogModerationState.nextCursor = res?.next_cursor || null;

    renderOwnerBlogCommentsList();

    const paginationEl = document.getElementById('ownerBlogCommentsPagination');
    if (paginationEl) {
      paginationEl.style.display = ownerBlogModerationState.nextCursor ? 'block' : 'none';
    }
  } catch (err) {
    if (currentSeq !== ownerBlogModerationState.requestSeq) return;
    if (reset) {
      showOwnerBlogCommentsError('Không thể tải danh sách bình luận kiểm duyệt. Vui lòng thử lại.');
    } else {
      showToast('Không thể tải thêm bình luận.');
    }
  } finally {
    if (currentSeq === ownerBlogModerationState.requestSeq) {
      ownerBlogModerationState.loading = false;
      ownerBlogModerationState.loadingMore = false;
      if (card) card.removeAttribute('aria-busy');
      if (loadMoreBtn) {
        loadMoreBtn.disabled = false;
        loadMoreBtn.removeAttribute('aria-busy');
      }
      if (loadMoreSpinner) loadMoreSpinner.style.display = 'none';
      if (loadMoreText) loadMoreText.textContent = 'Tải thêm bình luận';
    }
  }
}

function renderOwnerBlogCommentsList() {
  const loading = document.getElementById('ownerBlogCommentsLoading');
  const error = document.getElementById('ownerBlogCommentsError');
  const empty = document.getElementById('ownerBlogCommentsEmpty');
  const listWrap = document.getElementById('ownerBlogCommentsListWrap');
  const listEl = document.getElementById('ownerBlogCommentsList');
  const paginationEl = document.getElementById('ownerBlogCommentsPagination');

  setupOwnerBlogCommentsDelegation();

  if (loading) loading.style.display = 'none';
  if (error) error.style.display = 'none';

  const comments = ownerBlogModerationState.comments || [];
  const validComments = comments.filter(c => c && isValidBlogUuid(c.id));
  if (validComments.length === 0) {
    if (empty) empty.style.display = 'block';
    if (listWrap) listWrap.style.display = 'none';
    if (paginationEl) paginationEl.style.display = 'none';
    return;
  }

  if (empty) empty.style.display = 'none';
  if (listWrap) listWrap.style.display = 'block';

  let html = '';
  for (const item of validComments) {
    html += renderOwnerCommentRow(item);
  }
  listEl.innerHTML = html;

  if (paginationEl) {
    paginationEl.style.display = ownerBlogModerationState.nextCursor ? 'block' : 'none';
  }
}

function renderOwnerCommentRow(item) {
  if (!item || !isValidBlogUuid(item.id)) return '';
  const safeId = escapeHtml(item.id);
  const status = item.status || 'visible';
  const statusText = status === 'hidden' ? 'Đã ẩn' : (status === 'deleted' ? 'Đã xóa' : 'Hiển thị');
  const statusBadgeClass = status === 'hidden' ? 'hidden' : (status === 'deleted' ? 'deleted' : 'visible');
  const timeStr = formatBlogTimeAgo(item.created_at);
  const isDeleted = status === 'deleted';
  const isReply = !!item.is_reply || !!item.parent_comment_id;

  // Safe content rendering: if deleted, render placeholder; else escape
  const displayContent = isDeleted ? '[Đã xóa]' : escapeHtml(item.content);
  const contentClass = isDeleted ? 'owner-comment-content deleted' : 'owner-comment-content';

  return `
    <div class="owner-comment-row" id="ownerCommentRow-${safeId}" data-id="${safeId}">
      <div class="owner-comment-meta">
        <div class="owner-comment-author-info">
          <span class="owner-comment-author">${escapeHtml(item.author_name || 'Khách hàng')}</span>
          ${isReply ? '<span class="owner-comment-reply-badge">Phản hồi</span>' : ''}
          ${item.post_slug ? `<span style="font-size:11px;color:var(--gray);background:#f3f4f6;padding:2px 6px;border-radius:4px" title="Bài viết">${escapeHtml(item.post_slug)}</span>` : ''}
          <span class="owner-comment-date">${escapeHtml(timeStr)}</span>
        </div>
        <div class="owner-comment-status-badges">
          <span class="owner-status-badge ${statusBadgeClass}" id="ownerCommentStatusBadge-${safeId}">${statusText}</span>
        </div>
      </div>
      <div class="${contentClass}" id="ownerCommentContent-${safeId}">${displayContent}</div>
      <div class="owner-comment-actions">
        ${status === 'visible' ? `
          <button type="button" class="owner-mod-btn hide-btn" id="ownerModHideBtn-${safeId}" data-action="hidden" data-comment-id="${safeId}" aria-label="Ẩn bình luận">
            Ẩn
          </button>
          <button type="button" class="owner-mod-btn del-btn" id="ownerModDelBtn-${safeId}" data-action="deleted" data-comment-id="${safeId}" aria-label="Xóa bình luận">
            Xóa
          </button>
        ` : ''}
        ${status === 'hidden' ? `
          <button type="button" class="owner-mod-btn show-btn" id="ownerModShowBtn-${safeId}" data-action="visible" data-comment-id="${safeId}" aria-label="Hiện bình luận">
            Hiện
          </button>
          <button type="button" class="owner-mod-btn del-btn" id="ownerModDelBtn-${safeId}" data-action="deleted" data-comment-id="${safeId}" aria-label="Xóa bình luận">
            Xóa
          </button>
        ` : ''}
        ${status === 'deleted' ? `
          <span class="owner-deleted-note">Đã xóa khỏi hiển thị</span>
        ` : ''}
      </div>
    </div>
  `;
}

async function executeOwnerCommentModeration(commentId, targetStatus) {
  if (!isValidBlogUuid(commentId)) return;
  if (!['visible', 'hidden', 'deleted'].includes(targetStatus)) return;
  if (!currentUser || !currentUser.loggedIn || currentUser.role !== 'OWNER') {
    console.warn('[Melsou Security] Access denied: OWNER role required.');
    return;
  }

  // Anti-race: don't allow duplicate moderation on same comment
  if (pendingModerations.has(commentId)) return;

  const actionText = targetStatus === 'hidden' ? 'ẩn' : (targetStatus === 'visible' ? 'cho phép hiển thị' : 'xóa');
  if (!window.confirm(`Bạn có chắc chắn muốn ${actionText} bình luận này?`)) return;

  pendingModerations.add(commentId);
  const row = document.getElementById(`ownerCommentRow-${commentId}`);
  if (row) row.setAttribute('aria-busy', 'true');
  const buttons = row ? row.querySelectorAll('.owner-mod-btn') : [];
  buttons.forEach(b => {
    b.disabled = true;
    b.setAttribute('aria-busy', 'true');
  });

  const target = ownerBlogModerationState.comments.find(c => c.id === commentId);
  const isReply = !!target?.is_reply || !!target?.parent_comment_id;
  const postSlug = target?.post_slug || null;

  try {
    if (typeof window.codexModerateBlogComment === 'function') {
      await window.codexModerateBlogComment(commentId, targetStatus);
    } else {
      await blogFetchApi(`/owner/blog/comments/${encodeURIComponent(commentId)}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: targetStatus })
      });
    }

    // Active status filter transitions:
    const currentFilter = ownerBlogModerationState.selectedStatus || 'all';
    if (currentFilter !== 'all' && currentFilter !== targetStatus) {
      // Filter comment out of the active view
      ownerBlogModerationState.comments = ownerBlogModerationState.comments.filter(c => c.id !== commentId);
    } else {
      // In-place update
      if (target) {
        target.status = targetStatus;
        if (targetStatus === 'deleted') target.content = '[Đã xóa]';
      }
    }

    // Re-render list & empty/pagination state
    renderOwnerBlogCommentsList();

    // Summary reconciliation:
    if (blogInteractionsState?.activeSlug && (!postSlug || postSlug === blogInteractionsState.activeSlug)) {
      if (!isReply) {
        await refreshBlogPostInteractionsSummary(blogInteractionsState.activeSlug);
      }
      loadBlogComments({ reset: true });
    }

    showToast(`Đã ${actionText} bình luận thành công!`);
  } catch (err) {
    showToast('Không thể thực hiện kiểm duyệt lúc này. Vui lòng thử lại.');
  } finally {
    pendingModerations.delete(commentId);
    const currRow = document.getElementById(`ownerCommentRow-${commentId}`);
    if (currRow) {
      currRow.removeAttribute('aria-busy');
      currRow.querySelectorAll('.owner-mod-btn').forEach(b => {
        b.disabled = false;
        b.removeAttribute('aria-busy');
      });
    }
  }
}

window.initBlogInteractions = initBlogInteractions;
window.handleBlogPostLikeClick = handleBlogPostLikeClick;
window.scrollToBlogComments = scrollToBlogComments;
window.handleBlogShareClick = handleBlogShareClick;
window.executeBlogShare = executeBlogShare;
window.changeBlogCommentSort = changeBlogCommentSort;
window.handleBlogCommentInput = handleBlogCommentInput;
window.submitBlogComment = submitBlogComment;
window.loadMoreBlogComments = loadMoreBlogComments;
window.toggleCommentReplies = toggleCommentReplies;
window.toggleInlineReplyBox = toggleInlineReplyBox;
window.submitBlogReply = submitBlogReply;
window.handleBlogCommentLikeClick = handleBlogCommentLikeClick;
window.handleBlogReplyLikeClick = handleBlogReplyLikeClick;
window.updateBlogInteractionsAuthUI = updateBlogInteractionsAuthUI;
window.blogInteractionsState = blogInteractionsState;
window.loadBlogComments = loadBlogComments;

window.startEditBlogComment = startEditBlogComment;
window.cancelEditBlogComment = cancelEditBlogComment;
window.saveEditBlogComment = saveEditBlogComment;
window.deleteBlogComment = deleteBlogComment;
window.initOwnerBlogCommentsModeration = initOwnerBlogCommentsModeration;
window.onOwnerBlogFilterPostChange = onOwnerBlogFilterPostChange;
window.onOwnerBlogFilterStatusChange = onOwnerBlogFilterStatusChange;
window.refreshOwnerBlogComments = refreshOwnerBlogComments;
window.loadMoreOwnerBlogComments = loadMoreOwnerBlogComments;
window.loadOwnerBlogComments = loadOwnerBlogComments;
window.executeOwnerCommentModeration = executeOwnerCommentModeration;
window.refreshBlogPostInteractionsSummary = refreshBlogPostInteractionsSummary;
window.setupOwnerBlogCommentsDelegation = setupOwnerBlogCommentsDelegation;
window.setupBlogCommentsDelegation = setupBlogCommentsDelegation;
window.ownerBlogModerationState = ownerBlogModerationState;
window.findCommentAuthor = findCommentAuthor;
window.renderOwnerCommentRow = renderOwnerCommentRow;
window.isValidBlogUuid = isValidBlogUuid;

window.dispatchEvent(new Event('melsou-blog-interactions-ready'));


// ============================================================
// 💬 FB48: REALTIME CUSTOMER CHAT & SUPPORT INBOX SYSTEM
// ============================================================
let chatState = {
  status: 'ready', // loading, ready, sending, send_failed, offline, empty, conversation_loaded
  conversationId: null,
  guestInfo: null,
  messages: [],
  selectedAttachment: null,
  unreadCount: 0
};

function toggleSpeedDial() {
  const panel = document.getElementById('customerChatPanel');
  if (panel && panel.classList.contains('open')) {
    closeCustomerChat();
    return;
  }
  const m = document.getElementById('speedDialMenu');
  if (m) m.classList.toggle('open');
}

// Close speed dial launcher menu when clicking outside
document.addEventListener('click', function(e) {
  const widget = document.getElementById('speedDialWidget');
  const menu = document.getElementById('speedDialMenu');
  if (widget && menu && menu.classList.contains('open')) {
    if (!widget.contains(e.target)) {
      menu.classList.remove('open');
    }
  }
});

function toggleCustomerChatWidget() {
  const panel = document.getElementById('customerChatPanel');
  if (!panel) return;
  if (panel.classList.contains('open')) {
    closeCustomerChat();
  } else {
    openCustomerChat();
  }
}

function openCustomerChat() {
  const panel = document.getElementById('customerChatPanel');
  if (!panel) return;
  panel.classList.add('open');

  // Close speed dial if open
  const sdMenu = document.getElementById('speedDialMenu');
  if (sdMenu) sdMenu.classList.remove('open');

  // Clear unread badge
  chatState.unreadCount = 0;
  updateChatUnreadBadge();

  initCustomerChatSession();
}

function closeCustomerChat() {
  const panel = document.getElementById('customerChatPanel');
  if (panel) panel.classList.remove('open');
}

function minimizeCustomerChat() {
  closeCustomerChat();
}

function updateChatUnreadBadge() {
  const mainBtn = document.querySelector('.sd-main-btn');
  if (!mainBtn) return;
  let badge = mainBtn.querySelector('.chat-unread-badge');
  if (chatState.unreadCount > 0) {
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'chat-unread-badge';
      mainBtn.style.position = 'relative';
      mainBtn.appendChild(badge);
    }
    badge.textContent = chatState.unreadCount;
  } else if (badge) {
    badge.remove();
  }
}

function initCustomerChatSession() {
  const guestForm = document.getElementById('chatGuestForm');
  const chatMessages = document.getElementById('customerChatMessages');
  const notice = document.getElementById('chatConnectionNotice');
  const composer = document.querySelector('.chat-composer');

  // If user is logged in
  if (currentUser && currentUser.loggedIn) {
    if (guestForm) guestForm.style.display = 'none';
    if (chatMessages) chatMessages.style.display = 'flex';
    if (composer) composer.style.display = 'flex';
    if (notice) notice.style.display = 'block';
    loadOrFetchConversation();
    return;
  }

  // If guest with previous session
  if (chatState.guestInfo) {
    if (guestForm) guestForm.style.display = 'none';
    if (chatMessages) chatMessages.style.display = 'flex';
    if (composer) composer.style.display = 'flex';
    if (notice) notice.style.display = 'block';
    loadOrFetchConversation();
    return;
  }

  // Otherwise show friendly guest onboarding form
  if (guestForm) guestForm.style.display = 'block';
  if (chatMessages) {
    chatMessages.style.display = 'none';
    chatMessages.innerHTML = '';
  }
  if (notice) notice.style.display = 'none';
  if (composer) composer.style.display = 'none';
}

function submitGuestChatStart() {
  const nameInput = document.getElementById('chatGuestNameInput');
  const contactInput = document.getElementById('chatGuestContactInput');
  const name = nameInput ? nameInput.value.trim() : '';
  const contact = contactInput ? contactInput.value.trim() : '';

  if (!name || !contact) {
    showToast('Vui lòng nhập tên và thông tin liên hệ');
    if (!name && nameInput) nameInput.focus();
    else if (!contact && contactInput) contactInput.focus();
    return;
  }

  chatState.guestInfo = { name, contact };
  const guestForm = document.getElementById('chatGuestForm');
  if (guestForm) guestForm.style.display = 'none';

  const chatMessages = document.getElementById('customerChatMessages');
  if (chatMessages) chatMessages.style.display = 'flex';

  const composer = document.querySelector('.chat-composer');
  if (composer) composer.style.display = 'flex';

  const notice = document.getElementById('chatConnectionNotice');
  if (notice) notice.style.display = 'block';

  if (typeof window.codexChatStartConversation === 'function') {
    try {
      window.codexChatStartConversation({ name, contact });
    } catch(e) {
      console.warn('codexChatStartConversation error:', e);
    }
  }

  // Add warm welcome message from Melsou
  if (chatState.messages.length === 0) {
    chatState.messages.push({
      sender: 'melsou',
      text: `Chào ${name}! Melsou rất vui được hỗ trợ bạn. Bạn đang quan tâm đến gói photobook nào hay cần xưởng hướng dẫn chọn ảnh?`,
      time: getCurrentChatTime()
    });
  }

  renderChatMessages();
}

function loadOrFetchConversation() {
  if (typeof window.codexChatGetConversation === 'function') {
    try {
      const conv = window.codexChatGetConversation();
      if (conv && conv.messages) {
        chatState.messages = conv.messages;
        chatState.conversationId = conv.id;
      }
    } catch(e) {
      console.warn('codexChatGetConversation error:', e);
    }
  }

  if (chatState.messages.length === 0) {
    const custName = currentUser?.name || chatState.guestInfo?.name || 'bạn';
    chatState.messages.push({
      sender: 'melsou',
      text: `Chào ${custName}, Melsou sẵn sàng hỗ trợ bạn thiết kế và tư vấn các gói photobook liền trang 180°!`,
      time: getCurrentChatTime()
    });
  }

  const notice = document.getElementById('chatConnectionNotice');
  if (notice) notice.style.display = 'block';

  renderChatMessages();
}

function getCurrentChatTime() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

function renderChatMessages() {
  const container = document.getElementById('customerChatMessages');
  if (!container) return;

  container.innerHTML = chatState.messages.map(msg => {
    if (msg.sender === 'system') {
      return `<div class="chat-msg system">${msg.text}</div>`;
    }
    const isCust = msg.sender === 'customer';
    return `
      <div class="chat-msg ${isCust ? 'customer' : 'melsou'}">
        ${msg.imgUrl ? `<img src="${msg.imgUrl}" style="width:100%;max-width:200px;border-radius:8px;margin-bottom:6px;display:block" />` : ''}
        <div>${msg.text || ''}</div>
        <div class="chat-msg-meta">
          <span>${msg.time || ''}</span>
          ${isCust ? `<span>· ${msg.status || 'Đã gửi'}</span>` : ''}
        </div>
      </div>`;
  }).join('');

  container.scrollTop = container.scrollHeight;
}

function handleChatComposerKeyDown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendCustomerChatMessage();
  }
}

function autoResizeChatComposer(textarea) {
  if (!textarea) return;
  textarea.style.height = 'auto';
  const newHeight = Math.min(100, Math.max(38, textarea.scrollHeight));
  textarea.style.height = newHeight + 'px';
  textarea.style.overflowY = textarea.scrollHeight > 100 ? 'auto' : 'hidden';
}

function handleChatFileSelect(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  chatState.selectedAttachment = file;
  const strip = document.getElementById('chatAttachmentPreviewStrip');
  const thumb = document.getElementById('chatAttachmentThumb');
  const name = document.getElementById('chatAttachmentName');

  if (thumb) thumb.src = URL.createObjectURL(file);
  if (name) name.textContent = file.name;
  if (strip) strip.style.display = 'flex';
}

function clearChatAttachment() {
  chatState.selectedAttachment = null;
  const strip = document.getElementById('chatAttachmentPreviewStrip');
  if (strip) strip.style.display = 'none';
  const fileInput = document.getElementById('chatFileInput');
  if (fileInput) fileInput.value = '';
}

function sendCustomerChatMessage() {
  const input = document.getElementById('chatComposerInput');
  const text = input ? input.value.trim() : '';
  const file = chatState.selectedAttachment;

  if (!text && !file) return;

  const msg = {
    sender: 'customer',
    text: text,
    imgUrl: file ? URL.createObjectURL(file) : null,
    time: getCurrentChatTime(),
    status: 'Đã gửi'
  };

  chatState.messages.push(msg);
  renderChatMessages();

  // Reset composer
  if (input) {
    input.value = '';
    input.style.height = '38px';
    input.style.overflowY = 'hidden';
  }
  clearChatAttachment();

  // Keep notice visible
  const notice = document.getElementById('chatConnectionNotice');
  if (notice) notice.style.display = 'block';

  // Contract Hook for Codex Realtime
  if (typeof window.codexChatSendMessage === 'function') {
    try {
      window.codexChatSendMessage({ text, file }, (response) => {
        if (response?.status) {
          msg.status = response.status;
          renderChatMessages();
        }
      });
    } catch(e) {
      console.warn('codexChatSendMessage error:', e);
    }
  }
}


// ============================================================
// 🛡️ OWNER / ADMIN SUPPORT INBOX SHELL (FB48: ADMIN VIEW)
// ============================================================
window.openOwnerSupportInbox = function() {
  if (!currentUser || !currentUser.loggedIn || currentUser.role !== 'OWNER') {
    console.warn('[Melsou Security] Access denied: OWNER role required.');
    alert('Chức năng này chỉ dành riêng cho Quản trị viên (OWNER).');
    return;
  }
  const modal = document.getElementById('ownerSupportInboxModal');
  if (modal) modal.classList.add('open');
  renderAdminConversations('all');
};

window.closeOwnerSupportInbox = function() {
  const modal = document.getElementById('ownerSupportInboxModal');
  if (modal) modal.classList.remove('open');
};

function filterAdminConversations(filter, btn) {
  const chips = document.querySelectorAll('.admin-filter-chip');
  chips.forEach(c => c.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderAdminConversations(filter);
}

function renderAdminConversations(filter = 'all') {
  const list = document.getElementById('adminConversationList');
  if (!list) return;

  let convs = [];
  if (typeof window.codexAdminChatListConversations === 'function') {
    try {
      convs = window.codexAdminChatListConversations(filter) || [];
    } catch(e) {
      console.warn('codexAdminChatListConversations error:', e);
    }
  }

  if (convs.length === 0) {
    list.innerHTML = `
      <div style="text-align:center;padding:24px 12px;color:var(--gray);font-size:12.5px">
        Không có cuộc trò chuyện nào (${filter}).
      </div>`;
    return;
  }

  list.innerHTML = convs.map(c => `
    <div style="padding:10px 12px;border-radius:10px;margin-bottom:6px;cursor:pointer;background:white;border:1px solid var(--gray-l)" onclick="selectAdminConversation('${c.id}')">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
        <strong style="font-size:13px;color:var(--dark)">${c.customerName || 'Khách hàng'}</strong>
        <span style="font-size:10.5px;color:var(--gray)">${c.updatedAt || ''}</span>
      </div>
      <div style="font-size:12px;color:#6b7280;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${c.lastMessage || '...'}</div>
    </div>`).join('');
}

function selectAdminConversation(convId) {
  if (typeof window.codexAdminChatGetConversation === 'function') {
    const conv = window.codexAdminChatGetConversation(convId);
    if (conv) {
      document.getElementById('adminConvCustomerName').textContent = conv.customerName || 'Khách hàng';
      document.getElementById('adminConvCustomerContact').textContent = conv.contact || '--';
      document.getElementById('accName').textContent = conv.customerName || '--';
      document.getElementById('accContact').textContent = conv.contact || '--';
      document.getElementById('accDraft').textContent = conv.activeDraft || 'Album First Love Edition';
    }
  }
}

function sendAdminReply() {
  const inp = document.getElementById('adminReplyInput');
  const text = inp ? inp.value.trim() : '';
  if (!text) return;

  if (typeof window.codexAdminChatSendMessage === 'function') {
    window.codexAdminChatSendMessage(text);
  } else {
    showToast('Đã gửi câu trả lời (UI Shell - Chờ Codex kết nối realtime)');
  }
  if (inp) inp.value = '';
}

hydrateSsrBlogPosts();
resetBlogSearchState();
window.addEventListener('pageshow', resetBlogSearchState);
renderCustomerReviews();
var blogStorefrontLoaded = false;
function ensureStorefrontBlogLoaded() {
  if (blogStorefrontLoaded) return;
  blogStorefrontLoaded = true;
  renderBlogCategories();
  renderPublicBlog(activeBlogCategory || 'all', 1);
}
window.ensureStorefrontBlogLoaded = ensureStorefrontBlogLoaded;

(function initBlogStorefrontObserver() {
  const blogSec = document.getElementById('blog-section');
  if (blogSec && typeof IntersectionObserver === 'function') {
    const observer = new IntersectionObserver((entries) => {
      if (entries.some(e => e.isIntersecting)) {
        observer.disconnect();
        ensureStorefrontBlogLoaded();
      }
    }, { rootMargin: '350px 0px' });
    observer.observe(blogSec);
  } else {
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      window.addEventListener('load', () => requestIdleCallback(ensureStorefrontBlogLoaded, { timeout: 3500 }));
    } else if (typeof window !== 'undefined') {
      window.addEventListener('load', () => setTimeout(ensureStorefrontBlogLoaded, 3000));
    }
  }
})();

if (typeof window !== 'undefined') {
  window.addEventListener('melsou-blog-api-ready', () => {
    if (blogStorefrontLoaded) {
      renderBlogCategories();
      renderPublicBlog(activeBlogCategory, 1);
    }
  });
}


function loadMoreBlogPosts() {
  if (currentBlogPage < currentBlogTotalPages) renderPublicBlog(activeBlogCategory, currentBlogPage + 1);
}
window.loadMoreBlogPosts = loadMoreBlogPosts;
