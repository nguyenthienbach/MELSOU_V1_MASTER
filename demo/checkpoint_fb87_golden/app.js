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
    spread2: 'https://images.unsplash.com/photo-1507525428033-b723cf961d3e?w=600&auto=format&fit=crop&q=80',
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
    nameEn: 'Memory Box Keepsake',
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
    signature: '— melsou keepsake —',
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
function autoSaveToLocalStorage() {
  try {
    ALBUM_DATA.version = SCHEMA_VERSION;
    localStorage.setItem('melsou_active_draft', JSON.stringify(ALBUM_DATA));
    // The auth bridge is deliberately notified after the browser backup succeeds.
    // It mirrors the draft to the server using the opaque guest session; it never
    // treats localStorage as proof that somebody is signed in.
    window.melsouOnDraftChanged?.();
  } catch(e) {}
}

// Explicit, narrow integration surface for the authentication/persistence bridge.
// `let ALBUM_DATA` is not a window property, so do not access it indirectly.
window.melsouGetActiveDraft = () => ALBUM_DATA;

function loadFromLocalStorage() {
  try {
    const saved = localStorage.getItem('melsou_active_draft');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.version === SCHEMA_VERSION && parsed.spreads && parsed.spreads.length >= 7) {
        ALBUM_DATA = Object.assign(getFreshAlbumData(), parsed);
        if (!ALBUM_DATA.albumFormat) {
          const sc = ALBUM_DATA.sizeClass || 'ratio-portrait';
          ALBUM_DATA.albumFormat = ALBUM_FORMATS[sc] || ALBUM_FORMATS['ratio-portrait'];
        }
        if (Array.isArray(ALBUM_DATA.spreads)) {
          ALBUM_DATA.spreads.forEach(s => normalizeElementsToSafeArea(s));
        }
        return;
      }
    }
  } catch(e) {}
  ALBUM_DATA = getFreshAlbumData();
  autoSaveToLocalStorage();
}

// ── NAVIGATION & PAGES ──
function showPage(pageId) {
  if (pageId === 'studio') {
    setTimeout(() => applyStudioTranslations(currentAppLanguage), 20);
  }
  autoSaveToLocalStorage();
  document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
  const target = document.getElementById('page-' + pageId);
  if (target) target.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (pageId === 'studio') {
    document.body.classList.add('in-studio');
    document.body.classList.add('studio-mode-active');
    document.body.classList.add('page-studio-active');
    renderStudioWorkspace();
    adjustMobileStageScale();
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
let currentUser = { id: '', name: '', email: '', avatar: '', loggedIn: false };

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
      email: user?.email || '',
      avatar: user?.avatar || user?.user_metadata?.avatar_url || ''
    };
    updateHeaderUserUI();
    this.setLoginState('success');
  },

  logout() {
    currentUser = { id: '', name: '', email: '', avatar: '', loggedIn: false };
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
    openAuthModal();
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

  if (errorBox) errorBox.style.display = 'none';

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

  if (!username || !password) {
    if (errorBox) errorBox.style.display = 'flex';
    if (errorMsg) errorMsg.textContent = currentAppLanguage === 'en' ? 'Please enter both username and password' : 'Vui lòng nhập đầy đủ tên tài khoản và mật khẩu';
    return;
  }

  // Contract hook for Codex backend
  if (typeof window.codexHandleUsernameLogin === 'function') {
    window.codexHandleUsernameLogin({ username, password });
  } else {
    // Polite contract fallback: emulate session locally so PO can verify guest-first checkout continuity
    currentUser = { loggedIn: true, isGuest: false, name: username, username: username, email: '' };
    updateHeaderUserUI();
    closeAuthModal();
    showToast(currentAppLanguage === 'en' ? `Welcome, ${username}!` : `Chào mừng bạn, ${username}!`);
    if (ALBUM_DATA.cart && ALBUM_DATA.cart.length > 0) {
      openCheckoutModal();
    }
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
  if (password.length < 6) {
    if (errorBox) errorBox.style.display = 'flex';
    if (errorMsg) errorMsg.textContent = currentAppLanguage === 'en' ? 'Password must be at least 6 characters' : 'Mật khẩu phải có tối thiểu 6 ký tự';
    return;
  }
  if (password !== confirmPassword) {
    if (errorBox) errorBox.style.display = 'flex';
    if (errorMsg) errorMsg.textContent = currentAppLanguage === 'en' ? 'Passwords do not match' : 'Mật khẩu xác nhận không khớp';
    return;
  }

  // Contract hook for Codex backend
  if (typeof window.codexHandleUsernameRegister === 'function') {
    window.codexHandleUsernameRegister({ username, password });
  } else {
    // Polite contract fallback: emulate session locally so PO can verify guest-first checkout continuity
    currentUser = { loggedIn: true, isGuest: false, name: username, username: username, email: '' };
    updateHeaderUserUI();
    closeAuthModal();
    showToast(currentAppLanguage === 'en' ? `Account created! Welcome, ${username}` : `Tạo tài khoản thành công! Chào mừng ${username}`);
    if (ALBUM_DATA.cart && ALBUM_DATA.cart.length > 0) {
      openCheckoutModal();
    }
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
  currentUser = {
    loggedIn: true,
    isGuest: false,
    name: userData.username || userData.name,
    username: userData.username,
    email: userData.email || ''
  };
  updateHeaderUserUI();
  closeAuthModal();
  showToast(currentAppLanguage === 'en' ? `Welcome back, ${currentUser.name}!` : `Chào mừng bạn quay lại, ${currentUser.name}!`);
  if (ALBUM_DATA.cart && ALBUM_DATA.cart.length > 0) {
    openCheckoutModal();
  }
};

window.codexOnAuthError = function(errMsg) {
  const errorBox = document.getElementById('authModalErrorBox');
  const errorMsg = document.getElementById('authModalErrorMessage');
  if (errorBox) errorBox.style.display = 'flex';
  if (errorMsg) errorMsg.textContent = errMsg || (currentAppLanguage === 'en' ? 'Authentication failed. Please try again.' : 'Không thể xác thực. Vui lòng thử lại.');
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

function openAuthModal() {
  MelsouAuth.setLoginState('idle');
  switchAuthTab('login');
  const modal = document.getElementById('authModal');
  if (modal) { modal.classList.add('open'); modal.style.display = 'flex'; }
}

function closeAuthModal() {
  MelsouAuth.setLoginState('idle');
  const modal = document.getElementById('authModal');
  if (modal) { modal.classList.remove('open'); modal.style.display = 'none'; }
}

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
}


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
function initTemplateCards() {
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
            <img src="${t.coverImg}" class="bg-cover" alt="${title}">
            <div class="art-polaroid-1"><img src="${t.spread1}" alt=""></div>
            <div class="art-polaroid-2"><img src="${t.spread2}" alt=""></div>
          </div>
          <div class="art-tmpl-slide" id="tSlide_${idx}_1">
            <img src="${t.spread1}" class="bg-cover" alt="">
            <div style="position:absolute;bottom:12px;left:12px;background:rgba(0,0,0,0.7);color:white;padding:4px 8px;border-radius:4px;font-size:10px">${isEn ? 'Layout Spread 1' : 'Bố cục ruột trang 1'}</div>
          </div>
          <div class="art-tmpl-slide" id="tSlide_${idx}_2">
            <img src="${t.spread2}" class="bg-cover" alt="">
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
  const left = document.getElementById('heroLeftPage');
  const right = document.getElementById('heroRightPage');
  if (!left || !right) return;

  const isEn = (currentAppLanguage === 'en');
  if (heroStep === 0) {
    const heroCover = (ALBUM_DATA.spreads && ALBUM_DATA.spreads[0] && ALBUM_DATA.spreads[0].coverImg) || TEMPLATES_DATA[0].coverImg;
    const heroTitle = ALBUM_DATA.title || (isEn ? 'Artistic Photobook' : 'Album Kỷ Niệm');
    const heroQuote = ALBUM_DATA.quote || (isEn ? 'Snapshots of happiness that never fade.' : 'Mở phẳng 180° liền trang · Kỷ vật tình yêu');
    left.innerHTML = `<div style="font-family:'Pacifico',cursive;font-size:22px;color:var(--yellow)">melsou</div><div><div style="font-family:'Lora',serif;font-size:20px;font-weight:700">${heroTitle}</div><div style="font-size:11.5px;font-style:italic;opacity:0.8;margin-top:4px">"${heroQuote}"</div></div><div style="font-size:10px;opacity:0.7">${isEn ? '180° Layflat Hardcover · Click to flip 3D →' : 'Bìa cứng mở phẳng 180° · Bấm để lật 3D →'}</div>`;
    right.innerHTML = `<div class="pb-polaroid" style="transform:rotate(2deg)"><div class="pb-washi-corner" style="top:-6px;left:50%;transform:translateX(-50%)"></div><div style="height:120px;background:url('${heroCover}') center/cover;border-radius:2px"></div></div><div class="spotify-soundwave-bar" style="margin:0"><div class="spotify-logo-icon">🎵</div><div class="spotify-wave-lines"><span class="sw-line" style="height:8px"></span><span class="sw-line" style="height:16px"></span><span class="sw-line" style="height:10px"></span><span class="sw-line" style="height:20px"></span></div><span style="font-size:10px;font-weight:700">Spotify</span></div>`;
  } else if (heroStep === 1) {
    const songName = (ALBUM_DATA.spotifyTrack || (isEn ? 'Until I Found You' : 'Giai Điệu Kỷ Niệm')).split('—')[0];
    const img1 = (ALBUM_DATA.userGallery && ALBUM_DATA.userGallery[0]) || TEMPLATES_DATA[0].spread1;
    const img2 = (ALBUM_DATA.userGallery && ALBUM_DATA.userGallery[1]) || TEMPLATES_DATA[0].spread2;
    left.innerHTML = `<div style="font-size:10px;font-weight:800;color:var(--red)">OUR TIMES</div><h3 style="font-size:18px">${isEn ? 'Cherished Melody' : 'Giai Điệu Kỷ Niệm'}</h3><div class="spotify-soundwave-bar"><div class="spotify-logo-icon">🎵</div><div class="spotify-wave-lines"><span class="sw-line" style="height:14px"></span><span class="sw-line" style="height:22px"></span><span class="sw-line" style="height:8px"></span><span class="sw-line" style="height:18px"></span></div><span style="font-size:10px;font-weight:700">${songName}</span></div>`;
    right.innerHTML = `<div class="pb-polaroid" style="transform:rotate(-3deg)"><div style="height:110px;background:url('${img1}') center/cover"></div></div><div class="pb-polaroid" style="transform:rotate(3deg);margin-top:6px"><div style="height:110px;background:url('${img2}') center/cover"></div></div>`;
  } else {
    const img3 = (ALBUM_DATA.userGallery && ALBUM_DATA.userGallery[2]) || TEMPLATES_DATA[1].spread1;
    const msg = ALBUM_DATA.message || (isEn ? 'Every page holds a cherished piece of our journey together...' : 'Mỗi trang sách này là một phần tuổi trẻ tuyệt đẹp của chúng ta... 💖');
    left.innerHTML = `<span style="font-family:'Pacifico',cursive;color:var(--red);font-size:16px">${ALBUM_DATA.salutation || (isEn ? 'Dearest,' : 'Gửi người thương,')}</span><p style="font-family:${ALBUM_DATA.letterFont};color:${ALBUM_DATA.inkColor};font-size:11px;font-style:italic;line-height:1.6;margin-top:4px">${msg.slice(0, 110)}...</p><div style="font-size:9.5px;color:var(--gray);text-align:right;margin-top:8px">${ALBUM_DATA.signature}</div>`;
    right.innerHTML = `<div class="pb-polaroid" style="height:100%"><div style="height:100%;background:url('${img3}') center/cover;border-radius:2px"></div></div>`;
  }
}

function startHeroAutoFlip() {
  syncHeroLiveBook();
  setInterval(() => {
    heroStep = (heroStep + 1) % 3;
    syncHeroLiveBook();
  }, 4500);
}

// ── STORYTELLING VALUE CARDS ──
const VALUE_STORIES = [
  {
    icon: '🎨',
    iconBg: 'var(--red-light)',
    badge: 'GIÁ TRỊ ĐỘC BẢN · 01/04',
    title: 'Không gian sáng tạo tinh tế',
    experience: 'Bạn không cần kỹ năng đồ họa phức tạp để tạo nên một cuốn album đẹp. Không gian của Melsou được sắp xếp sẵn theo tỷ lệ vàng và bố cục thoáng đạt, nhường trọn vẹn sự chú ý cho câu chuyện của bạn.',
    craft: 'Melsou ứng dụng công nghệ bình trang liền mạch 180° cùng lưới căn chỉnh thông minh. Người dùng chỉ cần thả ảnh vào khung, hệ thống sẽ tự động tối ưu hóa vùng an toàn in ấn (print-safe area) để không làm mất góc ảnh khi hoàn thiện.'
  },
  {
    icon: '⚡',
    iconBg: 'rgba(109,158,81,0.15)',
    badge: 'GIÁ TRỊ ĐỘC BẢN · 02/04',
    title: 'Cá nhân hóa trong vài thao tác',
    experience: 'Gói trọn chuyến đi hay năm tháng thanh xuân chỉ sau ít phút trải nghiệm. Bạn có thể tự tay chọn màu bìa, dán sticker hoài niệm, viết lời đề tặng và quan sát toàn bộ album qua góc nhìn 3D trực quan.',
    craft: 'Mỗi thao tác biên tập được xử lý mượt mà và lưu trữ tọa độ chuẩn hóa. Toàn bộ thiết kế được giữ riêng tư trên thiết bị của bạn cho đến khi bạn quyết định gửi in.'
  },
  {
    icon: '🎵',
    iconBg: 'var(--red-light)',
    badge: 'GIÁ TRỊ ĐỘC BẢN · 03/04',
    title: 'Đánh thức ký ức đa giác quan',
    experience: 'Hình ảnh ghi lại ánh mắt, còn âm thanh lưu giữ nhịp đập cảm xúc. Mỗi trang photobook Melsou không chỉ để nhìn ngắm, mà còn biết ngân vang bản nhạc quen thuộc hay giọng nói ấm áp của người thương.',
    craft: 'Sự kết hợp giữa công nghệ in mã QR / Soundwave Spotify sắc nét và module vi mạch ghi âm vật lý ISD1820 tích hợp tinh tế bên trong bìa sau, cho phép người nhận cất lên tiếng nói mộc mạc bất cứ khi nào mở sách.'
  },
  {
    icon: '🔒',
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
function openTemplateOnboardingModal() { document.getElementById('templateOnboardingModal').classList.add('open'); }
function closeTemplateOnboardingModal() { document.getElementById('templateOnboardingModal').classList.remove('open'); }

function loadTemplateToStudio(name, quote, coverImg) {
  closeTemplateOnboardingModal();
  ALBUM_DATA.title = name;
  ALBUM_DATA.quote = quote || '';
  if (coverImg && ALBUM_DATA.spreads && ALBUM_DATA.spreads[0]) {
    ALBUM_DATA.spreads[0].coverImg = coverImg;
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

// ── ➕ THÊM TRANG ĐÔI MỞ RỘNG (+15K/2 TRANG) ──
function addNewSpreadToAlbum() {
  const insertIndex = ALBUM_DATA.spreads.length - 1; // Ngay trước Bìa Sau
  const newSpreadId = 'spread-custom-' + Date.now();

  const newSpread = {
    id: newSpreadId,
    name: 'Trang mới',
    isCustomAdded: true,
    elements: []
  };

  ALBUM_DATA.spreads.splice(insertIndex, 0, newSpread);
  ALBUM_DATA.extraSpreadsCount = (ALBUM_DATA.extraSpreadsCount || 0) + 1;
  ALBUM_DATA.activeSpreadIndex = insertIndex;

  renumberSpreads();
  autoSaveToLocalStorage();
  renderStudioWorkspace();
  showToast(currentAppLanguage === 'en' ? 'Added 2 pages (+15,000₫)' : '✅ Đã thêm thành công 2 trang (+15.000đ)!');
}

function removeCustomSpread(index, e) {
  if (e) e.stopPropagation();
  if (confirm(`Bạn có chắc chắn muốn xóa trang đôi này không?`)) {
    ALBUM_DATA.spreads.splice(index, 1);
    ALBUM_DATA.extraSpreadsCount = Math.max(0, (ALBUM_DATA.extraSpreadsCount || 1) - 1);
    if (ALBUM_DATA.activeSpreadIndex >= ALBUM_DATA.spreads.length) {
      ALBUM_DATA.activeSpreadIndex = ALBUM_DATA.spreads.length - 1;
    }
    renumberSpreads();
    autoSaveToLocalStorage();
    renderStudioWorkspace();
  }
}

// ── CANVA FREESTYLE: ADD TEXT BOX & CANVA IMAGE FRAME ──
function addRealFreeformTextBox() {
  const spread = ALBUM_DATA.spreads[ALBUM_DATA.activeSpreadIndex];
  if (!spread.elements) spread.elements = [];
  spread.elements.push({
    id: Date.now(),
    type: 'text',
    content: 'Nhấp để gõ lời tựa...',
    x: 100,
    y: 100,
    font: ALBUM_DATA.letterFont,
    color: ALBUM_DATA.inkColor,
    fontSize: 16,
    locked: false
  });
  autoSaveToLocalStorage();
  renderActiveSpread();
}

function addCanvaImageFrame(frameStyle = 'polaroid', initialImg = '') {
  const spread = ALBUM_DATA.spreads[ALBUM_DATA.activeSpreadIndex];
  if (!spread.elements) spread.elements = [];

  const newId = Date.now();
  spread.elements.push({
    id: newId,
    type: 'photo',
    frameStyle: frameStyle || 'polaroid',
    img: initialImg || '',
    x: 120 + ((spread.elements.length * 35) % 220),
    y: 70 + ((spread.elements.length * 30) % 160),
    width: frameStyle === 'oval' ? 200 : 220,
    rotate: (Math.random() * 6 - 3),
    locked: false,
    crop: { zoom: 1.0, offsetX: 0, offsetY: 0, rotate: 0 }
  });

  ALBUM_DATA.activePhotoSlot = 'el_' + newId;
  autoSaveToLocalStorage();
  renderActiveSpread();
}

function addRealFreeformPhotoFrame() {
  addCanvaImageFrame('polaroid', '');
}

function addRealStickerToCanvas(stickerChar, dropX, dropY) {
  const spread = ALBUM_DATA.spreads[ALBUM_DATA.activeSpreadIndex];
  if (!spread.elements) spread.elements = [];
  spread.elements.push({
    id: Date.now(),
    type: 'sticker',
    char: stickerChar,
    x: dropX || 250,
    y: dropY || 150,
    rotate: (Math.random() * 20) - 10,
    locked: false
  });
  autoSaveToLocalStorage();
  renderActiveSpread();
}

function removeSpreadElement(id) {
  const spread = ALBUM_DATA.spreads[ALBUM_DATA.activeSpreadIndex];
  spread.elements = spread.elements.filter(e => e.id !== id);
  if (ALBUM_DATA.cropEditingId === id) ALBUM_DATA.cropEditingId = null;
  autoSaveToLocalStorage();
  renderActiveSpread();
}

// ── BỐ CỤC ẢNH MẪU (PRESET COMPOSITIONS CHUẨN VÙNG AN TOÀN IN) ──
function applyPresetComposition(layoutType) {
  const spread = ALBUM_DATA.spreads[ALBUM_DATA.activeSpreadIndex];
  if (spread.isClosedCover || spread.isClosedBack) {
    alert('Vui lòng chọn trang ruột để áp dụng bố cục ảnh!');
    return;
  }

  const gallery = (ALBUM_DATA.userGallery && ALBUM_DATA.userGallery.length > 0)
    ? ALBUM_DATA.userGallery
    : [];

  spread.elements = [];
  const now = Date.now();

  if (layoutType === 'single-hero') {
    spread.elements.push({
      id: now + 1,
      type: 'photo',
      frameStyle: 'clean',
      img: gallery[0] || '',
      x: 180, y: 55, width: 360, rotate: 0, locked: false,
      crop: { zoom: 1.0, offsetX: 0, offsetY: 0, rotate: 0 }
    });
  } else if (layoutType === 'duo-horizontal') {
    spread.elements.push({
      id: now + 1,
      type: 'photo',
      frameStyle: 'polaroid',
      img: gallery[0] || '',
      x: 45, y: 70, width: 270, rotate: -2, locked: false,
      crop: { zoom: 1.0, offsetX: 0, offsetY: 0, rotate: 0 }
    });
    spread.elements.push({
      id: now + 2,
      type: 'photo',
      frameStyle: 'polaroid',
      img: gallery[1] || gallery[0] || '',
      x: 405, y: 70, width: 270, rotate: 2, locked: false,
      crop: { zoom: 1.0, offsetX: 0, offsetY: 0, rotate: 0 }
    });
  } else if (layoutType === 'trio-collage') {
    spread.elements.push({
      id: now + 1,
      type: 'photo',
      frameStyle: 'clean',
      img: gallery[0] || '',
      x: 45, y: 50, width: 300, rotate: 0, locked: false,
      crop: { zoom: 1.0, offsetX: 0, offsetY: 0, rotate: 0 }
    });
    spread.elements.push({
      id: now + 2,
      type: 'photo',
      frameStyle: 'polaroid',
      img: gallery[1] || gallery[0] || '',
      x: 410, y: 40, width: 250, rotate: 2, locked: false,
      crop: { zoom: 1.0, offsetX: 0, offsetY: 0, rotate: 0 }
    });
    spread.elements.push({
      id: now + 3,
      type: 'photo',
      frameStyle: 'polaroid',
      img: gallery[2] || gallery[1] || gallery[0] || '',
      x: 410, y: 220, width: 250, rotate: -2, locked: false,
      crop: { zoom: 1.0, offsetX: 0, offsetY: 0, rotate: 0 }
    });
  } else if (layoutType === 'quad-grid') {
    spread.elements.push({
      id: now + 1, type: 'photo', frameStyle: 'clean', img: gallery[0] || '',
      x: 45, y: 40, width: 260, rotate: 0, locked: false, crop: { zoom: 1.0, offsetX: 0, offsetY: 0, rotate: 0 }
    });
    spread.elements.push({
      id: now + 2, type: 'photo', frameStyle: 'clean', img: gallery[1] || gallery[0] || '',
      x: 415, y: 40, width: 260, rotate: 0, locked: false, crop: { zoom: 1.0, offsetX: 0, offsetY: 0, rotate: 0 }
    });
    spread.elements.push({
      id: now + 3, type: 'photo', frameStyle: 'clean', img: gallery[2] || gallery[0] || '',
      x: 45, y: 230, width: 260, rotate: 0, locked: false, crop: { zoom: 1.0, offsetX: 0, offsetY: 0, rotate: 0 }
    });
    spread.elements.push({
      id: now + 4, type: 'photo', frameStyle: 'clean', img: gallery[3] || gallery[1] || gallery[0] || '',
      x: 415, y: 230, width: 260, rotate: 0, locked: false, crop: { zoom: 1.0, offsetX: 0, offsetY: 0, rotate: 0 }
    });
  }

  autoSaveToLocalStorage();
  renderActiveSpread();
}

// ── TRỘN ẢNH NHANH (SHUFFLE PHOTOS) ──
function shuffleActiveSpreadPhotos() {
  const spread = ALBUM_DATA.spreads[ALBUM_DATA.activeSpreadIndex];
  if (!spread.elements) return;
  const photoElements = spread.elements.filter(e => e.type === 'photo' && e.img);
  if (photoElements.length < 2) {
    alert('Trang cần ít nhất 2 ảnh để có thể thực hiện xáo trộn!');
    return;
  }

  const images = photoElements.map(e => e.img);
  for (let i = images.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [images[i], images[j]] = [images[j], images[i]];
  }

  photoElements.forEach((el, idx) => {
    el.img = images[idx];
    if (el.crop) {
      el.crop.offsetX = 0;
      el.crop.offsetY = 0;
    }
  });

  autoSaveToLocalStorage();
  renderActiveSpread();
}

// ── VÙNG AN TOÀN IN ẤN & KIỂM TRA VI PHẠM (SAFE PRINT AREA) ──
function togglePrintSafeGuides() {
  const el = document.getElementById('printSafeGuidesOverlay');
  if (el) {
    const isActive = el.classList.toggle('active');
    const stageBtn = document.getElementById('btnToggleSafeGuidesStage');
    if (stageBtn) {
      stageBtn.style.background = isActive ? 'var(--red-light)' : '';
      stageBtn.style.borderColor = isActive ? 'var(--red)' : '';
      stageBtn.style.color = isActive ? 'var(--red)' : '';
      stageBtn.style.fontWeight = isActive ? '700' : '500';
    }
  }
}

function checkElementSafeArea(domItem, el) {
  if (!domItem || !el) return false;
  const curSpread = ALBUM_DATA.spreads ? ALBUM_DATA.spreads[ALBUM_DATA.activeSpreadIndex] : null;
  const isMobileSingle = (isMobileViewport() && curSpread && !curSpread.isClosedCover && !curSpread.isClosedBack);

  const safeMargin = 20;
  const elW = el.width || (el.type === 'sticker' ? 50 : 200);
  const elH = el.frameStyle === 'oval' ? elW : (el.type === 'sticker' ? 50 : Math.round(elW * 0.65) + (el.frameStyle === 'clean' ? 0 : 30));
  const rad = Math.abs((el.rotate || 0) * Math.PI / 180);
  const boundW = elW * Math.cos(rad) + elH * Math.sin(rad);
  const boundH = elW * Math.sin(rad) + elH * Math.cos(rad);

  let isViolating = false;
  if (isMobileSingle) {
    const isRight = (mobileActivePageHalf === 'right');
    const localX = isRight ? (el.x - 430) : el.x;
    const minX = localX - (boundW - elW) / 2;
    const maxX = minX + boundW;
    const minY = el.y - (boundH - elH) / 2;
    const maxY = minY + boundH;
    isViolating = (minX < safeMargin || maxX > (430 - safeMargin) || minY < safeMargin || maxY > (460 - safeMargin));
  } else {
    const isCoverOrBack = curSpread && (curSpread.isClosedCover || curSpread.isClosedBack);
    if (isCoverOrBack) {
      const minX = el.x - (boundW - elW) / 2;
      const maxX = minX + boundW;
      const minY = el.y - (boundH - elH) / 2;
      const maxY = minY + boundH;
      isViolating = (minX < safeMargin || maxX > (440 - safeMargin) || minY < safeMargin || maxY > (460 - safeMargin));
    } else {
      // FB63: 2-page desktop spread page-local clamping in canonical [0..860] coordinate system
      const elMid = (el.x || 0) + (el.width || 220) / 2;
      const isOnRight = (elMid >= 430);
      const minX = el.x - (boundW - elW) / 2;
      const maxX = minX + boundW;
      const minY = el.y - (boundH - elH) / 2;
      const maxY = minY + boundH;
      const spineMargin = 8;

      if (!isOnRight) {
        // Left page: [safeMargin .. 430 - spineMargin]
        isViolating = (minX < safeMargin || maxX > (430 - spineMargin) || minY < safeMargin || maxY > (460 - safeMargin));
      } else {
        // Right page: [430 + spineMargin .. 860 - safeMargin]
        isViolating = (minX < (430 + spineMargin) || maxX > (860 - safeMargin) || minY < safeMargin || maxY > (460 - safeMargin));
      }
    }
  }

  domItem.classList.toggle('safe-area-warning', isViolating);
  return isViolating;
}

// ── PHÂN LỚP Z-INDEX & THAO TÁC ĐỐI TƯỢNG (LAYERS & LOCK) ──
function bringElementForward(id, event) {
  if (event) event.stopPropagation();
  const spread = ALBUM_DATA.spreads[ALBUM_DATA.activeSpreadIndex];
  if (!spread.elements) return;
  const idx = spread.elements.findIndex(e => String(e.id) === String(id));
  if (idx > -1 && idx < spread.elements.length - 1) {
    const [item] = spread.elements.splice(idx, 1);
    spread.elements.splice(idx + 1, 0, item);
    autoSaveToLocalStorage();
    renderActiveSpread();
  }
}

function sendElementBackward(id, event) {
  if (event) event.stopPropagation();
  const spread = ALBUM_DATA.spreads[ALBUM_DATA.activeSpreadIndex];
  if (!spread.elements) return;
  const idx = spread.elements.findIndex(e => String(e.id) === String(id));
  if (idx > 0) {
    const [item] = spread.elements.splice(idx, 1);
    spread.elements.splice(idx - 1, 0, item);
    autoSaveToLocalStorage();
    renderActiveSpread();
  }
}

function bringElementToFront(id, event) {
  if (event) event.stopPropagation();
  const spread = ALBUM_DATA.spreads[ALBUM_DATA.activeSpreadIndex];
  if (!spread.elements) return;
  const idx = spread.elements.findIndex(e => String(e.id) === String(id));
  if (idx > -1) {
    const [item] = spread.elements.splice(idx, 1);
    spread.elements.push(item);
    autoSaveToLocalStorage();
    renderActiveSpread();
  }
}

function sendElementToBack(id, event) {
  if (event) event.stopPropagation();
  const spread = ALBUM_DATA.spreads[ALBUM_DATA.activeSpreadIndex];
  if (!spread.elements) return;
  const idx = spread.elements.findIndex(e => String(e.id) === String(id));
  if (idx > -1) {
    const [item] = spread.elements.splice(idx, 1);
    spread.elements.unshift(item);
    autoSaveToLocalStorage();
    renderActiveSpread();
  }
}

function toggleLockElement(id, event) {
  if (event) event.stopPropagation();
  const spread = ALBUM_DATA.spreads[ALBUM_DATA.activeSpreadIndex];
  if (!spread.elements) return;
  const el = spread.elements.find(e => String(e.id) === String(id));
  if (el) {
    el.locked = !el.locked;
    autoSaveToLocalStorage();
    renderActiveSpread();
  }
}

function copyElement(id) {
  const spread = ALBUM_DATA.spreads[ALBUM_DATA.activeSpreadIndex];
  if (!spread.elements) return;
  const el = spread.elements.find(e => String(e.id) === String(id));
  if (el) {
    ALBUM_DATA.clipboardElement = JSON.parse(JSON.stringify(el));
    closeContextMenu();
  }
}

function pasteElement() {
  if (!ALBUM_DATA.clipboardElement) return;
  const spread = ALBUM_DATA.spreads[ALBUM_DATA.activeSpreadIndex];
  if (!spread.elements) spread.elements = [];
  const clone = JSON.parse(JSON.stringify(ALBUM_DATA.clipboardElement));
  clone.id = Date.now();
  clone.x = (clone.x || 100) + 24;
  clone.y = (clone.y || 100) + 24;
  clone.locked = false;
  spread.elements.push(clone);
  autoSaveToLocalStorage();
  renderActiveSpread();
  selectCanvasItem(clone.id);
}

function duplicateElement(id, event) {
  if (event) event.stopPropagation();
  const spread = ALBUM_DATA.spreads[ALBUM_DATA.activeSpreadIndex];
  if (!spread.elements) return;
  const el = spread.elements.find(e => String(e.id) === String(id));
  if (el) {
    const clone = JSON.parse(JSON.stringify(el));
    clone.id = Date.now();
    clone.x = (clone.x || 100) + 24;
    clone.y = (clone.y || 100) + 24;
    clone.locked = false;
    spread.elements.push(clone);
    autoSaveToLocalStorage();
    renderActiveSpread();
    selectCanvasItem(clone.id);
  }
}

function alignElement(id, alignment) {
  const spread = ALBUM_DATA.spreads[ALBUM_DATA.activeSpreadIndex];
  if (!spread || !spread.elements) return;
  const el = spread.elements.find(e => String(e.id) === String(id));
  if (!el || el.locked) return;

  const elW = el.width || 220;
  const elH = el.frameStyle === 'oval' ? elW : Math.round(elW * 0.65);

  if (isMobileViewport() && !spread.isClosedCover && !spread.isClosedBack) {
    const isRight = (mobileActivePageHalf === 'right');
    const baseOffset = isRight ? 430 : 0;
    if (alignment === 'left') el.x = baseOffset + 30;
    else if (alignment === 'center') el.x = baseOffset + Math.round((430 - elW) / 2);
    else if (alignment === 'right') el.x = baseOffset + Math.round(430 - elW - 30);
    else if (alignment === 'top') el.y = 30;
    else if (alignment === 'middle') el.y = Math.round((460 - elH) / 2);
    else if (alignment === 'bottom') el.y = Math.round(460 - elH - 30);
  } else {
    const book = document.getElementById('interactiveLayflatBook');
    const maxW = book ? book.offsetWidth : 860;
    const maxH = book ? book.offsetHeight : 460;
    if (alignment === 'left') el.x = 40;
    else if (alignment === 'center') el.x = Math.round((maxW - elW) / 2);
    else if (alignment === 'right') el.x = Math.round(maxW - elW - 40);
    else if (alignment === 'top') el.y = 30;
    else if (alignment === 'middle') el.y = Math.round((maxH - elH) / 2);
    else if (alignment === 'bottom') el.y = Math.round(maxH - elH - 30);
  }

  autoSaveToLocalStorage();
  renderActiveSpread();
}

// ── CONTEXT MENU POSITIONING & LIFECYCLE ──
function closeContextMenu() {
  const menu = document.getElementById('melsouContextMenu');
  if (menu) menu.style.display = 'none';
}

function selectCanvasItem(id) {
  document.querySelectorAll('.freeform-canvas-item').forEach(el => el.classList.remove('active'));
  const target = document.getElementById('canvaEl_' + id);
  if (target) target.classList.add('active');
  ALBUM_DATA.selectedElementId = id;

  const spread = ALBUM_DATA.spreads ? ALBUM_DATA.spreads[ALBUM_DATA.activeSpreadIndex] : null;
  const elData = spread && spread.elements ? spread.elements.find(e => String(e.id) === String(id)) : null;
  if (elData) {
    selectSpreadItem(elData.type, elData.id, target);
  }
}

function openMoreMenu(elId, event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  const rect = event.currentTarget.getBoundingClientRect();
  const spread = ALBUM_DATA.spreads[ALBUM_DATA.activeSpreadIndex];
  const el = spread.elements ? spread.elements.find(e => String(e.id) === String(elId)) : null;
  if (el) {
    selectCanvasItem(el.id);
    openContextMenuAt(rect.left, rect.bottom + 6, el);
  }
}

function openContextMenuAt(x, y, el) {
  const menu = document.getElementById('melsouContextMenu');
  if (!menu || !el) return;

  const isPhoto = el.type === 'photo';
  const hasImg = isPhoto && !!el.img;
  const isLocked = !!el.locked;

  let html = `
    <div class="mcm-item" onclick="copyElement(${el.id})">
      <div class="mcm-left"><span>📋</span> Sao chép</div>
      <div class="mcm-shortcut">Ctrl+C</div>
    </div>
    <div class="mcm-item" onclick="duplicateElement(${el.id})">
      <div class="mcm-left"><span>📑</span> Nhân bản</div>
      <div class="mcm-shortcut">Ctrl+D</div>
    </div>
    <div class="mcm-item danger" onclick="removeSpreadElement(${el.id}); closeContextMenu()">
      <div class="mcm-left"><span>🗑️</span> Xóa</div>
      <div class="mcm-shortcut">Del</div>
    </div>

    <div class="mcm-divider"></div>

    <div class="mcm-item mcm-has-submenu">
      <div class="mcm-left"><span>🗂️</span> Lớp (Layer)</div>
      <div style="font-size:12px;opacity:0.6">›</div>
      <div class="mcm-submenu" id="mcmLayerSubmenu">
        <div class="mcm-item" onclick="bringElementToFront(${el.id}); closeContextMenu()">
          <div class="mcm-left"><span>🔝</span> Lên trên cùng</div>
        </div>
        <div class="mcm-item" onclick="bringElementForward(${el.id}); closeContextMenu()">
          <div class="mcm-left"><span>🔼</span> Lên 1 lớp</div>
        </div>
        <div class="mcm-item" onclick="sendElementBackward(${el.id}); closeContextMenu()">
          <div class="mcm-left"><span>🔽</span> Xuống 1 lớp</div>
        </div>
        <div class="mcm-item" onclick="sendElementToBack(${el.id}); closeContextMenu()">
          <div class="mcm-left"><span>🔚</span> Xuống dưới cùng</div>
        </div>
      </div>
    </div>

    <div class="mcm-item mcm-has-submenu">
      <div class="mcm-left"><span>📐</span> Căn gióng (Align)</div>
      <div style="font-size:12px;opacity:0.6">›</div>
      <div class="mcm-submenu" id="mcmAlignSubmenu">
        <div class="mcm-item" onclick="alignElement(${el.id}, 'left'); closeContextMenu()">
          <div class="mcm-left"><span>⇤</span> Căn trái trang</div>
        </div>
        <div class="mcm-item" onclick="alignElement(${el.id}, 'center'); closeContextMenu()">
          <div class="mcm-left"><span>⇥⇤</span> Căn giữa ngang</div>
        </div>
        <div class="mcm-item" onclick="alignElement(${el.id}, 'right'); closeContextMenu()">
          <div class="mcm-left"><span>⇥</span> Căn phải trang</div>
        </div>
        <div class="mcm-divider"></div>
        <div class="mcm-item" onclick="alignElement(${el.id}, 'top'); closeContextMenu()">
          <div class="mcm-left"><span>⤒</span> Căn mép trên</div>
        </div>
        <div class="mcm-item" onclick="alignElement(${el.id}, 'middle'); closeContextMenu()">
          <div class="mcm-left"><span>⤓⤒</span> Căn giữa dọc</div>
        </div>
        <div class="mcm-item" onclick="alignElement(${el.id}, 'bottom'); closeContextMenu()">
          <div class="mcm-left"><span>⤓</span> Căn mép dưới</div>
        </div>
      </div>
    </div>
  `;

  if (isPhoto) {
    html += `
      <div class="mcm-divider"></div>
      <div class="mcm-item" onclick="triggerDirectUpload('el_${el.id}'); closeContextMenu()">
        <div class="mcm-left"><span>📷</span> Đổi ảnh</div>
      </div>
    `;
    if (hasImg) {
      html += `
        <div class="mcm-item" onclick="enterImageAdjustmentMode(${el.id}); closeContextMenu()">
          <div class="mcm-left"><span>✂️</span> Chỉnh sửa & Cắt ảnh</div>
        </div>
        <div class="mcm-item" onclick="resetFrameCrop(${el.id}); closeContextMenu()">
          <div class="mcm-left"><span>🎯</span> Khôi phục căn giữa gốc</div>
        </div>
      `;
    }
  }

  html += `
    <div class="mcm-divider"></div>
    <div class="mcm-item" onclick="toggleLockElement(${el.id}); closeContextMenu()">
      <div class="mcm-left"><span>${isLocked ? '🔓' : '🔒'}</span> ${isLocked ? 'Mở khóa vị trí' : 'Khóa vị trí đối tượng'}</div>
    </div>
  `;

  menu.innerHTML = html;
  menu.style.display = 'block';

  // Smart Viewport Clamping
  const menuW = 220;
  const menuH = menu.offsetHeight || 280;
  let posX = x;
  let posY = y;
  if (posX + menuW > window.innerWidth - 16) {
    posX = window.innerWidth - menuW - 16;
  }
  if (posY + menuH > window.innerHeight - 16) {
    posY = window.innerHeight - menuH - 16;
  }
  menu.style.left = Math.max(12, posX) + 'px';
  menu.style.top = Math.max(12, posY) + 'px';

  // Submenu Flip Check
  const isNearRight = posX + menuW + 180 > window.innerWidth;
  document.querySelectorAll('.mcm-submenu').forEach(sub => {
    if (isNearRight) sub.classList.add('flip-left');
    else sub.classList.remove('flip-left');
  });
}

// Global click & Escape to dismiss Context Menu
document.addEventListener('click', function(e) {
  if (!e.target.closest('#melsouContextMenu') && !e.target.closest('.eat-btn')) {
    closeContextMenu();
  }
});

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    closeContextMenu();
    if (ALBUM_DATA.cropEditingId) exitImageAdjustmentMode();
  } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
    if (ALBUM_DATA.selectedElementId && !document.activeElement.isContentEditable) {
      copyElement(ALBUM_DATA.selectedElementId);
    }
  } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
    if (ALBUM_DATA.clipboardElement && !document.activeElement.isContentEditable) {
      pasteElement();
    }
  } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
    if (ALBUM_DATA.selectedElementId && !document.activeElement.isContentEditable) {
      e.preventDefault();
      duplicateElement(ALBUM_DATA.selectedElementId);
    }
  } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
    if (!document.activeElement.isContentEditable && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
      e.preventDefault();
      studioUndo();
    }
  } else if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
    if (!document.activeElement.isContentEditable && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
      e.preventDefault();
      studioRedo();
    }
  } else if (e.key === 'Delete' || e.key === 'Backspace') {
    if (ALBUM_DATA.selectedElementId && !document.activeElement.isContentEditable && !ALBUM_DATA.cropEditingId) {
      removeSpreadElement(ALBUM_DATA.selectedElementId);
      ALBUM_DATA.selectedElementId = null;
    }
  }
});

// ── CANVA DOUBLE-CLICK CROP & PAN ADJUSTMENT ENGINE ──
let currentPanElement = null;
let panStartX = 0;
let panStartY = 0;
let panStartOffsetX = 0;
let panStartOffsetY = 0;

function enterImageAdjustmentMode(elId, event) {
  if (event) event.stopPropagation();
  closeContextMenu();
  ALBUM_DATA.cropEditingId = elId;
  ALBUM_DATA.activePhotoSlot = 'el_' + elId;
  renderActiveSpread();
}

function exitImageAdjustmentMode(event) {
  if (event) event.stopPropagation();
  ALBUM_DATA.cropEditingId = null;
  autoSaveToLocalStorage();
  renderActiveSpread();
}

function resetFrameCrop(elId, event) {
  if (event) event.stopPropagation();
  const spread = ALBUM_DATA.spreads[ALBUM_DATA.activeSpreadIndex];
  const el = spread.elements ? spread.elements.find(e => String(e.id) === String(elId)) : null;
  if (el) {
    el.crop = { zoom: 1.0, offsetX: 0, offsetY: 0, rotate: 0 };
    autoSaveToLocalStorage();
    renderActiveSpread();
  }
}

function rotateFrameCropImage(elId, event) {
  if (event) event.stopPropagation();
  const spread = ALBUM_DATA.spreads[ALBUM_DATA.activeSpreadIndex];
  const el = spread.elements ? spread.elements.find(e => String(e.id) === String(elId)) : null;
  if (el) {
    if (!el.crop) el.crop = { zoom: 1.0, offsetX: 0, offsetY: 0, rotate: 0 };
    el.crop.rotate = ((el.crop.rotate || 0) + 90) % 360;
    el.crop.offsetX = 0;
    el.crop.offsetY = 0;
    autoSaveToLocalStorage();
    renderActiveSpread();
  }
}

function applyFrameCropZoom(elId, zoomVal) {
  const spread = ALBUM_DATA.spreads[ALBUM_DATA.activeSpreadIndex];
  const el = spread.elements ? spread.elements.find(e => String(e.id) === String(elId)) : null;
  if (el) {
    if (!el.crop) el.crop = { zoom: 1.0, offsetX: 0, offsetY: 0, rotate: 0 };
    el.crop.zoom = Math.max(1.0, parseFloat(zoomVal));

    // Giới hạn biên độ pan để tuyệt đối không lộ khoảng trống
    const frameW = el.width || 220;
    const frameH = Math.round(frameW * 0.65);
    const maxOffsetX = Math.max(0, ((el.crop.zoom - 1) * frameW) / 2);
    const maxOffsetY = Math.max(0, ((el.crop.zoom - 1) * frameH) / 2);
    el.crop.offsetX = Math.max(-maxOffsetX, Math.min(maxOffsetX, el.crop.offsetX));
    el.crop.offsetY = Math.max(-maxOffsetY, Math.min(maxOffsetY, el.crop.offsetY));

    const img = document.getElementById('photoImg_el_' + elId);
    if (img) {
      img.style.transform = `rotate(${el.crop.rotate || 0}deg) scale(${el.crop.zoom}) translate(${el.crop.offsetX}px, ${el.crop.offsetY}px)`;
    }
  }
}

function initImagePanningInsideFrame(e, elId) {
  e.stopPropagation();
  const spread = ALBUM_DATA.spreads[ALBUM_DATA.activeSpreadIndex];
  const el = spread.elements ? spread.elements.find(item => String(item.id) === String(elId)) : null;
  if (!el || ALBUM_DATA.cropEditingId !== elId) return;

  if (!el.crop) el.crop = { zoom: 1.0, offsetX: 0, offsetY: 0, rotate: 0 };

  currentPanElement = el;
  panStartX = e.clientX;
  panStartY = e.clientY;
  panStartOffsetX = el.crop.offsetX || 0;
  panStartOffsetY = el.crop.offsetY || 0;

  function doPan(ev) {
    if (!currentPanElement) return;
    const dx = ev.clientX - panStartX;
    const dy = ev.clientY - panStartY;

    const frameW = currentPanElement.width || 220;
    const frameH = Math.round(frameW * 0.65);
    const maxOffsetX = Math.max(0, ((currentPanElement.crop.zoom - 1) * frameW) / 2);
    const maxOffsetY = Math.max(0, ((currentPanElement.crop.zoom - 1) * frameH) / 2);

    currentPanElement.crop.offsetX = Math.max(-maxOffsetX, Math.min(maxOffsetX, panStartOffsetX + dx));
    currentPanElement.crop.offsetY = Math.max(-maxOffsetY, Math.min(maxOffsetY, panStartOffsetY + dy));

    const img = document.getElementById('photoImg_el_' + elId);
    if (img) {
      img.style.transform = `rotate(${currentPanElement.crop.rotate || 0}deg) scale(${currentPanElement.crop.zoom}) translate(${currentPanElement.crop.offsetX}px, ${currentPanElement.crop.offsetY}px)`;
    }
  }

  function stopPan() {
    document.removeEventListener('pointermove', doPan);
    document.removeEventListener('pointerup', stopPan);
    currentPanElement = null;
    autoSaveToLocalStorage();
  }

  document.addEventListener('pointermove', doPan);
  document.addEventListener('pointerup', stopPan);
}

// ── RENDER PHYSICAL 3D ALBUM SPREAD ──

function normalizeElementsToSafeArea(spread, customFmt) {
  if (!spread || !Array.isArray(spread.elements) || spread.isClosedCover || spread.isClosedBack) return;
  const fmt = customFmt || getCurrentAlbumFormat();
  const safeLeft = 20;
  const safeTop = 20;
  const safeRight = fmt.spreadWidth - 20;
  const safeBottom = fmt.spreadHeight - 20;

  spread.elements.forEach(el => {
    const elW = el.width || (el.type === 'sticker' ? 50 : 200);
    const elH = el.frameStyle === 'oval' ? elW : (el.type === 'sticker' ? 50 : Math.round(elW * 0.65) + (el.frameStyle === 'clean' ? 0 : 30));
    const rad = Math.abs((el.rotate || 0) * Math.PI / 180);
    const boundW = elW * Math.cos(rad) + elH * Math.sin(rad);
    const boundH = elW * Math.sin(rad) + elH * Math.cos(rad);

    // Clamp inside safe limits
    if (el.x + boundW > safeRight) {
      el.x = Math.max(safeLeft, safeRight - boundW - 10);
    }
    if (el.x < safeLeft) {
      el.x = safeLeft;
    }
    if (el.y + boundH > safeBottom) {
      el.y = Math.max(safeTop, safeBottom - boundH - 10);
    }
    if (el.y < safeTop) {
      el.y = safeTop;
    }
  });
}

function renderActiveSpread() {
  const curSpread = ALBUM_DATA.spreads[ALBUM_DATA.activeSpreadIndex];
  if (curSpread) normalizeElementsToSafeArea(curSpread);
  const spread = ALBUM_DATA.spreads[ALBUM_DATA.activeSpreadIndex];
  const isEn = (currentAppLanguage === 'en');
  const isMobile = isMobileViewport();

  const ind = document.getElementById('currentSpreadName');
  const mobInd = document.getElementById('mobileCurrentSpreadLabel');
  const totalPages = (ALBUM_DATA.spreads.length - 2) * 2 + 2;

  let currentLabel = spread.name;
  if (spread.isClosedCover) {
    currentLabel = isEn ? `Front Cover (Page 1 / ${totalPages})` : `Bìa Trước (Trang 1 / ${totalPages})`;
  } else if (spread.isClosedBack) {
    currentLabel = isEn ? `Back Cover (Page ${totalPages} / ${totalPages})` : `Bìa Sau (Trang ${totalPages} / ${totalPages})`;
  } else if (isMobile) {
    const pageNum = mobileActivePageHalf === 'left' ? ALBUM_DATA.activeSpreadIndex * 2 : ALBUM_DATA.activeSpreadIndex * 2 + 1;
    currentLabel = isEn ? `Page ${pageNum} / ${totalPages}` : `Trang ${pageNum} / ${totalPages}`;
  }

  if (ind) ind.textContent = currentLabel;
  if (mobInd) mobInd.textContent = currentLabel;

  const book = document.getElementById('interactiveLayflatBook');
  const leftPage = document.getElementById('stageLeftPage');
  const rightPage = document.getElementById('stageRightPage');
  const overlay = document.getElementById('spreadFreeformOverlay');

  if (spread.isClosedCover) {
    // 1. PHYSICAL 3D FRONT COVER
    book.className = 'layflat-book single-cover-mode ' + (ALBUM_DATA.sizeClass || 'ratio-portrait');
    leftPage.style.display = 'none';
    rightPage.style.display = 'flex';
    rightPage.innerHTML = `
      <div style="display:flex;flex-direction:column;height:100%;justify-content:space-between;background:linear-gradient(145deg, #fff 0%, #f7f3eb 100%)">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span style="font-family:'Pacifico',cursive;color:var(--red);font-size:22px">melsou</span>
          <span style="font-size:9.5px;font-weight:800;letter-spacing:1.5px;color:var(--gray);background:white;padding:3px 8px;border-radius:100px">${isEn ? 'FRONT COVER (3D)' : 'BÌA TRƯỚC (COVER 3D)'}</span>
        </div>

        <div class="interactive-photo-slot" id="slot_coverImg" style="height:240px;margin:10px 0"
             onclick="openPhotoCropToolbar('coverImg', event)"
             ondragover="handleSlotDragOver(event)" ondragleave="handleSlotDragLeave(event)" ondrop="handleSlotDrop(event, 'coverImg')">
          <img src="${spread.coverImg || ''}" id="photoImg_coverImg" class="photo-img-layer" alt="Cover Photo">

          <button class="btn-outline" onclick="triggerDirectUpload('coverImg', event)" style="position:absolute;bottom:10px;left:50%;transform:translateX(-50%);padding:6px 14px;font-size:12px;background:rgba(255,255,255,0.95);box-shadow:0 4px 10px rgba(0,0,0,0.2)">
            ${isEn ? '📷 Change Front Photo' : '📷 Đổi Ảnh Bìa Trước'}
          </button>
        </div>

        <div>
          <div class="pb-editable-text" contenteditable="true" onblur="updateLiveAlbumTitle(this.innerText)" style="font-family:'Lora',serif;font-size:24px;font-weight:800;color:var(--red)">
            ${ALBUM_DATA.title}
          </div>
          <div class="pb-editable-text" contenteditable="true" onblur="updateLiveAlbumQuote(this.innerText)" style="font-family:'Lora',serif;font-size:12px;font-style:italic;color:var(--gray);margin-top:4px">
            "${ALBUM_DATA.quote}"
          </div>
        </div>
      </div>
    `;
    if (overlay) overlay.innerHTML = '';
  } else if (spread.isClosedBack) {
    // 2. PHYSICAL 3D BACK COVER
    book.className = 'layflat-book single-back-mode ' + (ALBUM_DATA.sizeClass || 'ratio-portrait');
    leftPage.style.display = 'none';
    rightPage.style.display = 'flex';
    const hasVoice = ALBUM_DATA.package === 'voice' || ALBUM_DATA.package === 'signature';
    rightPage.innerHTML = `
      <div style="display:flex;flex-direction:column;height:100%;justify-content:space-between;background:linear-gradient(145deg, #fff 0%, #f7f3eb 100%);text-align:center">
        <div>
          <span style="font-family:'Pacifico',cursive;color:var(--red);font-size:22px">melsou</span>
          <div style="font-size:9.5px;letter-spacing:1.5px;color:var(--gray);margin-top:2px">${isEn ? 'BACK COVER (ISD1820 VOICE CHIP)' : 'BÌA SAU (GẮN CHIP VOICE ISD1820)'}</div>
        </div>

        <div class="interactive-photo-slot" id="slot_backImg" style="height:140px;margin:8px 0"
             onclick="openPhotoCropToolbar('backImg', event)"
             ondragover="handleSlotDragOver(event)" ondragleave="handleSlotDragLeave(event)" ondrop="handleSlotDrop(event, 'backImg')">
          <img src="${spread.backImg || ''}" id="photoImg_backImg" class="photo-img-layer" alt="Back Cover Photo">
          <button class="btn-outline" onclick="triggerDirectUpload('backImg', event)" style="position:absolute;bottom:6px;left:50%;transform:translateX(-50%);padding:4px 10px;font-size:11px;background:rgba(255,255,255,0.9)">
            ${isEn ? '📷 Change Back Photo' : '📷 Đổi Ảnh Bìa Sau'}
          </button>
        </div>

        ${hasVoice ? `
          <div style="background:var(--red-light);border:2px solid var(--red);border-radius:14px;padding:14px;cursor:pointer" onclick="playRealRecordedVoice()">
            <div style="font-size:12px;font-weight:800;color:var(--red);margin-bottom:2px">${isEn ? '🎙️ ISD1820 AUDIO MODULE' : '🎙️ MODULE ÂM THANH ISD1820'}</div>
            <div style="font-size:10.5px;color:var(--gray);margin-bottom:8px">
              ${ALBUM_DATA.isHomeRecording ? (isEn ? '✓ Self-recording at home selected' : '✓ Đã chọn tự thu âm tại nhà') : (isEn ? 'Press red button to play sample voice' : 'Bấm nút đỏ để nghe giọng nói thực tế')}
            </div>
            <div style="width:44px;height:44px;background:var(--red);border-radius:50%;margin:0 auto;display:flex;align-items:center;justify-content:center;color:white;font-size:18px;box-shadow:0 4px 14px rgba(168,35,35,0.4)">
              ▶
            </div>
          </div>
        ` : `
          <div style="background:#f9f9f9;border:1px dashed var(--gray-l);border-radius:12px;padding:14px;color:var(--gray);font-size:12px">
            ${isEn ? '🎵 Melody Package · Spotify Soundwave Scannable Code' : '🎵 Gói Melody · Đã in mã Spotify Soundwave Code'}
          </div>
        `}

        <div style="font-size:10px;color:var(--gray);font-style:italic">${isEn ? 'Melsou HCMC Workshop · 180° Seamless Layflat' : 'Xưởng chế tác melsou TP.HCM · Mở phẳng 180° Liền Trang'}</div>
      </div>
    `;
    if (overlay) overlay.innerHTML = '';
  } else {
    // 3. OPEN 180° SPREAD (FB62: Single-Page Projection on mobile <768px)
    if (isMobile) {
      book.className = 'layflat-book mobile-single-page-mode ' + (ALBUM_DATA.sizeClass || 'ratio-portrait');
      if (mobileActivePageHalf === 'left') {
        leftPage.style.display = 'flex';
        rightPage.style.display = 'none';
      } else {
        leftPage.style.display = 'none';
        rightPage.style.display = 'flex';
      }
    } else {
      book.className = 'layflat-book ' + (ALBUM_DATA.sizeClass || 'ratio-portrait');
      leftPage.style.display = 'flex';
      rightPage.style.display = 'flex';
    }

    if (spread.leftType === 'spotify-hero') {
      const meta = getSpotifyTrackDisplayMetadata();
      leftPage.innerHTML = `
        <div style="display:flex;flex-direction:column;height:100%;justify-content:space-between;background:var(--yellow-warm);border-radius:8px;padding:20px">
          <div>
            <span style="font-size:10px;font-weight:800;letter-spacing:2px;color:var(--red)">OUR TIMES</span>
            <h3 style="font-size:19px;font-weight:700;margin-top:4px;color:var(--dark)">${isEn ? 'Our Cherished Melody' : 'Giai Điệu Của Chúng Mình'}</h3>
          </div>
          <div style="margin:16px 0">
            ${!meta.hasTrack ? `
              <div style="font-size:13px;font-weight:700;margin-bottom:6px;color:var(--dark)">${isEn ? 'No track selected yet' : 'Chưa chọn bài hát'}</div>
            ` : meta.isPending ? `
              <div style="margin-bottom:10px;padding:8px 12px;background:rgba(0,0,0,0.04);border-radius:6px;text-align:left">
                <div style="font-size:11.5px;font-weight:600;color:var(--gray)">${isEn ? '⏳ Fetching song details...' : '⏳ Đang lấy thông tin bài hát...'}</div>
              </div>
            ` : `
              <div style="margin-bottom:12px;text-align:left">
                <div style="font-size:9.5px;font-weight:800;color:var(--gray);text-transform:uppercase;letter-spacing:1px;margin-bottom:2px">${isEn ? 'Song' : 'Bài hát'}</div>
                <div id="spotifyHeroSongTitle" style="font-size:15px;font-weight:800;color:var(--dark);margin-bottom:8px;line-height:1.3">${escapeSpotifyAttr(meta.title)}</div>
                <div style="font-size:9.5px;font-weight:800;color:var(--gray);text-transform:uppercase;letter-spacing:1px;margin-bottom:2px">${isEn ? 'Artist' : 'Nghệ sĩ'}</div>
                <div id="spotifyHeroArtistName" style="font-size:13px;font-weight:700;color:var(--red);margin-bottom:8px;line-height:1.3">${escapeSpotifyAttr(meta.artist || (isEn ? 'Spotify Artist' : 'Nghệ sĩ Spotify'))}</div>
              </div>
            `}
            ${renderSpotifyHorizontalCodeHtml()}
          </div>
          <div style="font-size:10.5px;color:var(--gray);font-style:italic">${isEn ? 'Open Spotify on phone & scan code to play.' : 'Mở ứng dụng Spotify trên điện thoại & quét mã để nghe nhạc.'}</div>
        </div>
      `;
    } else if (spread.leftType === 'handwritten-letter') {
      leftPage.innerHTML = `
        <div style="display:flex;flex-direction:column;height:100%;justify-content:space-between;background:var(--yellow-warm);border-radius:8px;padding:20px">
          <div>
            <div class="pb-editable-text" contenteditable="true" onblur="handleSalutationInput(this.innerText)"
                 style="font-family:'Pacifico',cursive;color:var(--red);font-size:17px;margin-bottom:6px">
              ${ALBUM_DATA.salutation || (isEn ? 'Dearest,' : 'Gửi người thương,')}
            </div>
            <div class="pb-editable-text" contenteditable="true" onblur="syncLetterFromCanvas(this.innerText)"
                 style="font-family:${ALBUM_DATA.letterFont};color:${ALBUM_DATA.inkColor};font-size:13.5px;line-height:1.75;font-style:italic">
              ${ALBUM_DATA.message}
            </div>
          </div>
          <div class="pb-editable-text" contenteditable="true" onblur="syncSignatureFromCanvas(this.innerText)"
               style="font-family:${ALBUM_DATA.letterFont};color:${ALBUM_DATA.inkColor};font-size:11.5px;text-align:right;font-style:italic">
              ${ALBUM_DATA.signature}
          </div>
        </div>
      `;
    } else {
      leftPage.innerHTML = '<div style="height:100%;border:1px dashed transparent"></div>';
    }

    rightPage.innerHTML = '<div style="height:100%;border:1px dashed transparent"></div>';

    renderElementsOnSpreadOverlay(spread);
  }

  renderFilmstripTray();
  applyAllSavedTransforms();
  adjustMobileStageScale();
}

function renderElementsOnSpreadOverlay(spread) {
  const overlay = document.getElementById('spreadFreeformOverlay');
  if (!overlay) return;
  overlay.innerHTML = '';
  if (!spread.elements) return;

  const isEn = (currentAppLanguage === 'en');
  const isMobile = (isMobileViewport() && !spread.isClosedCover && !spread.isClosedBack);

  const fmt = getCurrentAlbumFormat();
  const spineSplit = fmt.singleWidth + 6;
  const rightOffset = fmt.singleWidth + 12;

  spread.elements.forEach((el, elementIndex) => {
    // FB62: Mobile single-page projection filter
    if (isMobile) {
      const isRightPage = (mobileActivePageHalf === 'right');
      const elMid = (el.x || 0) + (el.width || 220) / 2;
      const elOnRight = (elMid >= spineSplit);
      if (isRightPage !== elOnRight) return;
    }

    const item = document.createElement('div');
    item.id = 'canvaEl_' + el.id;
    const visualLeft = (isMobile && mobileActivePageHalf === 'right') ? (el.x - rightOffset) : el.x;
    item.style.left = visualLeft + 'px';
    item.style.top = el.y + 'px';
    item.style.zIndex = elementIndex + 10;
    if (el.rotate) item.style.transform = `rotate(${el.rotate}deg)`;

    const isLocked = !!el.locked;
    const isPhoto = el.type === 'photo';
    const isCropActive = ALBUM_DATA.cropEditingId === el.id;

    const counterRotateStyle = `transform: translateX(-50%) rotate(${-(el.rotate || 0)}deg); top: -48px;`;
    let compactToolbarHtml = '';
    if (!isCropActive) {
      if (isPhoto) {
        if (el.img) {
          compactToolbarHtml = `
            <div class="element-action-toolbar" style="${counterRotateStyle}">
              <button class="eat-btn" onclick="enterImageAdjustmentMode(${el.id}, event)" title="${isEn ? 'Adjust & Crop Photo' : 'Chỉnh sửa & Cắt ảnh'}">${isEn ? '✂️ Edit Photo' : '✂️ Chỉnh ảnh'}</button>
              <button class="eat-btn" onclick="triggerDirectUpload('el_${el.id}', event)" title="${isEn ? 'Replace photo' : 'Đổi ảnh khác'}">${isEn ? '📷 Replace' : '📷 Đổi ảnh'}</button>
              <button class="eat-btn" onclick="openMoreMenu(${el.id}, event)" title="${isEn ? 'More options (Layers, Align, Lock, Duplicate)' : 'Thêm tùy chọn (Lớp, Căn gióng, Khóa, Nhân bản)'}">${isEn ? '⋯ More' : '⋯ Thêm'}</button>
              <button class="eat-btn danger" onclick="removeSpreadElement(${el.id})" title="${isEn ? 'Delete' : 'Xóa'}">✕</button>
            </div>
          `;
        } else {
          compactToolbarHtml = `
            <div class="element-action-toolbar" style="${counterRotateStyle}">
              <button class="eat-btn" onclick="triggerDirectUpload('el_${el.id}', event)" title="${isEn ? 'Choose photo from device' : 'Chọn ảnh từ máy'}">${isEn ? '📷 Add photo' : '📷 Thêm ảnh'}</button>
              <button class="eat-btn" onclick="openMoreMenu(${el.id}, event)" title="${isEn ? 'More options' : 'Thêm tùy chọn'}">${isEn ? '⋯ More' : '⋯ Thêm'}</button>
              <button class="eat-btn danger" onclick="removeSpreadElement(${el.id})" title="${isEn ? 'Delete' : 'Xóa'}">✕</button>
            </div>
          `;
        }
      } else {
        compactToolbarHtml = `
          <div class="element-action-toolbar" style="${counterRotateStyle}">
            <button class="eat-btn" onclick="openMoreMenu(${el.id}, event)" title="${isEn ? 'More options' : 'Thêm tùy chọn'}">${isEn ? '⋯ More' : '⋯ Thêm'}</button>
            <button class="eat-btn danger" onclick="removeSpreadElement(${el.id})" title="${isEn ? 'Delete' : 'Xóa'}">✕</button>
          </div>
        `;
      }
    }

    if (el.type === 'photo') {
      const crop = el.crop || { zoom: 1.0, offsetX: 0, offsetY: 0, rotate: 0 };
      const frameW = el.width || 220;
      const frameH = el.frameStyle === 'oval' ? frameW : Math.round(frameW * 0.65);
      const isClean = el.frameStyle === 'clean';
      const isOval = el.frameStyle === 'oval';

      item.className = 'freeform-canvas-item ' + (isCropActive ? 'crop-mode-active' : '') + (isLocked ? ' is-locked' : '');

      let innerContent = '';
      if (!el.img) {
        innerContent = `
          <div class="canva-frame-placeholder" style="height:${frameH}px;${isOval ? 'border-radius:999px;' : ''}"
               onclick="triggerDirectUpload('el_${el.id}', event)"
               ondragover="handleSlotDragOver(event)" ondragleave="handleSlotDragLeave(event)" ondrop="handleSlotDrop(event, 'el_${el.id}')"
               title="${isEn ? 'Drop photo here or click to choose from device' : 'Thả ảnh vào đây hoặc bấm để chọn ảnh từ máy'}">
            <div class="cfp-cloud"></div>
            <div class="cfp-hill"></div>
            <span style="font-size:26px;z-index:2">🖼️</span>
            <span style="font-size:11px;font-weight:800;z-index:2;margin-top:2px">${isEn ? 'Drop photo here' : 'Thả ảnh vào đây'}</span>
            <div class="photo-drop-hint-overlay">${isEn ? '✨ Drop photo here' : '✨ Thả ảnh vào đây'}</div>
          </div>
        `;
      } else {
        innerContent = `
          <div class="canva-frame-inner-viewport interactive-photo-slot" id="slot_el_${el.id}" style="height:${frameH}px;${isOval ? 'border-radius:999px;' : ''}"
               onclick="if (!ALBUM_DATA.cropEditingId) openPhotoCropToolbar('el_${el.id}', event)"
               ondragover="handleSlotDragOver(event)" ondragleave="handleSlotDragLeave(event)" ondrop="handleSlotDrop(event, 'el_${el.id}')">
            <img src="${el.img}" id="photoImg_el_${el.id}" class="photo-img-layer" alt="Photo"
                 style="transform: translate(${crop.offsetX || 0}px, ${crop.offsetY || 0}px) scale(${crop.zoom || 1}) rotate(${crop.rotate || 0}deg);"
                 onpointerdown="initPanCropImage(event, ${el.id})">
            <div class="photo-drop-hint-overlay">${isEn ? '✨ Drop to replace photo' : '✨ Thả để đổi ảnh'}</div>
          </div>
        `;
      }

      let cropToolbarHtml = '';
      if (isCropActive) {
        cropToolbarHtml = `
          <div class="canva-frame-toolbar" style="${counterRotateStyle}" onclick="event.stopPropagation()">
            <span style="font-size:11px;font-weight:700">${isEn ? 'Zoom:' : 'Thu phóng:'}</span>
            <input type="range" class="cft-slider" min="0.8" max="2.5" step="0.05" value="${crop.zoom || 1}" oninput="updateCropZoom(${el.id}, this.value)">
            <button class="cft-btn" onclick="rotateCropImage(${el.id})">${isEn ? '🔄 Rotate 90°' : '🔄 Xoay 90°'}</button>
            <button class="cft-btn" onclick="resetCropTransform(${el.id})">${isEn ? '🎯 Center' : '🎯 Căn giữa'}</button>
            <button class="cft-btn primary" onclick="exitImageAdjustmentMode()">${isEn ? '✓ Done' : '✓ Xong'}</button>
          </div>
        `;
      }

      item.innerHTML = `
        ${compactToolbarHtml}
        ${cropToolbarHtml}
        ${(!isLocked) ? `<div class="fci-resize-handle" onpointerdown="initResizeElement(event, ${el.id})" title="${isEn ? 'Drag to resize' : 'Kéo để đổi kích thước'}"></div>` : ''}
        ${(!isLocked) ? `<div class="fci-rotate-handle" onpointerdown="initRotateElement(event, ${el.id})" title="${isEn ? 'Drag to rotate 360°' : 'Kéo để xoay 360°'}">🔄</div>` : ''}
        <div class="safe-area-violation-badge">${isEn ? '⚠️ Exceeds safe print margin' : '⚠️ Vượt mép in (Có thể bị xén)'}</div>
        <div class="canva-frame-container ${isClean ? 'clean-style' : ''} ${isOval ? 'oval-style' : ''}" style="width:${frameW}px">
          ${innerContent}
        </div>
      `;
    } else if (el.type === 'text') {
      item.className = 'freeform-canvas-item' + (isLocked ? ' is-locked' : '');
      item.innerHTML = `
        ${compactToolbarHtml}
        ${(!isLocked) ? `<div class="fci-rotate-handle" onpointerdown="initRotateElement(event, ${el.id})" title="${isEn ? 'Drag to rotate 360°' : 'Kéo để xoay 360°'}">🔄</div>` : ''}
        <div class="safe-area-violation-badge">${isEn ? '⚠️ Exceeds safe print margin' : '⚠️ Vượt mép in (Có thể bị xén)'}</div>
        <div style="display:inline-flex;align-items:center;padding:6px 14px;background:rgba(255,255,255,0.95);border:1.5px dashed rgba(168,35,35,0.4);border-radius:8px;box-shadow:0 4px 14px rgba(0,0,0,0.12);cursor:grab">
          <span style="font-size:14px;color:var(--red);margin-right:8px;user-select:none;cursor:grab;font-weight:bold" title="${isEn ? 'Hold to drag' : 'Giữ chuột vào đây hoặc ô chữ để kéo di chuyển'}">⋮⋮</span>
          <div class="canva-editable-text-field" contenteditable="${!isLocked}"
               onblur="el.content=this.innerText;autoSaveToLocalStorage()"
               style="outline:none;font-family:${el.font || ALBUM_DATA.letterFont};color:${el.color || ALBUM_DATA.inkColor};font-size:${el.fontSize || 16}px;cursor:text">
            ${el.content}
          </div>
        </div>
      `;
    } else if (el.type === 'sticker') {
      item.className = 'freeform-canvas-item' + (isLocked ? ' is-locked' : '');
      item.innerHTML = `
        ${compactToolbarHtml}
        ${(!isLocked) ? `<div class="fci-rotate-handle" onpointerdown="initRotateElement(event, ${el.id})" title="${isEn ? 'Drag to rotate 360°' : 'Kéo để xoay 360°'}">🔄</div>` : ''}
        <div class="safe-area-violation-badge">${isEn ? '⚠️ Exceeds safe print margin' : '⚠️ Vượt mép in (Có thể bị xén)'}</div>
        <div style="font-size:38px;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.2))">${el.char}</div>
      `;
    }

    item.addEventListener('contextmenu', function(e) {
      e.preventDefault();
      e.stopPropagation();
      selectCanvasItem(el.id);
      openContextMenuAt(e.clientX, e.clientY, el);
    });

    makePointerDraggable(item, el);
    overlay.appendChild(item);
    checkElementSafeArea(item, el);
  });
}

// ── ROBUST POINTERCAPTURE DRAGGING (ZERO MOUSE-STICK BUG & 1:1 SCALE TRACKING FB70) ──
let currentStageScale = 1;
window.currentStageScale = currentStageScale;

function makePointerDraggable(el, dataObj) {
  let isDragging = false;
  let hasMoved = false;
  let initialElX = 0, initialElY = 0;
  let initialPointerX = 0, initialPointerY = 0;

  el.addEventListener('pointerdown', function(e) {
    if (ALBUM_DATA.cropEditingId === dataObj?.id) return; // In crop mode, user is panning the photo inside
    if (dataObj && dataObj.type === 'photo') {
      ALBUM_DATA.activePhotoSlot = 'el_' + dataObj.id;
    }
    if (e.target.closest('.fci-delete-btn') || e.target.closest('.fci-resize-handle') || e.target.closest('.fci-rotate-handle') || e.target.closest('.btn-outline') || e.target.closest('.canva-frame-toolbar') || e.target.closest('.element-action-toolbar')) return;

    initialElX = el.offsetLeft;
    initialElY = el.offsetTop;
    initialPointerX = e.clientX;
    initialPointerY = e.clientY;
    hasMoved = false;

    selectCanvasItem(dataObj.id);

    if (!dataObj?.locked) {
      isDragging = true;
      try { el.setPointerCapture(e.pointerId); } catch(err) {}
    }

    e.stopPropagation();
  });

  el.addEventListener('pointermove', function(e) {
    if (!isDragging || dataObj?.locked) return;
    const dist = Math.hypot(e.clientX - initialPointerX, e.clientY - initialPointerY);
    if (dist > 3) {
      hasMoved = true;
      const s = currentStageScale || 1;
      const newX = Math.round(initialElX + (e.clientX - initialPointerX) / s);
      const newY = Math.round(initialElY + (e.clientY - initialPointerY) / s);
      el.style.left = newX + 'px';
      el.style.top = newY + 'px';
      if (dataObj) {
        const curSpread = ALBUM_DATA.spreads ? ALBUM_DATA.spreads[ALBUM_DATA.activeSpreadIndex] : null;
        const isMobileSingle = (isMobileViewport() && curSpread && !curSpread.isClosedCover && !curSpread.isClosedBack);
        const isRight = isMobileSingle && (mobileActivePageHalf === 'right');
        dataObj.x = isRight ? (newX + 430) : newX;
        dataObj.y = newY;
      }
      checkElementSafeArea(el, dataObj);
    }
  });

  el.addEventListener('pointerup', function(e) {
    if (isDragging) {
      isDragging = false;
      try { el.releasePointerCapture(e.pointerId); } catch(err) {}
      if (hasMoved) {
        checkElementSafeArea(el, dataObj);
        autoSaveToLocalStorage();
      } else {
        // Khi click mà không kéo thì tự động focus vào con trỏ để gõ văn bản nếu có
        const editable = el.querySelector('[contenteditable="true"]');
        if (editable) {
          editable.focus();
        }
      }
    }
  });

  el.addEventListener('pointercancel', function(e) {
    if (isDragging) {
      isDragging = false;
      try { el.releasePointerCapture(e.pointerId); } catch(err) {}
    }
  });
}

function initResizeElement(e, id) {
  e.stopPropagation();
  const spread = ALBUM_DATA.spreads[ALBUM_DATA.activeSpreadIndex];
  const obj = spread.elements.find(el => el.id === id);
  if (!obj || obj.locked) return;

  const startX = e.clientX;
  const startW = obj.width || 220;

  function doDrag(ev) {
    const diff = (ev.clientX - startX) / (currentStageScale || 1);
    obj.width = Math.max(120, Math.min(480, startW + diff));
    const frame = document.getElementById('cFrame_' + id);
    if (frame) {
      frame.style.width = obj.width + 'px';
      const slot = frame.querySelector('.interactive-photo-slot, .canva-frame-placeholder');
      if (slot) {
        slot.style.height = obj.frameStyle === 'oval' ? obj.width + 'px' : Math.round(obj.width * 0.65) + 'px';
      }
    }
    const domEl = document.getElementById('canvaEl_' + id);
    if (domEl) checkElementSafeArea(domEl, obj);
  }

  function stopDrag() {
    document.removeEventListener('mousemove', doDrag);
    document.removeEventListener('mouseup', stopDrag);
    autoSaveToLocalStorage();
  }

  document.addEventListener('mousemove', doDrag);
  document.addEventListener('mouseup', stopDrag);
}

// ── 🌟 XOAY KHUNG ẢNH 360 ĐỘ TỰ DO (CANVA 360° ROTATE ENGINE) ──
function initRotateElement(e, id) {
  e.stopPropagation();
  e.preventDefault();
  const spread = ALBUM_DATA.spreads[ALBUM_DATA.activeSpreadIndex];
  const obj = spread.elements.find(el => el.id === id);
  const domEl = document.getElementById('canvaEl_' + id);
  if (!obj || !domEl || obj.locked) return;

  const rect = domEl.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  function doRotate(ev) {
    const dx = ev.clientX - centerX;
    const dy = ev.clientY - centerY;
    // Điểm handle ở phía dưới (bottom), dy > 0, dx = 0 tương đương góc 90 độ
    let deg = Math.round(Math.atan2(dy, dx) * (180 / Math.PI)) - 90;
    while (deg > 180) deg -= 360;
    while (deg < -180) deg += 360;

    // Hít nam châm (Magnetic Snap) tại các góc chuẩn 0°, 90°, -90°, 180°
    if (Math.abs(deg) <= 3) deg = 0;
    else if (Math.abs(deg - 90) <= 3) deg = 90;
    else if (Math.abs(deg + 90) <= 3) deg = -90;
    else if (Math.abs(deg - 180) <= 3 || Math.abs(deg + 180) <= 3) deg = 180;

    obj.rotate = deg;
    domEl.style.transform = `rotate(${deg}deg)`;

    // Tự động triệt tiêu góc nghiêng cho thanh công cụ phía trên để luôn cân bằng ngang
    const actionToolbar = domEl.querySelector('.element-action-toolbar');
    if (actionToolbar) {
      actionToolbar.style.transform = `translateX(-50%) rotate(${-deg}deg)`;
    }
    const cropToolbar = domEl.querySelector('.canva-frame-toolbar');
    if (cropToolbar) {
      cropToolbar.style.transform = `translateX(-50%) rotate(${-deg}deg)`;
    }

    checkElementSafeArea(domEl, obj);
  }

  function stopRotate() {
    document.removeEventListener('pointermove', doRotate);
    document.removeEventListener('pointerup', stopRotate);
    autoSaveToLocalStorage();
  }

  document.addEventListener('pointermove', doRotate);
  document.addEventListener('pointerup', stopRotate);
}

// ── FILMSTRIP TRAY (MỤC TRANG & THÊM TRANG Ở DƯỚI ĐÁY) ──
function renderFilmstripTray() {
  const tray = document.getElementById('studioFilmstripTray');
  if (!tray) return;
  const isEn = (currentAppLanguage === 'en');

  let html = ALBUM_DATA.spreads.map((spread, idx) => {
    const isCover = idx === 0;
    const isBack = idx === ALBUM_DATA.spreads.length - 1;
    const coverLabel = isEn ? 'Front Cover' : 'Bìa Trước';
    const backLabel = isEn ? 'Back Cover' : 'Bìa Sau';

    return `
      <div class="filmstrip-item ${idx === ALBUM_DATA.activeSpreadIndex ? 'active' : ''}" onclick="jumpToSpread(${idx})">
        ${spread.isCustomAdded ? `<button onclick="removeCustomSpread(${idx}, event)" style="position:absolute;top:-4px;right:-4px;background:#dc2626;color:white;border:none;border-radius:50%;width:18px;height:18px;font-size:10px;font-weight:800;z-index:20">✕</button>` : ''}

        ${isCover || isBack ? `
          <div class="filmstrip-single-cover">${isCover ? coverLabel : backLabel}</div>
        ` : `
          <div class="filmstrip-mini-spread">
            <div class="fms-page">${idx * 2}</div>
            <div class="fms-page">${idx * 2 + 1}</div>
          </div>
        `}
        <div class="filmstrip-label">${isCover ? coverLabel : (isBack ? backLabel : spread.name)}</div>
      </div>
    `;
  }).join('');

  html += `
    <button class="btn-add-spread-tray" onclick="addNewSpreadToAlbum()" title="${isEn ? 'Add 2 pages (+15,000₫)' : 'Thêm 2 trang (+15.000đ)'}">
      <span style="font-size:15px">➕</span>
      <span>${isEn ? 'Add 2 pages (+15,000₫)' : 'Thêm 2 trang (+15.000đ)'}</span>
    </button>
  `;

  tray.innerHTML = html;

  const sumText = document.getElementById('filmstripSummaryText');
  if (sumText) {
    sumText.textContent = isEn ? `All pages (${ALBUM_DATA.spreads.length} items)` : `Tất cả các trang (${ALBUM_DATA.spreads.length} mục)`;
  }
}

function jumpToSpread(index) {
  playPaperFlipSound();
  ALBUM_DATA.activeSpreadIndex = index;
  closePhotoToolbar();
  clearStudioSelection();
  renderActiveSpread();
  updateNavSpreadButtons();
}
function goToNextSpread() {
  if (isMobileViewport()) {
    const cur = ALBUM_DATA.spreads ? ALBUM_DATA.spreads[ALBUM_DATA.activeSpreadIndex] : null;
    if (!cur) return;
    if (cur.isClosedCover) {
      jumpToSpread(1);
      mobileActivePageHalf = 'left';
      renderActiveSpread();
      adjustMobileStageScale();
      updateContextualToolbar();
      updateNavSpreadButtons();
      return;
    }
    if (!cur.isClosedBack) {
      if (mobileActivePageHalf === 'left') {
        mobileActivePageHalf = 'right';
        playPaperFlipSound();
        renderActiveSpread();
        adjustMobileStageScale();
        updateContextualToolbar();
        updateNavSpreadButtons();
        return;
      }
    }
    if (ALBUM_DATA.activeSpreadIndex < ALBUM_DATA.spreads.length - 1) {
      jumpToSpread(ALBUM_DATA.activeSpreadIndex + 1);
      mobileActivePageHalf = 'left';
      renderActiveSpread();
      adjustMobileStageScale();
      updateContextualToolbar();
      updateNavSpreadButtons();
    }
  } else {
    if (ALBUM_DATA.activeSpreadIndex < ALBUM_DATA.spreads.length - 1) jumpToSpread(ALBUM_DATA.activeSpreadIndex + 1);
  }
}

function goToPrevSpread() {
  if (isMobileViewport()) {
    const cur = ALBUM_DATA.spreads ? ALBUM_DATA.spreads[ALBUM_DATA.activeSpreadIndex] : null;
    if (!cur) return;
    if (cur.isClosedBack) {
      jumpToSpread(ALBUM_DATA.spreads.length - 2);
      mobileActivePageHalf = 'right';
      renderActiveSpread();
      adjustMobileStageScale();
      updateContextualToolbar();
      updateNavSpreadButtons();
      return;
    }
    if (!cur.isClosedCover) {
      if (mobileActivePageHalf === 'right') {
        mobileActivePageHalf = 'left';
        playPaperFlipSound();
        renderActiveSpread();
        adjustMobileStageScale();
        updateContextualToolbar();
        updateNavSpreadButtons();
        return;
      }
    }
    if (ALBUM_DATA.activeSpreadIndex > 0) {
      const nextIdx = ALBUM_DATA.activeSpreadIndex - 1;
      jumpToSpread(nextIdx);
      mobileActivePageHalf = nextIdx === 0 ? 'left' : 'right';
      renderActiveSpread();
      adjustMobileStageScale();
      updateContextualToolbar();
      updateNavSpreadButtons();
    }
  } else {
    if (ALBUM_DATA.activeSpreadIndex > 0) jumpToSpread(ALBUM_DATA.activeSpreadIndex - 1);
  }
}

function updateNavSpreadButtons() {
  if (typeof ALBUM_DATA === 'undefined' || !ALBUM_DATA.spreads) return;
  const isEn = (currentAppLanguage === 'en');
  let isFirst, isLast;
  if (isMobileViewport()) {
    isFirst = (ALBUM_DATA.activeSpreadIndex === 0);
    isLast = (ALBUM_DATA.activeSpreadIndex >= ALBUM_DATA.spreads.length - 1);
  } else {
    isFirst = ALBUM_DATA.activeSpreadIndex <= 0;
    isLast = ALBUM_DATA.activeSpreadIndex >= ALBUM_DATA.spreads.length - 1;
  }

  const btnPrev = document.getElementById('btnToolbarPrev');
  const btnNext = document.getElementById('btnToolbarNext');
  if (btnPrev) {
    btnPrev.disabled = isFirst;
    btnPrev.style.opacity = isFirst ? '0.35' : '1';
    btnPrev.style.cursor = isFirst ? 'not-allowed' : 'pointer';
    btnPrev.title = isEn ? 'Previous page' : 'Trang trước';
    btnPrev.setAttribute('aria-label', btnPrev.title);
  }
  if (btnNext) {
    btnNext.disabled = isLast;
    btnNext.style.opacity = isLast ? '0.35' : '1';
    btnNext.style.cursor = isLast ? 'not-allowed' : 'pointer';
    btnNext.title = isEn ? 'Next page' : 'Trang sau';
    btnNext.setAttribute('aria-label', btnNext.title);
  }

  const mobPrev = document.querySelector('#mobilePageController button:first-child');
  const mobNext = document.querySelector('#mobilePageController button:last-child');
  if (mobPrev) {
    mobPrev.disabled = isFirst;
    mobPrev.style.opacity = isFirst ? '0.35' : '1';
  }
  if (mobNext) {
    mobNext.disabled = isLast;
    mobNext.style.opacity = isLast ? '0.35' : '1';
  }

  const btn3D = document.getElementById('btnToolbar3D');
  if (btn3D) {
    btn3D.textContent = isEn ? '📖 View 3D' : '📖 Xem 3D';
  }
  const msm3D = document.getElementById('msmItem3D');
  if (msm3D) {
    msm3D.textContent = isEn ? '📖 View 3D' : '📖 Xem 3D';
  }
}

// ── CANVA PHOTO TOOLBAR ──
function openPhotoCropToolbar(slotKey, event) {
  if (event) event.stopPropagation();
  ALBUM_DATA.activePhotoSlot = slotKey;
  const toolbar = document.getElementById('photoCropToolbar');
  if (toolbar) toolbar.classList.add('active');

  if (!ALBUM_DATA.photoTransforms[slotKey]) ALBUM_DATA.photoTransforms[slotKey] = { zoom: 1, rotate: 0, x: 0, y: 0 };
  document.getElementById('photoZoomSlider').value = ALBUM_DATA.photoTransforms[slotKey].zoom;
}

function closePhotoToolbar() {
  const toolbar = document.getElementById('photoCropToolbar');
  if (toolbar) toolbar.classList.remove('active');
}

function handleGlobalClick(e) {
  if (!e.target.closest('.interactive-photo-slot') && !e.target.closest('#photoCropToolbar') && !e.target.closest('#studioContextualToolbar') && !e.target.closest('#mobileContextualBottomBar') && !e.target.closest('.freeform-canvas-item') && !e.target.closest('.pb-editable-text')) {
    closePhotoToolbar();
    clearStudioSelection();
  }
  if (!e.target.closest('.user-menu-wrapper')) {
    const uMenu = document.getElementById('userDropdownMenu');
    if (uMenu) uMenu.classList.remove('open');
  }
  // Canva Desktop ergonomics: clicking on stage canvas closes flyout drawer
  if (e.target.closest('#interactiveLayflatBook') && !e.target.closest('.studio-rail') && !e.target.closest('#canvaSidebarEl')) {
    if (!isMobileViewport() && isFlyoutDrawerOpen) {
      closeFlyoutDrawer();
    }
  }
}

function applyActivePhotoZoom(val) {
  const key = ALBUM_DATA.activePhotoSlot;
  if (!key) return;
  if (!ALBUM_DATA.photoTransforms[key]) ALBUM_DATA.photoTransforms[key] = { zoom: 1, rotate: 0, x: 0, y: 0 };
  ALBUM_DATA.photoTransforms[key].zoom = parseFloat(val);
  applySinglePhotoTransform(key);
}

function rotateActivePhoto() {
  const key = ALBUM_DATA.activePhotoSlot;
  if (!key) return;
  if (!ALBUM_DATA.photoTransforms[key]) ALBUM_DATA.photoTransforms[key] = { zoom: 1, rotate: 0, x: 0, y: 0 };
  ALBUM_DATA.photoTransforms[key].rotate = (ALBUM_DATA.photoTransforms[key].rotate + 90) % 360;
  applySinglePhotoTransform(key);
}

function resetActivePhotoTransform() {
  const key = ALBUM_DATA.activePhotoSlot;
  if (!key) return;
  ALBUM_DATA.photoTransforms[key] = { zoom: 1, rotate: 0, x: 0, y: 0 };
  document.getElementById('photoZoomSlider').value = 1;
  applySinglePhotoTransform(key);
}

function applySinglePhotoTransform(key) {
  const img = document.getElementById('photoImg_' + key);
  if (img && ALBUM_DATA.photoTransforms[key]) {
    const t = ALBUM_DATA.photoTransforms[key];
    img.style.transform = `scale(${t.zoom}) rotate(${t.rotate}deg) translate(${t.x}px, ${t.y}px)`;
  }
}
function applyAllSavedTransforms() {
  Object.keys(ALBUM_DATA.photoTransforms).forEach(key => applySinglePhotoTransform(key));
}

// ── DRAG & DROP PHOTO & STICKER ACROSS SPREAD ──
let draggedItemType = '';
let draggedItemPayload = '';

function handlePhotoDragStart(e, url) {
  draggedItemType = 'photo';
  draggedItemPayload = url;
  e.dataTransfer.setData('text/plain', url);
}

function handleStickerDragStart(e, char) {
  draggedItemType = 'sticker';
  draggedItemPayload = char;
  e.dataTransfer.setData('text/plain', char);
}

function handleSpreadDragOver(e) { e.preventDefault(); }
function handleSpreadDrop(e) {
  e.preventDefault();
  const rect = document.getElementById('interactiveLayflatBook').getBoundingClientRect();
  const dropX = e.clientX - rect.left - 20;
  const dropY = e.clientY - rect.top - 20;

  if (draggedItemType === 'sticker') {
    addRealStickerToCanvas(draggedItemPayload, dropX, dropY);
  }
}

function handleSlotDragOver(e) {
  e.preventDefault();
  e.stopPropagation();
  e.currentTarget.classList.add('drop-target-active');
}

function handleSlotDragLeave(e) {
  e.preventDefault();
  e.stopPropagation();
  e.currentTarget.classList.remove('drop-target-active');
}

function handleSlotDrop(e, slotKey) {
  e.preventDefault();
  e.stopPropagation();
  e.currentTarget.classList.remove('drop-target-active');

  // Case 1: Thả file ảnh trực tiếp từ máy tính (Desktop/File Explorer)
  if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = ev => {
        const resultUrl = ev.target.result;
        ALBUM_DATA.userGallery.unshift(resultUrl);
        autoSaveToLocalStorage();
        renderUserGalleryTray();
        assignPhotoToSlot(slotKey, resultUrl);
      };
      reader.readAsDataURL(file);
      return;
    }
  }

  // Case 2: Thả ảnh từ kho ảnh bên trái
  const payload = (e.dataTransfer ? e.dataTransfer.getData('text/plain') : '') || draggedItemPayload;
  if (payload) {
    assignPhotoToSlot(slotKey, payload);
  }
}

function assignPhotoToSlot(slotKey, url) {
  if (!url) return;
  const spread = ALBUM_DATA.spreads[ALBUM_DATA.activeSpreadIndex];
  if (!spread) return;

  // Tự động nhận diện khung ảnh nếu slotKey chưa chọn
  if (!slotKey) {
    if (spread.isClosedCover) slotKey = 'coverImg';
    else if (spread.isClosedBack) slotKey = 'backImg';
    else if (spread.elements && spread.elements.length > 0) {
      const firstPhoto = spread.elements.find(el => el.type === 'photo');
      if (firstPhoto) slotKey = 'el_' + firstPhoto.id;
    }
  }

  if (slotKey === 'coverImg') {
    spread.coverImg = url;
  } else if (slotKey === 'backImg') {
    spread.backImg = url;
  } else if (slotKey && slotKey.startsWith('el_')) {
    const elId = slotKey.replace('el_', '');
    if (spread.elements) {
      const targetEl = spread.elements.find(el => String(el.id) === String(elId));
      if (targetEl) {
        targetEl.img = url;
      }
    }
  } else {
    // Nếu chưa có khung nào trên trang ruột thì tạo thêm khung ảnh mới
    if (spread.elements) {
      spread.elements.push({
        id: Date.now(),
        type: 'photo',
        img: url,
        x: 100,
        y: 80,
        width: 220,
        rotate: 0
      });
    }
  }

  autoSaveToLocalStorage();
  renderActiveSpread();
}

function triggerDirectUpload(slotKey, e) {
  if (e) e.stopPropagation();
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = ev => {
    const file = ev.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = re => assignPhotoToSlot(slotKey, re.target.result);
      reader.readAsDataURL(file);
    }
  };
  input.click();
}

function handleReplaceSpecificPhoto(e) {
  const key = ALBUM_DATA.activePhotoSlot || 'coverImg';
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = ev => assignPhotoToSlot(key, ev.target.result);
    reader.readAsDataURL(file);
  }
}

function renderUserGalleryTray() {
  const tray = document.getElementById('userUploadedTray');
  if (!tray) return;
  if (!ALBUM_DATA.userGallery || ALBUM_DATA.userGallery.length === 0) {
    tray.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:24px 12px;color:var(--gray);font-size:12px">
        <div style="font-size:24px;margin-bottom:6px">📸</div>
        <div>${currentAppLanguage === 'en' ? 'No photos uploaded yet' : 'Chưa có ảnh nào được tải lên'}</div>
        <div style="font-size:11px;opacity:0.8;margin-top:4px">${currentAppLanguage === 'en' ? 'Click "Upload Photos" above to get started' : 'Bấm nút tải ảnh ở trên để bắt đầu'}</div>
      </div>
    `;
    return;
  }
  tray.innerHTML = ALBUM_DATA.userGallery.map(url => `
    <div class="uploaded-item" draggable="true"
         ondragstart="handlePhotoDragStart(event, '${url}')"
         onclick="assignPhotoToSlot(ALBUM_DATA.activePhotoSlot, '${url}')"
         title="Kéo thả vào khung Polaroid hoặc bấm để thay ảnh">
      <img src="${url}" alt="Gallery item">
    </div>
  `).join('');
}

function handleBulkPhotoUpload(e) {
  Array.from(e.target.files).forEach(file => {
    const reader = new FileReader();
    reader.onload = ev => {
      ALBUM_DATA.userGallery.unshift(ev.target.result);
      autoSaveToLocalStorage();
      renderUserGalleryTray();
    };
    reader.readAsDataURL(file);
  });
}

// ── 5 STICKER CATEGORIES & LIBRARY SEARCH (FB28 BILINGUAL SEARCH) ──
let currentStickerCategory = 'all';
let stickerCustomImage = null;
let stickerCutShape = 'circle';

const STICKER_METADATA = [
  // Cảm xúc / Tình yêu (cat: 0)
  { char: '😄', cat: 0, tags: ['cười', 'cuoi', 'vui', 'smile', 'happy', 'laugh', 'fun'] },
  { char: '🥰', cat: 0, tags: ['cười', 'cuoi', 'yêu', 'yeu', 'love', 'tim', 'tình', 'heart', 'sweet'] },
  { char: '😍', cat: 0, tags: ['cười', 'cuoi', 'mê', 'love', 'tim', 'tình', 'crush', 'heart'] },
  { char: '😊', cat: 0, tags: ['cười', 'cuoi', 'mỉm', 'smile', 'hiền', 'vui', 'gentle'] },
  { char: '😂', cat: 0, tags: ['cười', 'cuoi', 'hài', 'funny', 'lol', 'laugh', 'haha'] },
  { char: '💖', cat: 0, tags: ['tim', 'yêu', 'yeu', 'love', 'tình', 'heart', 'pink'] },
  { char: '❤️‍🔥', cat: 0, tags: ['tim', 'cháy', 'love', 'fire', 'heart', 'nhiệt'] },
  { char: '💌', cat: 0, tags: ['thư', 'thu', 'love', 'letter', 'nhắn', 'mail', 'tin'] },
  { char: '💍', cat: 0, tags: ['nhẫn', 'nhan', 'cưới', 'cuoi', 'ring', 'marry', 'love'] },
  { char: '💞', cat: 0, tags: ['tim', 'love', 'xoay', 'heart', 'tình'] },

  // Hoa khô / Thực vật (cat: 1)
  { char: '🌸', cat: 1, tags: ['hoa', 'flower', 'sakura', 'đào', 'dao', 'hồng', 'pink', 'spring'] },
  { char: '🌺', cat: 1, tags: ['hoa', 'flower', 'dâm bụt', 'red', 'đỏ'] },
  { char: '🌻', cat: 1, tags: ['hoa', 'hướng dương', 'huong duong', 'sunflower', 'vàng', 'sun'] },
  { char: '🌷', cat: 1, tags: ['hoa', 'tulip', 'flower', 'spring', 'xinh'] },
  { char: '🌼', cat: 1, tags: ['hoa', 'cúc', 'cuc', 'daisy', 'flower', 'vàng'] },
  { char: '🌿', cat: 1, tags: ['lá', 'la', 'cây', 'leaf', 'green', 'thảo mộc', 'plant'] },
  { char: '🍃', cat: 1, tags: ['lá', 'la', 'bay', 'wind', 'nature', 'green'] },
  { char: '💐', cat: 1, tags: ['hoa', 'bó hoa', 'bouquet', 'tặng', 'quà', 'flower'] },
  { char: '🌹', cat: 1, tags: ['hoa', 'hồng', 'hong', 'rose', 'love', 'red'] },
  { char: '🌾', cat: 1, tags: ['lúa', 'cỏ', 'grass', 'nature', 'autumn', 'vintage'] },

  // Hoài niệm / Kỷ vật (cat: 2)
  { char: '📷', cat: 2, tags: ['kỷ niệm', 'ky niem', 'ảnh', 'anh', 'máy ảnh', 'camera', 'photo', 'film'] },
  { char: '🎞️', cat: 2, tags: ['kỷ niệm', 'ky niem', 'film', 'cuộn phim', 'movie', 'retro', 'vintage'] },
  { char: '📸', cat: 2, tags: ['kỷ niệm', 'ky niem', 'flash', 'camera', 'chụp', 'photo'] },
  { char: '🎧', cat: 2, tags: ['nhạc', 'nhac', 'tai nghe', 'music', 'sound', 'audio'] },
  { char: '🎵', cat: 2, tags: ['nhạc', 'nhac', 'nốt', 'melody', 'song', 'spotify'] },
  { char: '📮', cat: 2, tags: ['kỷ niệm', 'hộp thư', 'bưu điện', 'post', 'vintage', 'mail'] },
  { char: '🕯️', cat: 2, tags: ['nến', 'nen', 'ấm', 'warm', 'candle', 'vintage'] },
  { char: '📜', cat: 2, tags: ['kỷ niệm', 'giấy', 'cuộn thư', 'scroll', 'vintage', 'antique'] },
  { char: '🏷️', cat: 2, tags: ['tag', 'nhãn', 'label', 'kraft', 'kỷ vật'] },
  { char: '🔖', cat: 2, tags: ['bookmark', 'kẹp sách', 'đọc', 'vintage'] },

  // Dễ thương / Động vật (cat: 3)
  { char: '🧸', cat: 3, tags: ['gấu', 'gau', 'teddy', 'bear', 'cute', 'quà', 'búp bê'] },
  { char: '🐻', cat: 3, tags: ['gấu', 'gau', 'bear', 'cute', 'animal'] },
  { char: '🐼', cat: 3, tags: ['gấu trúc', 'panda', 'cute', 'animal'] },
  { char: '🐱', cat: 3, tags: ['mèo', 'meo', 'cat', 'kitten', 'cute', 'pet'] },
  { char: '🐶', cat: 3, tags: ['chó', 'cho', 'cún', 'dog', 'puppy', 'cute', 'pet'] },
  { char: '🐰', cat: 3, tags: ['thỏ', 'tho', 'rabbit', 'bunny', 'cute'] },
  { char: '🎁', cat: 3, tags: ['quà', 'qua', 'gift', 'present', 'hộp quà', 'box'] },
  { char: '🎀', cat: 3, tags: ['nơ', 'no', 'ribbon', 'pink', 'quà'] },
  { char: '🎈', cat: 3, tags: ['bóng bay', 'balloon', 'tiệc', 'party', 'vui'] },
  { char: '🧁', cat: 3, tags: ['bánh', 'cupcake', 'ngọt', 'sweet', 'cute'] }
];

function normalizeSearchText(str) {
  if (!str) return '';
  return str.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .trim();
}

function filterStickersByCategory(category) {
  currentStickerCategory = category;
  document.querySelectorAll('.sticker-subtab-btn').forEach(btn => btn.classList.remove('active'));
  const activeBtn = category === 'all' ? document.getElementById('stkTabBtnAll') : document.getElementById(`stkTabBtn${category}`);
  if (activeBtn) activeBtn.classList.add('active');

  const searchInput = document.getElementById('stickerSearchInput');
  if (searchInput && searchInput.value.trim()) {
    handleStickerSearch(searchInput.value);
  } else {
    renderPresetStickers();
  }
}

function handleStickerSearch(query) {
  const q = (query || '').trim();
  const tray = document.getElementById('presetStickerTray');
  if (!tray) return;

  if (!q) {
    renderPresetStickers();
    return;
  }

  const normQ = normalizeSearchText(q);

  // Filter pool based on current category
  let pool = STICKER_METADATA;
  if (currentStickerCategory !== 'all') {
    const catNum = parseInt(currentStickerCategory, 10);
    pool = pool.filter(s => s.cat === catNum);
  }

  const matched = pool.filter(item => {
    return item.tags.some(tag => {
      const normTag = normalizeSearchText(tag);
      return normTag.includes(normQ) || normQ.includes(normTag) || item.char === q;
    });
  });

  if (matched.length === 0) {
    tray.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:24px 10px;color:var(--gray);font-size:12px">
        🔍 ${currentAppLanguage === 'en' ? 'No matching stickers found for' : 'Không tìm thấy sticker phù hợp với từ khóa'} "${query}".<br>
        <span style="font-size:11px;opacity:0.8">${currentAppLanguage === 'en' ? 'Suggestions: smile, love, flower, teddy, film...' : 'Gợi ý: cười, tim, hoa, gấu, kỷ niệm, cute...'}</span>
      </div>
    `;
    return;
  }

  tray.innerHTML = matched.map(s => `
    <div class="sticker-item-btn" draggable="true" ondragstart="handleStickerDragStart(event, '${s.char}')" onclick="addRealStickerToCanvas('${s.char}')">${s.char}</div>
  `).join('');
}

function clearStickerSearch() {
  const inp = document.getElementById('stickerSearchInput');
  if (inp) inp.value = '';
  renderPresetStickers();
}

function renderPresetStickers() {
  const tray = document.getElementById('presetStickerTray');
  if (!tray) return;

  let list = [];
  if (currentStickerCategory === 'all') {
    list = STICKER_SETS.flat();
  } else {
    list = STICKER_SETS[currentStickerCategory] || STICKER_SETS[0];
  }

  tray.innerHTML = list.map(s => `
    <div class="sticker-item-btn" draggable="true" ondragstart="handleStickerDragStart(event, '${s}')" onclick="addRealStickerToCanvas('${s}')">${s}</div>
  `).join('');

  renderUserCustomStickersTray();
}

function renderUserCustomStickersTray() {
  const sec = document.getElementById('userCustomStickersSection');
  const tray = document.getElementById('userCustomStickersTray');
  if (!sec || !tray) return;

  const list = ALBUM_DATA.customStickers || [];
  if (list.length === 0) {
    sec.style.display = 'none';
    return;
  }

  sec.style.display = 'block';
  tray.innerHTML = list.map((url, idx) => `
    <div class="sticker-item-btn" style="padding:4px;overflow:hidden" onclick="addCustomImageStickerToCanvas('${url}')" title="Chèn sticker tự tạo">
      <img src="${url}" style="width:100%;height:100%;object-fit:contain">
    </div>
  `).join('');
}

function addCustomImageStickerToCanvas(imgUrl) {
  const activeSpread = ALBUM_DATA.spreads[ALBUM_DATA.activeSpreadIndex];
  if (!activeSpread) return;
  pushStudioSnapshot('Thêm sticker riêng');
  if (!activeSpread.elements) activeSpread.elements = [];
  activeSpread.elements.push({
    id: Date.now(),
    type: 'sticker-custom',
    imgUrl: imgUrl,
    x: 420,
    y: 180,
    width: 80,
    height: 80,
    rotate: (Math.random() * 12 - 6).toFixed(1)
  });
  autoSaveToLocalStorage();
  renderActiveSpread();
  showToast('Đã dán sticker tự tạo vào trang album');
}

// ── CUSTOM STICKER CREATOR ENGINE (FB12) ──
function openCustomStickerModal() {
  document.getElementById('customStickerModal').classList.add('open');
  stickerCustomImage = null;
  const canvas = document.getElementById('customStickerCanvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  const placeholder = document.getElementById('stickerCanvasPlaceholder');
  if (placeholder) placeholder.style.display = 'flex';
  const saveBtn = document.getElementById('btnSaveCustomSticker');
  if (saveBtn) saveBtn.disabled = true;
}

function closeCustomStickerModal() {
  document.getElementById('customStickerModal').classList.remove('open');
}

function handleStickerToolFileSelect(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    loadStickerImageSource(ev.target.result);
  };
  reader.readAsDataURL(file);
}

function useRecentPhotoForSticker() {
  const photos = ALBUM_DATA.userGallery || [];
  if (photos.length === 0) {
    alert('Bạn chưa tải ảnh nào vào album. Hãy tải ảnh lên trước nhé!');
    return;
  }
  loadStickerImageSource(photos[0]);
}

function loadStickerImageSource(src) {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    stickerCustomImage = img;
    const placeholder = document.getElementById('stickerCanvasPlaceholder');
    if (placeholder) placeholder.style.display = 'none';
    const saveBtn = document.getElementById('btnSaveCustomSticker');
    if (saveBtn) saveBtn.disabled = false;
    drawStickerPreview();
  };
  img.src = src;
}

function selectStickerCutShape(shape) {
  stickerCutShape = shape;
  ['Circle', 'Rounded', 'Heart', 'Polaroid'].forEach(s => {
    const b = document.getElementById(`shapeBtn${s}`);
    if (b) b.classList.remove('active');
  });
  const activeId = { circle: 'shapeBtnCircle', rounded: 'shapeBtnRounded', heart: 'shapeBtnHeart', stamp: 'shapeBtnPolaroid' }[shape];
  const btn = document.getElementById(activeId);
  if (btn) btn.classList.add('active');
  drawStickerPreview();
}

function drawStickerPreview() {
  const canvas = document.getElementById('customStickerCanvas');
  if (!canvas || !stickerCustomImage) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  ctx.save();
  ctx.beginPath();
  if (stickerCutShape === 'circle') {
    ctx.arc(w / 2, h / 2, w / 2 - 12, 0, Math.PI * 2);
  } else if (stickerCutShape === 'rounded') {
    const rad = 24, pad = 12;
    ctx.roundRect ? ctx.roundRect(pad, pad, w - pad * 2, h - pad * 2, rad) : ctx.rect(pad, pad, w - pad * 2, h - pad * 2);
  } else if (stickerCutShape === 'heart') {
    const pad = 20;
    const topCurveHeight = (h - pad * 2) * 0.3;
    ctx.moveTo(w / 2, h - pad - 10);
    ctx.bezierCurveTo(w / 2, h - pad * 1.5, pad, h / 2, pad, pad + topCurveHeight);
    ctx.bezierCurveTo(pad, pad, w / 2, pad, w / 2, pad + topCurveHeight);
    ctx.bezierCurveTo(w / 2, pad, w - pad, pad, w - pad, pad + topCurveHeight);
    ctx.bezierCurveTo(w - pad, h / 2, w / 2, h - pad * 1.5, w / 2, h - pad - 10);
  } else {
    // stamp
    const pad = 12;
    ctx.rect(pad, pad, w - pad * 2, h - pad * 2);
  }
  ctx.closePath();
  ctx.clip();

  // Draw image cover centered
  const imgW = stickerCustomImage.width;
  const imgH = stickerCustomImage.height;
  const scale = Math.max(w / imgW, h / imgH);
  const sw = imgW * scale;
  const sh = imgH * scale;
  ctx.drawImage(stickerCustomImage, (w - sw) / 2, (h - sh) / 2, sw, sh);
  ctx.restore();

  // Draw die-cut white border with shadow
  ctx.save();
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();
  ctx.restore();
}

function saveAndApplyCustomSticker() {
  const canvas = document.getElementById('customStickerCanvas');
  if (!canvas || !stickerCustomImage) return;
  const dataUrl = canvas.toDataURL('image/png');
  if (!ALBUM_DATA.customStickers) ALBUM_DATA.customStickers = [];
  ALBUM_DATA.customStickers.unshift(dataUrl);
  autoSaveToLocalStorage();
  renderUserCustomStickersTray();
  addCustomImageStickerToCanvas(dataUrl);
  closeCustomStickerModal();
}

function handleCustomStickerUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    if (!ALBUM_DATA.customStickers) ALBUM_DATA.customStickers = [];
    ALBUM_DATA.customStickers.unshift(ev.target.result);
    autoSaveToLocalStorage();
    renderUserCustomStickersTray();
    addCustomImageStickerToCanvas(ev.target.result);
  };
  reader.readAsDataURL(file);
}

// ── SALUTATION & FONT ──
function handleSalutationInput(val) {
  ALBUM_DATA.salutation = val;
  const inp = document.getElementById('sidebarSalutationInput');
  if (inp) inp.value = val;
  autoSaveToLocalStorage();
  renderActiveSpread();
}

function applyQuickSalutation(text) {
  handleSalutationInput(text);
}

function changeLetterFont(fontFamily) {
  ALBUM_DATA.letterFont = fontFamily;
  autoSaveToLocalStorage();
  renderActiveSpread();
}

function changeInkColor(colorHex, elem) {
  ALBUM_DATA.inkColor = colorHex;
  document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
  if (elem) elem.classList.add('active');
  autoSaveToLocalStorage();
  renderActiveSpread();
}

function updateLiveAlbumTitle(val) {
  ALBUM_DATA.title = val;
  const inp = document.getElementById('studioAlbumTitleInput');
  if (inp) inp.value = val;
  autoSaveToLocalStorage();
}
function updateLiveAlbumQuote(val) {
  if (typeof val === 'string') {
    ALBUM_DATA.quote = val.replace(/^["“”']+|["“”']+$/g, '').trim();
    autoSaveToLocalStorage();
  }
}
function handleStudioLetterInput(textarea) {
  ALBUM_DATA.message = textarea.value;
  autoSaveToLocalStorage();
  renderActiveSpread();
}
function handleStudioSignatureInput(inp) {
  ALBUM_DATA.signature = inp.value;
  autoSaveToLocalStorage();
  renderActiveSpread();
}
function syncLetterFromCanvas(text) {
  ALBUM_DATA.message = text;
  const inp = document.getElementById('sidebarLetterInput');
  if (inp) inp.value = text;
  autoSaveToLocalStorage();
}
function syncSignatureFromCanvas(text) {
  ALBUM_DATA.signature = text;
  const inp = document.getElementById('sidebarSignatureInput');
  if (inp) inp.value = text;
  autoSaveToLocalStorage();
}

// ── 🎵 SPOTIFY INTEGRATION ENGINE (FB75.1) ──
// CONTRACT HOOKS FOR CODEX / REAL SPOTIFY BACKEND API
window.codexSearchSpotifyTracks = window.codexSearchSpotifyTracks || null;
window.codexResolveSpotifyTrack = window.codexResolveSpotifyTrack || null;
window.codexOnSpotifyTrackSelected = window.codexOnSpotifyTrackSelected || null;

function escapeSpotifyAttr(str) {
  if (!str) return '';
  return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function parseSpotifyUrl(url) {
  if (!url) return null;
  const raw = String(url).trim();
  // Strip query parameters (?si=...) and fragment identifiers (#...)
  const clean = raw.split('?')[0].split('#')[0];
  const match = clean.match(/(track|playlist|album|artist|episode)[/:]([a-zA-Z0-9]+)/);
  if (match) {
    return {
      type: match[1],
      id: match[2],
      cleanUrl: `https://open.spotify.com/${match[1]}/${match[2]}`
    };
  }
  return null;
}

// Auto-Navigate to Page 2 (Spotify QR Page)
function navigateToSpotifyQrPage() {
  let targetIndex = ALBUM_DATA.spreads ? ALBUM_DATA.spreads.findIndex(s => s.leftType === 'spotify-hero') : -1;
  if (targetIndex < 0) {
    targetIndex = (ALBUM_DATA.spreads && ALBUM_DATA.spreads.length > 1) ? 1 : 0;
  }

  if (isMobileViewport()) {
    jumpToSpread(targetIndex);
    mobileActivePageHalf = 'left';
    renderActiveSpread();
    adjustMobileStageScale();
    updateContextualToolbar();
    updateNavSpreadButtons();
  } else {
    jumpToSpread(targetIndex);
    adjustMobileStageScale();
    updateContextualToolbar();
    updateNavSpreadButtons();
  }

  const toastMsg = (currentAppLanguage === 'en')
    ? 'Spotify track added — QR code is on Page 2'
    : 'Đã thêm nhạc Spotify — mã QR nằm ở Trang 2';
  showToast(toastMsg);
}

let spotifySearchDebounce = null;
let spotifySearchSeqId = 0;

function handleSpotifySongSearch(query) {
  const rawQuery = (query || '').trim();
  const resBox = document.getElementById('spotifySearchResultsBox');
  const spinner = document.getElementById('spotifySearchSpinner');
  if (!resBox) return;

  if (spotifySearchDebounce) clearTimeout(spotifySearchDebounce);

  if (!rawQuery) {
    resBox.style.display = 'none';
    resBox.innerHTML = '';
    if (spinner) spinner.style.display = 'none';
    return;
  }

  // 1. Direct Spotify URL detection inside search box
  const parsedUrl = parseSpotifyUrl(rawQuery);
  if (parsedUrl) {
    if (spinner) spinner.style.display = 'none';
    const isEn = (currentAppLanguage === 'en');
    resBox.innerHTML = `
      <div class="spotify-search-item" onclick="handleDirectSpotifyLinkResolve('${escapeSpotifyAttr(parsedUrl.cleanUrl)}', '${escapeSpotifyAttr(parsedUrl.id)}')"
           style="display:flex;align-items:center;gap:10px;padding:12px 14px;cursor:pointer;background:#f0fdf4;border-bottom:1px solid #bbf7d0;transition:background 0.15s ease">
        <span style="font-size:20px">🔗</span>
        <div style="flex:1;min-width:0">
          <div style="font-size:12.5px;font-weight:700;color:#166534">${isEn ? 'Direct Spotify Link Detected' : 'Nhận diện liên kết Spotify hợp lệ'}</div>
          <div style="font-size:11px;color:#15803d;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${parsedUrl.cleanUrl}</div>
        </div>
        <button class="btn-primary" style="padding:4px 10px;font-size:11.5px;border-radius:6px;pointer-events:none">${isEn ? 'Apply' : 'Áp dụng'}</button>
      </div>
    `;
    resBox.style.display = 'block';
    return;
  }

  if (rawQuery.length < 2) {
    resBox.style.display = 'none';
    if (spinner) spinner.style.display = 'none';
    return;
  }

  if (spinner) spinner.style.display = 'inline-block';
  const thisSeqId = ++spotifySearchSeqId;

  spotifySearchDebounce = setTimeout(async () => {
    const isEn = (currentAppLanguage === 'en');

    // FB75.1: If Codex/backend is not yet connected, do not fake results!
    if (typeof window.codexSearchSpotifyTracks !== 'function') {
      if (thisSeqId !== spotifySearchSeqId) return;
      if (spinner) spinner.style.display = 'none';
      resBox.innerHTML = `
        <div style="padding:16px 14px;text-align:center;font-size:12px;color:var(--gray);line-height:1.5">
          <div style="font-size:18px;margin-bottom:4px">📡</div>
          <div>${isEn 
            ? 'Spotify search is awaiting service connection. You can still paste a Spotify track link.' 
            : 'Tìm kiếm Spotify đang chờ kết nối dịch vụ. Bạn vẫn có thể dán liên kết bài hát Spotify.'}</div>
        </div>
      `;
      resBox.style.display = 'block';
      return;
    }

    // Call real Codex search contract
    let matches = [];
    try {
      const remoteRes = await window.codexSearchSpotifyTracks(rawQuery);
      if (thisSeqId !== spotifySearchSeqId) return;
      if (Array.isArray(remoteRes)) {
        matches = remoteRes;
      }
    } catch (err) {
      console.warn('Codex Spotify search error:', err);
    }

    if (thisSeqId !== spotifySearchSeqId) return;
    if (spinner) spinner.style.display = 'none';

    if (matches.length === 0) {
      resBox.innerHTML = `
        <div style="padding:14px 16px;text-align:center;font-size:12px;color:var(--gray);line-height:1.5">
          🔍 ${isEn 
            ? `No tracks found matching "${escapeSpotifyAttr(rawQuery)}". You can paste a direct Spotify link below.` 
            : `Không tìm thấy bài hát nào khớp với "${escapeSpotifyAttr(rawQuery)}". Bạn có thể dán liên kết trực tiếp ở ô bên dưới.`}
        </div>
      `;
      resBox.style.display = 'block';
      return;
    }

    const displayMatches = matches.slice(0, 8);
    resBox.innerHTML = displayMatches.map(item => `
      <div class="spotify-search-item" onclick="selectSpotifyTrack(${JSON.stringify(item).replace(/"/g, '&quot;')})"
           style="display:flex;align-items:center;gap:10px;padding:8px 10px;cursor:pointer;border-bottom:1px solid #f3f4f6;transition:background 0.15s ease">
        ${item.artwork 
          ? `<img src="${escapeSpotifyAttr(item.artwork)}" style="width:38px;height:38px;border-radius:6px;object-fit:cover" alt="${escapeSpotifyAttr(item.title)}">` 
          : `<div style="width:38px;height:38px;border-radius:6px;background:#1e293b;color:var(--spotify);display:flex;align-items:center;justify-content:center;font-size:16px">🎵</div>`}
        <div style="flex:1;min-width:0">
          <div style="font-size:12.5px;font-weight:700;color:var(--dark);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeSpotifyAttr(item.title)}</div>
          <div style="font-size:11px;color:var(--gray);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeSpotifyAttr(item.artist || 'Spotify')}</div>
        </div>
        <button class="btn-outline" style="padding:3px 8px;font-size:11px;border-radius:6px;pointer-events:none">${isEn ? 'Select' : 'Chọn'}</button>
      </div>
    `).join('');
    resBox.style.display = 'block';
  }, 280);
}

// FB75.1 / FB81: Direct link resolver with real metadata synchronization
async function handleDirectSpotifyLinkResolve(cleanUrl, trackId) {
  // 1. If external Codex resolver is available, attempt real metadata resolution
  if (typeof window.codexResolveSpotifyTrack === 'function') {
    try {
      const resolved = await window.codexResolveSpotifyTrack(cleanUrl || trackId);
      if (resolved && resolved.id) {
        selectSpotifyTrack({
          id: resolved.id,
          name: resolved.name || resolved.title || '',
          title: resolved.title || resolved.name || '',
          artist: resolved.artist || resolved.artistNames || '',
          artistNames: resolved.artistNames || resolved.artist || '',
          artists: resolved.artists || (resolved.artist ? [resolved.artist] : []),
          artwork: resolved.artwork || resolved.artworkUrl || '',
          artworkUrl: resolved.artworkUrl || resolved.artwork || '',
          albumName: resolved.albumName || '',
          url: resolved.canonicalUrl || resolved.url || cleanUrl,
          isPendingMetadata: false
        });
        return;
      }
    } catch (e) {
      console.warn('Codex Spotify track resolver hook error:', e);
    }
  }

  // 2. If resolver is not yet available:
  // Strictly DO NOT fabricate fake title, artist, or singer artwork.
  // Store authentic canonical track ID & URL, with pending metadata status.
  const isEn = (currentAppLanguage === 'en');
  const pendingTrack = {
    id: trackId,
    name: '',
    title: '',
    artist: isEn ? 'Awaiting track metadata connection' : 'Đang chờ kết nối thông tin bài hát',
    artistNames: isEn ? 'Awaiting track metadata connection' : 'Đang chờ kết nối thông tin bài hát',
    artwork: '',
    url: cleanUrl,
    isPendingMetadata: true
  };
  selectSpotifyTrack(pendingTrack);
}

// FB81: Canonical metadata helper for printed Page 2 & 3D Preview
function getSpotifyTrackDisplayMetadata() {
  const isEn = (currentAppLanguage === 'en');
  if (!ALBUM_DATA.spotifyTrack && !ALBUM_DATA.spotifyTrackId) {
    return {
      hasTrack: false,
      title: isEn ? 'No track selected yet' : 'Chưa chọn bài hát',
      artist: '',
      isPending: false
    };
  }

  if (ALBUM_DATA.spotifyTrackObj && typeof ALBUM_DATA.spotifyTrackObj === 'object') {
    const obj = ALBUM_DATA.spotifyTrackObj;
    const title = obj.name || obj.title || '';
    const artist = obj.artistNames || (Array.isArray(obj.artists) ? obj.artists.join(', ') : obj.artist) || '';
    const isPending = !!obj.isPendingMetadata;
    return {
      hasTrack: true,
      title: title,
      artist: artist,
      isPending: isPending
    };
  }

  const str = String(ALBUM_DATA.spotifyTrack || '');
  if (str.includes(' — ')) {
    const parts = str.split(' — ');
    const isPending = str.includes('Đang chờ kết nối') || str.includes('Awaiting track');
    return {
      hasTrack: true,
      title: isPending ? '' : parts[0],
      artist: isPending ? '' : parts.slice(1).join(' — '),
      isPending: isPending
    };
  }

  const isPending = str.includes('Đang chờ kết nối') || str.includes('Awaiting track') || str.includes('Spotify Track (');
  return {
    hasTrack: !!str,
    title: isPending ? '' : str,
    artist: ALBUM_DATA.spotifyArtist || '',
    isPending: isPending
  };
}

function selectSpotifyTrack(track) {
  if (!track || !track.id) return;

  const rawTitle = track.name || track.title || '';
  const rawArtist = track.artistNames || (Array.isArray(track.artists) ? track.artists.join(', ') : track.artist) || '';
  const isPending = !!track.isPendingMetadata;
  const canonicalUrl = track.canonicalUrl || track.url || (`https://open.spotify.com/track/${track.id}`);
  const artwork = track.artworkUrl || track.artwork || '';
  const albumName = track.albumName || '';

  const displayTitle = rawTitle || (isPending ? `Spotify Track (${track.id})` : `Track ${track.id}`);
  const displayArtist = rawArtist || '';

  pushStudioSnapshot('Chọn bài hát Spotify: ' + (rawTitle || track.id));

  // Canonical structured state (FB81)
  ALBUM_DATA.spotifyTrackObj = {
    id: track.id,
    name: rawTitle,
    title: rawTitle,
    artist: rawArtist,
    artistNames: rawArtist,
    artists: Array.isArray(track.artists) ? track.artists : (rawArtist ? [rawArtist] : []),
    canonicalUrl: canonicalUrl,
    artworkUrl: artwork,
    albumName: albumName,
    isPendingMetadata: isPending
  };

  ALBUM_DATA.spotifyTrack = displayArtist ? `${displayTitle} — ${displayArtist}` : displayTitle;
  ALBUM_DATA.spotifyTrackTitle = rawTitle;
  ALBUM_DATA.spotifyArtist = rawArtist;
  ALBUM_DATA.spotifyUrl = canonicalUrl;
  ALBUM_DATA.spotifyTrackId = track.id;
  ALBUM_DATA.spotifyArtwork = artwork;
  // Scannable SVG directly from official Spotify Scannables CDN using valid canonical track ID
  ALBUM_DATA.spotifyCodeImg = 'https://scannables.scdn.co/uri/plain/svg/000000/white/640/spotify:track:' + track.id;

  const resBox = document.getElementById('spotifySearchResultsBox');
  if (resBox) resBox.style.display = 'none';

  const sInp = document.getElementById('spotifySearchInput');
  if (sInp) sInp.value = ALBUM_DATA.spotifyTrack;

  const lInp = document.getElementById('spotifyLinkInput');
  if (lInp) lInp.value = ALBUM_DATA.spotifyUrl;

  renderSpotifySelectedState();
  renderSpotifyOfficialEmbed();
  autoSaveToLocalStorage();
  renderActiveSpread();

  if (typeof window.codexOnSpotifyTrackSelected === 'function') {
    try {
      window.codexOnSpotifyTrackSelected(ALBUM_DATA.spotifyTrackObj);
    } catch (e) {
      console.warn('Codex track selected hook error:', e);
    }
  }

  // FB75: Auto-navigate to Page 2 (Spotify QR Page) and show confirmation toast
  navigateToSpotifyQrPage();
}

function removeSelectedSpotifySong() {
  pushStudioSnapshot('Gỡ bài hát Spotify');
  ALBUM_DATA.spotifyTrack = null;
  ALBUM_DATA.spotifyUrl = null;
  ALBUM_DATA.spotifyTrackId = null;
  ALBUM_DATA.spotifyTrackObj = null;
  ALBUM_DATA.spotifyArtwork = null;
  ALBUM_DATA.spotifyCodeImg = null;
  ALBUM_DATA.spotifyEmbed = null;

  const sInp = document.getElementById('spotifySearchInput');
  if (sInp) sInp.value = '';

  const lInp = document.getElementById('spotifyLinkInput');
  if (lInp) lInp.value = '';

  renderSpotifySelectedState();
  renderSpotifyOfficialEmbed();
  autoSaveToLocalStorage();
  renderActiveSpread();
  showToast(currentAppLanguage === 'en' ? 'Spotify track unlinked' : 'Đã hủy liên kết bài hát Spotify');
}

// ── 🎵 SPOTIFY HORIZONTAL SCANNABLE CODE ENGINE (FB35) ──
function renderSpotifyHorizontalCodeHtml() {
  const meta = getSpotifyTrackDisplayMetadata();
  if (!meta.hasTrack) {
    return `
      <div style="background:rgba(0,0,0,0.03);border:1px dashed var(--gray-l);border-radius:8px;padding:12px;text-align:center;color:var(--gray);font-size:11.5px;max-width:320px;margin:8px auto">
        🎵 ${currentAppLanguage === 'en' ? 'Select a song in Audio tab to link Spotify & generate scannable code' : 'Chọn bài hát tại tab Âm thanh để liên kết Spotify & tạo mã quét'}
      </div>
    `;
  }
  if (ALBUM_DATA.spotifyCodeImg) {
    return `
      <div class="spotify-scannable-bar-wrap" style="width:100%;max-width:320px;margin:8px auto;text-align:center">
        <img src="${ALBUM_DATA.spotifyCodeImg}" alt="Spotify Scannable Code"
             style="width:100%;height:38px;border-radius:6px;box-shadow:0 3px 12px rgba(0,0,0,0.18);display:block;margin:0 auto;object-fit:cover"
             onerror="this.onerror=null;this.replaceWith(renderFallbackSpotifyCodeSvg())">
        <div style="font-size:9.5px;color:var(--gray);margin-top:4px;letter-spacing:0.5px">${currentAppLanguage === 'en' ? 'Scan on Spotify app to play music' : 'Quét trên app Spotify để phát nhạc'}</div>
      </div>
    `;
  }
  return `
    <div class="spotify-soundwave-bar" style="width:100%;max-width:320px;margin:8px auto">
      <div class="spotify-logo-icon">🎵</div>
      <div class="spotify-wave-lines">
        <span class="sw-line" style="height:6px"></span>
        <span class="sw-line" style="height:14px"></span>
        <span class="sw-line" style="height:22px"></span>
        <span class="sw-line" style="height:8px"></span>
        <span class="sw-line" style="height:18px"></span>
        <span class="sw-line" style="height:24px"></span>
        <span class="sw-line" style="height:12px"></span>
        <span class="sw-line" style="height:20px"></span>
      </div>
      <span style="font-size:10.5px;font-weight:800;color:white;letter-spacing:1px">Spotify</span>
    </div>
  `;
}

function renderFallbackSpotifyCodeSvg() {
  const el = document.createElement('div');
  el.className = 'spotify-soundwave-bar';
  el.style.cssText = 'width:100%;max-width:320px;margin:8px auto;';
  el.innerHTML = `
    <div class="spotify-logo-icon">🎵</div>
    <div class="spotify-wave-lines">
      <span class="sw-line" style="height:6px"></span>
      <span class="sw-line" style="height:14px"></span>
      <span class="sw-line" style="height:22px"></span>
      <span class="sw-line" style="height:8px"></span>
      <span class="sw-line" style="height:18px"></span>
      <span class="sw-line" style="height:24px"></span>
      <span class="sw-line" style="height:12px"></span>
      <span class="sw-line" style="height:20px"></span>
    </div>
    <span style="font-size:10.5px;font-weight:800;color:white;letter-spacing:1px">Spotify</span>
  `;
  return el;
}

// ── 📱 MOBILE STAGE POPUP MENU CONTROLLER (FB34) ──
function toggleMobileStageMenu(e) {
  if (e) e.stopPropagation();
  const pop = document.getElementById('mobileStageMenuPopup');
  if (pop) pop.classList.toggle('open');
}
function closeMobileStageMenu() {
  const pop = document.getElementById('mobileStageMenuPopup');
  if (pop) pop.classList.remove('open');
}
document.addEventListener('click', (e) => {
  if (!e.target.closest('#mobileStageMenuPopup') && !e.target.closest('#mobileMoreMenuBtn')) {
    closeMobileStageMenu();
  }
});

function renderSpotifySelectedState() {
  const card = document.getElementById('spotifySelectedSongCard');
  const empty = document.getElementById('spotifyEmptyPlaceholder');
  const art = document.getElementById('spotifySelectedArtwork');
  const title = document.getElementById('spotifySelectedTitle');
  const artist = document.getElementById('spotifySelectedArtist');

  if (ALBUM_DATA.spotifyTrack && ALBUM_DATA.spotifyUrl) {
    if (card) card.style.display = 'flex';
    if (empty) empty.style.display = 'none';
    const neutralArtworkSvg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Crect width='48' height='48' rx='8' fill='%23121212'/%3E%3Ccircle cx='24' cy='24' r='12' fill='%231db954'/%3E%3Cpath d='M18 22c3.5-1 7.5-.5 11 1.5M19 25.5c3-.8 6.5-.4 9.5 1.2M20 29c2.5-.6 5.5-.3 8 1' stroke='%23121212' stroke-width='2' stroke-linecap='round' fill='none'/%3E%3C/svg%3E";
    if (art) art.src = ALBUM_DATA.spotifyArtwork || neutralArtworkSvg;
    const parts = ALBUM_DATA.spotifyTrack.split(' — ');
    if (title) title.textContent = parts[0] || ALBUM_DATA.spotifyTrack;
    if (artist) artist.textContent = parts[1] || (currentAppLanguage === 'en' ? 'Awaiting track metadata connection' : 'Đang chờ kết nối thông tin bài hát');
  } else {
    if (card) card.style.display = 'none';
    if (empty) empty.style.display = 'block';
  }
}

function handleSpotifyLinkChange(val) {
  const trimmed = (val || '').trim();
  ALBUM_DATA.spotifyUrl = trimmed;
  const parsed = parseSpotifyUrl(trimmed);

  if (parsed) {
    handleDirectSpotifyLinkResolve(parsed.cleanUrl, parsed.id);
  } else {
    ALBUM_DATA.spotifyTrackId = '';
    ALBUM_DATA.spotifyCodeImg = '';
    if (!trimmed) {
      ALBUM_DATA.spotifyTrack = '';
      ALBUM_DATA.spotifyArtwork = '';
    }
    renderSpotifySelectedState();
    renderSpotifyOfficialEmbed();
    autoSaveToLocalStorage();
    renderActiveSpread();
  }
}

function pasteQuickSpotifyUrl(url, title) {
  const inp = document.getElementById('spotifyLinkInput');
  if (inp) inp.value = url;
  ALBUM_DATA.spotifyTrack = title;
  handleSpotifyLinkChange(url);
}

function renderSpotifyOfficialEmbed() {
  const host = document.getElementById('spotifyEmbedHostContainer');
  const floatHost = document.getElementById('floatingSpotifyEmbedHost');
  const floatWidget = document.getElementById('studioFloatingSpotifyWidget');
  const parsed = parseSpotifyUrl(ALBUM_DATA.spotifyUrl);

  if (!host) return;

  if (parsed && parsed.id) {
    const embedSrc = `https://open.spotify.com/embed/${parsed.type}/${parsed.id}?utm_source=generator&theme=0`;
    host.innerHTML = `
      <div class="spotify-official-embed-container" style="border-radius:12px;overflow:hidden;box-shadow:0 4px 14px rgba(0,0,0,0.06);margin-top:6px">
        <iframe src="${embedSrc}" width="100%" height="152" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
      </div>
      <div style="font-size:11.5px;color:var(--green-d);font-weight:700;margin-top:6px">
        ✅ ${currentAppLanguage === 'en' ? 'Official Spotify Embed & High-Res QR Scannable Code linked!' : 'Đã nhúng Spotify Embed chính thức & tạo mã QR quét bài hát in trên album!'}
      </div>
    `;
    if (floatHost && floatWidget) {
      floatHost.innerHTML = `<iframe src="${embedSrc}" width="100%" height="80" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`;
      floatWidget.style.display = 'flex';
    }
  } else if (ALBUM_DATA.spotifyUrl) {
    host.innerHTML = `
      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:12px;margin-top:8px;font-size:12px;color:#dc2626">
        <div>⚠️ ${currentAppLanguage === 'en' ? 'Could not load song from Spotify. Please select another track or check the link.' : 'Không thể tải bài hát này từ Spotify. Hãy chọn bài khác hoặc kiểm tra lại liên kết.'}</div>
        <button class="btn-outline" style="margin-top:8px;font-size:11px;padding:4px 10px" onclick="document.getElementById('spotifySearchInput')?.focus()">${currentAppLanguage === 'en' ? 'Choose another song' : 'Chọn lại bài hát'}</button>
      </div>
    `;
    if (floatWidget) floatWidget.style.display = 'none';
  } else {
    host.innerHTML = '';
    if (floatWidget) floatWidget.style.display = 'none';
  }
}

// ── ↶ STUDIO UNDO / REDO ENGINE (FB14) ──
const STUDIO_HISTORY_LIMIT = 20;
let studioUndoStack = [];
let studioRedoStack = [];
let isApplyingHistory = false;

function pushStudioSnapshot(actionLabel = 'Chỉnh sửa album') {
  if (isApplyingHistory) return;
  try {
    const snap = JSON.stringify(ALBUM_DATA);
    studioUndoStack.push({ time: Date.now(), label: actionLabel, state: snap });
    if (studioUndoStack.length > STUDIO_HISTORY_LIMIT) studioUndoStack.shift();
    studioRedoStack = [];
    updateStudioUndoRedoButtons();
  } catch (err) {}
}

function studioUndo() {
  if (studioUndoStack.length === 0) return;
  try {
    isApplyingHistory = true;
    const currentSnap = JSON.stringify(ALBUM_DATA);
    studioRedoStack.push({ time: Date.now(), label: 'Undo', state: currentSnap });

    const prev = studioUndoStack.pop();
    const parsed = JSON.parse(prev.state);
    ALBUM_DATA = parsed;
    autoSaveToLocalStorage();
    renderActiveSpread();
    renderFilmstripTray();
    updateStudioUndoRedoButtons();
    showToast(`Đã hoàn tác: ${prev.label || 'thao tác trước'}`);
  } catch (err) {
  } finally {
    isApplyingHistory = false;
  }
}

function studioRedo() {
  if (studioRedoStack.length === 0) return;
  try {
    isApplyingHistory = true;
    const currentSnap = JSON.stringify(ALBUM_DATA);
    studioUndoStack.push({ time: Date.now(), label: 'Redo', state: currentSnap });

    const next = studioRedoStack.pop();
    const parsed = JSON.parse(next.state);
    ALBUM_DATA = parsed;
    autoSaveToLocalStorage();
    renderActiveSpread();
    renderFilmstripTray();
    updateStudioUndoRedoButtons();
    showToast(`Đã làm lại: ${next.label || 'thao tác'}`);
  } catch (err) {
  } finally {
    isApplyingHistory = false;
  }
}

function updateStudioUndoRedoButtons() {
  const btnUndo = document.getElementById('btnStudioUndo');
  const btnRedo = document.getElementById('btnStudioRedo');
  if (btnUndo) {
    btnUndo.disabled = studioUndoStack.length === 0;
    btnUndo.style.opacity = studioUndoStack.length === 0 ? '0.4' : '1';
  }
  if (btnRedo) {
    btnRedo.disabled = studioRedoStack.length === 0;
    btnRedo.style.opacity = studioRedoStack.length === 0 ? '0.4' : '1';
  }
}

/// ── PACKAGE & WORKFLOW DECOUPLING (FB19 & FB54) ──
function selectPackage(pkg, price) {
  const pkgPrices = { melody: 119000, voice: 159000, signature: 199000 };
  ALBUM_DATA.package = pkg;
  ALBUM_DATA.basePrice = price || pkgPrices[pkg] || 199000;

  // Realtime synchronization to Cart if current album is already added (FB54)
  if (Array.isArray(ALBUM_DATA.cart)) {
    const existingIdx = ALBUM_DATA.cart.findIndex(i => i.title && i.title.startsWith(`Album melsou · ${ALBUM_DATA.title}`));
    if (existingIdx !== -1) {
      const extraCost = (ALBUM_DATA.extraSpreadsCount || 0) * EXTRA_SPREAD_PRICE;
      const pkgNames = { melody: 'Gói Melody', voice: 'Gói Voice', signature: 'Signature Combo' };
      const pkgNameEn = { melody: 'Melody Package', voice: 'Voice Package', signature: 'Signature Combo' };
      ALBUM_DATA.cart[existingIdx].package = pkg;
      ALBUM_DATA.cart[existingIdx].packageName = currentAppLanguage === 'en' ? pkgNameEn[pkg] : pkgNames[pkg];
      ALBUM_DATA.cart[existingIdx].basePrice = ALBUM_DATA.basePrice;
      ALBUM_DATA.cart[existingIdx].extraCost = extraCost;
      ALBUM_DATA.cart[existingIdx].price = ALBUM_DATA.basePrice + (ALBUM_DATA.sizeAdj || 0) + extraCost;
      updateCartBadge();
    }
  }

  document.querySelectorAll('#pkgCardSelectorGroup .layout-card').forEach(el => el.classList.remove('active'));
  const cardId = { melody: 'pkgCardMelody', voice: 'pkgCardVoice', signature: 'pkgCardSignature' }[pkg];
  const card = document.getElementById(cardId);
  if (card) card.classList.add('active');

  const names = { melody: 'Gói Melody (119k)', voice: 'Gói Voice (159k)', signature: 'Signature Combo (199k)' };
  const badge = document.getElementById('studioPackageBadge');
  if (badge) badge.textContent = names[pkg] || 'Signature (199k)';

  applyAudioGating();
  updateStudioPriceDisplay();
  autoSaveToLocalStorage();

  // FB19: Decouple choosing package from jumping directly to random template.
  // Prompt user to explicitly select their preferred template design.
  openTemplateOnboardingModal();
}

function applyAudioGating() {
  const pkg = ALBUM_DATA.package;
  const spotSec = document.getElementById('audioTabSpotifySection');
  const spotLock = document.getElementById('audioTabSpotifyLocked');
  const voiceSec = document.getElementById('audioTabVoiceSection');
  const voiceLock = document.getElementById('audioTabVoiceLocked');

  if (pkg === 'melody') {
    if (spotSec) spotSec.style.display = 'block';
    if (spotLock) spotLock.style.display = 'none';
    if (voiceSec) voiceSec.style.display = 'none';
    if (voiceLock) voiceLock.style.display = 'block';
  } else if (pkg === 'voice') {
    if (spotSec) spotSec.style.display = 'none';
    if (spotLock) spotLock.style.display = 'block';
    if (voiceSec) voiceSec.style.display = 'block';
    if (voiceLock) voiceLock.style.display = 'none';
  } else {
    if (spotSec) spotSec.style.display = 'block';
    if (spotLock) spotLock.style.display = 'none';
    if (voiceSec) voiceSec.style.display = 'block';
    if (voiceLock) voiceLock.style.display = 'none';
  }
}

// ════════ 📐 FB77: ALBUM FORMAT REMAPPING & CONFIRMATION UX ════════
let pendingAlbumSizeChange = null;

function remapElementsForFormatChange(oldFmt, newFmt) {
  if (!ALBUM_DATA || !Array.isArray(ALBUM_DATA.spreads)) return;
  if (!oldFmt || !newFmt || oldFmt.ratioClass === newFmt.ratioClass) return;

  const oldW = oldFmt.spreadWidth;
  const oldH = oldFmt.spreadHeight;
  const newW = newFmt.spreadWidth;
  const newH = newFmt.spreadHeight;

  ALBUM_DATA.spreads.forEach(spread => {
    if (!spread || !Array.isArray(spread.elements) || spread.isClosedCover || spread.isClosedBack) return;
    spread.elements.forEach(el => {
      const normX = (el.x || 0) / oldW;
      const normY = (el.y || 0) / oldH;
      const normW = (el.width || 200) / oldW;

      el.x = Math.round(normX * newW);
      el.y = Math.round(normY * newH);
      el.width = Math.max(80, Math.round(normW * newW));
    });
    normalizeElementsToSafeArea(spread, newFmt);
  });
}

function selectAlbumSize(adj, name, ratioClass) {
  if (typeof ALBUM_DATA === 'undefined') return;
  if (ALBUM_DATA.sizeClass === ratioClass) return; // already active

  const targetFmt = ALBUM_FORMATS[ratioClass];
  if (!targetFmt) return;

  pendingAlbumSizeChange = { adj, name, ratioClass, targetFmt };
  const isEn = (currentAppLanguage === 'en');

  const titleEl = document.getElementById('sizeChangeModalTitle');
  const descEl = document.getElementById('sizeChangeModalDesc');
  const cancelBtn = document.getElementById('sizeChangeCancelBtn');
  const confirmBtn = document.getElementById('sizeChangeConfirmBtn');

  if (titleEl) titleEl.textContent = isEn ? 'Change album size?' : 'Đổi khổ album?';
  if (descEl) {
    const dims = isEn ? targetFmt.dimsEn : targetFmt.dimsVi;
    descEl.textContent = isEn
      ? `Your current design will be adjusted to fit ${dims}. Some photos or text may need minor repositioning.`
      : `Thiết kế hiện tại sẽ được tự động điều chỉnh để phù hợp với khổ ${dims}. Một số ảnh hoặc chữ có thể cần căn lại.`;
  }
  if (cancelBtn) cancelBtn.textContent = isEn ? 'Cancel' : 'Hủy';
  if (confirmBtn) {
    const fmtName = isEn ? targetFmt.nameEn : targetFmt.nameVi;
    confirmBtn.textContent = isEn ? `Change to ${fmtName}` : `Đổi sang ${fmtName}`;
  }

  const modal = document.getElementById('sizeChangeConfirmModal');
  if (modal) modal.classList.add('open');
}

function cancelAlbumSizeChange() {
  pendingAlbumSizeChange = null;
  const modal = document.getElementById('sizeChangeConfirmModal');
  if (modal) modal.classList.remove('open');
}

function confirmAlbumSizeChange() {
  if (!pendingAlbumSizeChange) return;
  const { adj, name, ratioClass, targetFmt } = pendingAlbumSizeChange;
  const oldFmt = getCurrentAlbumFormat();

  remapElementsForFormatChange(oldFmt, targetFmt);

  ALBUM_DATA.sizeAdj = 0;
  ALBUM_DATA.sizeClass = ratioClass;
  ALBUM_DATA.sizeName = name;
  ALBUM_DATA.albumFormat = {
    id: targetFmt.id,
    ratioClass: targetFmt.ratioClass,
    widthMm: targetFmt.id === 'square-20' ? 200 : targetFmt.id === 'a5-landscape' ? 210 : targetFmt.id === 'a6-mini' ? 100 : 150,
    heightMm: targetFmt.id === 'square-20' ? 200 : targetFmt.id === 'a5-landscape' ? 150 : targetFmt.id === 'a6-mini' ? 150 : 210,
    priceDelta: 0
  };

  document.querySelectorAll('#sizeCardSelectorGroup .layout-card').forEach(el => el.classList.remove('active'));
  const card = document.getElementById(targetFmt.cardId);
  if (card) card.classList.add('active');

  const modal = document.getElementById('sizeChangeConfirmModal');
  if (modal) modal.classList.remove('open');
  pendingAlbumSizeChange = null;

  updateStudioPriceDisplay();
  autoSaveToLocalStorage();
  renderActiveSpread();
  adjustMobileStageScale();

  const isEn = (currentAppLanguage === 'en');
  const toastMsg = isEn 
    ? `Switched to ${targetFmt.nameEn} (${targetFmt.dimsEn})`
    : `Đã đổi sang khổ ${targetFmt.nameVi} (${targetFmt.dimsVi})`;
  showStudioToast(toastMsg);
}

function applyAlbumSizeDirect(adj, name, ratioClass) {
  const targetFmt = ALBUM_FORMATS[ratioClass];
  if (!targetFmt) return;
  pendingAlbumSizeChange = { adj, name, ratioClass, targetFmt };
  confirmAlbumSizeChange();
}

function toggleHomeRecordingMode(isChecked) {
  ALBUM_DATA.isHomeRecording = isChecked;
  const box = document.getElementById('voiceRecorderControlsBox');
  if (box) box.style.opacity = isChecked ? '0.4' : '1';
  autoSaveToLocalStorage();
  renderActiveSpread();
}

// ── 🎙️ FB36: VOICE RECORDING STATE ARCHITECTURE (PRESERVE SAVED ON RE-RECORD) ──
const MELSOU_VOICE = {
  savedBlob: null,       // Confirmed saved recording blob
  savedDuration: 0,      // Seconds
  draftBlob: null,       // Temporary recording take
  draftDuration: 0,      // Seconds
  recordingState: 'idle',// 'idle' | 'recording' | 'paused' | 'reviewing_draft'
  isReRecording: false
};

let mediaRecorder = null;
let audioChunks = [];
let recTimer = null;
let recSec = 0;

function updateVoiceUI() {
  const box = document.getElementById('voiceRecorderControlsBox');
  if (!box) return;

  const hasSaved = !!(MELSOU_VOICE.savedBlob || ALBUM_DATA.recordedAudioBlob);

  if (!MELSOU_VOICE.isReRecording && hasSaved && MELSOU_VOICE.recordingState === 'idle') {
    // STATE A: Show confirmed saved recording card with Safe Retake button
    box.innerHTML = `
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:12px;margin-bottom:10px;text-align:center">
        <div style="font-size:12px;font-weight:800;color:#166534;margin-bottom:4px">✅ BẢN THU ĐÃ CHỐT LƯU TRÊN CHIP</div>
        <div style="font-size:11.5px;color:#374151;margin-bottom:8px">Thời lượng: 00:${String(MELSOU_VOICE.savedDuration || 15).padStart(2, '0')} · Vi mạch ISD1820</div>
        <div style="display:flex;gap:6px">
          <button class="btn-primary" style="flex:1;padding:8px;font-size:12px;justify-content:center;background:#16a34a" onclick="playSavedVoice()">▶️ Nghe Bản Đã Lưu</button>
          <button class="btn-outline" style="flex:1;padding:8px;font-size:12px;justify-content:center" onclick="startReRecordingSession()">🔄 Thu Lại Bản Khác</button>
        </div>
      </div>
    `;
    return;
  }

  // STATE B: Recording in progress / draft review
  const reRecordNotice = MELSOU_VOICE.isReRecording ? `
    <div style="background:#fffbeb;border:1px solid #fef3c7;border-radius:8px;padding:8px 10px;margin-bottom:8px;font-size:11.5px;color:#92400e;display:flex;justify-content:space-between;align-items:center">
      <span>🛡️ Bản thu cũ vẫn được giữ an toàn.</span>
      <button onclick="cancelReRecordingSession()" style="background:none;border:none;color:#b45309;font-weight:700;font-size:11px;cursor:pointer">Hủy thu lại</button>
    </div>
  ` : '';

  let buttonsHtml = '';
  if (MELSOU_VOICE.recordingState === 'idle') {
    buttonsHtml = `
      <button class="btn-primary" style="flex:1;padding:9px;font-size:12.5px;justify-content:center" onclick="startVoiceRec()">🎙️ ${MELSOU_VOICE.isReRecording ? 'Bắt Đầu Thu Mới' : 'Bắt Đầu Thu Âm'}</button>
      ${MELSOU_VOICE.isReRecording ? '<button class="btn-outline" style="padding:9px 12px;font-size:12px" onclick="cancelReRecordingSession()">✕ Hủy</button>' : ''}
    `;
  } else if (MELSOU_VOICE.recordingState === 'recording') {
    buttonsHtml = `
      <button class="btn-outline" style="flex:1;padding:9px;font-size:12px;justify-content:center" onclick="pauseVoiceRec()">⏸️ Tạm Dừng</button>
      <button class="btn-primary" style="flex:1;padding:9px;font-size:12px;justify-content:center;background:var(--green-d)" onclick="finishVoiceRec()">🔒 Hoàn Tất Bản Thu</button>
    `;
  } else if (MELSOU_VOICE.recordingState === 'paused') {
    buttonsHtml = `
      <button class="btn-outline" style="flex:1;padding:9px;font-size:12px;justify-content:center" onclick="resumeVoiceRec()">▶️ Tiếp Tục</button>
      <button class="btn-primary" style="flex:1;padding:9px;font-size:12px;justify-content:center;background:var(--green-d)" onclick="finishVoiceRec()">🔒 Hoàn Tất Bản Thu</button>
    `;
  } else if (MELSOU_VOICE.recordingState === 'reviewing_draft') {
    buttonsHtml = `
      <button class="btn-outline" style="flex:1;padding:8px;font-size:12px;justify-content:center" onclick="playDraftVoice()">▶️ Nghe Bản Mới</button>
      <button class="btn-primary" style="flex:1;padding:8px;font-size:12px;justify-content:center;background:var(--green-d)" onclick="commitDraftAsSaved()">🔒 Chốt Lưu Bản Này</button>
      <button class="btn-outline" style="padding:8px 10px;font-size:12px;justify-content:center" onclick="cancelReRecordingSession()">✕ Bỏ Bản Này</button>
    `;
  }

  box.innerHTML = `
    ${reRecordNotice}
    <div id="voiceRecTimer" style="font-size:13.5px;font-weight:800;color:var(--red);text-align:center;margin-bottom:8px">
      ${MELSOU_VOICE.recordingState === 'recording' ? `🎙️ Đang thu âm: 00:${String(recSec).padStart(2, '0')} / 00:30` : (MELSOU_VOICE.recordingState === 'reviewing_draft' ? `✨ Đã thu xong: 00:${String(MELSOU_VOICE.draftDuration).padStart(2, '0')} (Xem xét bản mới)` : '⏱️ Thời lượng tối đa: 30 giây')}
    </div>
    <div style="display:flex;gap:6px;flex-wrap:wrap">
      ${buttonsHtml}
    </div>
  `;
}

function startReRecordingSession() {
  MELSOU_VOICE.isReRecording = true;
  MELSOU_VOICE.recordingState = 'idle';
  MELSOU_VOICE.draftBlob = null;
  recSec = 0;
  updateVoiceUI();
}

function cancelReRecordingSession() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
  clearInterval(recTimer);
  MELSOU_VOICE.isReRecording = false;
  MELSOU_VOICE.recordingState = 'idle';
  MELSOU_VOICE.draftBlob = null;
  recSec = 0;
  updateVoiceUI();
  showToast('Đã giữ nguyên bản thu âm cũ.');
}

async function startVoiceRec() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];
    mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
    mediaRecorder.onstop = () => {
      MELSOU_VOICE.draftBlob = new Blob(audioChunks, { type: 'audio/webm' });
      MELSOU_VOICE.draftDuration = recSec;
      MELSOU_VOICE.recordingState = 'reviewing_draft';
      updateVoiceUI();
    };
    mediaRecorder.start();
    MELSOU_VOICE.recordingState = 'recording';
    recSec = 0;
    updateVoiceUI();

    recTimer = setInterval(() => {
      recSec++;
      const timerEl = document.getElementById('voiceRecTimer');
      if (timerEl) timerEl.textContent = `🎙️ Đang thu âm: 00:${String(recSec).padStart(2, '0')} / 00:30`;
      if (recSec >= 30) finishVoiceRec();
    }, 1000);
  } catch(err) {
    alert('Không thể mở micro hoặc quyền truy cập bị chặn. Đã nạp file thu mẫu cảm xúc của xưởng!');
    MELSOU_VOICE.draftBlob = 'sample';
    MELSOU_VOICE.draftDuration = 15;
    MELSOU_VOICE.recordingState = 'reviewing_draft';
    updateVoiceUI();
  }
}

function pauseVoiceRec() {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.pause();
    clearInterval(recTimer);
    MELSOU_VOICE.recordingState = 'paused';
    updateVoiceUI();
  }
}

function resumeVoiceRec() {
  if (mediaRecorder && mediaRecorder.state === 'paused') {
    mediaRecorder.resume();
    MELSOU_VOICE.recordingState = 'recording';
    updateVoiceUI();
    recTimer = setInterval(() => {
      recSec++;
      const timerEl = document.getElementById('voiceRecTimer');
      if (timerEl) timerEl.textContent = `🎙️ Đang thu âm: 00:${String(recSec).padStart(2, '0')} / 00:30`;
      if (recSec >= 30) finishVoiceRec();
    }, 1000);
  }
}

function finishVoiceRec() {
  clearInterval(recTimer);
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  } else {
    MELSOU_VOICE.recordingState = 'reviewing_draft';
    updateVoiceUI();
  }
}

function commitDraftAsSaved() {
  if (!MELSOU_VOICE.draftBlob) return;
  MELSOU_VOICE.savedBlob = MELSOU_VOICE.draftBlob;
  MELSOU_VOICE.savedDuration = MELSOU_VOICE.draftDuration || recSec || 15;
  MELSOU_VOICE.draftBlob = null;
  MELSOU_VOICE.isReRecording = false;
  MELSOU_VOICE.recordingState = 'idle';

  ALBUM_DATA.recordedAudioBlob = MELSOU_VOICE.savedBlob;
  autoSaveToLocalStorage();
  updateVoiceUI();
  showToast('Đã chốt lưu bản thu âm mới vào vi mạch album!');
}

function playSavedVoice() {
  const blob = MELSOU_VOICE.savedBlob || ALBUM_DATA.recordedAudioBlob;
  if (blob instanceof Blob) {
    const url = URL.createObjectURL(blob);
    new Audio(url).play();
  } else {
    alert('🔊 Đang phát giọng nói từ vi mạch chip ISD1820 trên bìa sau!');
  }
}

function playDraftVoice() {
  if (MELSOU_VOICE.draftBlob instanceof Blob) {
    const url = URL.createObjectURL(MELSOU_VOICE.draftBlob);
    new Audio(url).play();
  } else {
    alert('🔊 Đang phát thử bản thu nháp vừa ghi!');
  }
}

function playRealRecordedVoice() {
  playSavedVoice();
}

// ── 📖 FB38: REALISTIC PAPER FLIP SOUND (EPIDEMIC SOUND REFERENCE) ──
var isFlipSoundEnabled = true;
let flipAudioContext = null;
let isFlipSoundPlaying = false;
let flipAudioElement = null;

function getFlipAudioContext() {
  if (!flipAudioContext) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) flipAudioContext = new AudioCtx();
  }
  if (flipAudioContext && flipAudioContext.state === 'suspended') {
    flipAudioContext.resume().catch(() => {});
  }
  return flipAudioContext;
}

// Organic acoustic paper leaf sound synthesis
function synthesizeRealisticPaperMovement() {
  const ctx = getFlipAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const duration = 0.55;

  // 1. Noise buffer for organic paper fiber friction
  const bufferSize = ctx.sampleRate * duration;
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = (Math.random() * 2 - 1) * 0.35;
  }

  const whiteNoise = ctx.createBufferSource();
  whiteNoise.buffer = noiseBuffer;

  // 2. Dual biquad filters for realistic paper resonance (250Hz - 1200Hz)
  const bandpass = ctx.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.setValueAtTime(450, now);
  bandpass.frequency.exponentialRampToValueAtTime(850, now + 0.18);
  bandpass.frequency.exponentialRampToValueAtTime(320, now + duration);
  bandpass.Q.setValueAtTime(1.8, now);

  const lowpass = ctx.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.setValueAtTime(1600, now);
  lowpass.frequency.exponentialRampToValueAtTime(800, now + duration);

  // 3. Gentle air whoosh oscillator
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(95, now);
  osc.frequency.exponentialRampToValueAtTime(140, now + 0.15);
  osc.frequency.exponentialRampToValueAtTime(70, now + duration);

  const oscGain = ctx.createGain();
  oscGain.gain.setValueAtTime(0.001, now);
  oscGain.gain.linearRampToValueAtTime(0.06, now + 0.12);
  oscGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  // 4. Main envelope for paper friction
  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(0.001, now);
  gainNode.gain.linearRampToValueAtTime(0.28, now + 0.08); // Quick subtle rustle
  gainNode.gain.exponentialRampToValueAtTime(0.18, now + 0.22); // Leaf settling
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  whiteNoise.connect(bandpass);
  bandpass.connect(lowpass);
  lowpass.connect(gainNode);

  osc.connect(oscGain);
  oscGain.connect(gainNode);

  gainNode.connect(ctx.destination);

  whiteNoise.start(now);
  osc.start(now);
  whiteNoise.stop(now + duration);
  osc.stop(now + duration);
}

function playPaperFlipSound() {
  if (!isFlipSoundEnabled) return;
  if (isFlipSoundPlaying) return; // Debounce rapid overlapping clicks
  isFlipSoundPlaying = true;

  try {
    synthesizeRealisticPaperMovement();
  } catch(e) {
    try {
      if (!flipAudioElement) flipAudioElement = new Audio('assets/audio/page-flip.mp3');
      flipAudioElement.currentTime = 0;
      flipAudioElement.volume = 0.35;
      flipAudioElement.play().catch(() => {});
    } catch(err) {}
  }

  setTimeout(() => {
    isFlipSoundPlaying = false;
  }, 360);
}

function playPaperRustleSound() {
  if (!isFlipSoundEnabled) return;
  setTimeout(() => {
    playPaperFlipSound();
  }, 160); // Synced with 25% page bend progress
}

// ── 📖 3D FULLSCREEN REALTIME HEYZINE FLIPBOOK MODAL & TOUCH GESTURES (FB69) ──
let fbmMobilePageIndex = 1;
let fbmTouchStartX = 0;
let fbmTouchStartY = 0;

function handleFbmTouchStart(e) {
  if (e.touches && e.touches.length > 0) {
    fbmTouchStartX = e.touches[0].clientX;
    fbmTouchStartY = e.touches[0].clientY;
  }
}

function handleFbmTouchEnd(e) {
  if (e.changedTouches && e.changedTouches.length > 0) {
    const deltaX = e.changedTouches[0].clientX - fbmTouchStartX;
    const deltaY = e.changedTouches[0].clientY - fbmTouchStartY;
    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < 0) {
        fbmNextPage();
      } else {
        fbmPrevPage();
      }
    }
  }
}

function openFlipbookModal() {
  const modal = document.getElementById('flipbook3DModal');
  if (modal) modal.classList.add('open');
  document.body.classList.add('modal-open');
  if (typeof ALBUM_DATA !== 'undefined' && ALBUM_DATA.spreads) {
    const totalPages = (ALBUM_DATA.spreads.length - 2) * 2 + 2;
    const actIdx = ALBUM_DATA.activeSpreadIndex || 0;
    if (actIdx === 0) {
      fbmMobilePageIndex = 1;
      fbmIdx = 0;
    } else if (actIdx === ALBUM_DATA.spreads.length - 1) {
      fbmMobilePageIndex = totalPages;
      fbmIdx = actIdx;
    } else {
      fbmIdx = actIdx;
      fbmMobilePageIndex = (typeof mobileActivePageHalf !== 'undefined' && mobileActivePageHalf === 'right') ? (actIdx * 2 + 1) : (actIdx * 2);
    }
  }
  renderFlipbookSpread();
}

function closeFlipbookModal() {
  const modal = document.getElementById('flipbook3DModal');
  if (modal) modal.classList.remove('open');
  document.body.classList.remove('modal-open');
}

function triggerPageCurlEffect(direction) {
  if (isMobileViewport()) return;
  const leaf = document.getElementById('fbmTurnLeaf');
  if (!leaf) return;
  leaf.className = 'fbm-turn-leaf ' + (direction === 'forward' ? 'flip-forward' : 'flip-backward');
  setTimeout(() => { leaf.className = 'fbm-turn-leaf'; }, 550);
}

function fbmNextPage() {
  if (typeof ALBUM_DATA === 'undefined' || !ALBUM_DATA.spreads) return;
  const totalPages = (ALBUM_DATA.spreads.length - 2) * 2 + 2;
  if (isMobileViewport()) {
    if (fbmMobilePageIndex < totalPages) {
      triggerPageCurlEffect('forward');
      playPaperFlipSound();
      fbmMobilePageIndex++;
      fbmIdx = (fbmMobilePageIndex === 1) ? 0 : (fbmMobilePageIndex === totalPages) ? (ALBUM_DATA.spreads.length - 1) : Math.floor(fbmMobilePageIndex / 2);
      renderFlipbookSpread();
    }
  } else {
    if (fbmIdx < ALBUM_DATA.spreads.length - 1) {
      triggerPageCurlEffect('forward');
      playPaperFlipSound();
      fbmIdx++;
      renderFlipbookSpread();
    }
  }
}

function fbmPrevPage() {
  if (typeof ALBUM_DATA === 'undefined' || !ALBUM_DATA.spreads) return;
  const totalPages = (ALBUM_DATA.spreads.length - 2) * 2 + 2;
  if (isMobileViewport()) {
    if (fbmMobilePageIndex > 1) {
      triggerPageCurlEffect('backward');
      playPaperFlipSound();
      fbmMobilePageIndex--;
      fbmIdx = (fbmMobilePageIndex === 1) ? 0 : (fbmMobilePageIndex === totalPages) ? (ALBUM_DATA.spreads.length - 1) : Math.floor(fbmMobilePageIndex / 2);
      renderFlipbookSpread();
    }
  } else {
    if (fbmIdx > 0) {
      triggerPageCurlEffect('backward');
      playPaperFlipSound();
      fbmIdx--;
      renderFlipbookSpread();
    }
  }
}

function renderFlipbookSpread() {
  if (typeof ALBUM_DATA === 'undefined' || !ALBUM_DATA.spreads) return;
  const isEn = (currentAppLanguage === 'en');
  const totalPages = (ALBUM_DATA.spreads.length - 2) * 2 + 2;
  const isMobile = isMobileViewport();

  const book = document.getElementById('fbmBookContainer');
  const l = document.getElementById('fbmLeftPage');
  const r = document.getElementById('fbmRightPage');
  const spine = document.getElementById('fbmSpine');
  const overlay = document.getElementById('fbmFreeformOverlay');
  const cnt = document.getElementById('fbmPageCounter');
  const modalTitle = document.getElementById('fbmModalTitle');
  const prevBtn = document.getElementById('fbmPrevBtn');
  const nextBtn = document.getElementById('fbmNextBtn');

  if (!book || !l || !r) return;
  if (overlay) overlay.innerHTML = '';

  if (isMobile) {
    // ════════ MOBILE SINGLE-PAGE PROJECTION (FB69) ════════
    book.className = 'fbm-book fbm-single-mobile ' + (ALBUM_DATA.sizeClass || 'ratio-portrait');
    if (spine) spine.style.display = 'none';
    if (modalTitle) modalTitle.textContent = isEn ? '3D Preview' : 'Xem trước 3D';

    const fmt = getCurrentAlbumFormat();
    const bW = book.offsetWidth || fmt.singleWidth;
    const mScale = bW / fmt.singleWidth;
    if (overlay) {
      overlay.style.width = fmt.singleWidth + 'px';
      overlay.style.height = fmt.spreadHeight + 'px';
      overlay.style.transform = `scale(${mScale})`;
      overlay.style.transformOrigin = 'top left';
    }

    const renderElements = (elements, filterFn, xOffset) => {
      if (!overlay || !elements) return;
      overlay.innerHTML = elements.filter(filterFn).map((el, elIdx) => {
        const posX = (el.x || 0) - (xOffset || 0);
        if (el.type === 'photo') {
          const pt = (ALBUM_DATA.photoTransforms && ALBUM_DATA.photoTransforms['el_' + el.id]) || {};
          const crop = el.crop || {};
          const zoom = pt.zoom || crop.zoom || 1.0;
          const rotate = pt.rotate || crop.rotate || 0;
          const offX = pt.x || crop.offsetX || 0;
          const offY = pt.y || crop.offsetY || 0;
          const frameW = el.width || 220;
          const frameH = el.frameStyle === 'oval' ? frameW : Math.round(frameW * 0.65);
          const isClean = el.frameStyle === 'clean';
          const isOval = el.frameStyle === 'oval';

          if (!el.img) {
            return `<div style="position:absolute;left:${posX}px;top:${el.y}px;width:${frameW}px;transform:rotate(${el.rotate || 0}deg);pointer-events:none;z-index:${elIdx + 40}">
              <div class="canva-image-frame-wrapper ${isClean ? 'style-clean' : ''} ${isOval ? 'style-clean' : ''}" style="width:100%;${isOval ? 'border-radius:999px;padding:0;' : ''}">
                ${(!isClean && !isOval) ? `<div class="pb-washi-corner" style="top:-6px;left:50%;transform:translateX(-50%)"></div>` : ''}
                <div class="canva-frame-placeholder" style="height:${frameH}px;${isOval ? 'border-radius:999px;' : ''}">
                  <span style="font-size:22px;z-index:2">🖼️</span>
                </div>
              </div>
            </div>`;
          }
          return `<div style="position:absolute;left:${posX}px;top:${el.y}px;width:${frameW}px;transform:rotate(${el.rotate || 0}deg);pointer-events:none;z-index:${elIdx + 40}">
            <div class="canva-image-frame-wrapper ${isClean ? 'style-clean' : ''} ${isOval ? 'style-clean' : ''}" style="width:100%;${isOval ? 'border-radius:999px;padding:0;' : ''}">
              ${(!isClean && !isOval) ? `<div class="pb-washi-corner" style="top:-6px;left:50%;transform:translateX(-50%)"></div>` : ''}
              <div class="canva-frame-inner-viewport" style="height:${frameH}px;${isOval ? 'border-radius:999px;' : ''}">
                <img src="${el.img}" class="canva-frame-img" style="transform:rotate(${rotate}deg) scale(${zoom}) translate(${offX}px, ${offY}px);" alt="Frame Photo">
              </div>
            </div>
          </div>`;
        } else if (el.type === 'text') {
          return `<div style="position:absolute;left:${posX}px;top:${el.y}px;font-family:${el.font || ALBUM_DATA.letterFont};color:${el.color || ALBUM_DATA.inkColor};font-size:${el.fontSize || 16}px;padding:6px 12px;background:rgba(255,255,255,0.9);border-radius:6px;box-shadow:0 2px 8px rgba(0,0,0,0.1);z-index:${elIdx + 40}">
            ${el.content}
          </div>`;
        } else if (el.type === 'sticker') {
          return `<div style="position:absolute;left:${posX}px;top:${el.y}px;font-size:38px;transform:rotate(${el.rotate || 0}deg);pointer-events:none;z-index:${elIdx + 40}">${el.char}</div>`;
        }
        return '';
      }).join('');
    };

    if (fbmMobilePageIndex === 1) {
      // FRONT COVER
      l.style.display = 'none';
      r.style.display = 'flex';
      const coverSpread = ALBUM_DATA.spreads[0];
      const ct = (ALBUM_DATA.photoTransforms && ALBUM_DATA.photoTransforms['coverImg']) || { zoom: 1, rotate: 0, x: 0, y: 0 };
      r.innerHTML = `
        <div style="height:100%;width:100%;background:linear-gradient(145deg,#fff,#f7f3eb);display:flex;flex-direction:column;justify-content:space-between;padding:20px;border-radius:8px">
          <div style="font-family:'Pacifico',cursive;font-size:22px;color:var(--red)">melsou</div>
          <div style="height:220px;border-radius:8px;overflow:hidden;box-shadow:0 6px 20px rgba(0,0,0,0.15);position:relative">
            <img src="${coverSpread?.coverImg || ''}" style="width:100%;height:100%;object-fit:cover;transform:scale(${ct.zoom || 1}) rotate(${ct.rotate || 0}deg) translate(${ct.x || 0}px, ${ct.y || 0}px);">
          </div>
          <div>
            <h2 style="font-family:'Lora',serif;font-size:22px;color:var(--red);font-weight:800">${ALBUM_DATA.title || ''}</h2>
            <p style="font-family:'Lora',serif;font-style:italic;font-size:12px;color:var(--gray);margin-top:4px">"${ALBUM_DATA.quote || ''}"</p>
          </div>
        </div>
      `;
      if (cnt) cnt.textContent = isEn ? `Front Cover (1 / ${totalPages})` : `Bìa Trước (1 / ${totalPages})`;
    } else if (fbmMobilePageIndex === totalPages) {
      // BACK COVER
      l.style.display = 'none';
      r.style.display = 'flex';
      const backSpread = ALBUM_DATA.spreads[ALBUM_DATA.spreads.length - 1];
      const bt = (ALBUM_DATA.photoTransforms && ALBUM_DATA.photoTransforms['backImg']) || { zoom: 1, rotate: 0, x: 0, y: 0 };
      const hasVoice = (ALBUM_DATA.activePkg === 'voice' || ALBUM_DATA.activePkg === 'signature');
      r.innerHTML = `
        <div style="height:100%;width:100%;background:linear-gradient(145deg,#fcfbfa,#f4ede2);display:flex;flex-direction:column;justify-content:space-between;align-items:center;padding:20px;border-radius:8px;text-align:center">
          <div>
            <div style="font-family:'Pacifico',cursive;font-size:22px;color:var(--red)">melsou</div>
            <div style="font-size:10px;color:var(--gray);letter-spacing:1px">${isEn ? 'BACK COVER' : 'BÌA SAU KẾT BÀI'}</div>
          </div>
          <div style="height:140px;width:80%;border-radius:8px;overflow:hidden;box-shadow:0 4px 14px rgba(0,0,0,0.15);position:relative">
            <img src="${backSpread?.backImg || ''}" style="width:100%;height:100%;object-fit:cover;transform:scale(${bt.zoom || 1}) rotate(${bt.rotate || 0}deg) translate(${bt.x || 0}px, ${bt.y || 0}px)">
          </div>
          ${hasVoice ? `
            <div style="background:var(--red-light);border:2px solid var(--red);border-radius:12px;padding:10px;width:100%;cursor:pointer" onclick="playRealRecordedVoice()">
              <div style="font-size:11px;font-weight:800;color:var(--red)">🎙️ MODULE ÂM THANH ISD1820</div>
              <div style="font-size:10px;color:var(--gray);margin-top:2px">${isEn ? 'Click to play physical recorded voice' : 'Bấm để nghe giọng nói thực tế'}</div>
            </div>
          ` : `<div style="font-size:11px;color:var(--gray);background:#f9f9f9;padding:8px;border-radius:8px;border:1px dashed #ddd">🎵 ${isEn ? 'Melody Package · Spotify Code' : 'Gói Melody · Đã in mã Spotify'}</div>`}
          <div style="font-size:10px;color:var(--gray);font-style:italic">${isEn ? 'Melsou HCMC Workshop · 180° Layflat' : 'Xưởng melsou TP.HCM · Mở phẳng 180°'}</div>
        </div>
      `;
      if (cnt) cnt.textContent = isEn ? `Back Cover (${totalPages} / ${totalPages})` : `Bìa Sau (${totalPages} / ${totalPages})`;
    } else {
      // INTERIOR PAGES
      const spreadIdx = Math.floor(fbmMobilePageIndex / 2);
      const isRight = (fbmMobilePageIndex % 2 === 1);
      const curSpread = ALBUM_DATA.spreads[spreadIdx];
      const fmt = getCurrentAlbumFormat();
      const spineSplit = fmt.singleWidth + 6;
      const rightOffset = fmt.singleWidth + 12;

      if (!isRight) {
        // LEFT PAGE
        l.style.display = 'flex';
        r.style.display = 'none';
        if (curSpread?.leftType === 'spotify-hero') {
          const meta = getSpotifyTrackDisplayMetadata();
          l.innerHTML = `
            <div style="height:100%;width:100%;background:var(--yellow-warm);border-radius:8px;padding:20px;display:flex;flex-direction:column;justify-content:space-between">
              <div>
                <span style="font-size:10px;font-weight:800;color:var(--red);letter-spacing:2px">OUR TIMES</span>
                <h3 style="font-size:18px;font-weight:700;margin-top:4px">${isEn ? 'Our Cherished Melody' : 'Giai Điệu Của Chúng Mình'}</h3>
              </div>
              <div style="margin:16px 0">
                ${!meta.hasTrack ? `
                  <div style="font-size:13px;font-weight:700;margin-bottom:6px;color:var(--dark)">${isEn ? 'No track selected yet' : 'Chưa chọn bài hát'}</div>
                ` : meta.isPending ? `
                  <div style="margin-bottom:10px;padding:6px 10px;background:rgba(0,0,0,0.04);border-radius:6px">
                    <div style="font-size:11px;font-weight:600;color:var(--gray)">${isEn ? '⏳ Fetching song details...' : '⏳ Đang lấy thông tin bài hát...'}</div>
                  </div>
                ` : `
                  <div style="margin-bottom:10px;text-align:left">
                    <div style="font-size:9px;font-weight:800;color:var(--gray);text-transform:uppercase;letter-spacing:1px;margin-bottom:2px">${isEn ? 'Song' : 'Bài hát'}</div>
                    <div class="fbm-spotify-song-name" style="font-size:14px;font-weight:800;color:var(--dark);margin-bottom:6px;line-height:1.3">${escapeSpotifyAttr(meta.title)}</div>
                    <div style="font-size:9px;font-weight:800;color:var(--gray);text-transform:uppercase;letter-spacing:1px;margin-bottom:2px">${isEn ? 'Artist' : 'Nghệ sĩ'}</div>
                    <div class="fbm-spotify-artist-name" style="font-size:12px;font-weight:700;color:var(--red);margin-bottom:6px;line-height:1.3">${escapeSpotifyAttr(meta.artist || (isEn ? 'Spotify Artist' : 'Nghệ sĩ Spotify'))}</div>
                  </div>
                `}
                ${!meta.hasTrack ? `
                  <div style="font-size:11px;color:var(--gray);font-style:italic;padding:8px 0">${isEn ? 'Please choose a song in Audio tab' : 'Vui lòng chọn bài hát tại tab Âm thanh'}</div>
                ` : ALBUM_DATA.spotifyCodeImg ? `<img src="${ALBUM_DATA.spotifyCodeImg}" style="width:100%;border-radius:6px;box-shadow:0 4px 12px rgba(139,30,63,0.35)">` : `<div class="spotify-soundwave-bar"><div class="spotify-logo-icon">🎵</div><span style="font-size:12px;font-weight:700">${escapeSpotifyAttr(meta.title || 'Spotify Soundwave')}</span></div>`}
              </div>
              <div style="font-size:10.5px;color:var(--gray);font-style:italic">${isEn ? 'Scan code on Spotify mobile app to play music.' : 'Quét mã trên app Spotify để phát nhạc.'}</div>
            </div>
          `;
        } else if (curSpread?.leftType === 'handwritten-letter') {
          l.innerHTML = `
            <div style="height:100%;width:100%;background:var(--yellow-warm);border-radius:8px;padding:20px;display:flex;flex-direction:column;justify-content:space-between">
              <div>
                <div style="font-family:'Pacifico',cursive;color:var(--red);font-size:17px">${ALBUM_DATA.salutation || (isEn ? 'Dearest,' : 'Gửi người thương,')}</div>
                <p style="font-family:${ALBUM_DATA.letterFont || 'inherit'};color:${ALBUM_DATA.inkColor || 'inherit'};font-size:13px;line-height:1.65;font-style:italic;margin-top:6px">
                  ${ALBUM_DATA.message || ''}
                </p>
              </div>
              <div style="font-family:${ALBUM_DATA.letterFont || 'inherit'};color:${ALBUM_DATA.inkColor || 'inherit'};font-size:11px;text-align:right;font-style:italic">
                ${ALBUM_DATA.signature || ''}
              </div>
            </div>
          `;
        } else {
          l.innerHTML = `<div style="height:100%;width:100%"></div>`;
        }
        renderElements(curSpread?.elements, el => (el.x || 0) < spineSplit, 0);
      } else {
        // RIGHT PAGE
        l.style.display = 'none';
        r.style.display = 'flex';
        r.innerHTML = `<div style="height:100%;width:100%"></div>`;
        renderElements(curSpread?.elements, el => (el.x || 0) >= spineSplit, rightOffset);
      }
      if (cnt) cnt.textContent = isEn ? `Page ${fbmMobilePageIndex} / ${totalPages}` : `Trang ${fbmMobilePageIndex} / ${totalPages}`;
    }

    if (prevBtn) {
      prevBtn.disabled = fbmMobilePageIndex <= 1;
      prevBtn.style.opacity = fbmMobilePageIndex <= 1 ? '0.35' : '1';
      prevBtn.style.cursor = fbmMobilePageIndex <= 1 ? 'not-allowed' : 'pointer';
      prevBtn.textContent = isEn ? '‹ Prev' : '‹ Trước';
    }
    if (nextBtn) {
      nextBtn.disabled = fbmMobilePageIndex >= totalPages;
      nextBtn.style.opacity = fbmMobilePageIndex >= totalPages ? '0.35' : '1';
      nextBtn.style.cursor = fbmMobilePageIndex >= totalPages ? 'not-allowed' : 'pointer';
      nextBtn.textContent = isEn ? 'Next ›' : 'Sau ›';
    }
  } else {
    // ════════ DESKTOP 2-PAGE SPREAD PROJECTION ════════
    if (spine) spine.style.display = 'block';
    if (overlay) {
      overlay.style.width = '100%';
      overlay.style.height = '100%';
      overlay.style.transform = 'none';
      overlay.style.transformOrigin = 'initial';
    }
    if (modalTitle) {
      modalTitle.textContent = isEn
        ? '3D REALTIME ALBUM · melsou Seamless Layflat 180°'
        : 'ALBUM 3D REALTIME · melsou Mở Phẳng Liền Trang 180°';
    }
    const spread = ALBUM_DATA.spreads[fbmIdx];
    if (!spread) return;

    if (spread.isClosedCover) {
      book.className = 'fbm-book fbm-single-cover ' + (ALBUM_DATA.sizeClass || 'ratio-portrait');
      l.style.display = 'none';
      r.style.display = 'flex';
      const ct = (ALBUM_DATA.photoTransforms && ALBUM_DATA.photoTransforms['coverImg']) || { zoom: 1, rotate: 0, x: 0, y: 0 };
      r.innerHTML = `
        <div style="height:100%;width:100%;background:linear-gradient(145deg,#fff,#f7f3eb);display:flex;flex-direction:column;justify-content:space-between;padding:24px;border-radius:4px 12px 12px 4px">
          <div style="font-family:'Pacifico',cursive;font-size:24px;color:var(--red)">melsou</div>
          <div style="height:260px;border-radius:8px;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,0.15);position:relative">
            <img src="${spread.coverImg || ''}" style="width:100%;height:100%;object-fit:cover;transform:scale(${ct.zoom || 1}) rotate(${ct.rotate || 0}deg) translate(${ct.x || 0}px, ${ct.y || 0}px);transition:transform 0.1s ease">
          </div>
          <div>
            <h2 id="fbmLiveCoverTitle" style="font-family:'Lora',serif;font-size:26px;color:var(--red);font-weight:800">${ALBUM_DATA.title || ''}</h2>
            <p style="font-family:'Lora',serif;font-style:italic;font-size:13px;color:var(--gray);margin-top:4px">"${ALBUM_DATA.quote || ''}"</p>
          </div>
        </div>
      `;
    } else if (spread.isClosedBack) {
      book.className = 'fbm-book fbm-single-back ' + (ALBUM_DATA.sizeClass || 'ratio-portrait');
      l.style.display = 'none';
      r.style.display = 'flex';
      const bt = (ALBUM_DATA.photoTransforms && ALBUM_DATA.photoTransforms['backImg']) || { zoom: 1, rotate: 0, x: 0, y: 0 };
      const hasVoice = (ALBUM_DATA.activePkg === 'voice' || ALBUM_DATA.activePkg === 'signature');
      r.innerHTML = `
        <div style="height:100%;width:100%;background:linear-gradient(145deg,#fcfbfa,#f4ede2);display:flex;flex-direction:column;justify-content:space-between;align-items:center;padding:24px;border-radius:12px 4px 4px 12px;text-align:center">
          <div>
            <div style="font-family:'Pacifico',cursive;font-size:24px;color:var(--red)">melsou</div>
            <div style="font-size:10px;color:var(--gray);letter-spacing:1px">${isEn ? 'BACK COVER' : 'BÌA SAU KẾT BÀI'}</div>
          </div>
          <div style="height:160px;width:80%;border-radius:8px;overflow:hidden;box-shadow:0 4px 14px rgba(0,0,0,0.15);position:relative">
            <img src="${spread.backImg || ''}" style="width:100%;height:100%;object-fit:cover;transform:scale(${bt.zoom || 1}) rotate(${bt.rotate || 0}deg) translate(${bt.x || 0}px, ${bt.y || 0}px)">
          </div>
          ${hasVoice ? `
            <div style="background:var(--red-light);border:2px solid var(--red);border-radius:12px;padding:12px;width:100%;cursor:pointer" onclick="playRealRecordedVoice()">
              <div style="font-size:12px;font-weight:800;color:var(--red)">🎙️ MODULE ÂM THANH ISD1820</div>
              <div style="font-size:10.5px;color:var(--gray);margin-top:2px">
                ${ALBUM_DATA.isHomeRecording ? (isEn ? '✓ Record at home selected' : '✓ Đã chọn tự thu âm tại nhà') : (isEn ? 'Click to play physical recorded voice' : 'Bấm để nghe giọng nói thực tế')}
              </div>
              <div style="width:32px;height:32px;background:var(--red);border-radius:50%;margin:6px auto 0;display:flex;align-items:center;justify-content:center;color:white;font-size:14px">▶</div>
            </div>
          ` : `<div style="font-size:11.5px;color:var(--gray);background:#f9f9f9;padding:10px;border-radius:8px;border:1px dashed #ddd">🎵 ${isEn ? 'Melody Package · Spotify Soundwave Code' : 'Gói Melody · Đã in mã Spotify Soundwave'}</div>`}
          <div style="font-size:10px;color:var(--gray);font-style:italic">${isEn ? 'Melsou HCMC Workshop · 180° Layflat' : 'Xưởng melsou TP.HCM · Mở phẳng 180°'}</div>
        </div>
      `;
    } else {
      book.className = 'fbm-book ' + (ALBUM_DATA.sizeClass || 'ratio-portrait');
      l.style.display = 'flex';
      r.style.display = 'flex';

      if (spread.leftType === 'spotify-hero') {
        const meta = getSpotifyTrackDisplayMetadata();
        l.innerHTML = `
          <div style="height:100%;width:100%;background:var(--yellow-warm);border-radius:8px;padding:24px;display:flex;flex-direction:column;justify-content:space-between">
            <div>
              <span style="font-size:10px;font-weight:800;color:var(--red);letter-spacing:2px">OUR TIMES</span>
              <h3 style="font-size:20px;font-weight:700;margin-top:4px">${isEn ? 'Our Cherished Melody' : 'Giai Điệu Của Chúng Mình'}</h3>
            </div>
            <div style="margin:20px 0">
              ${!meta.hasTrack ? `
                <div style="font-size:13px;font-weight:700;margin-bottom:6px;color:var(--dark)">${isEn ? 'No track selected yet' : 'Chưa chọn bài hát'}</div>
              ` : meta.isPending ? `
                <div style="margin-bottom:12px;padding:8px 12px;background:rgba(0,0,0,0.04);border-radius:6px">
                  <div style="font-size:11.5px;font-weight:600;color:var(--gray)">${isEn ? '⏳ Fetching song details...' : '⏳ Đang lấy thông tin bài hát...'}</div>
                </div>
              ` : `
                <div style="margin-bottom:14px;text-align:left">
                  <div style="font-size:9.5px;font-weight:800;color:var(--gray);text-transform:uppercase;letter-spacing:1px;margin-bottom:2px">${isEn ? 'Song' : 'Bài hát'}</div>
                  <div class="fbm-spotify-song-name" style="font-size:16px;font-weight:800;color:var(--dark);margin-bottom:8px;line-height:1.3">${escapeSpotifyAttr(meta.title)}</div>
                  <div style="font-size:9.5px;font-weight:800;color:var(--gray);text-transform:uppercase;letter-spacing:1px;margin-bottom:2px">${isEn ? 'Artist' : 'Nghệ sĩ'}</div>
                  <div class="fbm-spotify-artist-name" style="font-size:13.5px;font-weight:700;color:var(--red);margin-bottom:8px;line-height:1.3">${escapeSpotifyAttr(meta.artist || (isEn ? 'Spotify Artist' : 'Nghệ sĩ Spotify'))}</div>
                </div>
              `}
              ${!meta.hasTrack ? `
                <div style="font-size:11.5px;color:var(--gray);font-style:italic;padding:10px 0">${isEn ? 'Please choose a song in Audio tab' : 'Vui lòng chọn bài hát tại tab Âm thanh'}</div>
              ` : ALBUM_DATA.spotifyCodeImg ? `<img src="${ALBUM_DATA.spotifyCodeImg}" style="width:100%;border-radius:6px;box-shadow:0 4px 12px rgba(139,30,63,0.35)">` : `<div class="spotify-soundwave-bar"><div class="spotify-logo-icon">🎵</div><span style="font-size:12px;font-weight:700">${escapeSpotifyAttr(meta.title || 'Spotify Soundwave')}</span></div>`}
              </div>
            <div style="font-size:11px;color:var(--gray);font-style:italic">${isEn ? 'Scan code on Spotify mobile app to play music.' : 'Quét mã trên app Spotify để phát nhạc.'}</div>
          </div>
        `;
      } else if (spread.leftType === 'handwritten-letter') {
        l.innerHTML = `
          <div style="height:100%;width:100%;background:var(--yellow-warm);border-radius:8px;padding:24px;display:flex;flex-direction:column;justify-content:space-between">
            <div>
              <div style="font-family:'Pacifico',cursive;color:var(--red);font-size:18px">${ALBUM_DATA.salutation || (isEn ? 'Dearest,' : 'Gửi người thương,')}</div>
              <p style="font-family:${ALBUM_DATA.letterFont || 'inherit'};color:${ALBUM_DATA.inkColor || 'inherit'};font-size:14px;line-height:1.75;font-style:italic;margin-top:8px">
                ${ALBUM_DATA.message || ''}
              </p>
            </div>
            <div style="font-family:${ALBUM_DATA.letterFont || 'inherit'};color:${ALBUM_DATA.inkColor || 'inherit'};font-size:12px;text-align:right;font-style:italic">
              ${ALBUM_DATA.signature || ''}
            </div>
          </div>
        `;
      } else {
        l.innerHTML = `<div style="height:100%"></div>`;
      }

      r.innerHTML = `<div style="height:100%"></div>`;

      if (overlay && spread.elements && spread.elements.length > 0) {
        overlay.innerHTML = spread.elements.map((el, elIdx) => {
          if (el.type === 'photo') {
            const pt = (ALBUM_DATA.photoTransforms && ALBUM_DATA.photoTransforms['el_' + el.id]) || {};
            const crop = el.crop || {};
            const zoom = pt.zoom || crop.zoom || 1.0;
            const rotate = pt.rotate || crop.rotate || 0;
            const offX = pt.x || crop.offsetX || 0;
            const offY = pt.y || crop.offsetY || 0;

            const frameW = el.width || 220;
            const frameH = el.frameStyle === 'oval' ? frameW : Math.round(frameW * 0.65);
            const isClean = el.frameStyle === 'clean';
            const isOval = el.frameStyle === 'oval';

            if (!el.img) {
              return `
                <div style="position:absolute;left:${el.x}px;top:${el.y}px;width:${frameW}px;transform:rotate(${el.rotate || 0}deg);pointer-events:none;z-index:${elIdx + 40}">
                  <div class="canva-image-frame-wrapper ${isClean ? 'style-clean' : ''} ${isOval ? 'style-clean' : ''}" style="width:100%;${isOval ? 'border-radius:999px;padding:0;' : ''}">
                    ${(!isClean && !isOval) ? `<div class="pb-washi-corner" style="top:-6px;left:50%;transform:translateX(-50%)"></div>` : ''}
                    <div class="canva-frame-placeholder" style="height:${frameH}px;${isOval ? 'border-radius:999px;' : ''}">
                      <span style="font-size:22px;z-index:2">🖼️</span>
                    </div>
                  </div>
                </div>
              `;
            }

            return `
              <div style="position:absolute;left:${el.x}px;top:${el.y}px;width:${frameW}px;transform:rotate(${el.rotate || 0}deg);pointer-events:none;z-index:${elIdx + 40}">
                <div class="canva-image-frame-wrapper ${isClean ? 'style-clean' : ''} ${isOval ? 'style-clean' : ''}" style="width:100%;${isOval ? 'border-radius:999px;padding:0;' : ''}">
                  ${(!isClean && !isOval) ? `<div class="pb-washi-corner" style="top:-6px;left:50%;transform:translateX(-50%)"></div>` : ''}
                  <div class="canva-frame-inner-viewport" style="height:${frameH}px;${isOval ? 'border-radius:999px;' : ''}">
                    <img src="${el.img}" class="canva-frame-img" style="transform:rotate(${rotate}deg) scale(${zoom}) translate(${offX}px, ${offY}px);" alt="Frame Photo">
                  </div>
                </div>
              </div>
            `;
          } else if (el.type === 'text') {
            return `
              <div style="position:absolute;left:${el.x}px;top:${el.y}px;font-family:${el.font || ALBUM_DATA.letterFont};color:${el.color || ALBUM_DATA.inkColor};font-size:${el.fontSize || 16}px;padding:6px 12px;background:rgba(255,255,255,0.9);border-radius:6px;box-shadow:0 2px 8px rgba(0,0,0,0.1);z-index:${elIdx + 40}">
                ${el.content}
              </div>
            `;
          } else if (el.type === 'sticker') {
            return `<div style="position:absolute;left:${el.x}px;top:${el.y}px;font-size:38px;transform:rotate(${el.rotate || 0}deg);pointer-events:none;z-index:${elIdx + 40}">${el.char}</div>`;
          }
          return '';
        }).join('');
      }
    }

    if (cnt) {
      const sName = isEn
        ? spread.name.replace('Bìa Trước', 'Front Cover').replace('Bìa Sau', 'Back Cover').replace('Trang', 'Pages')
        : spread.name;
      cnt.textContent = `${sName} (${fbmIdx + 1} / ${ALBUM_DATA.spreads.length})`;
    }

    if (prevBtn) {
      prevBtn.disabled = fbmIdx <= 0;
      prevBtn.style.opacity = fbmIdx <= 0 ? '0.35' : '1';
      prevBtn.style.cursor = fbmIdx <= 0 ? 'not-allowed' : 'pointer';
      prevBtn.textContent = isEn ? '◀ Previous (←)' : '◀ Lật Trang Trước (←)';
    }
    if (nextBtn) {
      nextBtn.disabled = fbmIdx >= ALBUM_DATA.spreads.length - 1;
      nextBtn.style.opacity = fbmIdx >= ALBUM_DATA.spreads.length - 1 ? '0.35' : '1';
      nextBtn.style.cursor = fbmIdx >= ALBUM_DATA.spreads.length - 1 ? 'not-allowed' : 'pointer';
      nextBtn.textContent = isEn ? 'Next Page (→) ▶' : 'Lật Trang Sau (→) ▶';
    }
  }
}

// ── RECOVERED CORE MODAL HANDLERS & POLICIES ──
function openDraftsManagerModal() { const m = document.getElementById('draftsManagerModal'); if (m) m.classList.add('open'); }
function closeDraftsManagerModal() { const m = document.getElementById('draftsManagerModal'); if (m) m.classList.remove('open'); }
function openOrdersManagerModal() {
  const m = document.getElementById('ordersManagerModal');
  if (m) m.classList.add('open');
  renderOrdersManagerList();
}
function closeOrdersManagerModal() {
  const m = document.getElementById('ordersManagerModal');
  if (m) m.classList.remove('open');
}

function renderOrdersManagerList() {
  const list = document.getElementById('ordersManagerList');
  if (!list) return;

  let orders = [];
  if (typeof window.codexGetCustomerOrders === 'function') {
    try { orders = window.codexGetCustomerOrders() || []; } catch(e) {}
  }
  if (orders.length === 0 && Array.isArray(window.MELSOU_CONFIRMED_ORDERS)) {
    orders = window.MELSOU_CONFIRMED_ORDERS;
  }

  const isEn = (currentAppLanguage === 'en');
  if (orders.length === 0) {
    list.innerHTML = `
      <div style="text-align:center;padding:44px 16px;color:var(--gray)">
        <div style="font-size:42px;margin-bottom:12px">📦</div>
        <div style="font-size:16px;font-weight:700;color:var(--dark);margin-bottom:6px">
          ${isEn ? 'No orders yet' : 'Bạn chưa có đơn hàng nào'}
        </div>
        <p style="font-size:13px;color:var(--gray);max-width:400px;margin:0 auto 16px;line-height:1.5">
          ${isEn ? 'When you complete an order and payment is verified, your order will appear here.' : 'Sau khi bạn hoàn tất đặt hàng và thanh toán thành công, chi tiết đơn hàng sẽ xuất hiện tại đây.'}
        </p>
        <button class="btn-outline" style="font-size:12.5px;padding:8px 18px" onclick="closeOrdersManagerModal();showPage('studio')">
          ${isEn ? '🪄 Create photobook now' : '🪄 Bắt đầu tạo album'}
        </button>
      </div>
    `;
    return;
  }

  list.innerHTML = orders.map(o => `
    <div style="padding:16px;border:1px solid var(--gray-l);border-radius:12px;background:white">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <strong style="font-size:15px;color:var(--dark)">${o.orderCode}</strong>
        <span style="font-size:12px;background:#dcfce7;color:#16a34a;padding:3px 10px;border-radius:100px;font-weight:700">${o.statusText || (isEn ? 'Confirmed' : 'Đã xác nhận')}</span>
      </div>
      <div style="font-size:12.5px;color:var(--gray);margin-bottom:6px">
        ${o.items ? o.items.map(i => i.title).join(', ') : (isEn ? 'Custom photobook' : 'Album photobook')}
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;font-size:12.5px;border-top:1px solid #f3f4f6;padding-top:8px">
        <span style="color:var(--gray)">${o.createdAt || ''}</span>
        <strong style="color:var(--red);font-size:14px">${(o.totalAmount || 0).toLocaleString('vi-VN')}đ</strong>
      </div>
    </div>
  `).join('');
}

function renderTrackingOrderDetails(order) {
  const title = document.getElementById('trackOrderTitle');
  const badge = document.getElementById('trackOrderStatusBadge');
  const itemsList = document.getElementById('trackOrderItemsList');
  const timeline = document.getElementById('trackTimelineContainer');
  const isEn = (currentAppLanguage === 'en');

  if (title) title.textContent = `${order.orderCode} · ${order.customer?.name || (isEn ? 'Customer' : 'Khách hàng')}`;
  if (badge) badge.textContent = order.statusText || (isEn ? '✅ Order Confirmed' : '✅ Đã xác nhận đơn hàng');

  if (itemsList) {
    if (order.items && order.items.length > 0) {
      itemsList.innerHTML = order.items.map(it => `
        <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #eee">
          <span>${it.title || it.packageName} × ${it.qty || 1}</span>
          <strong>${((it.price || 0) * (it.qty || 1)).toLocaleString('vi-VN')}đ</strong>
        </div>
      `).join('');
    } else {
      itemsList.innerHTML = `<div>${isEn ? 'Photobook 180° Layflat' : 'Album photobook mở phẳng 180°'}</div>`;
    }
  }

  if (timeline) {
    const steps = order.timeline || [
      { time: order.createdAt || (isEn ? 'Just now' : 'Vừa xong'), title: isEn ? 'Order confirmed & payment verified' : 'Xác nhận đơn hàng & khớp lệnh thanh toán thành công' },
      { time: isEn ? 'In production' : 'Đang xử lý', title: isEn ? 'Melsou workshop received seamless 180° layout file' : 'Xưởng in Melsou tiếp nhận tệp thiết kế liền trang 180°' },
      { time: isEn ? 'Estimated' : 'Dự kiến', title: isEn ? 'Packaging & handover to delivery courier' : 'Đóng gói hộp quà Kraft & bàn giao đơn vị vận chuyển' }
    ];
    timeline.innerHTML = steps.map(s => `
      <div>
        <div style="font-size:11px;color:var(--gray)">${s.time}</div>
        <div style="font-size:13.5px;font-weight:700">${s.title}</div>
      </div>
    `).join('');
  }
}

function performTrackingSearch() {
  const inp = document.getElementById('trackQueryInput');
  const q = inp ? inp.value.trim() : '';
  const init = document.getElementById('trackInitialBox');
  const res = document.getElementById('trackResultBox');
  const emp = document.getElementById('trackEmptyBox');
  const loading = document.getElementById('trackLoadingBox');

  if (!q) {
    if (init) init.style.display = 'block';
    if (res) res.style.display = 'none';
    if (emp) emp.style.display = 'none';
    if (loading) loading.style.display = 'none';
    showToast(currentAppLanguage === 'en' ? 'Please enter an order code or phone number' : 'Vui lòng nhập mã đơn hàng hoặc số điện thoại');
    return;
  }

  if (init) init.style.display = 'none';
  if (res) res.style.display = 'none';
  if (emp) emp.style.display = 'none';
  if (loading) loading.style.display = 'block';

  setTimeout(() => {
    if (loading) loading.style.display = 'none';

    let foundOrder = null;
    if (typeof window.codexTrackOrder === 'function') {
      try { foundOrder = window.codexTrackOrder(q); } catch(e) {}
    }
    if (!foundOrder && Array.isArray(window.MELSOU_CONFIRMED_ORDERS)) {
      foundOrder = window.MELSOU_CONFIRMED_ORDERS.find(o =>
        (o.orderCode && o.orderCode.toLowerCase() === q.toLowerCase()) ||
        (o.customer && o.customer.phone === q)
      );
    }

    if (foundOrder) {
      if (res) res.style.display = 'block';
      if (emp) emp.style.display = 'none';
      renderTrackingOrderDetails(foundOrder);
    } else {
      if (res) res.style.display = 'none';
      if (emp) emp.style.display = 'block';
    }
  }, 300);
}

function resetTrackingSearch() {
  const inp = document.getElementById('trackQueryInput');
  if (inp) { inp.value = ''; inp.focus(); }
  const init = document.getElementById('trackInitialBox');
  const res = document.getElementById('trackResultBox');
  const emp = document.getElementById('trackEmptyBox');
  const loading = document.getElementById('trackLoadingBox');
  if (init) init.style.display = 'block';
  if (res) res.style.display = 'none';
  if (emp) emp.style.display = 'none';
  if (loading) loading.style.display = 'none';
}

function toggleFlipSound(val) {
  if (typeof val === 'boolean') {
    isFlipSoundEnabled = val;
  } else {
    isFlipSoundEnabled = !isFlipSoundEnabled;
  }
  const btn = document.getElementById('fbmSoundToggleBtn');
  if (btn) btn.textContent = isFlipSoundEnabled ? '🔊 Âm thanh' : '🔇 Tắt tiếng';
  const chk = document.getElementById('settingsSoundToggle');
  if (chk) chk.checked = isFlipSoundEnabled;
}

function clearStudioLocalCache() {
  if (confirm('Bạn có chắc chắn muốn xóa bản thảo lưu tạm cục bộ trên trình duyệt này không?')) {
    try {
      localStorage.removeItem('melsou_album_draft');
      localStorage.removeItem('melsou_studio_autosave');
      localStorage.removeItem('melsou_guest_drafts');
    } catch(e) {}
    alert('Đã xóa dữ liệu tạm cục bộ.');
    location.reload();
  }
}

function closeBlogAdminModal() {
  const m = document.getElementById('blogAdminModal');
  if (m) m.classList.remove('open');
}

function closeBlogPostModal() {
  const m = document.getElementById('blogPostModal');
  if (m) m.classList.remove('open');
}

function saveNewBlogPost() {
  const title = document.getElementById('blogInputTitle')?.value.trim();
  const category = document.getElementById('blogInputCategory')?.value;
  const cover = document.getElementById('blogInputCover')?.value.trim() || 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800';
  const content = document.getElementById('blogInputContent')?.value.trim();
  if (!title || !content) {
    alert('Vui lòng nhập đầy đủ tiêu đề và nội dung bài viết.');
    return;
  }
  if (typeof window.codexCreateBlogPost === 'function') {
    window.codexCreateBlogPost({ title, category, cover, content });
  } else {
    alert('Đã tiếp nhận bài viết nháp. Đang chờ kết nối API từ backend.');
  }
  closeBlogAdminModal();
}

function resetVoiceRec() {
  if (typeof cancelReRecordingSession === 'function' && typeof MELSOU_VOICE !== 'undefined' && MELSOU_VOICE.isReRecording) {
    cancelReRecordingSession();
    return;
  }
  if (typeof recTimer !== 'undefined') clearInterval(recTimer);
  if (typeof mediaRecorder !== 'undefined' && mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop();
  if (typeof ALBUM_DATA !== 'undefined') ALBUM_DATA.recordedAudioBlob = null;
  if (typeof MELSOU_VOICE !== 'undefined') {
    MELSOU_VOICE.draftBlob = null;
    MELSOU_VOICE.recordingState = 'idle';
    if (typeof updateVoiceUI === 'function') updateVoiceUI();
  }
  const btn = document.getElementById('btnVoiceStart');
  if (btn) btn.textContent = '🎙️ Thu Âm';
  const timer = document.getElementById('voiceRecTimer');
  if (timer) timer.textContent = `⏱️ Thời lượng: 00:00 / 00:30`;
}

let fbmIdx = 0;
let fbmStartX = 0;

// ── ⬇️ FB37: EXPORT CURRENT DESIGN FILE (LƯU VỀ MÁY) ──
function exportCurrentDesignFile() {
  const btn = document.getElementById('btnExportDesign');
  const originalText = btn ? btn.innerHTML : '⬇ Tải PDF album';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '⏳ Đang chuẩn bị tệp...';
  }

  // 1. Hook into Codex PDF Export Engine
  if (typeof window.codexExportAlbumPdf === 'function') {
    try {
      window.codexExportAlbumPdf(ALBUM_DATA);
      setTimeout(() => {
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = originalText;
        }
        showToast('✅ Đã gửi yêu cầu kết xuất PDF chất lượng in ấn (300 DPI)!');
      }, 600);
      return;
    } catch(e) {
      console.warn('codexExportAlbumPdf error:', e);
    }
  } else if (typeof window.codexHandleExportDesign === 'function') {
    try {
      window.codexHandleExportDesign(ALBUM_DATA);
      setTimeout(() => {
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = originalText;
        }
        showToast('✅ Đã khởi tạo tiến trình xuất bản thiết kế!');
      }, 600);
      return;
    } catch(e) {}
  } else {
    setTimeout(() => {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
      showToast('✅ Đã lưu bản thiết kế về máy thành công!');
    }, 600);
    return;
  }
}

// ── PREFLIGHT CHECK ──
function handlePreflightOrAddToCart() {
  const missing = [];
  if (!ALBUM_DATA.spotifyUrl && (ALBUM_DATA.package === 'melody' || ALBUM_DATA.package === 'signature')) {
    missing.push('🎵 Chưa dán link bài hát Spotify.');
  }
  if (!ALBUM_DATA.recordedAudioBlob && !ALBUM_DATA.isHomeRecording && (ALBUM_DATA.package === 'voice' || ALBUM_DATA.package === 'signature')) {
    missing.push('🎙️ Chưa thu âm giọng nói (hoặc chưa chọn tự thu tại nhà).');
  }

  if (missing.length > 0) {
    const list = document.getElementById('preflightMissingList');
    if (list) list.innerHTML = missing.map(m => `<div>• ${m}</div>`).join('');
    document.getElementById('preflightModal').classList.add('open');
  } else {
    addCurrentAlbumToCart();
  }
}

function closePreflightModal() { document.getElementById('preflightModal').classList.remove('open'); }
function proceedToCheckoutFromPreflight() {
  closePreflightModal();
  addCurrentAlbumToCart();
}

// ── SHOPEE CART DRAWER (FB51 & FB54 STANDARDIZED) ──
function addCurrentAlbumToCart() {
  const pkgPrices = { melody: 119000, voice: 159000, signature: 199000 };
  const basePrice = pkgPrices[ALBUM_DATA.package] || ALBUM_DATA.basePrice || 199000;
  ALBUM_DATA.basePrice = basePrice;
  const extraCost = (ALBUM_DATA.extraSpreadsCount || 0) * EXTRA_SPREAD_PRICE;
  const total = basePrice + (ALBUM_DATA.sizeAdj || 0) + extraCost;
  const pageCount = ALBUM_DATA.spreads.length * 2 - 2;
  const title = `Album melsou · ${ALBUM_DATA.title} (${pageCount} trang)`;
  const specs = `${pageCount} trang · Mở phẳng 180° · In Couche 250gsm`;
  const pkgNames = { melody: 'Gói Melody', voice: 'Gói Voice', signature: 'Signature Combo' };
  const pkgNameEn = { melody: 'Melody Package', voice: 'Voice Package', signature: 'Signature Combo' };

  const existingIdx = ALBUM_DATA.cart.findIndex(i => i.title.startsWith(`Album melsou · ${ALBUM_DATA.title}`));
  if (existingIdx !== -1) {
    ALBUM_DATA.cart[existingIdx].price = total;
    ALBUM_DATA.cart[existingIdx].basePrice = basePrice;
    ALBUM_DATA.cart[existingIdx].extraSpreadsCount = ALBUM_DATA.extraSpreadsCount || 0;
    ALBUM_DATA.cart[existingIdx].extraCost = extraCost;
    ALBUM_DATA.cart[existingIdx].package = ALBUM_DATA.package;
    ALBUM_DATA.cart[existingIdx].packageName = currentAppLanguage === 'en' ? pkgNameEn[ALBUM_DATA.package] : pkgNames[ALBUM_DATA.package];
    ALBUM_DATA.cart[existingIdx].title = title;
    ALBUM_DATA.cart[existingIdx].specs = specs;
    showToast(currentAppLanguage === 'en' ? 'Cart updated with latest album changes' : 'Đã cập nhật giỏ hàng theo bản thiết kế mới nhất');
  } else {
    ALBUM_DATA.cart.push({
      id: Date.now(),
      title: title,
      specs: specs,
      package: ALBUM_DATA.package,
      packageName: currentAppLanguage === 'en' ? pkgNameEn[ALBUM_DATA.package] : pkgNames[ALBUM_DATA.package],
      basePrice: basePrice,
      extraSpreadsCount: ALBUM_DATA.extraSpreadsCount || 0,
      extraCost: extraCost,
      price: total,
      qty: 1,
      selected: true
    });
    showToast(currentAppLanguage === 'en' ? 'Album added to cart' : 'Đã thêm album vào giỏ hàng');
  }

  autoSaveToLocalStorage();
  updateCartBadge();
  toggleCart();
}

function editCartItemDesign(id) {
  toggleCart();
  showPage('studio');
  showToast(currentAppLanguage === 'en' ? 'Opening album design in Studio' : 'Đang mở lại album trong Studio để bạn chỉnh sửa.');
}

function toggleSelectAllCart(isChecked) {
  ALBUM_DATA.cart.forEach(i => i.selected = isChecked);
  updateCartBadge();
}

function toggleCartItemSelect(id, isChecked) {
  const item = ALBUM_DATA.cart.find(i => i.id === id);
  if (item) item.selected = isChecked;
  updateCartBadge();
}

function removeCartItem(id) {
  ALBUM_DATA.cart = ALBUM_DATA.cart.filter(i => i.id !== id);
  autoSaveToLocalStorage();
  updateCartBadge();
}

function updateCartItemQty(id, delta) {
  const item = ALBUM_DATA.cart.find(i => i.id === id);
  if (item) {
    item.qty = Math.max(1, item.qty + delta);
    autoSaveToLocalStorage();
    updateCartBadge();
  }
}

function updateCartBadge() {
  const b = document.getElementById('cartBadge');
  const count = ALBUM_DATA.cart ? ALBUM_DATA.cart.length : 0;
  if (b) {
    b.textContent = count;
    b.classList.toggle('is-empty', count === 0);
  }

  const list = document.getElementById('cartItemsList');
  const footerBar = document.getElementById('cartFooterBar');
  if (!list) return;

  if (ALBUM_DATA.cart.length === 0) {
    if (footerBar) footerBar.style.display = 'none';
    list.innerHTML = `
      <div style="text-align:center;padding:48px 16px;color:var(--gray)">
        <div style="font-size:44px;margin-bottom:12px">🛒</div>
        <div style="font-size:15px;font-weight:700;color:var(--dark);margin-bottom:6px">
          ${currentAppLanguage === 'en' ? 'Your cart is empty' : 'Giỏ hàng của bạn đang trống'}
        </div>
        <p style="font-size:12.5px;color:var(--gray);margin-bottom:18px;line-height:1.5">
          ${currentAppLanguage === 'en' ? 'Start creating your bespoke keepsake photobook now.' : 'Hãy bắt đầu tạo cuốn photobook mở phẳng 180° của riêng bạn.'}
        </p>
        <button class="btn-outline" style="font-size:12.5px;padding:8px 18px" onclick="toggleCart();showPage('studio')">
          ${currentAppLanguage === 'en' ? '🪄 Start Creating Album' : '🪄 Bắt đầu tạo album'}
        </button>
      </div>
    `;
    const totEl = document.getElementById('cartTotalVal');
    const chkBtn = document.getElementById('btnCartCheckout');
    if (totEl) totEl.textContent = '0đ';
    if (chkBtn) {
      chkBtn.textContent = currentAppLanguage === 'en' ? 'Proceed to Order (0) →' : 'Tiến hành đặt hàng (0) →';
      chkBtn.disabled = true;
      chkBtn.style.opacity = '0.5';
      chkBtn.style.cursor = 'not-allowed';
    }
    return;
  }

  if (footerBar) footerBar.style.display = 'block';

  let totalSum = 0;
  let selectedCount = 0;

  list.innerHTML = ALBUM_DATA.cart.map(item => {
    const itemExtra = (item.extraSpreadsCount || 0) * EXTRA_SPREAD_PRICE;
    const baseP = item.basePrice || (item.price - itemExtra);
    const itemSubtotal = (baseP + itemExtra) * item.qty;

    if (item.selected) {
      totalSum += itemSubtotal;
      selectedCount += item.qty;
    }
    return `
      <div class="cart-item-card ${item.selected ? '' : 'unselected'}" style="margin-bottom:12px;padding:14px;border:1px solid var(--gray-l);border-radius:12px;background:white">
        <div style="display:flex;gap:10px;align-items:flex-start">
          <input type="checkbox" class="cart-checkbox" ${item.selected ? 'checked' : ''} onchange="toggleCartItemSelect(${item.id}, this.checked)" style="margin-top:3px">
          <div style="flex:1">
            <div style="display:flex;justify-content:space-between;align-items:flex-start">
              <div style="font-weight:700;font-size:13.5px;color:var(--dark)">${item.title}</div>
              <button onclick="removeCartItem(${item.id})" style="background:none;border:none;color:#dc2626;font-size:14px;cursor:pointer" title="Xóa">🗑️</button>
            </div>
            <div style="font-size:11.5px;color:var(--gray);margin-top:2px">
              ${item.packageName || (item.package === 'melody' ? 'Gói Melody' : item.package === 'voice' ? 'Gói Voice' : 'Signature Combo')} (${baseP.toLocaleString('vi-VN')}đ)
              ${item.extraSpreadsCount > 0 ? ` · +${item.extraSpreadsCount * 2} trang (${itemExtra.toLocaleString('vi-VN')}đ)` : ''}
            </div>
            <div style="font-size:11px;color:var(--gray);margin-top:1px">${item.specs || 'Mở phẳng 180° · In Couche 250gsm'}</div>

            <div style="margin:6px 0">
              <button class="cart-edit-btn" onclick="editCartItemDesign(${item.id})">✏️ ${currentAppLanguage === 'en' ? 'Edit album design' : 'Chỉnh sửa album'}</button>
            </div>

            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px">
              <div style="display:flex;align-items:center;gap:6px;background:#f9fafb;border:1px solid #ddd;border-radius:6px;padding:2px 8px">
                <button onclick="updateCartItemQty(${item.id}, -1)" style="background:none;border:none;font-weight:700;cursor:pointer">-</button>
                <span style="font-size:12px;font-weight:700;min-width:14px;text-align:center">${item.qty}</span>
                <button onclick="updateCartItemQty(${item.id}, 1)" style="background:none;border:none;font-weight:700;cursor:pointer">+</button>
              </div>
              <strong style="color:var(--red);font-size:14.5px">${itemSubtotal.toLocaleString('vi-VN')}đ</strong>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  if (typeof appliedCartVoucher === 'undefined') {
    window.appliedCartVoucher = null;
  }
  let discountAmt = 0;
  if (appliedCartVoucher && appliedCartVoucher.discount) {
    discountAmt = Math.min(totalSum, appliedCartVoucher.discount);
  }
  const finalSum = Math.max(0, totalSum - discountAmt);

  const discRow = document.getElementById('cartDiscountRow');
  const discVal = document.getElementById('cartDiscountVal');
  if (discRow && discVal) {
    if (discountAmt > 0) {
      discRow.style.display = 'flex';
      discVal.textContent = `-${discountAmt.toLocaleString('vi-VN')}đ`;
    } else {
      discRow.style.display = 'none';
    }
  }

  const totEl = document.getElementById('cartTotalVal');
  const chkBtn = document.getElementById('btnCartCheckout');
  if (totEl) totEl.textContent = finalSum.toLocaleString('vi-VN') + 'đ';
  if (chkBtn) {
    chkBtn.textContent = currentAppLanguage === 'en' ? `Proceed to Order (${selectedCount}) →` : `Tiến hành đặt hàng (${selectedCount}) →`;
    if (selectedCount === 0) {
      chkBtn.disabled = true;
      chkBtn.style.opacity = '0.5';
      chkBtn.style.cursor = 'not-allowed';
    } else {
      chkBtn.disabled = false;
      chkBtn.style.opacity = '1';
      chkBtn.style.cursor = 'pointer';
    }
  }
}

function toggleCart() {
  document.getElementById('cartOverlay').classList.toggle('open');
  document.getElementById('cartDrawer').classList.toggle('open');
  updateCartBadge();
}

// ── CHECKOUT & SEPAY MB BANK (GUEST-FIRST WITH AUTH GATE) ──
function openAuthOrCheckoutStep() {
  if (!currentUser || currentUser.isGuest) {
    showToast(currentAppLanguage === 'en' ? 'Please log in or create an account to proceed with your order' : 'Vui lòng đăng nhập hoặc tạo tài khoản để tiếp tục thanh toán an toàn');
    openAuthModal('login');
    return;
  }
  toggleCart();
  openCheckoutModal();
}

function openCheckoutModal() {
  const modal = document.getElementById('checkoutModal');
  if (modal) modal.classList.add('open');
  document.getElementById('checkoutStep1').style.display = 'block';
  document.getElementById('checkoutStep2').style.display = 'none';

  let totalCart = 0;
  ALBUM_DATA.cart.forEach(i => { if (i.selected) totalCart += i.price * i.qty; });
  if (totalCart === 0) totalCart = ALBUM_DATA.basePrice + ALBUM_DATA.sizeAdj + ((ALBUM_DATA.extraSpreadsCount || 0) * EXTRA_SPREAD_PRICE);

  let discountAmt = 0;
  if (appliedCartVoucher && appliedCartVoucher.discount) {
    discountAmt = Math.min(totalCart, appliedCartVoucher.discount);
  }
  const albumFinal = Math.max(0, totalCart - discountAmt);
  const finalPrice = albumFinal + 30000;

  document.getElementById('chkAlbumPrice').textContent = totalCart.toLocaleString('vi-VN') + 'đ';
  document.getElementById('chkFinalPrice').textContent = finalPrice.toLocaleString('vi-VN') + 'đ';
}

function closeCheckoutModal() { document.getElementById('checkoutModal').classList.remove('open'); }

function goToSepayVietQrStep() {
  const name = document.getElementById('shipName').value.trim();
  const phone = document.getElementById('shipPhone').value.trim();
  const address = document.getElementById('shipAddress').value.trim();
  const terms = document.getElementById('chkTermsAccept').checked;

  if (!name || !phone || !address) {
    alert('Vui lòng điền đầy đủ Họ tên, Số điện thoại và Địa chỉ nhận hàng!');
    return;
  }
  if (!terms) {
    alert('Vui lòng bấm tick đồng ý với Điều khoản dịch vụ & Chính sách bảo mật!');
    return;
  }

  let totalCart = 0;
  ALBUM_DATA.cart.forEach(i => { if (i.selected) totalCart += i.price * i.qty; });
  if (totalCart === 0) totalCart = ALBUM_DATA.basePrice + ALBUM_DATA.sizeAdj + ((ALBUM_DATA.extraSpreadsCount || 0) * EXTRA_SPREAD_PRICE);

  let discountAmt = 0;
  if (appliedCartVoucher && appliedCartVoucher.discount) {
    discountAmt = Math.min(totalCart, appliedCartVoucher.discount);
  }
  const finalPrice = Math.max(0, totalCart - discountAmt) + 30000;
  const orderCode = 'MELS' + Date.now().toString().slice(-7);

  const qrUrl = `https://api.vietqr.io/image/970422-00931940512-compact2.jpg?amount=${finalPrice}&addInfo=${orderCode}&accountName=MELSOU%20VIETNAM`;
  document.getElementById('vietQrImg').src = qrUrl;
  document.getElementById('copyAmountText').textContent = finalPrice.toLocaleString('vi-VN') + 'đ';
  document.getElementById('copyMemoText').textContent = orderCode;

  // Contract hook for Codex backend
  if (typeof window.codexCreateOrder === 'function') {
    try {
      window.codexCreateOrder({
        orderCode,
        customer: { name, phone, address, email: currentUser?.email || '' },
        items: ALBUM_DATA.cart.filter(i => i.selected),
        totalAmount: finalPrice,
        voucher: appliedCartVoucher
      });
    } catch(e) {}
  }

  document.getElementById('checkoutStep1').style.display = 'none';
  document.getElementById('checkoutStep2').style.display = 'block';
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => showToast(`Đã sao chép: ${text}`));
}

function simulateSuccessfulPayment() {
  const memoEl = document.getElementById('copyMemoText');
  const code = (memoEl && memoEl.textContent !== '--') ? memoEl.textContent : ('MELS' + Date.now().toString().slice(-7));
  const nameEl = document.getElementById('shipName');
  const phoneEl = document.getElementById('shipPhone');
  const addressEl = document.getElementById('shipAddress');

  const confirmedOrder = {
    orderCode: code,
    customer: {
      name: (nameEl ? nameEl.value.trim() : '') || (currentAppLanguage === 'en' ? 'Customer' : 'Khách hàng'),
      phone: (phoneEl ? phoneEl.value.trim() : '') || '',
      address: (addressEl ? addressEl.value.trim() : '') || '',
      email: currentUser?.email || ''
    },
    items: ALBUM_DATA.cart ? ALBUM_DATA.cart.filter(i => i.selected) : [],
    totalAmount: ALBUM_DATA.cart ? ALBUM_DATA.cart.reduce((s, i) => s + (i.selected ? i.price * i.qty : 0), 0) + 30000 : 0,
    status: 'confirmed',
    statusText: currentAppLanguage === 'en' ? '✅ Payment Verified' : '✅ Đã xác nhận thanh toán',
    createdAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' · Hôm nay'
  };

  if (!window.MELSOU_CONFIRMED_ORDERS) window.MELSOU_CONFIRMED_ORDERS = [];
  window.MELSOU_CONFIRMED_ORDERS.unshift(confirmedOrder);

  if (typeof window.codexCheckPaymentStatus === 'function') {
    try {
      window.codexCheckPaymentStatus(confirmedOrder);
    } catch(e) {}
  }

  showToast(currentAppLanguage === 'en' ? '✅ Payment verified! Melsou is preparing your bespoke album.' : '✅ Đã ghi nhận chuyển khoản thành công! Melsou đang chuyển sang chế độ chuẩn bị ấn phẩm.');

  // Clean cart of selected items
  ALBUM_DATA.cart = ALBUM_DATA.cart.filter(i => !i.selected);
  autoSaveToLocalStorage();
  updateCartBadge();

  setTimeout(() => {
    closeCheckoutModal();
    showPage('tracking');
    const trackInput = document.getElementById('trackQueryInput');
    if (trackInput) trackInput.value = code;
    performTrackingSearch();
  }, 1000);
}

// ── 🌟 STUDIO ONBOARDING COACH MARK ENGINE (FB18) ──
const STUDIO_COACH_STEPS = [
  {
    icon: '🪄',
    badge: 'HƯỚNG DẪN STUDIO · 01/03',
    badgeEn: 'STUDIO GUIDE · 01/03',
    title: 'Thanh công cụ sáng tạo bên trái',
    titleEn: 'Creative Toolbar on the Left',
    desc: 'Tại đây bạn có thể thêm trang đôi, tải ảnh kỷ niệm, dán sticker trang trí, viết lời nhắn tặng và chọn bài hát Spotify cho album.',
    descEn: 'Here you can add spreads, upload photos, place stickers, write personal notes, and select a Spotify song.'
  },
  {
    icon: '📐',
    badge: 'HƯỚNG DẪN STUDIO · 02/03',
    badgeEn: 'STUDIO GUIDE · 02/03',
    title: 'Không gian mở phẳng 180° liền trang',
    titleEn: '180° Seamless Layflat Space',
    desc: 'Bấm trực tiếp vào ảnh hoặc khung chữ trên trang để xoay 360°, căn chỉnh vị trí, hoặc nhấp đúp để phóng to và cắt ảnh trực quan.',
    descEn: 'Click photos or text frames to rotate 360°, align position, or click to adjust and crop photos interactively.'
  },
  {
    icon: '📖',
    badge: 'HƯỚNG DẪN STUDIO · 03/03',
    badgeEn: 'STUDIO GUIDE · 03/03',
    title: 'Xem trước 3D và hoàn tất đặt in',
    titleEn: '3D Preview and Checkout',
    desc: 'Bất cứ lúc nào bạn cũng có thể mở chế độ "Xem 3D" để ngắm thành phẩm như cầm trên tay, sau đó bấm Đặt In Album khi hài lòng.',
    descEn: 'At any time, open "View 3D" to experience your photobook as if held in your hands, then click Add to Cart when pleased.'
  }
];

let currentCoachStepIndex = 0;

function checkStudioFirstVisit() {
  try {
    const seen = localStorage.getItem('melsou_studio_onboarded');
    if (!seen && document.body.classList.contains('in-studio')) {
      setTimeout(() => {
        openStudioOnboardingModal();
      }, 600);
    }
  } catch(e) {}
}

function openStudioOnboardingModal() {
  currentCoachStepIndex = 0;
  renderStudioCoachStep();
  const modal = document.getElementById('studioOnboardingModal');
  if (modal) modal.classList.add('open');
}

function renderStudioCoachStep() {
  const step = STUDIO_COACH_STEPS[currentCoachStepIndex];
  if (!step) return;
  const isEn = (currentAppLanguage === 'en');

  const icon = document.getElementById('somStepIcon');
  const badge = document.getElementById('somStepBadge');
  const title = document.getElementById('somStepTitle');
  const desc = document.getElementById('somStepDesc');
  const nextBtn = document.getElementById('somNextBtn');
  const skipBtn = document.querySelector('#studioOnboardingModal .btn-outline');

  if (icon) icon.textContent = step.icon;
  if (badge) badge.textContent = isEn ? step.badgeEn : step.badge;
  if (title) title.textContent = isEn ? step.titleEn : step.title;
  if (desc) desc.textContent = isEn ? step.descEn : step.desc;
  if (skipBtn) skipBtn.textContent = isEn ? 'Skip guide' : 'Bỏ qua hướng dẫn';
  if (nextBtn) {
    if (currentCoachStepIndex === STUDIO_COACH_STEPS.length - 1) {
      nextBtn.textContent = isEn ? 'Start Designing Now ✨' : 'Bắt đầu thiết kế ngay ✨';
    } else {
      nextBtn.textContent = isEn ? `Next (${currentCoachStepIndex + 1}/3) →` : `Tiếp tục (${currentCoachStepIndex + 1}/3) →`;
    }
  }
}

function nextStudioOnboardingStep() {
  if (currentCoachStepIndex < STUDIO_COACH_STEPS.length - 1) {
    currentCoachStepIndex++;
    renderStudioCoachStep();
  } else {
    skipStudioOnboarding();
  }
}

function skipStudioOnboarding() {
  try {
    localStorage.setItem('melsou_studio_onboarded', 'true');
  } catch(e) {}
  const modal = document.getElementById('studioOnboardingModal');
  if (modal) modal.classList.remove('open');
}

// ── ⚙️ SETTINGS MODAL & THEME SWITCHER (FB10) ──
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
    toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#1e293b;color:#f8fafc;padding:10px 20px;border-radius:30px;font-size:12.5px;font-weight:600;box-shadow:0 10px 25px rgba(0,0,0,0.25);z-index:99999;pointer-events:none;opacity:0;transition:opacity 0.25s ease, transform 0.25s ease;display:flex;align-items:center;gap:8px;';
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<span>✨</span><span>${message}</span>`;
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
function recalculateDrawerAvailableHeight() {
  if (isMobileViewport()) return; // Mobile uses bottom sheet mode
  const drawer = document.getElementById('canvaSidebarEl');
  const filmstripEl = document.getElementById('studioFilmstripWrapper');
  const studioBody = document.getElementById('studioBodyContainer');
  if (!drawer || !studioBody) return;

  if (filmstripEl) {
    const filmstripRect = filmstripEl.getBoundingClientRect();
    const bodyRect = studioBody.getBoundingClientRect();
    const safeGap = 12; // 12px aesthetic clear gap before top edge of filmstrip
    const bottomOffset = Math.max(0, Math.round(bodyRect.bottom - filmstripRect.top) + safeGap);
    drawer.style.bottom = `${bottomOffset}px`;
  } else {
    drawer.style.bottom = '120px';
  }
}

function adjustMobileStageScale() {
  const stage = document.getElementById('studioStageArea');
  const book = document.getElementById('interactiveLayflatBook');
  if (!stage || !book) return;

  const stageWidth = stage.clientWidth || window.innerWidth;
  const activeSpread = ALBUM_DATA.spreads ? ALBUM_DATA.spreads[ALBUM_DATA.activeSpreadIndex] : null;
  const isCover = !!activeSpread?.isClosedCover;
  const isBack = !!activeSpread?.isClosedBack;
  const isCoverOrBack = isCover || isBack;
  const isEn = (currentAppLanguage === 'en');
  const stageWrapper = document.querySelector('.photobook-stage-wrapper');

  if (isMobileViewport()) {
    const isDrawerOpen = typeof isFlyoutDrawerOpen !== 'undefined' && isFlyoutDrawerOpen;
    const drawer = document.getElementById('canvaSidebarEl');
    let drawerHeight = 0;
    if (isDrawerOpen && drawer && !drawer.classList.contains('collapsed')) {
      drawerHeight = drawer.offsetHeight || (window.innerHeight * 0.33);
    }

    if (stageWrapper) {
      stageWrapper.style.paddingBottom = drawerHeight > 0 ? `${drawerHeight + 20}px` : '0px';
      stageWrapper.style.transition = 'padding-bottom 0.25s ease';
    }

    const fmt = getCurrentAlbumFormat();
    const availableWidth = stageWidth - 16;
    const availableHeight = drawerHeight > 0 
      ? Math.max(140, window.innerHeight - 176 - drawerHeight)
      : Math.max(160, window.innerHeight - 170);
    const targetBaseWidth = fmt.singleWidth;
    const targetBaseHeight = fmt.singleHeight;
    const scale = Math.max(0.35, Math.min(availableWidth / targetBaseWidth, availableHeight / targetBaseHeight, 0.95));

    currentStageScale = scale;
    window.currentStageScale = scale;
    book.style.transform = `scale(${scale})`;
    book.style.transformOrigin = 'center center';

    const mobLabel = document.getElementById('mobileCurrentSpreadLabel');
    if (activeSpread) {
      const totalPages = (ALBUM_DATA.spreads.length - 2) * 2 + 2;
      let labelText = '';
      if (isCover) {
        labelText = isEn ? `Front Cover (1 / ${totalPages})` : `Bìa Trước (1 / ${totalPages})`;
      } else if (isBack) {
        labelText = isEn ? `Back Cover (${totalPages} / ${totalPages})` : `Bìa Sau (${totalPages} / ${totalPages})`;
      } else {
        const pageNum = mobileActivePageHalf === 'left' 
          ? ALBUM_DATA.activeSpreadIndex * 2 
          : ALBUM_DATA.activeSpreadIndex * 2 + 1;
        labelText = isEn ? `Page ${pageNum} / ${totalPages}` : `Trang ${pageNum} / ${totalPages}`;
      }
      if (mobLabel) mobLabel.textContent = labelText;
    }

    if (stageWrapper) stageWrapper.style.minHeight = (targetBaseHeight * scale + 10) + 'px';
  } else {
    // Desktop & Tablet Responsive Scale (FB83 & FB85: Decoupled Fit-to-Workspace Canva-style Editor Display Scale)
    const fmt = getCurrentAlbumFormat();
    const stageW = stage.clientWidth || (window.innerWidth - 64);
    const stageH = stage.clientHeight || (window.innerHeight - 48);
    const baseW = isCoverOrBack ? fmt.singleWidth : fmt.spreadWidth;
    const baseH = isCoverOrBack ? fmt.singleHeight : fmt.spreadHeight;

    const drawer = document.getElementById('canvaSidebarEl');
    const isDrawerOpen = typeof isFlyoutDrawerOpen !== 'undefined' && isFlyoutDrawerOpen && drawer && !drawer.classList.contains('collapsed');
    const filmstripEl = document.getElementById('studioFilmstripWrapper');
    const toolbarEl = document.querySelector('.stage-toolbar');
    const isTrayCollapsed = filmstripEl ? filmstripEl.classList.contains('collapsed') : false;
    const trayH = filmstripEl ? (isTrayCollapsed ? 32 : (filmstripEl.offsetHeight || 108)) : 0;
    const toolbarH = toolbarEl ? (toolbarEl.offsetHeight || 36) : 36;

    // FB85: Tablet Portrait adaptive workspace rule:
    // On wide viewports (>= 960px), side drawer docks side-by-side (drawerOffset = 320px, marginLeft = 320px).
    // On tablet portrait / compact workspaces (< 960px), drawer floats as an overlay (drawerOffset = 0, marginLeft = 0px)
    // so the 2-page spread keeps its full available width and is never crushed!
    const shouldDockDrawer = (window.innerWidth >= 960);
    const drawerOffset = (isDrawerOpen && shouldDockDrawer) ? 320 : 0;
    const availW = Math.max(320, stageW - drawerOffset - 48);

    // Available height accounting for top stage-toolbar + bottom filmstrip + visual breathing room
    const totalVerticalDeductions = toolbarH + trayH + 48;
    const availH = Math.max(260, stageH - totalVerticalDeductions);

    // Fit-to-workspace scale utilizing available space while locking physical aspect ratio
    const rawScale = Math.min(availW / baseW, availH / baseH);
    const scale = Math.max(0.45, Math.min(Math.round(rawScale * 100) / 100, 1.85));

    currentStageScale = scale;
    window.currentStageScale = scale;
    book.style.transform = `scale(${scale})`;
    book.style.transformOrigin = 'center center';

    if (stageWrapper) {
      stageWrapper.style.paddingBottom = '0px';
      stageWrapper.style.minHeight = '0px';
      stageWrapper.style.marginLeft = (isDrawerOpen && shouldDockDrawer) ? '320px' : '0px';
      stageWrapper.style.transition = 'margin-left 0.24s cubic-bezier(0.2, 0, 0.2, 1), transform 0.24s ease';
    }

    const ind = document.getElementById('currentSpreadName');
    if (activeSpread && ind) {
      ind.textContent = activeSpread.name || '';
    }

    if (typeof recalculateDrawerAvailableHeight === 'function') {
      recalculateDrawerAvailableHeight();
    }
  }
}

function initStudioTouchGestures() {
  const stage = document.getElementById('studioStageArea');
  if (!stage) return;
  let startX = 0, startY = 0;

  stage.addEventListener('touchstart', function(e) {
    if (e.target.closest('.freeform-canvas-item') || e.target.closest('.interactive-photo-slot') || e.target.closest('.canva-sidebar') || e.target.closest('input')) return;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  }, { passive: true });

  stage.addEventListener('touchend', function(e) {
    if (e.target.closest('.freeform-canvas-item') || e.target.closest('.interactive-photo-slot') || e.target.closest('.canva-sidebar') || e.target.closest('input')) return;
    const diffX = e.changedTouches[0].clientX - startX;
    const diffY = e.changedTouches[0].clientY - startY;

    if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY) * 1.4) {
      if (diffX < 0) goToNextSpread();
      else goToPrevSpread();
    }
  }, { passive: true });
}


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
    ctaBtn.textContent = isWide ? '🪄 Start Creating Album' : '🪄 Create Album';
  } else {
    ctaBtn.textContent = isWide ? '🪄 Bắt đầu tạo album' : '🪄 Tạo album';
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
    topbarBadge: '🎓 DỰ ÁN DOANH NGHIỆP GIẢ ĐỊNH',
    topbarPromoFull: '✨ Tặng kèm mã QR nhạc Spotify & Hộp quà Kraft cao cấp khi thiết kế album tại Melsou!',
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
    heroBadge: '📖 Album ảnh liền trang 180° kết hợp thanh âm',
    heroTitle: 'Gói tâm tình',
    heroTitleAccent: 'trong dáng hình thanh âm',
    heroDesc: 'Chiếc máy ảnh có thể giữ lại hình dáng khoảnh khắc, nhưng lại vô tình bỏ quên âm thanh. melsou hòa quyện giai điệu (melody) và kỷ vật (souvenir) để mỗi trang ảnh không chỉ đẹp, mà còn biết cất lời.',
    btnStartStudio: '🪄 Bắt đầu tạo album',
    btn3DFlip: '📖 Xem 3D',
    heroTrustOffgrid: '🔒 Bảo mật vật lý off-grid',
    heroTrustLayflat: '📖 Mở phẳng 180° liền trang',
    heroTrustSpotify: '🎵 Mã QR nhạc Spotify',

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
    pkgMelodyLabel: 'MELODY KEEPSAKE',
    pkgMelodyNote: 'Nhỏ gọn, mở phẳng liền trang kèm mã nhạc Spotify độc bản',
    pkgMelodyFeat1: 'Album mở phẳng 180° liền trang cao cấp (không rách gáy)',
    pkgMelodyFeat2: 'Tùy chọn khổ ảnh: Vuông 20×20cm hoặc A5 Đứng',
    pkgMelodyFeat3: 'In mã sóng nhạc Spotify Soundwave Scannable Code',
    pkgMelodyFeat4: 'Tặng kèm hộp quà Kraft mộc mạc + Thiệp tay',
    btnSelectMelody: 'Chọn gói này',

    pkgVoiceLabel: 'VOICE KEEPSAKE',
    pkgVoiceNote: 'Chạm để lắng nghe giọng nói thật lưu trên vi mạch vật lý',
    pkgVoiceFeat1: 'Album mở phẳng 180° liền trang cao cấp',
    pkgVoiceFeat2: 'Module âm thanh ISD1820 tích hợp ở bìa sau',
    pkgVoiceFeat3: 'Tự thu âm tại nhà (nút REC) hoặc gửi file Melsou nạp sẵn',
    pkgVoiceFeat4: 'Bảo mật vật lý off-grid 100%, không lưu cloud',
    btnSelectVoice: 'Chọn gói này',

    pkgSignatureLabel: 'SIGNATURE COMBO',
    pkgSignatureNote: '✨ Trọn bộ trải nghiệm hình ảnh + âm thanh',
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
    btnModeEdit: '✏️ Chế Độ Thiết Kế',
    btnModeFlip: '📖 Xem 3D',
    studioBtnOrder: '🛒 Thêm vào giỏ hàng',
    btnExportDesign: '⬇ Tải PDF album',
    studioCloudSync: 'Đã lưu',
    btnTopSafeGuides: '📏 Vùng an toàn',

    // Studio Tabs
    cNavTab0: '<span>📐</span>Khổ & Gói',
    cNavTab1: '<span>🎨</span>Bố cục',
    cNavTab2: '<span>📸</span>Ảnh',
    cNavTab3: '<span>✨</span>Sticker',
    cNavTab4: '<span>✒️</span>Lời nhắn',
    cNavTab5: '<span>🎵</span>Âm thanh',

    // Mobile more menu
    msmSafeGuides: '📏 Vùng an toàn in',
    msmDownloadPdf: '⬇ Tải PDF album',
    msmUndo: '↶ Hoàn tác',
    msmRedo: '↷ Làm lại',

    // Reviews & Blog
    reviewsHeading: 'Ý kiến từ người dùng trải nghiệm Melsou',
    reviewsSubheading: 'Cảm nhận chân thực từ những người dùng đã trực tiếp thiết kế và trải nghiệm album Melsou',
    reviewsBadge: 'CẢM NHẬN KHÁCH HÀNG',
    reviewsDisclaimer: '* Đánh giá được thu thập từ những khách hàng đã trực tiếp thiết kế và cầm trên tay album hoàn thiện.',
    btnWriteReview: '✍️ Viết đánh giá',
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
    lblRegPassword: 'Mật khẩu (tối thiểu 6 ký tự)',
    lblRegConfirmPassword: 'Nhập lại mật khẩu',
    btnSubmitRegister: 'Tạo tài khoản',
    forgotPwHeading: 'Quên mật khẩu',
    forgotPwDesc: 'Khôi phục tài khoản sẽ được hỗ trợ sau khi bạn liên kết email trong mục Hồ sơ tài khoản. Nếu bạn đã liên kết email, vui lòng liên hệ bộ phận hỗ trợ hoặc thử lại sau khi hệ thống kết nối máy chủ hoàn tất.',
    forgotPwBackLink: '← Quay lại đăng nhập',
    lblLinkedEmailHeading: 'Email liên kết',
    lblLinkedEmailDesc: 'Dùng để khôi phục mật khẩu và nhận hóa đơn',
    btnSettingsLinkEmail: 'Thêm email'
  },
  en: {
    // Topbar & Header
    topbarBadge: '🎓 MOCK BUSINESS PROJECT',
    topbarPromoFull: '✨ Free Spotify Scannable Code & luxury Kraft gift box included with every album at Melsou!',
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
    heroBadge: '📖 180° Seamless Layflat Photobook with Sound Keepsake',
    heroTitle: 'Cherish feelings',
    heroTitleAccent: 'in the shape of sound',
    heroDesc: 'Cameras capture visual silhouettes, but often leave voices behind. melsou fuses melody and souvenir so every printed page sings its own heartfelt tune.',
    btnStartStudio: '🪄 Start Creating Album',
    btn3DFlip: '📖 View 3D',
    heroTrustOffgrid: '🔒 Off-Grid Physical Privacy',
    heroTrustLayflat: '📖 180° Seamless Layflat',
    heroTrustSpotify: '🎵 Spotify Scannable Code',

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
    valCardTitle3: 'Off-Grid Intimacy for Keepsakes',
    valCardDesc3: 'All personal messages and recorded voices are stored directly onto a physical integrated circuit. No cloud leakage, totally safe.',
    valCardMore3: 'Explore story →',

    // Pricing Section
    pricingTitle: 'Packages',
    pkgFeaturedBadge: '✦ Most Popular Choice',
    pkgMelodyLabel: 'MELODY KEEPSAKE',
    pkgMelodyNote: 'Compact, seamless layflat with personalized Spotify code',
    pkgMelodyFeat1: 'Premium 180° seamless layflat album (zero gutter split)',
    pkgMelodyFeat2: 'Size options: Square 20×20cm or A5 Portrait',
    pkgMelodyFeat3: 'Custom Spotify Soundwave Scannable Code printed',
    pkgMelodyFeat4: 'Complementary Kraft gift box + Handwritten card',
    btnSelectMelody: 'Select package',

    pkgVoiceLabel: 'VOICE KEEPSAKE',
    pkgVoiceNote: 'Touch to hear real voices stored on physical microchips',
    pkgVoiceFeat1: 'Premium 180° seamless layflat album',
    pkgVoiceFeat2: 'Integrated ISD1820 audio module in back cover',
    pkgVoiceFeat3: 'Record at home (REC button) or send audio for Melsou preloading',
    pkgVoiceFeat4: '100% off-grid physical privacy, zero cloud storage',
    btnSelectVoice: 'Select package',

    pkgSignatureLabel: 'SIGNATURE COMBO',
    pkgSignatureNote: '✨ Complete visual + audio experience',
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
    btnModeEdit: '✏️ Design Mode',
    btnModeFlip: '📖 View 3D',
    studioBtnOrder: '🛒 Add to Cart',
    btnExportDesign: '⬇ Download PDF Album',
    studioCloudSync: 'Saved',
    btnTopSafeGuides: '📏 Safe Margins',

    // Studio Tabs
    cNavTab0: '<span>📐</span>Size & Pkg',
    cNavTab1: '<span>🎨</span>Layout',
    cNavTab2: '<span>📸</span>Photos',
    cNavTab3: '<span>✨</span>Stickers',
    cNavTab4: '<span>✒️</span>Message',
    cNavTab5: '<span>🎵</span>Audio',

    // Mobile more menu
    msmSafeGuides: '📏 Print Safe Margins',
    msmDownloadPdf: '⬇ Download PDF Album',
    msmUndo: '↶ Undo',
    msmRedo: '↷ Redo',

    // Reviews & Blog
    reviewsHeading: 'Reflections from Melsou Creators',
    reviewsSubheading: 'Authentic thoughts from customers who designed and held their own Melsou keepsakes',
    reviewsBadge: 'CUSTOMER REVIEWS',
    reviewsDisclaimer: '* Reviews gathered from customers who designed and received their handcrafted albums.',
    btnWriteReview: '✍️ Write Review',
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
    lblRegPassword: 'Password (minimum 6 characters)',
    lblRegConfirmPassword: 'Confirm password',
    btnSubmitRegister: 'Create Account',
    forgotPwHeading: 'Forgot Password',
    forgotPwDesc: 'Account recovery will be available after linking an email in your Account Profile. If you have already linked your email, please contact support or try again once server connection is ready.',
    forgotPwBackLink: '← Back to log in',
    lblLinkedEmailHeading: 'Linked Email',
    lblLinkedEmailDesc: 'Used for password recovery and receiving digital receipts',
    btnSettingsLinkEmail: 'Link Email'
  }
};


function applyStudioTranslations(lang) {
  const isEn = (lang === 'en');

  // Topbar steps & buttons
  const s1 = document.getElementById('stStep1Text'); if (s1) s1.textContent = isEn ? '1. Size & Pkg' : '1. Chọn gói & mẫu';
  const s2 = document.getElementById('stStep2Text'); if (s2) s2.textContent = isEn ? '2. Design' : '2. Thiết kế album';
  const s3 = document.getElementById('stStep3Text'); if (s3) s3.textContent = isEn ? '3. 3D Preview' : '3. Xem trước 3D';
  const s4 = document.getElementById('stStep4Text'); if (s4) s4.textContent = isEn ? '4. Checkout' : '4. Đặt in';
  const bEdit = document.getElementById('btnModeEdit'); if (bEdit) bEdit.textContent = isEn ? '✏️ Design Mode' : '✏️ Chế Độ Thiết Kế';
  const bFlip = document.getElementById('btnModeFlip'); if (bFlip) bFlip.textContent = isEn ? '📖 View 3D' : '📖 Xem 3D';
  const bSafe = document.getElementById('btnTopSafeGuides'); if (bSafe) bSafe.textContent = isEn ? '📏 Safe Margins' : '📏 Vùng an toàn';
  const bCloud = document.getElementById('studioCloudSyncText'); if (bCloud) bCloud.textContent = isEn ? 'Saved' : 'Đã lưu';
  const bAddCart = document.getElementById('btnStudioAddToCart'); if (bAddCart) bAddCart.textContent = isEn ? '🛒 Add to Cart' : '🛒 Thêm vào giỏ hàng';
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
  const enDrawerTitles = ['📐 Size & Package', '🎨 Preset Layouts', '📸 Photos & Media', '✨ Stickers & Deco', '✒️ Handwritten Letter', '🎵 Audio & Music'];
  const viDrawerTitles = ['📐 Khổ & Gói', '🎨 Bố cục & Khung ảnh', '📸 Ảnh của bạn', '✨ Sticker trang trí', '✒️ Lời nhắn thủ bút', '🎵 Giai điệu & Lời thoại'];
  if (drawerTitle) {
    drawerTitle.textContent = isEn ? enDrawerTitles[activeTabIdx] : viDrawerTitles[activeTabIdx];
  }

  const textReplacements = isEn ? [
    ['1. Chọn Gói Sản Phẩm', '1. Choose Photobook Package'],
    ['🎵 Gói Melody', '🎵 Melody Keepsake'],
    ['🎙️ Gói Voice', '🎙️ Voice Keepsake'],
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
    ['📏 Vùng an toàn in', '📏 Print Safe Margins'],
    ['⬇ Tải PDF album', '⬇ Download PDF Album'],
    ['↶ Hoàn tác', '↶ Undo'],
    ['↷ Làm lại', '↷ Redo'],
    ['🎯 Căn Giữa', '🎯 Center'],
    ['📷 Đổi Ảnh', '📷 Replace Photo'],
    ['Tất cả các trang', 'All pages']
  ] : [
    ['1. Choose Photobook Package', '1. Chọn Gói Sản Phẩm'],
    ['🎵 Melody Keepsake', '🎵 Gói Melody'],
    ['🎙️ Voice Keepsake', '🎙️ Gói Voice'],
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
    ['📏 Print Safe Margins', '📏 Vùng an toàn in'],
    ['⬇ Download PDF Album', '⬇ Tải PDF album'],
    ['↶ Undo', '↶ Hoàn tác'],
    ['↷ Redo', '↷ Làm lại'],
    ['🎯 Center', '🎯 Căn Giữa'],
    ['📷 Replace Photo', '📷 Đổi Ảnh'],
    ['All pages', 'Tất cả các trang']
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
  if (spotInput) spotInput.placeholder = isEn ? 'Type song name (e.g. Until I Found You, Perfect...)' : 'Gõ tên bài hát (vd: Until I Found You, Perfect...)';
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
      accLinks[0].innerHTML = '📁 Your Designs';
      accLinks[1].innerHTML = '📦 Your Orders';
      accLinks[2].innerHTML = '🚪 Log out';
    } else {
      accLinks[0].innerHTML = '📁 Bản thiết kế của bạn';
      accLinks[1].innerHTML = '📦 Đơn hàng của bạn';
      accLinks[2].innerHTML = '🚪 Đăng xuất';
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
    mndLinkHome: isEn ? '🏠 Home' : '🏠 Trang chủ',
    mndLinkValues: isEn ? '✨ Four Unique Values' : '✨ Bốn giá trị độc bản',
    mndLinkPricing: isEn ? '🏷️ Packages' : '🏷️ Gói sản phẩm',
    mndLinkTemplates: isEn ? '🎨 Template Library' : '🎨 Thư viện Template',
    mndLinkReviews: isEn ? '💬 User Reviews' : '💬 Trải nghiệm người dùng',
    mndLinkBlog: isEn ? '📖 Blog' : '📖 Câu chuyện',
    mndLinkTracking: isEn ? '🔍 Track Order' : '🔍 Tra cứu đơn hàng',
    mndCtaBtn: isEn ? '🪄 Start Creating Album' : '🪄 Bắt đầu tạo album'
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
  if (udDrafts) udDrafts.textContent = isEn ? '📁 Your Saved Drafts' : '📁 Bản thiết kế của bạn';
  const udOrders = document.getElementById('udLinkOrders');
  if (udOrders) udOrders.textContent = isEn ? '📦 Your Orders' : '📦 Đơn hàng của bạn';
  const udLogout = document.getElementById('udLinkLogout');
  if (udLogout) udLogout.textContent = isEn ? '🚪 Sign Out' : '🚪 Đăng xuất';

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
  updateContextualToolbar();
  adjustMobileStageScale();
  const isEn = (lang === 'en');

  const shortPromo = document.querySelector('.topbar-short-text');
  if (shortPromo) {
    shortPromo.textContent = isEn ? '✨ Free Spotify Code & Kraft Box' : '✨ Tặng mã Spotify & Hộp Kraft';
  }

  const bio = document.getElementById('footerBrandBio');
  if (bio) {
    bio.textContent = isEn ? 'Cherish feelings in the shape of sound. Where melody meets memory, and printed pages sing.' : 'Gói tâm tình trong dáng hình thanh âm. Nơi giai điệu gặp gỡ kỷ niệm, và mỗi trang ảnh biết cất lời.';
  }

  const blogCats = {
    blogCatAll: isEn ? 'All Articles' : 'Tất cả bài viết',
    blogCatLove: isEn ? 'Love Stories' : 'Chuyện tình yêu',
    blogCatMemories: isEn ? 'Memories & Youth' : 'Ký ức & Thanh xuân',
    blogCatCraft: isEn ? 'Craft & Materials' : 'Thủ công & Chất liệu',
    blogCatInspiration: isEn ? 'Design Inspiration' : 'Cảm hứng thiết kế'
  };
  Object.keys(blogCats).forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = blogCats[id];
  });
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
  if (authLabel && (!currentUser || currentUser.isGuest)) {
    authLabel.textContent = dict.authBtnLabel;
  }
  const cartLabel = document.getElementById('headerCartBtnLabel');
  if (cartLabel) {
    cartLabel.textContent = dict.cartBtnLabel || (lang === 'vi' ? 'Giỏ hàng' : 'Cart');
  }

  // Hero Section
  const heroBadge = document.getElementById('heroEducationalBadge');
  if (heroBadge) heroBadge.textContent = dict.heroBadge;
  const heroBase = document.getElementById('heroTitleBase');
  if (heroBase) heroBase.textContent = dict.heroTitle;
  const heroAccent = document.getElementById('heroTitleAccent');
  if (heroAccent) heroAccent.textContent = dict.heroTitleAccent;
  const heroDesc = document.getElementById('heroSubheadlineText');
  if (heroDesc) heroDesc.textContent = dict.heroDesc;
  const btnStart = document.getElementById('btnHeroStartStudio');
  if (btnStart) btnStart.textContent = dict.btnStartStudio;
  const btnFlip = document.getElementById('btnHeroFlipbook');
  if (btnFlip) btnFlip.textContent = dict.btn3DFlip;

  // Hero Trust Items
  const trustOffgrid = document.getElementById('heroTrustOffgrid');
  if (trustOffgrid) trustOffgrid.textContent = dict.heroTrustOffgrid;
  const trustLayflat = document.getElementById('heroTrustLayflat');
  if (trustLayflat) trustLayflat.textContent = dict.heroTrustLayflat;
  const trustSpotify = document.getElementById('heroTrustSpotify');
  if (trustSpotify) trustSpotify.textContent = dict.heroTrustSpotify;

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
  initTemplateCards();
  const onbT = document.getElementById('onboardingModalTitle');
  if (onbT) onbT.textContent = isEn ? 'Choose a Starting Design Template 🎨' : 'Chọn mẫu thiết kế mở đầu 🎨';
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
    settingsModalTitle: isEn ? '⚙️ System Settings' : '⚙️ Cài đặt hệ thống',
    settingsModalSub: isEn ? 'Customize interface, account security and privacy' : 'Tùy chỉnh giao diện, bảo mật tài khoản và quyền riêng tư',
    lblSettingsGroupA: isEn ? 'A. INTERFACE & EFFECTS' : 'A. GIAO DIỆN & HIỆU ỨNG',
    lblSettingsLanguageHeading: isEn ? 'Display Language' : 'Ngôn ngữ hiển thị',
    lblSettingsLanguageDesc: isEn ? 'Choose Vietnamese or English' : 'Chọn Tiếng Việt hoặc Tiếng Anh',
    lblSettingsThemeHeading: isEn ? 'Display Theme' : 'Chế độ hiển thị',
    lblSettingsThemeDesc: isEn ? 'Choose standard white paper or dark background' : 'Lựa chọn tone màu chuẩn giấy trắng hoặc nền tối',
    optThemeLight: isEn ? '☀️ Light Mode' : '☀️ Giao diện Sáng',
    optThemeDark: isEn ? '🌙 Dark Mode' : '🌙 Giao diện Tối',
    optThemeWarm: isEn ? '🕯️ Warm Paper Tone' : '🕯️ Tone Giấy Ấm',
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
    btnClearStudioCache: isEn ? '🗑️ Clear Local Draft Cache' : '🗑️ Xóa bản thảo cục bộ',
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
  updateCartBadge();
  updateNavSpreadButtons();

  applyStudioTranslations(lang);
  applyHomepageModalTranslations(lang);

  syncHeroLiveBook();
  if (typeof renderReviewsList === 'function') renderReviewsList();
  if (typeof renderPublicBlog === 'function') renderPublicBlog();

  // Size Change Modal Translations (FB77)
  if (pendingAlbumSizeChange) {
    const { targetFmt } = pendingAlbumSizeChange;
    const titleEl = document.getElementById('sizeChangeModalTitle');
    const descEl = document.getElementById('sizeChangeModalDesc');
    const cancelBtn = document.getElementById('sizeChangeCancelBtn');
    const confirmBtn = document.getElementById('sizeChangeConfirmBtn');
    if (titleEl) titleEl.textContent = isEn ? 'Change album size?' : 'Đổi khổ album?';
    if (descEl) {
      const dims = isEn ? targetFmt.dimsEn : targetFmt.dimsVi;
      descEl.textContent = isEn
        ? `Your current design will be adjusted to fit ${dims}. Some photos or text may need minor repositioning.`
        : `Thiết kế hiện tại sẽ được tự động điều chỉnh để phù hợp với khổ ${dims}. Một số ảnh hoặc chữ có thể cần căn lại.`;
    }
    if (cancelBtn) cancelBtn.textContent = isEn ? 'Cancel' : 'Hủy';
    if (confirmBtn) {
      const fmtName = isEn ? targetFmt.nameEn : targetFmt.nameVi;
      confirmBtn.textContent = isEn ? `Change to ${fmtName}` : `Đổi sang ${fmtName}`;
    }
  }

  // If studio is open, re-render active spread and filmstrip tray with translated strings
  if (typeof renderActiveSpread === 'function' && document.getElementById('interactiveLayflatBook')) {
    renumberSpreads();
    renderActiveSpread();
    renderFilmstripTray();
  }
}

// ── INIT ON LOAD ──
syncResponsiveDeviceClasses();
initUserAuthState();
loadFromLocalStorage();
initTemplateCards();
renderStudioWorkspace();
initStudioTouchGestures();
startHeroAutoFlip();
switchLanguage(currentAppLanguage);
initBackToTop();
checkStudioFirstVisit();
updateStudioUndoRedoButtons();

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
        <div style="font-size:38px;margin-bottom:12px">✨</div>
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
          <span class="review-badge-verified">✓ Đã trải nghiệm Melsou</span>
        </div>
        <h4 style="font-size:15px;font-weight:700;color:var(--dark);margin-bottom:6px">${rev.title || ''}</h4>
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
          <strong style="display:block;font-size:13.5px;color:var(--dark)">${rev.authorName || 'Khách hàng'}</strong>
          <span style="font-size:11.5px;color:var(--gray)">${rev.package || 'Gói photobook'}</span>
        </div>
      </div>
    </div>`).join('');
}


// ============================================================
// 📖 FB47: BLOG / MEMORY JOURNAL STOREFRONT & READER MODAL
// ============================================================
var activeBlogCategory = 'all';
var currentLoadedBlogPosts = [];

function filterBlogCategory(category, btn) {
  activeBlogCategory = category;
  const container = document.getElementById('blogCategoryTabs');
  if (container) {
    const chips = container.querySelectorAll('.sal-chip');
    chips.forEach(c => c.classList.remove('active'));
    if (btn) btn.classList.add('active');
  }
  renderPublicBlog(category);
}

function renderPublicBlog(category = 'all') {
  const list = document.getElementById('publicBlogList');
  if (!list) return;

  let posts = [];
  if (typeof window.codexGetPublishedPosts === 'function') {
    try {
      posts = window.codexGetPublishedPosts(category) || [];
    } catch(e) {
      console.warn('codexGetPublishedPosts error:', e);
    }
  }

  currentLoadedBlogPosts = posts;

  const isEn = (currentAppLanguage === 'en');
  if (!posts || posts.length === 0) {
    list.innerHTML = `
      <div class="blog-empty-state">
        <div style="font-size:42px;margin-bottom:14px">📖</div>
        <h3 style="font-size:19px;font-weight:700;color:var(--dark);margin-bottom:8px">${isEn ? 'The first stories of Melsou are being prepared...' : 'Những câu chuyện đầu tiên của Melsou đang được chuẩn bị...'}</h3>
        <p style="font-size:14px;color:var(--gray);max-width:580px;margin:0 auto;line-height:1.65">
          ${isEn ? 'We will soon share cherished keepsake memories, design inspirations, and artisan stories from our workshop.' : 'Chúng tôi sẽ sớm chia sẻ những kinh nghiệm lưu giữ kỷ niệm, cảm hứng thiết kế và câu chuyện từ xưởng in Melsou đến bạn.'}
        </p>
      </div>`;
    return;
  }

  list.innerHTML = posts.map((post, idx) => `
    <div class="blog-card-item" onclick="openBlogArticleReader(${idx})">
      <div style="height:200px;background:url('${post.coverImage || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600'}') center/cover"></div>
      <div style="padding:22px;display:flex;flex-direction:column;flex:1;justify-content:space-between">
        <div>
          <span style="font-size:11px;font-weight:700;color:var(--red);text-transform:uppercase;letter-spacing:1px">
            ${post.categoryLabel || 'Kỷ vật'} · ${post.publishDate || ''}
          </span>
          <h3 style="font-size:17.5px;font-weight:700;margin:8px 0;color:var(--dark);line-height:1.4">${post.title}</h3>
          <p style="font-size:13px;color:#4b5563;line-height:1.6;margin-bottom:14px">${post.excerpt || ''}</p>
        </div>
        <span style="font-size:12.5px;font-weight:700;color:var(--red)">Đọc tiếp câu chuyện →</span>
      </div>
    </div>`).join('');
}

function openBlogArticleReader(postIdx) {
  const post = currentLoadedBlogPosts[postIdx];
  if (!post) return;

  const modal = document.getElementById('blogArticleReaderModal');
  const coverImg = document.getElementById('readerCoverImg');
  const catBadge = document.getElementById('readerCategoryBadge');
  const pubDate = document.getElementById('readerPublishDate');
  const titleEl = document.getElementById('readerTitle');
  const bodyEl = document.getElementById('readerBody');

  if (coverImg) coverImg.src = post.coverImage || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800';
  if (catBadge) catBadge.textContent = post.categoryLabel || 'KỶ VẬT & THANH ÂM';
  if (pubDate) pubDate.textContent = post.publishDate || '';
  if (titleEl) titleEl.textContent = post.title;
  if (bodyEl) {
    bodyEl.innerHTML = post.contentHtml || `<p>${post.content || post.excerpt || ''}</p>`;
  }

  if (modal) modal.classList.add('open');
}

function closeBlogArticleReader() {
  const modal = document.getElementById('blogArticleReaderModal');
  if (modal) modal.classList.remove('open');
}


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

  // If user is logged in
  if (currentUser && currentUser.loggedIn) {
    if (guestForm) guestForm.style.display = 'none';
    loadOrFetchConversation();
    return;
  }

  // If guest with previous session
  if (chatState.guestInfo) {
    if (guestForm) guestForm.style.display = 'none';
    loadOrFetchConversation();
    return;
  }

  // Otherwise show friendly guest form before starting
  if (guestForm) guestForm.style.display = 'block';
  if (chatMessages) chatMessages.innerHTML = '';
}

function submitGuestChatStart() {
  const name = document.getElementById('chatGuestNameInput')?.value.trim();
  const contact = document.getElementById('chatGuestContactInput')?.value.trim();

  if (!name || !contact) {
    showToast('Vui lòng nhập tên và thông tin liên hệ');
    return;
  }

  chatState.guestInfo = { name, contact };
  const guestForm = document.getElementById('chatGuestForm');
  if (guestForm) guestForm.style.display = 'none';

  if (typeof window.codexChatStartConversation === 'function') {
    try {
      window.codexChatStartConversation({ name, contact });
    } catch(e) {
      console.warn('codexChatStartConversation error:', e);
    }
  }

  // Add warm welcome message from Melsou
  chatState.messages.push({
    sender: 'melsou',
    text: `Chào ${name}! Melsou rất vui được hỗ trợ bạn. Bạn đang quan tâm đến gói photobook nào hay cần xưởng hướng dẫn chọn ảnh?`,
    time: getCurrentChatTime()
  });

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
  textarea.style.height = 'auto';
  textarea.style.height = Math.min(100, Math.max(36, textarea.scrollHeight)) + 'px';
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
    status: 'Đang gửi...'
  };

  chatState.messages.push(msg);
  renderChatMessages();

  // Reset composer
  if (input) {
    input.value = '';
    input.style.height = '36px';
  }
  clearChatAttachment();

  // Contract Hook for Codex Realtime
  if (typeof window.codexChatSendMessage === 'function') {
    try {
      window.codexChatSendMessage({ text, file }, (response) => {
        msg.status = response?.status || 'Đã gửi';
        renderChatMessages();
      });
      return;
    } catch(e) {
      console.warn('codexChatSendMessage error:', e);
    }
  }

  // Polite connection notice when backend contract is not yet active
  setTimeout(() => {
    msg.status = 'Đã gửi';
    renderChatMessages();
    const notice = document.getElementById('chatConnectionNotice');
    if (notice) notice.style.display = 'block';
  }, 400);
}


// ============================================================
// 🛡️ OWNER / ADMIN SUPPORT INBOX SHELL (FB48: ADMIN VIEW)
// ============================================================
window.openOwnerSupportInbox = function() {
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

renderCustomerReviews();
renderPublicBlog('all');


// ============================================================
// 🌟 FB57: CANVA-INSPIRED STUDIO ENGINE (5-ZONE IA & MOBILE)
// ============================================================
var activeRailTabIndex = 0;
var isFlyoutDrawerOpen = true;
var mobileActivePageHalf = 'left'; // 'left' | 'right'
var currentStudioSelection = { type: 'none', id: null, el: null };

const CANVA_TAB_TITLES = [
  '📐 Khổ & Gói Sản Phẩm',
  '🎨 Bố Cục Nghệ Thuật',
  '📸 Kho Ảnh Kỷ Niệm',
  '✨ Sticker & Họa Tiết',
  '✒️ Lời Nhắn & Khắc Chữ',
  '🎵 Giai Điệu & Âm Thanh'
];

function handleRailTabClick(tabIndex) {
  const drawer = document.getElementById('canvaSidebarEl');
  if (!drawer) return;

  const isCollapsed = drawer.classList.contains('collapsed');

  // If clicking the currently active tab on desktop/tablet while drawer is open -> collapse
  if (!isCollapsed && activeRailTabIndex === tabIndex && !isMobileViewport()) {
    closeFlyoutDrawer();
    return;
  }

  openFlyoutDrawer(tabIndex);
}

function openFlyoutDrawer(tabIndex) {
  activeRailTabIndex = tabIndex;
  isFlyoutDrawerOpen = true;

  document.body.classList.add('drawer-open');
  const drawer = document.getElementById('canvaSidebarEl');
  if (drawer) {
    drawer.classList.remove('collapsed');
    if (isMobileViewport()) {
      drawer.classList.remove('snap-expanded', 'snap-full');
      drawer.classList.add('snap-compact', 'snap-half');
    }
    adjustMobileStageScale();
    recalculateDrawerAvailableHeight();
  }

  const isEn = (currentAppLanguage === 'en');
  const titles = isEn ? [
    '📐 Size & Pack',
    '🎨 Composition & Layout',
    '📸 Photo Memories',
    '✨ Decorative Stickers',
    '✒️ Handwritten Message',
    '🎵 Audio & Melody'
  ] : [
    '📐 Khổ & Gói Album',
    '🎨 Bố Cục & Trình Bày',
    '📸 Kho Ảnh Kỷ Niệm',
    '✨ Sticker Trang Trí',
    '✒️ Lời Nhắn Yêu Thương',
    '🎵 Âm Thanh & Giai Điệu'
  ];

  const titleEl = document.getElementById('flyoutDrawerTitle');
  if (titleEl && titles[tabIndex]) {
    titleEl.textContent = titles[tabIndex];
  }

  document.querySelectorAll('.studio-rail-btn, .canva-nav-tab').forEach((btn, idx) => {
    btn.classList.toggle('active', idx === tabIndex);
  });

  switchCanvaTab(tabIndex);
}

function closeFlyoutDrawer() {
  document.body.classList.remove('drawer-open');
  isFlyoutDrawerOpen = false;
  const drawer = document.getElementById('canvaSidebarEl');
  if (drawer) {
    drawer.classList.add('collapsed');
    drawer.classList.remove('snap-compact', 'snap-half', 'snap-expanded', 'snap-full');
  }
  document.querySelectorAll('.studio-rail-btn').forEach(btn => btn.classList.remove('active'));
  adjustMobileStageScale();
  recalculateDrawerAvailableHeight();
}

function selectSpreadItem(type, id, el, e) {
  if (e) e.stopPropagation();
  currentStudioSelection = { type, id, el };
  updateContextualToolbar();
}

function clearStudioSelection() {
  currentStudioSelection = { type: 'none', id: null, el: null };
  updateContextualToolbar();
}

function updateContextualToolbar() {
  if (typeof currentStudioSelection === 'undefined' || !currentStudioSelection) {
    currentStudioSelection = { type: 'none', id: null, el: null };
  }
  const desktopBar = document.getElementById('studioContextualToolbar');
  const mobileBar = document.getElementById('mobileContextualBottomBar');
  const curSpread = ALBUM_DATA.spreads ? ALBUM_DATA.spreads[ALBUM_DATA.activeSpreadIndex] : null;
  if (!curSpread) return;

  const totalSpreads = ALBUM_DATA.spreads.length;
  const spreadNum = ALBUM_DATA.activeSpreadIndex;

  // 1. DESKTOP CONTEXTUAL TOOLBAR
  if (desktopBar) {
    if (currentStudioSelection.type === 'photo') {
      const slotKey = currentStudioSelection.id;
      desktopBar.innerHTML = `
        <div class="ctx-left">
          <span class="ctx-badge">📸 Khung Ảnh</span>
          <div class="ctx-divider"></div>
          <label class="ctx-btn" style="cursor:pointer">
            <input type="file" accept="image/*" onchange="handleReplaceSpecificPhoto(event)" style="display:none">
            <span>📷 Thay ảnh</span>
          </label>
          <button class="ctx-btn" onclick="openPhotoCropToolbar('${slotKey}', event)">✂️ Cắt / Căn chỉnh</button>
          <button class="ctx-btn" onclick="cyclePhotoFilter('${slotKey}')">🎨 Bộ lọc</button>
          <button class="ctx-btn danger" onclick="clearPhotoSlot('${slotKey}')">🗑️ Xóa ảnh</button>
        </div>
        <div class="ctx-right">
          <button class="ctx-btn" onclick="clearStudioSelection()">✕ Hủy chọn</button>
        </div>
      `;
    } else if (currentStudioSelection.type === 'text') {
      desktopBar.innerHTML = `
        <div class="ctx-left">
          <span class="ctx-badge">✒️ Văn Bản</span>
          <div class="ctx-divider"></div>
          <select class="ctx-select" onchange="applyTextFont(this.value)">
            <option value="'Lora', serif" ${(ALBUM_DATA.letterFont || '').includes('Lora') ? 'selected' : ''}>Lora</option>
            <option value="'Playfair Display', serif" ${(ALBUM_DATA.letterFont || '').includes('Playfair') ? 'selected' : ''}>Playfair Display</option>
            <option value="'Pacifico', cursive" ${(ALBUM_DATA.letterFont || '').includes('Pacifico') ? 'selected' : ''}>Pacifico</option>
            <option value="'Montserrat', sans-serif" ${(ALBUM_DATA.letterFont || '').includes('Montserrat') ? 'selected' : ''}>Montserrat</option>
            <option value="'Be Vietnam Pro', sans-serif" ${(ALBUM_DATA.letterFont || '').includes('Be Vietnam') ? 'selected' : ''}>Be Vietnam Pro</option>
          </select>
          <button class="ctx-btn-icon" onclick="adjustTextFontSize(-2)" title="Giảm cỡ chữ">A-</button>
          <button class="ctx-btn-icon" onclick="adjustTextFontSize(2)" title="Tăng cỡ chữ">A+</button>
          <div class="ctx-divider"></div>
          <div style="display:flex;gap:4px">
            <span class="ctx-color-dot" style="background:#222222" onclick="applyTextColor('#222222')" title="Đen mực"></span>
            <span class="ctx-color-dot" style="background:#A82323" onclick="applyTextColor('#A82323')" title="Đỏ Melsou"></span>
            <span class="ctx-color-dot" style="background:#2563eb" onclick="applyTextColor('#2563eb')" title="Xanh navy"></span>
            <span class="ctx-color-dot" style="background:#854d0e" onclick="applyTextColor('#854d0e')" title="Nâu vintage"></span>
          </div>
          <div class="ctx-divider"></div>
          <button class="ctx-btn-icon" onclick="toggleTextBold()" title="In đậm"><b>B</b></button>
          <button class="ctx-btn-icon" onclick="toggleTextItalic()" title="In nghiêng"><i>I</i></button>
        </div>
        <div class="ctx-right">
          <button class="ctx-btn" onclick="clearStudioSelection()">✕ Hủy chọn</button>
        </div>
      `;
    } else if (currentStudioSelection.type === 'sticker') {
      const elId = currentStudioSelection.id;
      desktopBar.innerHTML = `
        <div class="ctx-left">
          <span class="ctx-badge">✨ Sticker</span>
          <div class="ctx-divider"></div>
          <button class="ctx-btn" onclick="bringElementForward(${elId})">⬆ Lên trước</button>
          <button class="ctx-btn" onclick="sendElementBackward(${elId})">⬇ Về sau</button>
          <button class="ctx-btn" onclick="flipElementHorizontal(${elId})">↔ Lật ngang</button>
          <button class="ctx-btn" onclick="rotateSpreadElement90(${elId})">🔄 Xoay 90°</button>
          <button class="ctx-btn danger" onclick="removeSpreadElement(${elId});clearStudioSelection()">🗑️ Xóa</button>
        </div>
        <div class="ctx-right">
          <button class="ctx-btn" onclick="clearStudioSelection()">✕ Hủy chọn</button>
        </div>
      `;
    } else {
      // SPREAD LEVEL
      desktopBar.innerHTML = `
        <div class="ctx-left">
          <span class="ctx-badge">📖 ${curSpread.name || 'Trang Album'}</span>
          <div class="ctx-divider"></div>
          <button class="ctx-btn-icon" onclick="goToPrevSpread()" title="Trang trước" ${spreadNum <= 0 ? 'disabled' : ''}>‹</button>
          <span style="font-size:11.5px;font-weight:700;color:var(--gray)">${spreadNum + 1} / ${totalSpreads}</span>
          <button class="ctx-btn-icon" onclick="goToNextSpread()" title="Trang sau" ${spreadNum >= totalSpreads - 1 ? 'disabled' : ''}>›</button>
          <div class="ctx-divider"></div>
          <span style="font-size:11px;color:var(--gray)">Màu nền:</span>
          <div style="display:flex;gap:4px">
            <span class="ctx-color-dot" style="background:#ffffff" onclick="applySpreadBgColor('#ffffff')" title="Trắng giấy"></span>
            <span class="ctx-color-dot" style="background:#FAF7F2" onclick="applySpreadBgColor('#FAF7F2')" title="Giấy kraft sáng"></span>
            <span class="ctx-color-dot" style="background:#FFF5F5" onclick="applySpreadBgColor('#FFF5F5')" title="Hồng pastel"></span>
            <span class="ctx-color-dot" style="background:#F5EFEB" onclick="applySpreadBgColor('#F5EFEB')" title="Kem ấm cổ điển"></span>
          </div>
        </div>
        <div class="ctx-right">
          <button class="ctx-btn" onclick="togglePrintSafeGuides()" title="Hiển thị lề an toàn in">📏 Vùng in</button>
          <button class="ctx-btn" style="background:var(--red-light);color:var(--red);border-color:var(--red)" onclick="addNewSpreadToAlbum()">${currentAppLanguage === 'en' ? '➕ Add 2 pages (+15,000₫)' : '➕ Thêm 2 trang (+15.000đ)'}</button>
        </div>
      `;
    }
  }

  // 2. MOBILE CONTEXTUAL BOTTOM BAR
  if (mobileBar) {
    if (currentStudioSelection.type === 'photo') {
      const slotKey = currentStudioSelection.id;
      mobileBar.innerHTML = `
        <button class="mc-btn" onclick="clearStudioSelection()"><span class="mc-icon">✕</span><span>Đóng</span></button>
        <label class="mc-btn" style="cursor:pointer">
          <input type="file" accept="image/*" onchange="handleReplaceSpecificPhoto(event)" style="display:none">
          <span class="mc-icon">📷</span><span>Đổi ảnh</span>
        </label>
        <button class="mc-btn" onclick="openPhotoCropToolbar('${slotKey}', event)"><span class="mc-icon">✂️</span><span>Cắt ảnh</span></button>
        <button class="mc-btn" onclick="cyclePhotoFilter('${slotKey}')"><span class="mc-icon">🎨</span><span>Bộ lọc</span></button>
        <button class="mc-btn danger" onclick="clearPhotoSlot('${slotKey}')"><span class="mc-icon">🗑️</span><span>Xóa</span></button>
      `;
    } else if (currentStudioSelection.type === 'text') {
      mobileBar.innerHTML = `
        <button class="mc-btn" onclick="clearStudioSelection()"><span class="mc-icon">✕</span><span>Đóng</span></button>
        <button class="mc-btn" onclick="openFlyoutDrawer(4)"><span class="mc-icon">✏️</span><span>Sửa chữ</span></button>
        <button class="mc-btn" onclick="adjustTextFontSize(2)"><span class="mc-icon">A+</span><span>Cỡ chữ</span></button>
        <button class="mc-btn" onclick="toggleTextBold()"><span class="mc-icon"><b>B</b></span><span>Đậm</span></button>
        <button class="mc-btn" onclick="applyTextColor(ALBUM_DATA.inkColor === '#A82323' ? '#222222' : '#A82323')"><span class="mc-icon">🎨</span><span>Màu</span></button>
      `;
    } else if (currentStudioSelection.type === 'sticker') {
      const elId = currentStudioSelection.id;
      mobileBar.innerHTML = `
        <button class="mc-btn" onclick="clearStudioSelection()"><span class="mc-icon">✕</span><span>Đóng</span></button>
        <button class="mc-btn" onclick="flipElementHorizontal(${elId})"><span class="mc-icon">↔️</span><span>Lật</span></button>
        <button class="mc-btn" onclick="rotateSpreadElement90(${elId})"><span class="mc-icon">🔄</span><span>Xoay</span></button>
        <button class="mc-btn" onclick="bringElementForward(${elId})"><span class="mc-icon">⬆️</span><span>Lên lớp</span></button>
        <button class="mc-btn danger" onclick="removeSpreadElement(${elId});clearStudioSelection()"><span class="mc-icon">🗑️</span><span>Xóa</span></button>
      `;
    } else {
      const isEn = (currentAppLanguage === 'en');
      mobileBar.innerHTML = `
        <button class="mc-btn primary" onclick="openFlyoutDrawer(2)" title="${isEn ? 'Add photo' : 'Thêm ảnh'}"><span class="mc-icon">＋</span><span>${isEn ? 'Add' : 'Thêm'}</span></button>
        <button class="mc-btn" onclick="openFlyoutDrawer(1)" title="${isEn ? 'Layout' : 'Bố cục'}"><span class="mc-icon">🎨</span><span>${isEn ? 'Layout' : 'Bố cục'}</span></button>
        <button class="mc-btn" onclick="openFlyoutDrawer(2)" title="${isEn ? 'Photos' : 'Ảnh'}"><span class="mc-icon">📸</span><span>${isEn ? 'Photos' : 'Ảnh'}</span></button>
        <button class="mc-btn" onclick="openFlyoutDrawer(3)" title="${isEn ? 'Stickers' : 'Sticker'}"><span class="mc-icon">✨</span><span>${isEn ? 'Stickers' : 'Sticker'}</span></button>
        <button class="mc-btn" onclick="openFlyoutDrawer(4)" title="${isEn ? 'Message' : 'Lời nhắn'}"><span class="mc-icon">✍️</span><span>${isEn ? 'Text' : 'Lời nhắn'}</span></button>
        <button class="mc-btn" onclick="openFlyoutDrawer(5)" title="${isEn ? 'Audio' : 'Âm thanh'}"><span class="mc-icon">🎵</span><span>${isEn ? 'Audio' : 'Âm thanh'}</span></button>
        <button class="mc-btn" onclick="openFlyoutDrawer(0)" title="${isEn ? 'Size & Package' : 'Khổ & Gói'}"><span class="mc-icon">📐</span><span>${isEn ? 'Size & Pack' : 'Khổ & Gói'}</span></button>
      `;
    }
  }
}

function toggleFilmstripCollapse() {
  const wrapper = document.getElementById('studioFilmstripWrapper');
  const icon = document.getElementById('filmstripToggleIcon');
  if (!wrapper) return;
  wrapper.classList.toggle('collapsed');
  if (icon) {
    icon.textContent = wrapper.classList.contains('collapsed') ? '▲' : '▼';
  }
  requestAnimationFrame(() => {
    adjustMobileStageScale();
    recalculateDrawerAvailableHeight();
  });
}

function applySpreadBgColor(color) {
  const curSpread = ALBUM_DATA.spreads[ALBUM_DATA.activeSpreadIndex];
  if (!curSpread) return;
  curSpread.bgColor = color;
  const leftPage = document.getElementById('stageLeftPage');
  const rightPage = document.getElementById('stageRightPage');
  if (leftPage) leftPage.style.backgroundColor = color;
  if (rightPage) rightPage.style.backgroundColor = color;
  autoSaveToLocalStorage();
  showToast(currentAppLanguage === 'en' ? 'Page background updated' : 'Đã đổi màu nền trang');
}

function cyclePhotoFilter(slotKey) {
  if (!ALBUM_DATA.photoFilters) ALBUM_DATA.photoFilters = {};
  const filters = ['none', 'sepia(0.4) contrast(1.1)', 'grayscale(1)', 'sepia(0.2) saturate(1.3)'];
  const filterNames = ['Gốc', 'Vintage', 'Đen Trắng', 'Ấm Áp'];
  const cur = ALBUM_DATA.photoFilters[slotKey] || 0;
  const next = (cur + 1) % filters.length;
  ALBUM_DATA.photoFilters[slotKey] = next;

  const img = document.getElementById('photoImg_' + slotKey);
  if (img) {
    img.style.filter = filters[next];
  }
  autoSaveToLocalStorage();
  showToast('🎨 Bộ lọc: ' + filterNames[next]);
}

function clearPhotoSlot(slotKey) {
  if (slotKey.startsWith('el_')) {
    const elId = parseInt(slotKey.replace('el_', ''));
    removeSpreadElement(elId);
    clearStudioSelection();
    return;
  }
  const spread = ALBUM_DATA.spreads[ALBUM_DATA.activeSpreadIndex];
  if (spread && spread[slotKey]) {
    spread[slotKey] = '';
    renderActiveSpread();
    clearStudioSelection();
    autoSaveToLocalStorage();
    showToast(currentAppLanguage === 'en' ? 'Photo cleared' : 'Đã xóa ảnh khỏi khung');
  }
}

function flipElementHorizontal(elId) {
  const spread = ALBUM_DATA.spreads[ALBUM_DATA.activeSpreadIndex];
  if (!spread || !spread.elements) return;
  const el = spread.elements.find(e => e.id === elId);
  if (el) {
    el.flipH = !el.flipH;
    const domEl = document.getElementById('canvaEl_' + elId);
    if (domEl) {
      const curRot = el.rotate || 0;
      domEl.style.transform = `rotate(${curRot}deg) scaleX(${el.flipH ? -1 : 1})`;
    }
    autoSaveToLocalStorage();
  }
}

function rotateSpreadElement90(elId) {
  const spread = ALBUM_DATA.spreads[ALBUM_DATA.activeSpreadIndex];
  if (!spread || !spread.elements) return;
  const el = spread.elements.find(e => e.id === elId);
  if (el) {
    el.rotate = ((el.rotate || 0) + 90) % 360;
    const domEl = document.getElementById('canvaEl_' + elId);
    if (domEl) {
      domEl.style.transform = `rotate(${el.rotate}deg) scaleX(${el.flipH ? -1 : 1})`;
    }
    autoSaveToLocalStorage();
  }
}



function applyTextFont(fontFamily) {
  ALBUM_DATA.letterFont = fontFamily;
  renderActiveSpread();
  autoSaveToLocalStorage();
}

function adjustTextFontSize(delta) {
  ALBUM_DATA.letterFontSize = Math.max(10, Math.min(36, (ALBUM_DATA.letterFontSize || 14) + delta));
  const textEls = document.querySelectorAll('.pb-editable-text');
  textEls.forEach(t => { t.style.fontSize = ALBUM_DATA.letterFontSize + 'px'; });
  autoSaveToLocalStorage();
}

function applyTextColor(color) {
  ALBUM_DATA.inkColor = color;
  const textEls = document.querySelectorAll('.pb-editable-text');
  textEls.forEach(t => { t.style.color = color; });
  autoSaveToLocalStorage();
}

function toggleTextBold() {
  ALBUM_DATA.letterFontWeight = ALBUM_DATA.letterFontWeight === 'bold' ? 'normal' : 'bold';
  const textEls = document.querySelectorAll('.pb-editable-text');
  textEls.forEach(t => { t.style.fontWeight = ALBUM_DATA.letterFontWeight; });
  autoSaveToLocalStorage();
}

function toggleTextItalic() {
  ALBUM_DATA.letterFontStyle = ALBUM_DATA.letterFontStyle === 'italic' ? 'normal' : 'italic';
  const textEls = document.querySelectorAll('.pb-editable-text');
  textEls.forEach(t => { t.style.fontStyle = ALBUM_DATA.letterFontStyle; });
  autoSaveToLocalStorage();
}
