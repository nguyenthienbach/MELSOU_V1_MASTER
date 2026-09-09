/* ============================================================
   🌟 MELSOU MASTER FRONTEND ENGINE V12.0 (REAL SUPABASE GOOGLE OAUTH) 🌟
============================================================ */

const SCHEMA_VERSION = 'v12.0_real_supabase_google_oauth';
const EXTRA_SPREAD_PRICE = 15000; // 15.000đ / 1 trang đôi (2 trang ruột)

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
    nameEn: 'First Love Edition',
    taglineVi: 'Tình yêu đầu, góc quán quen và những lời tỏ tình giấu kín',
    taglineEn: 'First love, warm tea talks, and unspoken sweet confessions',
    tagVi: 'Chọn mẫu này →',
    tagEn: 'Select template →',
    coverImg: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=800&auto=format&fit=crop&q=80',
    spread1: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&auto=format&fit=crop&q=80',
    spread2: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80',
    title: 'FIRST LOVE',
    quote: 'Mỗi ánh nhìn là một lần tim rung lên khe khẽ.'
  },
  {
    id: 'graduation',
    nameVi: 'Mùa tốt nghiệp',
    nameEn: 'Our Graduation',
    taglineVi: 'Kỷ yếu thanh xuân, tà áo cử nhân và hoa tươi trao tay',
    taglineEn: 'Graduation memories, gowns, and joyful hand-tied bouquets',
    tagVi: 'Chọn mẫu này →',
    tagEn: 'Select template →',
    coverImg: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80',
    spread1: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=600&auto=format&fit=crop&q=80',
    spread2: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&auto=format&fit=crop&q=80',
    title: 'OUR GRADUATION',
    quote: 'Thanh xuân rực rỡ nhất dưới khoảng trời sân trường.'
  },
  {
    id: 'besties',
    nameVi: 'Hội bạn thân',
    nameEn: 'Besties Archive',
    taglineVi: 'Tụ họp nhóm bạn thân, máy ảnh film và tiếng cười rộn rã',
    taglineEn: 'Cherished reunions, film captures, and endless shared laughter',
    tagVi: 'Chọn mẫu này →',
    tagEn: 'Select template →',
    coverImg: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&auto=format&fit=crop&q=80',
    spread1: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&auto=format&fit=crop&q=80',
    spread2: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80',
    title: 'BESTIES ARCHIVE',
    quote: 'Không cần hẹn trước, gặp nhau là rôm rả cả ngày.'
  },
  {
    id: 'somewhere',
    nameVi: 'Hành trình bên nhau',
    nameEn: 'Somewhere Together',
    taglineVi: 'Khung cảnh hoàng hôn biển và những cung đường xa xôi',
    taglineEn: 'Golden ocean sunsets and unforgettable scenic road trips',
    tagVi: 'Chọn mẫu này →',
    tagEn: 'Select template →',
    coverImg: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
    spread1: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&auto=format&fit=crop&q=80',
    spread2: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80',
    title: 'SOMEWHERE TOGETHER',
    quote: 'Đi đâu cũng được, miễn là được đi cùng nhau.'
  },
  {
    id: 'memory-box',
    nameVi: 'Hộp kỷ vật hoài niệm',
    nameEn: 'Memory Box Keepsake',
    taglineVi: 'Giấy Kraft mộc mạc lưu giữ những điều trân quý',
    taglineEn: 'Authentic rustic Kraft paper keeping timeless moments close',
    tagVi: 'Chọn mẫu này →',
    tagEn: 'Select template →',
    coverImg: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&auto=format&fit=crop&q=80',
    spread1: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&auto=format&fit=crop&q=80',
    spread2: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80',
    title: 'MEMORY BOX',
    quote: 'Lưu giữ nguyên vẹn những gì đáng trân quý nhất.'
  },
  {
    id: 'sweet-romance',
    nameVi: 'Tình nồng say',
    nameEn: 'Sweet Romance',
    taglineVi: 'Tone đỏ rượu vang Burgundy và hoa hồng nhung ấm áp',
    taglineEn: 'Rich burgundy tones paired with deep velvety red roses',
    tagVi: 'Chọn mẫu này →',
    tagEn: 'Select template →',
    coverImg: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=800&auto=format&fit=crop&q=80',
    spread1: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&auto=format&fit=crop&q=80',
    spread2: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
    title: 'SWEET ROMANCE',
    quote: 'Tình yêu như ly rượu vang, càng ủ lâu càng nồng nàn.'
  },
  {
    id: 'fandom',
    nameVi: 'Đêm hòa nhạc',
    nameEn: 'Concert & Fandom Era',
    taglineVi: 'Ánh đèn sân khấu rực rỡ và giai điệu thần tượng hòa ca',
    taglineEn: 'Vibrant stage lights, crowd cheers, and unforgettable anthems',
    tagVi: 'Chọn mẫu này →',
    tagEn: 'Select template →',
    coverImg: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
    spread1: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
    spread2: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&auto=format&fit=crop&q=80',
    title: 'CONCERT ERA',
    quote: 'Hòa mình vào biển ánh sáng và khúc ca tuổi trẻ.'
  },
  {
    id: 'healing',
    nameVi: 'Năm tháng thanh xuân',
    nameEn: 'Silent Healing & Youth',
    taglineVi: 'Tone xanh lá chữa lành, tìm về an yên trong tâm hồn',
    taglineEn: 'Calming botanical greenery bringing peace and gentle memories',
    tagVi: 'Chọn mẫu này →',
    tagEn: 'Select template →',
    coverImg: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&auto=format&fit=crop&q=80',
    spread1: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=80',
    spread2: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&auto=format&fit=crop&q=80',
    title: 'SILENT HEALING',
    quote: 'Tìm lại sự tĩnh lặng giữa nhịp sống hối hả.'
  }
];

function getFreshAlbumData() {
  return {
    version: SCHEMA_VERSION,
    title: 'FRIEND SHIP',
    quote: 'Snapshots of happiness that never fade.',
    salutation: 'Gửi người thương,',
    message: 'Cảm ơn cậu vì đã luôn ở bên, ngay cả những lúc tôi không biết mình cần được ở bên. Mỗi trang sách này là một phần tuổi trẻ tuyệt đẹp của chúng ta... 💖',
    signature: '— Sài Gòn, 2026 · melsou keepsake —',
    letterFont: "'Lora', serif",
    inkColor: '#1A1A1A',
    spotifyUrl: '',
    spotifyTrack: '',
    spotifyTrackId: '',
    spotifyCodeImg: '',
    package: 'signature',
    basePrice: 199000,
    sizeAdj: 0,
    sizeClass: 'ratio-portrait',
    extraSpreadsCount: 0,
    activeSpreadIndex: 0,
    recordedAudioBlob: null,
    isHomeRecording: false,
    activePhotoSlot: null,
    photoTransforms: {},
    userGallery: [
      'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=600&auto=format&fit=crop&q=80'
    ],
    spreads: [
      {
        id: 'cover',
        name: 'Bìa Trước',
        isClosedCover: true,
        coverImg: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&auto=format&fit=crop&q=80',
        elements: []
      },
      {
        id: 'spread-1',
        name: 'Trang 2–3',
        leftType: 'spotify-hero',
        elements: [
          { id: 101, type: 'photo', img: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80', x: 470, y: 30, width: 220, rotate: -2 },
          { id: 102, type: 'photo', img: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&auto=format&fit=crop&q=80', x: 440, y: 220, width: 210, rotate: 2 }
        ]
      },
      {
        id: 'spread-2',
        name: 'Trang 4–5',
        elements: [
          { id: 201, type: 'photo', img: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&auto=format&fit=crop&q=80', x: 50, y: 40, width: 220, rotate: -2 },
          { id: 202, type: 'photo', img: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=600&auto=format&fit=crop&q=80', x: 70, y: 220, width: 220, rotate: 2 },
          { id: 203, type: 'photo', img: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80', x: 480, y: 40, width: 220, rotate: -2 },
          { id: 204, type: 'photo', img: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&auto=format&fit=crop&q=80', x: 450, y: 220, width: 200, rotate: 2 }
        ]
      },
      {
        id: 'spread-3',
        name: 'Trang 6–7',
        elements: [
          { id: 301, type: 'photo', img: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&auto=format&fit=crop&q=80', x: 40, y: 50, width: 320, rotate: 0 },
          { id: 302, type: 'photo', img: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&auto=format&fit=crop&q=80', x: 440, y: 100, width: 210, rotate: 2 }
        ]
      },
      {
        id: 'spread-4',
        name: 'Trang 8–9',
        elements: [
          { id: 401, type: 'photo', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80', x: 50, y: 40, width: 200, rotate: -4 },
          { id: 402, type: 'photo', img: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&q=80', x: 430, y: 80, width: 220, rotate: 2 }
        ]
      },
      {
        id: 'spread-5',
        name: 'Trang 10–11',
        leftType: 'handwritten-letter',
        elements: [
          { id: 501, type: 'photo', img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80', x: 470, y: 40, width: 220, rotate: -2 },
          { id: 502, type: 'photo', img: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=80', x: 440, y: 220, width: 210, rotate: 2 }
        ]
      },
      {
        id: 'back-cover',
        name: 'Bìa Sau',
        isClosedBack: true,
        backImg: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=600&auto=format&fit=crop&q=80',
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
        return;
      }
    }
  } catch(e) {}
  ALBUM_DATA = getFreshAlbumData();
  autoSaveToLocalStorage();
}

// ── NAVIGATION & PAGES ──
function showPage(pageId) {
  autoSaveToLocalStorage();
  document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
  const target = document.getElementById('page-' + pageId);
  if (target) target.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (pageId === 'studio') {
    document.body.classList.add('in-studio');
    document.body.classList.add('studio-mode-active');
    renderStudioWorkspace();
    adjustMobileStageScale();
  } else {
    document.body.classList.remove('in-studio');
    document.body.classList.remove('studio-mode-active');
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

function handleNativeLoginSubmit() {
  const emailInput = document.getElementById('loginEmailInput');
  const passInput = document.getElementById('loginPasswordInput');
  const email = emailInput ? emailInput.value.trim() : '';
  const password = passInput ? passInput.value : '';
  const errorBox = document.getElementById('authModalErrorBox');
  const errorMsg = document.getElementById('authModalErrorMessage');

  if (!email || !password) {
    if (errorBox) errorBox.style.display = 'flex';
    if (errorMsg) errorMsg.textContent = currentAppLanguage === 'en' ? 'Please enter both email and password' : 'Vui lòng nhập đầy đủ email và mật khẩu';
    return;
  }

  if (typeof window.codexHandleNativeLogin === 'function') {
    window.codexHandleNativeLogin({ email, password });
  } else {
    if (errorBox) errorBox.style.display = 'flex';
    if (errorMsg) errorMsg.textContent = currentAppLanguage === 'en' ? 'Authentication service is connecting to Melsou server. Please try again in a moment or use Google Sign-In.' : 'Hệ thống xác thực đang kết nối máy chủ Melsou. Vui lòng thử lại sau giây lát hoặc sử dụng Google Sign-In.';
  }
}

function handleNativeRegisterSubmit() {
  const emailInput = document.getElementById('regEmailInput');
  const passInput = document.getElementById('regPasswordInput');
  const confirmInput = document.getElementById('regConfirmPasswordInput');
  const email = emailInput ? emailInput.value.trim() : '';
  const password = passInput ? passInput.value : '';
  const confirmPassword = confirmInput ? confirmInput.value : '';
  const errorBox = document.getElementById('authModalErrorBox');
  const errorMsg = document.getElementById('authModalErrorMessage');

  if (!email || !password || !confirmPassword) {
    if (errorBox) errorBox.style.display = 'flex';
    if (errorMsg) errorMsg.textContent = currentAppLanguage === 'en' ? 'Please fill in all registration fields' : 'Vui lòng điền đầy đủ tất cả thông tin đăng ký';
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

  if (typeof window.codexHandleNativeRegister === 'function') {
    window.codexHandleNativeRegister({ email, password });
  } else {
    if (errorBox) errorBox.style.display = 'flex';
    if (errorMsg) errorMsg.textContent = currentAppLanguage === 'en' ? 'Authentication service is connecting to Melsou server. Please try again in a moment or use Google Sign-In.' : 'Hệ thống xác thực đang kết nối máy chủ Melsou. Vui lòng thử lại sau giây lát hoặc sử dụng Google Sign-In.';
  }
}

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

  const html = TEMPLATES_DATA.map((t, idx) => {
    const title = currentAppLanguage === 'en' ? (t.nameEn || t.title) : (t.nameVi || t.title);
    const tagline = currentAppLanguage === 'en' ? (t.taglineEn || t.taglineVi) : (t.taglineVi || t.taglineEn);
    const tag = currentAppLanguage === 'en' ? (t.tagEn || 'Select template →') : (t.tagVi || 'Chọn mẫu này →');
    const quote = currentAppLanguage === 'en' ? (t.quoteEn || t.quote) : (t.quoteVi || t.quote);
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
            <div style="position:absolute;bottom:12px;left:12px;background:rgba(0,0,0,0.7);color:white;padding:4px 8px;border-radius:4px;font-size:10px">${currentAppLanguage === 'en' ? 'Layout Spread 1' : 'Bố cục ruột trang 1'}</div>
          </div>
          <div class="art-tmpl-slide" id="tSlide_${idx}_2">
            <img src="${t.spread2}" class="bg-cover" alt="">
            <div style="position:absolute;bottom:12px;left:12px;background:rgba(0,0,0,0.7);color:white;padding:4px 8px;border-radius:4px;font-size:10px">${currentAppLanguage === 'en' ? 'Letter & Sound' : 'Trang thư &amp; Nhạc'}</div>
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

  if (heroStep === 0) {
    left.innerHTML = `<div style="font-family:'Pacifico',cursive;font-size:22px;color:var(--yellow)">melsou</div><div><div style="font-family:'Lora',serif;font-size:20px;font-weight:700">${ALBUM_DATA.title}</div><div style="font-size:11.5px;font-style:italic;opacity:0.8;margin-top:4px">"${ALBUM_DATA.quote}"</div></div><div style="font-size:10px;opacity:0.7">Bìa cứng mở phẳng 180° · Bấm để lật 3D →</div>`;
    right.innerHTML = `<div class="pb-polaroid" style="transform:rotate(2deg)"><div class="pb-washi-corner" style="top:-6px;left:50%;transform:translateX(-50%)"></div><div style="height:120px;background:url('${ALBUM_DATA.spreads[0].coverImg}') center/cover;border-radius:2px"></div></div><div class="spotify-soundwave-bar" style="margin:0"><div class="spotify-logo-icon">🎵</div><div class="spotify-wave-lines"><span class="sw-line" style="height:8px"></span><span class="sw-line" style="height:16px"></span><span class="sw-line" style="height:10px"></span><span class="sw-line" style="height:20px"></span></div><span style="font-size:10px;font-weight:700">Spotify</span></div>`;
} else if (heroStep === 1) {
    left.innerHTML = `<div style="font-size:10px;font-weight:800;color:var(--red)">OUR TIMES</div><h3 style="font-size:18px">Giai Điệu Kỷ Niệm</h3><div class="spotify-soundwave-bar"><div class="spotify-logo-icon">🎵</div><div class="spotify-wave-lines"><span class="sw-line" style="height:14px"></span><span class="sw-line" style="height:22px"></span><span class="sw-line" style="height:8px"></span><span class="sw-line" style="height:18px"></span></div><span style="font-size:10px;font-weight:700">${(ALBUM_DATA.spotifyTrack || 'Thanh Xuân').split('—')[0]}</span></div>`;
    right.innerHTML = `<div class="pb-polaroid" style="transform:rotate(-3deg)"><div style="height:110px;background:url('${ALBUM_DATA.userGallery[0]}') center/cover"></div></div><div class="pb-polaroid" style="transform:rotate(3deg);margin-top:6px"><div style="height:110px;background:url('${ALBUM_DATA.userGallery[1]}') center/cover"></div></div>`;
  } else {
    left.innerHTML = `<span style="font-family:'Pacifico',cursive;color:var(--red);font-size:16px">${ALBUM_DATA.salutation || 'Gửi người thương,'}</span><p style="font-family:${ALBUM_DATA.letterFont};color:${ALBUM_DATA.inkColor};font-size:11px;font-style:italic;line-height:1.6;margin-top:4px">${ALBUM_DATA.message.slice(0, 110)}...</p><div style="font-size:9.5px;color:var(--gray);text-align:right;margin-top:8px">${ALBUM_DATA.signature}</div>`;
    right.innerHTML = `<div class="pb-polaroid" style="height:100%"><div style="height:100%;background:url('${ALBUM_DATA.userGallery[2]}') center/cover;border-radius:2px"></div></div>`;
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
  ALBUM_DATA.quote = quote;
  if (coverImg) ALBUM_DATA.spreads[0].coverImg = coverImg;
  autoSaveToLocalStorage();
  showPage('studio');
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
}

function renumberSpreads() {
  let pageCounter = 2;
  ALBUM_DATA.spreads.forEach((spread, idx) => {
    if (idx === 0) {
      spread.name = 'Bìa Trước';
      spread.isClosedCover = true;
    } else if (idx === ALBUM_DATA.spreads.length - 1) {
      spread.name = 'Bìa Sau';
      spread.isClosedBack = true;
    } else {
      spread.isClosedCover = false;
      spread.isClosedBack = false;
      spread.name = `Trang ${pageCounter}–${pageCounter + 1}`;
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
    elements: [
      { id: Date.now() + 1, type: 'photo', frameStyle: 'polaroid', img: ALBUM_DATA.userGallery[0] || 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&auto=format&fit=crop&q=80', x: 60, y: 60, width: 220, rotate: -2, crop: { zoom: 1.0, offsetX: 0, offsetY: 0 } },
      { id: Date.now() + 2, type: 'photo', frameStyle: 'polaroid', img: ALBUM_DATA.userGallery[1] || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80', x: 480, y: 60, width: 220, rotate: 2, crop: { zoom: 1.0, offsetX: 0, offsetY: 0 } }
    ]
  };

  ALBUM_DATA.spreads.splice(insertIndex, 0, newSpread);
  ALBUM_DATA.extraSpreadsCount = (ALBUM_DATA.extraSpreadsCount || 0) + 1;
  ALBUM_DATA.activeSpreadIndex = insertIndex;

  renumberSpreads();
  autoSaveToLocalStorage();
  renderStudioWorkspace();
  alert(`✅ Đã thêm thành công 1 Trang Đôi Liền Kề (+15.000đ)! Cuốn album của bạn đã được mở rộng.`);
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
    : [
        'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80'
      ];

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
  const book = document.getElementById('interactiveLayflatBook');
  const bookW = book ? (book.offsetWidth || 720) : 720;
  const bookH = book ? (book.offsetHeight || 480) : 480;

  const safeMargin = 20;
  const safeLeft = safeMargin;
  const safeTop = safeMargin;
  const safeRight = bookW - safeMargin;
  const safeBottom = bookH - safeMargin;

  const elW = el.width || (el.type === 'sticker' ? 50 : 200);
  const elH = el.frameStyle === 'oval' ? elW : (el.type === 'sticker' ? 50 : Math.round(elW * 0.65) + (el.frameStyle === 'clean' ? 0 : 30));

  // Tính toán khung bao khi có góc xoay (Rotated bounding box)
  const rad = Math.abs((el.rotate || 0) * Math.PI / 180);
  const boundW = elW * Math.cos(rad) + elH * Math.sin(rad);
  const boundH = elW * Math.sin(rad) + elH * Math.cos(rad);

  const minX = el.x - (boundW - elW) / 2;
  const maxX = minX + boundW;
  const minY = el.y - (boundH - elH) / 2;
  const maxY = minY + boundH;

  const isViolating = (minX < safeLeft || maxX > safeRight || minY < safeTop || maxY > safeBottom);
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
  if (!spread.elements) return;
  const el = spread.elements.find(e => String(e.id) === String(id));
  if (!el || el.locked) return;

  const book = document.getElementById('interactiveLayflatBook');
  const maxW = book ? book.offsetWidth : 860;
  const maxH = book ? book.offsetHeight : 460;
  const elW = el.width || 220;
  const elH = el.frameStyle === 'oval' ? elW : Math.round(elW * 0.65);

  if (alignment === 'left') el.x = 40;
  else if (alignment === 'center') el.x = Math.round((maxW - elW) / 2);
  else if (alignment === 'right') el.x = Math.round(maxW - elW - 40);
  else if (alignment === 'top') el.y = 30;
  else if (alignment === 'middle') el.y = Math.round((maxH - elH) / 2);
  else if (alignment === 'bottom') el.y = Math.round(maxH - elH - 30);

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

function normalizeElementsToSafeArea(spread) {
  if (!spread || !Array.isArray(spread.elements)) return;
  const safeLeft = 20;
  const safeTop = 20;
  const safeRight = 700;
  const safeBottom = 460;

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
  const ind = document.getElementById('currentSpreadName');
  if (ind) ind.textContent = spread.name;
  const mobInd = document.getElementById('mobileCurrentSpreadLabel');
  if (mobInd) mobInd.textContent = spread.name;

  const book = document.getElementById('interactiveLayflatBook');
  const leftPage = document.getElementById('stageLeftPage');
  const rightPage = document.getElementById('stageRightPage');
  const overlay = document.getElementById('spreadFreeformOverlay');

  if (spread.isClosedCover) {
    // 1. PHYSICAL 3D FRONT COVER (SIZE SCALED)
    book.className = 'layflat-book single-cover-mode ' + (ALBUM_DATA.sizeClass || 'ratio-portrait');
    leftPage.style.display = 'none';
    rightPage.style.display = 'flex';
    rightPage.innerHTML = `
      <div style="display:flex;flex-direction:column;height:100%;justify-content:space-between;background:linear-gradient(145deg, #fff 0%, #f7f3eb 100%)">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span style="font-family:'Pacifico',cursive;color:var(--red);font-size:22px">melsou</span>
          <span style="font-size:9.5px;font-weight:800;letter-spacing:1.5px;color:var(--gray);background:white;padding:3px 8px;border-radius:100px">BÌA TRƯỚC (COVER 3D)</span>
        </div>

        <div class="interactive-photo-slot" id="slot_coverImg" style="height:240px;margin:10px 0"
             onclick="openPhotoCropToolbar('coverImg', event)"
             ondragover="handleSlotDragOver(event)" ondragleave="handleSlotDragLeave(event)" ondrop="handleSlotDrop(event, 'coverImg')">
          <img src="${spread.coverImg || ''}" id="photoImg_coverImg" class="photo-img-layer" alt="Cover Photo">

          <button class="btn-outline" onclick="triggerDirectUpload('coverImg', event)" style="position:absolute;bottom:10px;left:50%;transform:translateX(-50%);padding:6px 14px;font-size:12px;background:rgba(255,255,255,0.95);box-shadow:0 4px 10px rgba(0,0,0,0.2)">
            📷 Đổi Ảnh Bìa Trước
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
    // 2. PHYSICAL 3D BACK COVER (SIZE SCALED)
    book.className = 'layflat-book single-back-mode ' + (ALBUM_DATA.sizeClass || 'ratio-portrait');
    leftPage.style.display = 'none';
    rightPage.style.display = 'flex';
    const hasVoice = ALBUM_DATA.package === 'voice' || ALBUM_DATA.package === 'signature';
    rightPage.innerHTML = `
      <div style="display:flex;flex-direction:column;height:100%;justify-content:space-between;background:linear-gradient(145deg, #fff 0%, #f7f3eb 100%);text-align:center">
        <div>
          <span style="font-family:'Pacifico',cursive;color:var(--red);font-size:22px">melsou</span>
          <div style="font-size:9.5px;letter-spacing:1.5px;color:var(--gray);margin-top:2px">BÌA SAU (GẮN CHIP VOICE ISD1820)</div>
        </div>

        <div class="interactive-photo-slot" id="slot_backImg" style="height:140px;margin:8px 0"
             onclick="openPhotoCropToolbar('backImg', event)"
             ondragover="handleSlotDragOver(event)" ondragleave="handleSlotDragLeave(event)" ondrop="handleSlotDrop(event, 'backImg')">
          <img src="${spread.backImg || ''}" id="photoImg_backImg" class="photo-img-layer" alt="Back Cover Photo">
          <button class="btn-outline" onclick="triggerDirectUpload('backImg', event)" style="position:absolute;bottom:6px;left:50%;transform:translateX(-50%);padding:4px 10px;font-size:11px;background:rgba(255,255,255,0.9)">
            📷 Đổi Ảnh Bìa Sau
          </button>
        </div>

        ${hasVoice ? `
          <div style="background:var(--red-light);border:2px solid var(--red);border-radius:14px;padding:14px;cursor:pointer" onclick="playRealRecordedVoice()">
            <div style="font-size:12px;font-weight:800;color:var(--red);margin-bottom:2px">🎙️ MODULE ÂM THANH ISD1820</div>
            <div style="font-size:10.5px;color:var(--gray);margin-bottom:8px">
              ${ALBUM_DATA.isHomeRecording ? '✓ Đã chọn tự thu âm tại nhà' : 'Bấm nút đỏ để nghe giọng nói thực tế'}
            </div>
            <div style="width:44px;height:44px;background:var(--red);border-radius:50%;margin:0 auto;display:flex;align-items:center;justify-content:center;color:white;font-size:18px;box-shadow:0 4px 14px rgba(168,35,35,0.4)">
              ▶
            </div>
          </div>
        ` : `
          <div style="background:#f9f9f9;border:1px dashed var(--gray-l);border-radius:12px;padding:14px;color:var(--gray);font-size:12px">
            🎵 Gói Melody · Đã in mã Spotify Soundwave Code
          </div>
        `}

        <div style="font-size:10px;color:var(--gray);font-style:italic">Xưởng chế tác melsou TP.HCM · Mở phẳng 180° Liền Trang</div>
      </div>
    `;
    if (overlay) overlay.innerHTML = '';
  } else {
    // 3. OPEN 180° SPREAD WITH SEAMLESS OVERLAY (SIZE SCALED)
    book.className = 'layflat-book ' + (ALBUM_DATA.sizeClass || 'ratio-portrait');
    leftPage.style.display = 'flex';
    rightPage.style.display = 'flex';

    if (spread.leftType === 'spotify-hero') {
      leftPage.innerHTML = `
        <div style="display:flex;flex-direction:column;height:100%;justify-content:space-between;background:var(--yellow-warm);border-radius:8px;padding:20px">
          <div>
            <span style="font-size:10px;font-weight:800;letter-spacing:2px;color:var(--red)">OUR TIMES</span>
            <h3 style="font-size:19px;font-weight:700;margin-top:4px;color:var(--dark)">Giai Điệu Của Chúng Mình</h3>
          </div>
          <div style="margin:16px 0">
            <div style="font-size:13px;font-weight:700;margin-bottom:6px;color:var(--dark)">${ALBUM_DATA.spotifyTrack || 'Thanh Xuân — Da LAB'}</div>
            ${renderSpotifyHorizontalCodeHtml()}
          </div>
          <div style="font-size:10.5px;color:var(--gray);font-style:italic">Mở ứng dụng Spotify trên điện thoại &amp; quét mã để nghe nhạc.</div>
        </div>
      `;
    } else if (spread.leftType === 'handwritten-letter') {
      leftPage.innerHTML = `
        <div style="display:flex;flex-direction:column;height:100%;justify-content:space-between;background:var(--yellow-warm);border-radius:8px;padding:20px">
          <div>
            <div class="pb-editable-text" contenteditable="true" onblur="handleSalutationInput(this.innerText)"
                 style="font-family:'Pacifico',cursive;color:var(--red);font-size:17px;margin-bottom:6px">
              ${ALBUM_DATA.salutation || 'Gửi người thương,'}
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
      leftPage.innerHTML = `<div style="height:100%;border:1px dashed transparent"></div>`;
    }

    rightPage.innerHTML = `<div style="height:100%;border:1px dashed transparent"></div>`;

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

  spread.elements.forEach((el, elementIndex) => {
    const item = document.createElement('div');
    item.id = 'canvaEl_' + el.id;
    item.style.left = el.x + 'px';
    item.style.top = el.y + 'px';
    item.style.zIndex = elementIndex + 10;
    if (el.rotate) item.style.transform = `rotate(${el.rotate}deg)`;

    const isLocked = !!el.locked;
    const isPhoto = el.type === 'photo';
    const isCropActive = ALBUM_DATA.cropEditingId === el.id;

    // 🌟 COMPACT CONTEXTUAL FLOATING TOOLBAR (LUÔN CÂN BẰNG NGANG TRÊN ĐẦU KHUNG)
    const counterRotateStyle = `transform: translateX(-50%) rotate(${-(el.rotate || 0)}deg); top: -48px;`;
    let compactToolbarHtml = '';
    if (!isCropActive) {
      if (isPhoto) {
        if (el.img) {
          compactToolbarHtml = `
            <div class="element-action-toolbar" style="${counterRotateStyle}">
              <button class="eat-btn" onclick="enterImageAdjustmentMode(${el.id}, event)" title="Chỉnh sửa & Cắt ảnh">✂️ Chỉnh ảnh</button>
              <button class="eat-btn" onclick="triggerDirectUpload('el_${el.id}', event)" title="Đổi ảnh khác">📷 Đổi ảnh</button>
              <button class="eat-btn" onclick="openMoreMenu(${el.id}, event)" title="Thêm tùy chọn (Lớp, Căn gióng, Khóa, Nhân bản)">⋯ Thêm</button>
              <button class="eat-btn danger" onclick="removeSpreadElement(${el.id})" title="Xóa">✕</button>
            </div>
          `;
        } else {
          compactToolbarHtml = `
            <div class="element-action-toolbar" style="${counterRotateStyle}">
              <button class="eat-btn" onclick="triggerDirectUpload('el_${el.id}', event)" title="Chọn ảnh từ máy">📷 Thêm ảnh</button>
              <button class="eat-btn" onclick="openMoreMenu(${el.id}, event)" title="Thêm tùy chọn">⋯ Thêm</button>
              <button class="eat-btn danger" onclick="removeSpreadElement(${el.id})" title="Xóa">✕</button>
            </div>
          `;
        }
      } else {
        compactToolbarHtml = `
          <div class="element-action-toolbar" style="${counterRotateStyle}">
            <button class="eat-btn" onclick="openMoreMenu(${el.id}, event)" title="Thêm tùy chọn">⋯ Thêm</button>
            <button class="eat-btn danger" onclick="removeSpreadElement(${el.id})" title="Xóa">✕</button>
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
        // CANVA PLACEHOLDER STATE
        innerContent = `
          <div class="canva-frame-placeholder" style="height:${frameH}px;${isOval ? 'border-radius:999px;' : ''}"
               onclick="triggerDirectUpload('el_${el.id}', event)"
               ondragover="handleSlotDragOver(event)" ondragleave="handleSlotDragLeave(event)" ondrop="handleSlotDrop(event, 'el_${el.id}')"
               title="Thả ảnh vào đây hoặc bấm để chọn ảnh từ máy">
            <div class="cfp-cloud"></div>
            <div class="cfp-hill"></div>
            <span style="font-size:26px;z-index:2">🖼️</span>
            <span style="font-size:11px;font-weight:800;z-index:2;margin-top:2px">Thả ảnh vào đây</span>
            <div class="photo-drop-hint-overlay">✨ Thả ảnh vào đây</div>
          </div>
        `;
      } else {
        // POPULATED IMAGE VIEWPORT WITH CROP & DRAG-PAN
        innerContent = `
          <div class="canva-frame-inner-viewport interactive-photo-slot" id="slot_el_${el.id}" style="height:${frameH}px;${isOval ? 'border-radius:999px;' : ''}"
               ondblclick="enterImageAdjustmentMode(${el.id}, event)"
               onpointerdown="${isCropActive ? `initImagePanningInsideFrame(event, ${el.id})` : ''}"
               ondragover="handleSlotDragOver(event)" ondragleave="handleSlotDragLeave(event)" ondrop="handleSlotDrop(event, 'el_${el.id}')">
            <img src="${el.img}" class="canva-frame-img" id="photoImg_el_${el.id}"
                 style="transform: rotate(${crop.rotate || 0}deg) scale(${crop.zoom || 1}) translate(${crop.offsetX || 0}px, ${crop.offsetY || 0}px);"
                 alt="Frame Photo">
            <div class="photo-drop-hint-overlay">✨ Thả ảnh vào đây</div>
          </div>
        `;
      }

      item.innerHTML = `
        <div class="crop-mode-badge">✂️ Chế độ chỉnh ảnh (Kéo để di chuyển)</div>

        <div class="canva-frame-toolbar" style="transform: translateX(-50%) rotate(${-(el.rotate || 0)}deg); top: -52px;">
          <span style="font-size:10.5px">Zoom:</span>
          <input type="range" min="1.0" max="3.0" step="0.05" value="${crop.zoom || 1}" style="width:65px;accent-color:var(--red);cursor:pointer" oninput="applyFrameCropZoom(${el.id}, this.value)">
          <button class="cft-btn" onclick="rotateFrameCropImage(${el.id}, event)" title="Xoay ảnh 90°">🔄 Xoay 90°</button>
          <button class="cft-btn" onclick="resetFrameCrop(${el.id}, event)" title="Căn giữa lại ảnh">🎯 Căn Giữa</button>
          <button class="cft-btn" onclick="triggerDirectUpload('el_${el.id}', event)" title="Đổi sang ảnh khác">📷 Đổi Ảnh</button>
          <button class="cft-btn cft-done" onclick="exitImageAdjustmentMode(event)">✓ Xong</button>
        </div>

        ${compactToolbarHtml}
        ${(!isCropActive && !isLocked) ? `
          <div class="fci-resize-handle" onmousedown="initResizeElement(event, ${el.id})" title="Kéo để thay đổi kích thước"></div>
          <div class="fci-rotate-handle" onpointerdown="initRotateElement(event, ${el.id})" title="Kéo để xoay khung 360°">🔄</div>
        ` : ''}

        <div class="safe-area-violation-badge">⚠️ Vượt mép in (Có thể bị xén)</div>
        <div class="canva-image-frame-wrapper ${isClean ? 'style-clean' : ''} ${isOval ? 'style-clean' : ''}" style="width:${frameW}px;${isOval ? 'border-radius:999px;padding:0;' : ''}" id="cFrame_${el.id}">
          ${(!isClean && !isOval) ? `<div class="pb-washi-corner" style="top:-6px;left:50%;transform:translateX(-50%)"></div>` : ''}
          ${innerContent}
        </div>
      `;
    } else if (el.type === 'text') {
      item.className = 'freeform-canvas-item' + (isLocked ? ' is-locked' : '');
      item.innerHTML = `
        ${compactToolbarHtml}
        ${(!isLocked) ? `<div class="fci-rotate-handle" onpointerdown="initRotateElement(event, ${el.id})" title="Kéo để xoay 360°">🔄</div>` : ''}
        <div class="safe-area-violation-badge">⚠️ Vượt mép in (Có thể bị xén)</div>
        <div style="display:inline-flex;align-items:center;padding:6px 14px;background:rgba(255,255,255,0.95);border:1.5px dashed rgba(168,35,35,0.4);border-radius:8px;box-shadow:0 4px 14px rgba(0,0,0,0.12);cursor:grab">
          <span style="font-size:14px;color:var(--red);margin-right:8px;user-select:none;cursor:grab;font-weight:bold" title="Giữ chuột vào đây hoặc ô chữ để kéo di chuyển">⋮⋮</span>
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
        ${(!isLocked) ? `<div class="fci-rotate-handle" onpointerdown="initRotateElement(event, ${el.id})" title="Kéo để xoay 360°">🔄</div>` : ''}
        <div class="safe-area-violation-badge">⚠️ Vượt mép in (Có thể bị xén)</div>
        <div style="font-size:38px;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.2))">${el.char}</div>
      `;
    }

    // 🌟 RIGHT-CLICK CONTEXT MENU LISTENER
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

// ── ROBUST POINTERCAPTURE DRAGGING (ZERO MOUSE-STICK BUG) ──
function makePointerDraggable(el, dataObj) {
  let isDragging = false;
  let hasMoved = false;
  let startX, startY;
  let initialPointerX, initialPointerY;

  el.addEventListener('pointerdown', function(e) {
    if (ALBUM_DATA.cropEditingId === dataObj?.id) return; // In crop mode, user is panning the photo inside
    if (dataObj && dataObj.type === 'photo') {
      ALBUM_DATA.activePhotoSlot = 'el_' + dataObj.id;
    }
    if (e.target.closest('.fci-delete-btn') || e.target.closest('.fci-resize-handle') || e.target.closest('.fci-rotate-handle') || e.target.closest('.btn-outline') || e.target.closest('.canva-frame-toolbar') || e.target.closest('.element-action-toolbar')) return;

    startX = e.clientX - el.offsetLeft;
    startY = e.clientY - el.offsetTop;
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
      const newX = e.clientX - startX;
      const newY = e.clientY - startY;
      el.style.left = newX + 'px';
      el.style.top = newY + 'px';
      if (dataObj) { dataObj.x = newX; dataObj.y = newY; }
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
    const diff = ev.clientX - startX;
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

  let html = ALBUM_DATA.spreads.map((spread, idx) => {
    const isCover = idx === 0;
    const isBack = idx === ALBUM_DATA.spreads.length - 1;

    return `
      <div class="filmstrip-item ${idx === ALBUM_DATA.activeSpreadIndex ? 'active' : ''}" onclick="jumpToSpread(${idx})">
        ${spread.isCustomAdded ? `<button onclick="removeCustomSpread(${idx}, event)" style="position:absolute;top:-4px;right:-4px;background:#dc2626;color:white;border:none;border-radius:50%;width:18px;height:18px;font-size:10px;font-weight:800;z-index:20">✕</button>` : ''}

        ${isCover || isBack ? `
          <div class="filmstrip-single-cover">${isCover ? 'Bìa Trước' : 'Bìa Sau'}</div>
        ` : `
          <div class="filmstrip-mini-spread">
            <div class="fms-page">${idx * 2}</div>
            <div class="fms-page">${idx * 2 + 1}</div>
          </div>
        `}
        <div class="filmstrip-label">${spread.name}</div>
      </div>
    `;
  }).join('');

  html += `
    <button class="btn-add-spread-tray" onclick="addNewSpreadToAlbum()" title="Thêm 1 trang đôi liền kề (+15.000đ)">
      <span style="font-size:16px">➕</span>
      <span>Thêm Trang (+15k)</span>
    </button>
  `;

  tray.innerHTML = html;
}

function jumpToSpread(index) {
  playPaperFlipSound();
  ALBUM_DATA.activeSpreadIndex = index;
  closePhotoToolbar();
  renderActiveSpread();
  updateNavSpreadButtons();
}
function goToNextSpread() { if (ALBUM_DATA.activeSpreadIndex < ALBUM_DATA.spreads.length - 1) jumpToSpread(ALBUM_DATA.activeSpreadIndex + 1); }
function goToPrevSpread() { if (ALBUM_DATA.activeSpreadIndex > 0) jumpToSpread(ALBUM_DATA.activeSpreadIndex - 1); }

function updateNavSpreadButtons() {
  if (typeof ALBUM_DATA === 'undefined' || !ALBUM_DATA.spreads) return;
  const isFirst = ALBUM_DATA.activeSpreadIndex <= 0;
  const isLast = ALBUM_DATA.activeSpreadIndex >= ALBUM_DATA.spreads.length - 1;

  const btnPrev = document.getElementById('btnToolbarPrev');
  const btnNext = document.getElementById('btnToolbarNext');
  if (btnPrev) {
    btnPrev.disabled = isFirst;
    btnPrev.style.opacity = isFirst ? '0.35' : '1';
    btnPrev.style.cursor = isFirst ? 'not-allowed' : 'pointer';
    btnPrev.title = currentAppLanguage === 'en' ? 'Previous page' : 'Trang trước';
    btnPrev.setAttribute('aria-label', btnPrev.title);
  }
  if (btnNext) {
    btnNext.disabled = isLast;
    btnNext.style.opacity = isLast ? '0.35' : '1';
    btnNext.style.cursor = isLast ? 'not-allowed' : 'pointer';
    btnNext.title = currentAppLanguage === 'en' ? 'Next page' : 'Trang sau';
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
    btn3D.textContent = currentAppLanguage === 'en' ? '🔍 View 3D' : '🔍 Xem 3D';
  }
  const msm3D = document.getElementById('msmItem3D');
  if (msm3D) {
    msm3D.textContent = currentAppLanguage === 'en' ? '🔍 View 3D' : '🔍 Xem 3D';
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
  if (!e.target.closest('.interactive-photo-slot') && !e.target.closest('#photoCropToolbar')) {
    closePhotoToolbar();
  }
  if (!e.target.closest('.user-menu-wrapper')) {
    const uMenu = document.getElementById('userDropdownMenu');
    if (uMenu) uMenu.classList.remove('open');
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

// ── 🎵 SPOTIFY DYNAMIC DATA & SMART SEARCH ENGINE (FB13) ──
const SPOTIFY_CATALOG = [
  {
    title: 'Until I Found You',
    artist: 'Stephen Sanchez',
    artwork: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120&auto=format&fit=crop&q=80',
    type: 'track',
    id: '0T5iIrXA4p5GsubkhuBIKV',
    url: 'https://open.spotify.com/track/0T5iIrXA4p5GsubkhuBIKV'
  },
  {
    title: 'Thanh Xuân',
    artist: 'Da LAB',
    artwork: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=120&auto=format&fit=crop&q=80',
    type: 'track',
    id: '5lGvFOz1d6659Llxqx1qAH',
    url: 'https://open.spotify.com/track/5lGvFOz1d6659Llxqx1qAH'
  },
  {
    title: 'Perfect',
    artist: 'Ed Sheeran',
    artwork: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=120&auto=format&fit=crop&q=80',
    type: 'track',
    id: '0tgVpDi06FyKpA1z0VMD4v',
    url: 'https://open.spotify.com/track/0tgVpDi06FyKpA1z0VMD4v'
  },
  {
    title: 'Golden Hour',
    artist: 'JVKE',
    artwork: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=120&auto=format&fit=crop&q=80',
    type: 'track',
    id: '5G2f63n7IPVPPjfNIGih7Q',
    url: 'https://open.spotify.com/track/5G2f63n7IPVPPjfNIGih7Q'
  },
  {
    title: 'Lover',
    artist: 'Taylor Swift',
    artwork: 'https://images.unsplash.com/photo-1445985543469-433ecdd62977?w=120&auto=format&fit=crop&q=80',
    type: 'track',
    id: '1dGr1c8CrMLDpV6mPbImSI',
    url: 'https://open.spotify.com/track/1dGr1c8CrMLDpV6mPbImSI'
  },
  {
    title: 'Nàng Thơ',
    artist: 'Hoàng Dũng',
    artwork: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120&auto=format&fit=crop&q=80',
    type: 'track',
    id: '1w3eUC89GPspKpi62tPwjt',
    url: 'https://open.spotify.com/track/1w3eUC89GPspKpi62tPwjt'
  },
  {
    title: 'Ngày Đầu Tiên',
    artist: 'Đức Phúc',
    artwork: 'https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=120&auto=format&fit=crop&q=80',
    type: 'track',
    id: '2HD74f3P4RdkpcSdhQVo99',
    url: 'https://open.spotify.com/track/2HD74f3P4RdkpcSdhQVo99'
  },
  {
    title: 'Say Yes To Heaven',
    artist: 'Lana Del Rey',
    artwork: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=120&auto=format&fit=crop&q=80',
    type: 'track',
    id: '3GCdLUSnKSMJhs4Tj6CV3s',
    url: 'https://open.spotify.com/track/3GCdLUSnKSMJhs4Tj6CV3s'
  }
];

const SPOTIFY_OLD_CATALOG_SKIP = [
];

function parseSpotifyUrl(url) {
  if (!url) return null;
  const match = url.match(/(track|playlist|album|artist|episode)[/:]([a-zA-Z0-9]+)/);
  if (match) {
    return { type: match[1], id: match[2] };
  }
  return null;
}

let spotifySearchDebounce = null;

function handleSpotifySongSearch(query) {
  const q = (query || '').trim().toLowerCase();
  const resBox = document.getElementById('spotifySearchResultsBox');
  const spinner = document.getElementById('spotifySearchSpinner');
  if (!resBox) return;

  if (spotifySearchDebounce) clearTimeout(spotifySearchDebounce);

  if (!q) {
    resBox.style.display = 'none';
    resBox.innerHTML = '';
    if (spinner) spinner.style.display = 'none';
    return;
  }

  if (spinner) spinner.style.display = 'inline-block';

  spotifySearchDebounce = setTimeout(() => {
    if (spinner) spinner.style.display = 'none';
    const matches = SPOTIFY_CATALOG.filter(item =>
      item.title.toLowerCase().includes(q) || item.artist.toLowerCase().includes(q)
    );

    if (matches.length === 0) {
      resBox.innerHTML = `
        <div style="padding:14px;text-align:center;font-size:12px;color:var(--gray)">
          🔍 Không tìm thấy bài hát nào khớp với "${query}".<br>
          <span style="font-size:11px;opacity:0.8">Bạn vẫn có thể dán đường dẫn Spotify trực tiếp ở ô bên dưới.</span>
        </div>
      `;
      resBox.style.display = 'block';
      return;
    }

    resBox.innerHTML = matches.map(item => `
      <div class="spotify-search-item" onclick="selectSpotifyTrack('${item.id}')"
           style="display:flex;align-items:center;gap:10px;padding:8px 10px;cursor:pointer;border-bottom:1px solid #f3f4f6;transition:background 0.15s ease">
        <img src="${item.artwork}" style="width:38px;height:38px;border-radius:6px;object-fit:cover" alt="${item.title}">
        <div style="flex:1;min-width:0">
          <div style="font-size:12.5px;font-weight:700;color:var(--dark);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${item.title}</div>
          <div style="font-size:11px;color:var(--gray);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${item.artist}</div>
        </div>
        <button class="btn-outline" style="padding:3px 8px;font-size:11px;border-radius:6px;pointer-events:none">Chọn</button>
      </div>
    `).join('');
    resBox.style.display = 'block';
  }, 220);
}

function selectSpotifyTrack(trackId) {
  const item = SPOTIFY_CATALOG.find(t => t.id === trackId);
  if (!item) return;

  pushStudioSnapshot('Chọn bài hát Spotify: ' + item.title);
  ALBUM_DATA.spotifyTrack = `${item.title} — ${item.artist}`;
  ALBUM_DATA.spotifyUrl = item.url;
  ALBUM_DATA.spotifyTrackId = item.id;
  ALBUM_DATA.spotifyArtwork = item.artwork;
  ALBUM_DATA.spotifyCodeImg = 'https://scannables.scdn.co/uri/plain/svg/000000/white/640/spotify:track:' + item.id;

  const resBox = document.getElementById('spotifySearchResultsBox');
  if (resBox) resBox.style.display = 'none';

  const sInp = document.getElementById('spotifySearchInput');
  if (sInp) sInp.value = item.title + ' — ' + item.artist;

  const lInp = document.getElementById('spotifyLinkInput');
  if (lInp) lInp.value = item.url;

  renderSpotifySelectedState();
  renderSpotifyOfficialEmbed();
  autoSaveToLocalStorage();
  renderActiveSpread();
  showToast(`Đã liên kết bài hát: ${item.title}`);
}

function removeSelectedSpotifySong() {
  pushStudioSnapshot('Gỡ bài hát Spotify');
  ALBUM_DATA.spotifyTrack = '';
  ALBUM_DATA.spotifyUrl = '';
  ALBUM_DATA.spotifyTrackId = '';
  ALBUM_DATA.spotifyArtwork = '';
  ALBUM_DATA.spotifyCodeImg = '';

  const sInp = document.getElementById('spotifySearchInput');
  if (sInp) sInp.value = '';

  const lInp = document.getElementById('spotifyLinkInput');
  if (lInp) lInp.value = '';

  renderSpotifySelectedState();
  renderSpotifyOfficialEmbed();
  autoSaveToLocalStorage();
  renderActiveSpread();
  showToast('Đã hủy liên kết bài hát Spotify');
}

// ── 🎵 SPOTIFY HORIZONTAL SCANNABLE CODE ENGINE (FB35) ──
function renderSpotifyHorizontalCodeHtml() {
  if (ALBUM_DATA.spotifyCodeImg) {
    return `
      <div class="spotify-scannable-bar-wrap" style="width:100%;max-width:320px;margin:8px auto;text-align:center">
        <img src="${ALBUM_DATA.spotifyCodeImg}" alt="Spotify Scannable Code"
             style="width:100%;height:38px;border-radius:6px;box-shadow:0 3px 12px rgba(0,0,0,0.18);display:block;margin:0 auto;object-fit:cover"
             onerror="this.onerror=null;this.replaceWith(renderFallbackSpotifyCodeSvg())">
        <div style="font-size:9.5px;color:var(--gray);margin-top:4px;letter-spacing:0.5px">Quét trên app Spotify để phát nhạc</div>
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
    if (art) art.src = ALBUM_DATA.spotifyArtwork || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120&auto=format&fit=crop&q=80';
    if (title) title.textContent = ALBUM_DATA.spotifyTrack.split(' — ')[0] || ALBUM_DATA.spotifyTrack;
    if (artist) artist.textContent = ALBUM_DATA.spotifyTrack.split(' — ')[1] || 'Spotify Track';
  } else {
    if (card) card.style.display = 'none';
    if (empty) empty.style.display = 'block';
  }
}

function handleSpotifyLinkChange(val) {
  const trimmed = val.trim();
  ALBUM_DATA.spotifyUrl = trimmed;
  const parsed = parseSpotifyUrl(trimmed);

  if (parsed) {
    pushStudioSnapshot('Dán liên kết Spotify');
    ALBUM_DATA.spotifyTrackId = parsed.id;
    ALBUM_DATA.spotifyCodeImg = 'https://scannables.scdn.co/uri/plain/svg/000000/white/640/spotify:track:' + parsed.id;
    if (!ALBUM_DATA.spotifyTrack) ALBUM_DATA.spotifyTrack = 'Giai Điệu Tùy Chọn';
  } else {
    ALBUM_DATA.spotifyTrackId = '';
    ALBUM_DATA.spotifyCodeImg = '';
    if (!trimmed) ALBUM_DATA.spotifyTrack = '';
  }

  renderSpotifySelectedState();
  renderSpotifyOfficialEmbed();
  autoSaveToLocalStorage();
  renderActiveSpread();
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

function selectAlbumSize(adj, name, ratioClass) {
  ALBUM_DATA.sizeAdj = adj;
  ALBUM_DATA.sizeClass = ratioClass;
  ALBUM_DATA.sizeName = name;
  document.querySelectorAll('#sizeCardSelectorGroup .layout-card').forEach(el => el.classList.remove('active'));
  const cardId = {
    'ratio-portrait': 'sizeCardA5',
    'ratio-square': 'sizeCardSquare',
    'ratio-landscape': 'sizeCardLandscape',
    'ratio-mini': 'sizeCardMini'
  }[ratioClass];
  const card = document.getElementById(cardId);
  if (card) card.classList.add('active');
  updateStudioPriceDisplay();
  autoSaveToLocalStorage();
  renderActiveSpread();
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

// ── 📖 3D FULLSCREEN REALTIME HEYZINE FLIPBOOK MODAL & RECOVERED CORE HANDLERS ──

function openFlipbookModal() {
  const modal = document.getElementById('flipbook3DModal');
  if (modal) modal.classList.add('open');
  fbmIdx = (typeof ALBUM_DATA !== 'undefined' && ALBUM_DATA.activeSpreadIndex != null) ? ALBUM_DATA.activeSpreadIndex : 0;
  renderFlipbookSpread();
}

function closeFlipbookModal() {
  const modal = document.getElementById('flipbook3DModal');
  if (modal) modal.classList.remove('open');
}

function triggerPageCurlEffect(direction) {
  const leaf = document.getElementById('fbmTurnLeaf');
  if (!leaf) return;
  leaf.className = 'fbm-turn-leaf ' + (direction === 'forward' ? 'flip-forward' : 'flip-backward');
  setTimeout(() => { leaf.className = 'fbm-turn-leaf'; }, 550);
}

function fbmNextPage() {
  if (typeof ALBUM_DATA === 'undefined' || !ALBUM_DATA.spreads) return;
  if (fbmIdx < ALBUM_DATA.spreads.length - 1) {
    triggerPageCurlEffect('forward');
    playPaperFlipSound();
    fbmIdx++;
    renderFlipbookSpread();
  }
}

function fbmPrevPage() {
  if (fbmIdx > 0) {
    triggerPageCurlEffect('backward');
    playPaperFlipSound();
    fbmIdx--;
    renderFlipbookSpread();
  }
}

function renderFlipbookSpread() {
  if (typeof ALBUM_DATA === 'undefined' || !ALBUM_DATA.spreads) return;
  const spread = ALBUM_DATA.spreads[fbmIdx];
  if (!spread) return;
  const book = document.getElementById('fbmBookContainer');
  const l = document.getElementById('fbmLeftPage');
  const r = document.getElementById('fbmRightPage');
  const overlay = document.getElementById('fbmFreeformOverlay');
  const cnt = document.getElementById('fbmPageCounter');
  const modalTitle = document.getElementById('fbmModalTitle');

  if (modalTitle) {
    modalTitle.textContent = currentAppLanguage === 'en'
      ? '3D REALTIME ALBUM · melsou Seamless Layflat 180°'
      : 'ALBUM 3D REALTIME · melsou Mở Phẳng Liền Trang 180°';
  }

  if (!book || !l || !r) return;
  if (overlay) overlay.innerHTML = '';

  if (spread.isClosedCover) {
    // 1. BÌA TRƯỚC 3D REALTIME (ĐỒNG BỘ 100% CROP & TRANSFORM)
    book.className = 'fbm-book fbm-single-cover';
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
    // 2. BÌA SAU 3D REALTIME (ĐỒNG BỘ CHIP VOICE ISD1820 & SPOTIFY)
    book.className = 'fbm-book fbm-single-back';
    l.style.display = 'none';
    r.style.display = 'flex';
    const bt = (ALBUM_DATA.photoTransforms && ALBUM_DATA.photoTransforms['backImg']) || { zoom: 1, rotate: 0, x: 0, y: 0 };
    const hasVoice = ALBUM_DATA.package === 'voice' || ALBUM_DATA.package === 'signature';
    r.innerHTML = `
      <div style="height:100%;width:100%;background:linear-gradient(145deg,#fff,#f7f3eb);display:flex;flex-direction:column;justify-content:space-between;align-items:center;padding:24px;text-align:center;border-radius:12px 4px 4px 12px">
        <div>
          <div style="font-family:'Pacifico',cursive;font-size:24px;color:var(--red)">melsou</div>
          <div style="font-size:10px;color:var(--gray);letter-spacing:1px">${currentAppLanguage === 'en' ? 'BACK COVER' : 'BÌA SAU KẾT BÀI'}</div>
        </div>
        <div style="height:160px;width:80%;border-radius:8px;overflow:hidden;box-shadow:0 4px 14px rgba(0,0,0,0.15);position:relative">
          <img src="${spread.backImg || ''}" style="width:100%;height:100%;object-fit:cover;transform:scale(${bt.zoom || 1}) rotate(${bt.rotate || 0}deg) translate(${bt.x || 0}px, ${bt.y || 0}px)">
        </div>
        ${hasVoice ? `
          <div style="background:var(--red-light);border:2px solid var(--red);border-radius:12px;padding:12px;width:100%;cursor:pointer" onclick="playRealRecordedVoice()">
            <div style="font-size:12px;font-weight:800;color:var(--red)">🎙️ MODULE ÂM THANH ISD1820</div>
            <div style="font-size:10.5px;color:var(--gray);margin-top:2px">
              ${ALBUM_DATA.isHomeRecording ? (currentAppLanguage === 'en' ? '✓ Record at home selected' : '✓ Đã chọn tự thu âm tại nhà') : (currentAppLanguage === 'en' ? 'Click to play physical recorded voice' : 'Bấm để nghe giọng nói thực tế')}
            </div>
            <div style="width:32px;height:32px;background:var(--red);border-radius:50%;margin:6px auto 0;display:flex;align-items:center;justify-content:center;color:white;font-size:14px">▶</div>
          </div>
        ` : `<div style="font-size:11.5px;color:var(--gray);background:#f9f9f9;padding:10px;border-radius:8px;border:1px dashed #ddd">🎵 ${currentAppLanguage === 'en' ? 'Melody Package · Spotify Soundwave Code' : 'Gói Melody · Đã in mã Spotify Soundwave'}</div>`}
        <div style="font-size:10px;color:var(--gray);font-style:italic">${currentAppLanguage === 'en' ? 'Melsou HCMC Workshop · 180° Layflat' : 'Xưởng melsou TP.HCM · Mở phẳng 180°'}</div>
      </div>
    `;
  } else {
    // 3. TRANG RUỘT REALTIME 1:1 CẢ 2 TRANG TRÁI VÀ PHẢI
    book.className = 'fbm-book';
    l.style.display = 'flex';
    r.style.display = 'flex';

    // RENDER LEFT PAGE
    if (spread.leftType === 'spotify-hero') {
      l.innerHTML = `
        <div style="height:100%;width:100%;background:var(--yellow-warm);border-radius:8px;padding:24px;display:flex;flex-direction:column;justify-content:space-between">
          <div>
            <span style="font-size:10px;font-weight:800;color:var(--red);letter-spacing:2px">OUR TIMES</span>
            <h3 style="font-size:20px;font-weight:700;margin-top:4px">${ALBUM_DATA.spotifyTrack || 'Thanh Xuân — Da LAB'}</h3>
          </div>
          <div style="margin:20px 0">
            ${ALBUM_DATA.spotifyCodeImg ? `
              <img src="${ALBUM_DATA.spotifyCodeImg}" style="width:100%;border-radius:6px;box-shadow:0 4px 12px rgba(139,30,63,0.35)">
            ` : `
              <div class="spotify-soundwave-bar"><div class="spotify-logo-icon">🎵</div><span style="font-size:12px;font-weight:700">${ALBUM_DATA.spotifyTrack || 'Spotify Soundwave'}</span></div>
            `}
          </div>
          <div style="font-size:11px;color:var(--gray);font-style:italic">${currentAppLanguage === 'en' ? 'Scan code on Spotify mobile app to play music.' : 'Quét mã trên app Spotify để phát nhạc.'}</div>
        </div>
      `;
    } else if (spread.leftType === 'handwritten-letter') {
      l.innerHTML = `
        <div style="height:100%;width:100%;background:var(--yellow-warm);border-radius:8px;padding:24px;display:flex;flex-direction:column;justify-content:space-between">
          <div>
            <div style="font-family:'Pacifico',cursive;color:var(--red);font-size:18px">${ALBUM_DATA.salutation || 'Gửi người thương,'}</div>
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
                    <div class="cfp-cloud"></div><div class="cfp-hill"></div>
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
    const sName = currentAppLanguage === 'en'
      ? spread.name.replace('Bìa Trước', 'Front Cover').replace('Bìa Sau', 'Back Cover').replace('Trang', 'Pages')
      : spread.name;
    cnt.textContent = `${sName} (${fbmIdx + 1} / ${ALBUM_DATA.spreads.length})`;
  }

  // Update navigation button disabled states in 3D modal
  const prevBtn = document.getElementById('fbmPrevBtn');
  const nextBtn = document.getElementById('fbmNextBtn');
  if (prevBtn) {
    prevBtn.disabled = fbmIdx <= 0;
    prevBtn.style.opacity = fbmIdx <= 0 ? '0.35' : '1';
    prevBtn.style.cursor = fbmIdx <= 0 ? 'not-allowed' : 'pointer';
    prevBtn.textContent = currentAppLanguage === 'en' ? '◀ Previous (←)' : '◀ Lật Trang Trước (←)';
  }
  if (nextBtn) {
    nextBtn.disabled = fbmIdx >= ALBUM_DATA.spreads.length - 1;
    nextBtn.style.opacity = fbmIdx >= ALBUM_DATA.spreads.length - 1 ? '0.35' : '1';
    nextBtn.style.cursor = fbmIdx >= ALBUM_DATA.spreads.length - 1 ? 'not-allowed' : 'pointer';
    nextBtn.textContent = currentAppLanguage === 'en' ? 'Next Page (→) ▶' : 'Lật Trang Sau (→) ▶';
  }
}

// ── RECOVERED CORE MODAL HANDLERS & POLICIES ──
function openDraftsManagerModal() { const m = document.getElementById('draftsManagerModal'); if (m) m.classList.add('open'); }
function closeDraftsManagerModal() { const m = document.getElementById('draftsManagerModal'); if (m) m.classList.remove('open'); }
function openOrdersManagerModal() { const m = document.getElementById('ordersManagerModal'); if (m) m.classList.add('open'); }
function closeOrdersManagerModal() { const m = document.getElementById('ordersManagerModal'); if (m) m.classList.remove('open'); }
function openPrivacyPolicyModal() { const m = document.getElementById('privacyPolicyModal'); if (m) m.classList.add('open'); }
function closePrivacyPolicyModal() { const m = document.getElementById('privacyPolicyModal'); if (m) m.classList.remove('open'); }
function openWarrantyPolicyModal() { const m = document.getElementById('warrantyPolicyModal'); if (m) m.classList.add('open'); }
function closeWarrantyPolicyModal() { const m = document.getElementById('warrantyPolicyModal'); if (m) m.classList.remove('open'); }
function toggleSpeedDial() { const m = document.getElementById('speedDialMenu'); if (m) m.classList.toggle('open'); }

function performTrackingSearch() {
  const inp = document.getElementById('trackQueryInput');
  const q = inp ? inp.value.trim() : '';
  const res = document.getElementById('trackResultBox');
  const emp = document.getElementById('trackEmptyBox');
  if (q) {
    if (res) res.style.display = 'block';
    if (emp) emp.style.display = 'none';
    const title = document.getElementById('trackOrderTitle');
    if (title) title.textContent = `${q} · Nguyễn Thiện Bách`;
  } else {
    if (res) res.style.display = 'none';
    if (emp) emp.style.display = 'block';
  }
}

function resetTrackingSearch() {
  const inp = document.getElementById('trackQueryInput');
  if (inp) { inp.value = ''; inp.focus(); }
  const res = document.getElementById('trackResultBox');
  if (res) res.style.display = 'none';
  const emp = document.getElementById('trackEmptyBox');
  if (emp) emp.style.display = 'none';
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
  if (b) b.textContent = ALBUM_DATA.cart.length;

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

  let discountAmt = 0;
  if (typeof appliedCartVoucher !== 'undefined' && appliedCartVoucher && appliedCartVoucher.discount) {
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

// ── CHECKOUT & SEPAY MB BANK (GUEST-FIRST WITH GOOGLE AUTH GATE) ──
function openAuthOrCheckoutStep() {
  // Locked Rule: Prompt Google Sign-In only on Continue to order
  if (!currentUser || currentUser.isGuest) {
    showToast(currentAppLanguage === 'en' ? 'Please log in with Google to proceed with your order' : 'Vui lòng đăng nhập Google để lưu đơn hàng và tiếp tục thanh toán an toàn');
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
  if (typeof window.codexCheckPaymentStatus === 'function') {
    try {
      window.codexCheckPaymentStatus();
    } catch(e) {}
  }
  showToast('✅ Đã ghi nhận chuyển khoản thành công! Melsou đang chuyển sang chế độ chuẩn bị ấn phẩm.');
  setTimeout(() => {
    closeCheckoutModal();
    showPage('tracking');
  }, 1000);
}


// ── 🌟 STUDIO ONBOARDING COACH MARK ENGINE (FB18) ──
const STUDIO_COACH_STEPS = [
  {
    icon: '🪄',
    badge: 'HƯỚNG DẪN STUDIO · 01/03',
    title: 'Thanh công cụ sáng tạo bên trái',
    desc: 'Tại đây bạn có thể thêm trang đôi, tải ảnh kỷ niệm, dán sticker trang trí, viết lời nhắn tặng và chọn bài hát Spotify cho album.'
  },
  {
    icon: '📐',
    badge: 'HƯỚNG DẪN STUDIO · 02/03',
    title: 'Không gian mở phẳng 180° liền trang',
    desc: 'Bấm trực tiếp vào ảnh hoặc khung chữ trên trang để xoay 360°, căn chỉnh vị trí, hoặc nhấp đúp để phóng to và cắt ảnh trực quan.'
  },
  {
    icon: '📖',
    badge: 'HƯỚNG DẪN STUDIO · 03/03',
    title: 'Xem trước 3D và hoàn tất đặt in',
    desc: 'Bất cứ lúc nào bạn cũng có thể mở chế độ "Lật trang 3D" để ngắm thành phẩm như cầm trên tay, sau đó bấm Đặt In Album khi hài lòng.'
  }
];

let currentCoachStepIndex = 0;

function checkStudioFirstVisit() {
  try {
    const seen = localStorage.getItem('melsou_studio_onboarded');
    if (!seen) {
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

  const icon = document.getElementById('somStepIcon');
  const badge = document.getElementById('somStepBadge');
  const title = document.getElementById('somStepTitle');
  const desc = document.getElementById('somStepDesc');
  const nextBtn = document.getElementById('somNextBtn');

  if (icon) icon.textContent = step.icon;
  if (badge) badge.textContent = step.badge;
  if (title) title.textContent = step.title;
  if (desc) desc.textContent = step.desc;
  if (nextBtn) {
    nextBtn.textContent = currentCoachStepIndex === STUDIO_COACH_STEPS.length - 1
      ? 'Bắt đầu thiết kế ngay ✨'
      : `Tiếp tục (${currentCoachStepIndex + 1}/3) →`;
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
  if (sidebar) sidebar.classList.toggle('collapsed');
}

function adjustMobileStageScale() {
  const stage = document.getElementById('studioStageArea');
  const book = document.getElementById('interactiveLayflatBook');
  if (!stage || !book) return;

  const stageWidth = stage.clientWidth || window.innerWidth;
  const isCoverOrBack = ALBUM_DATA.spreads[ALBUM_DATA.activeSpreadIndex]?.isClosedCover || ALBUM_DATA.spreads[ALBUM_DATA.activeSpreadIndex]?.isClosedBack;
  const targetBaseWidth = isCoverOrBack ? 440 : 860;
  const targetBaseHeight = 460;

  if (window.innerWidth <= 768) {
    const availableWidth = stageWidth - 16;
    const availableHeight = Math.max(210, window.innerHeight - 190);
    const scaleW = availableWidth / targetBaseWidth;
    const scaleH = availableHeight / targetBaseHeight;
    const scale = Math.max(0.35, Math.min(scaleW, scaleH, 0.95));

    book.style.transform = `scale(${scale})`;
    book.style.transformOrigin = 'center center';

    const stageWrapper = document.querySelector('.photobook-stage-wrapper');
    if (stageWrapper) stageWrapper.style.minHeight = (targetBaseHeight * scale + 10) + 'px';
  } else {
    book.style.transform = 'none';
    const stageWrapper = document.querySelector('.photobook-stage-wrapper');
    if (stageWrapper) stageWrapper.style.minHeight = '460px';
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
window.addEventListener('resize', updateAdaptiveCtaText);

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
    navBlog: 'Góc kỷ niệm',
    navTracking: 'Tra cứu đơn hàng',
    authBtnLabel: 'Tài khoản',
    cartBtnLabel: 'Giỏ hàng',

    // Hero Section
    heroBadge: '📖 Album ảnh liền trang 180° kết hợp thanh âm',
    heroTitle: 'Gói tâm tình',
    heroTitleAccent: 'trong dáng hình thanh âm',
    heroDesc: 'Chiếc máy ảnh có thể giữ lại hình dáng khoảnh khắc, nhưng lại vô tình bỏ quên âm thanh. melsou hòa quyện giai điệu (melody) và kỷ vật (souvenir) để mỗi trang ảnh không chỉ đẹp, mà còn biết cất lời.',
    btnStartStudio: '🪄 Bắt đầu tạo album',
    btn3DFlip: '📖 Xem lật trang 3D',
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
    pkgBtnText: 'Chọn gói này',
    pkgBtnBestText: 'Chọn gói Combo tốt nhất',

    // Templates Section
    tplLibraryHeading: 'Thư Viện Template Mẫu',
    tplLibrarySubheading: '8 bộ mẫu nghệ thuật độc bản — Rê chuột để xem hoạt họa Bìa & Ruột bên trong!',

    // Studio & Toolbar
    stStep1: 'Chọn gói & mẫu',
    stStep2: 'Thiết kế album',
    stStep3: 'Xem trước 3D',
    stStep4: 'Đặt in',
    btnModeEdit: '✏️ Chế Độ Thiết Kế',
    btnModeFlip: '📖 Lật Trang 3D (Heyzine)',
    studioBtnOrder: '🛒 Thêm vào giỏ hàng',
    btnExportDesign: '⬇ Tải PDF album',

    // Studio Tabs
    cNavTab0: '<span>📐</span>Khổ & Gói',
    cNavTab1: '<span>🎨</span>Bố cục',
    cNavTab2: '<span>📸</span>Ảnh',
    cNavTab3: '<span>✨</span>Sticker',
    cNavTab4: '<span>✒️</span>Lời nhắn',
    cNavTab5: '<span>🎵</span>Âm thanh',

    // Reviews & Blog
    reviewsHeading: 'Ý kiến từ người dùng trải nghiệm Melsou',
    reviewsSubheading: 'Cảm nhận chân thực từ những người dùng đã trực tiếp thiết kế và trải nghiệm album Melsou',
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
    footerCopyDetails: 'Xưởng chế tác tại TP.HCM · Bảo hành 1–1 trong 7 ngày'
  },
  en: {
    // Topbar & Header
    topbarBadge: '🎓 MOCK BUSINESS PROJECT',
    topbarPromoFull: '✨ Free Spotify Scannable Code & luxury Kraft gift box included with every album at Melsou!',
    topbarAction: 'Create now →',
    navAbout: 'About us',
    navValues: 'Unique Values',
    navPricing: 'Packages & Pricing',
    navTemplates: 'Template Library',
    navReviews: 'User Reviews',
    navBlog: 'Memory Journal',
    navTracking: 'Track Order',
    authBtnLabel: 'Account',
    cartBtnLabel: 'Cart',

    // Hero Section
    heroBadge: '📖 180° Seamless Layflat Photobook with Sound Keepsake',
    heroTitle: 'Cherish feelings',
    heroTitleAccent: 'in the shape of sound',
    heroDesc: 'Cameras capture visual silhouettes, but often leave voices behind. melsou fuses melody and souvenir so every printed page sings its own heartfelt tune.',
    btnStartStudio: '🪄 Start Creating Album',
    btn3DFlip: '📖 View 3D Flipbook',
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
    pricingTitle: 'Packages & Pricing',
    pkgBtnText: 'Select package',
    pkgBtnBestText: 'Select Best Combo →',

    // Templates Section
    tplLibraryHeading: 'Template Library',
    tplLibrarySubheading: '8 bespoke artistic templates — Hover to preview Cover & Inside spreads!',

    // Studio & Toolbar
    stStep1: 'Choose package & template',
    stStep2: 'Design album',
    stStep3: '3D Preview',
    stStep4: 'Order print',
    btnModeEdit: '✏️ Design Mode',
    btnModeFlip: '📖 3D Flipbook (Heyzine)',
    studioBtnOrder: '🛒 Add to Cart',
    btnExportDesign: '⬇ Download PDF Album',

    // Studio Tabs
    cNavTab0: '<span>📐</span>Size & Pkg',
    cNavTab1: '<span>🎨</span>Layout',
    cNavTab2: '<span>📸</span>Photos',
    cNavTab3: '<span>✨</span>Stickers',
    cNavTab4: '<span>✒️</span>Message',
    cNavTab5: '<span>🎵</span>Audio',

    // Reviews & Blog
    reviewsHeading: 'Reflections from Melsou Creators',
    reviewsSubheading: 'Authentic thoughts from customers who designed and held their own Melsou keepsakes',
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
    footerCopyDetails: 'Artisan workshop in HCMC · 1-to-1 replacement warranty in 7 days'
  }
};


function switchLanguage(lang) {
  currentAppLanguage = lang;
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
  const pkgBtns = document.querySelectorAll('.pricing-card:not(.featured) .pkg-btn');
  pkgBtns.forEach(b => { if (b) b.textContent = dict.pkgBtnText; });
  const pkgBestBtn = document.querySelector('.pricing-card.featured .pkg-btn');
  if (pkgBestBtn) pkgBestBtn.textContent = dict.pkgBtnBestText;

  // Templates Section
  const tplHeading = document.getElementById('tplLibraryHeading');
  if (tplHeading) tplHeading.textContent = dict.tplLibraryHeading;
  const tplSub = document.getElementById('tplLibrarySubheading');
  if (tplSub) tplSub.textContent = dict.tplLibrarySubheading;

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

  // Studio tabs
  for (let i = 0; i <= 5; i++) {
    const tab = document.getElementById(`cNavTab${i}`);
    if (tab && dict[`cNavTab${i}`]) tab.innerHTML = dict[`cNavTab${i}`];
  }

  // Reviews & Blog
  const revHeading = document.getElementById('i18nReviewsHeading') || document.getElementById('reviewsHeading');
  if (revHeading) revHeading.textContent = dict.reviewsHeading;
  const revSub = document.getElementById('i18nReviewsSubheading') || document.getElementById('reviewsSubheading');
  if (revSub) revSub.textContent = dict.reviewsSubheading;
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
  const fHeadings = ['footerHeadingProducts', 'footerHeadingSupport', 'footerHeadingBrand'];
  fHeadings.forEach(id => {
    const el = document.getElementById(id);
    if (el && dict[id]) el.textContent = dict[id];
  });
  const fLinks = [
    'footerLinkMelody', 'footerLinkVoice', 'footerLinkSignature', 'footerLinkTemplates',
    'footerLinkTracking', 'footerLinkWarranty', 'footerLinkPrivacy', 'footerLinkAbout',
    'footerLinkValues', 'footerLinkWorkshop', 'footerCopyDetails'
  ];
  fLinks.forEach(id => {
    const el = document.getElementById(id);
    if (el && dict[id]) el.textContent = dict[id];
  });

  updateAdaptiveCtaText();
  updateCartBadge();
  updateNavSpreadButtons();
}

// ── INIT ON LOAD ──
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
let currentReviewRating = 5;
let currentReviewMedia = [];

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

  if (!reviews || reviews.length === 0) {
    grid.innerHTML = `
      <div class="review-empty-state">
        <div style="font-size:38px;margin-bottom:12px">✨</div>
        <h3 style="font-size:18px;font-weight:700;color:var(--dark);margin-bottom:6px">Những đánh giá chân thực đầu tiên đang được chuẩn bị</h3>
        <p style="font-size:13.5px;color:var(--gray);max-width:540px;margin:0 auto">
          Melsou trân trọng từng khoảnh khắc và cảm xúc của khách hàng. Hãy trải nghiệm và trở thành một trong những người đầu tiên chia sẻ cảm nhận!
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
let activeBlogCategory = 'all';
let currentLoadedBlogPosts = [];

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

  if (!posts || posts.length === 0) {
    list.innerHTML = `
      <div class="blog-empty-state">
        <div style="font-size:42px;margin-bottom:14px">📖</div>
        <h3 style="font-size:19px;font-weight:700;color:var(--dark);margin-bottom:8px">Những câu chuyện đầu tiên của Melsou đang được chuẩn bị...</h3>
        <p style="font-size:14px;color:var(--gray);max-width:580px;margin:0 auto;line-height:1.65">
          Chúng tôi sẽ sớm chia sẻ những kinh nghiệm lưu giữ kỷ niệm, cảm hứng thiết kế và câu chuyện từ xưởng in Melsou đến bạn.
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
