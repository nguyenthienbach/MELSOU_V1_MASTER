(function () {
  const routes = {
    '/': {
      title: 'melsou — Gói tâm tình trong dáng hình thanh âm',
      description: 'Chiếc máy ảnh có thể giữ lại hình dáng khoảnh khắc, nhưng lại vô tình bỏ quên âm thanh. Melsou hòa quyện giai điệu và kỷ vật để mỗi trang ảnh biết cất lời.',
      view: 'home'
    },
    '/ve-melsou': {
      title: 'Về Melsou — Gói tâm tình trong dáng hình thanh âm',
      description: 'Melsou hòa quyện giai điệu và kỷ vật để mỗi trang ảnh không chỉ đẹp, mà còn biết cất lời.',
      view: 'hero',
      heading: 'heroHeadlineText'
    },
    '/goi-san-pham': {
      title: 'Gói sản phẩm Melsou — Melody, Voice và Signature',
      description: 'Gói sản phẩm Melsou gồm Melody, Voice và Signature Combo cho album liền trang mở phẳng 180° kết hợp hình ảnh và thanh âm.',
      view: 'pricing',
      heading: 'pricingTitle'
    },
    '/templates': {
      title: 'Thư viện Template Melsou — 8 bộ mẫu nghệ thuật độc bản',
      description: 'Khám phá 8 bộ mẫu nghệ thuật độc bản của Melsou với bố cục bìa và ruột album.',
      view: 'templates',
      heading: 'tplLibraryHeading'
    },
    '/chinh-sach-bao-mat': {
      title: 'Chính sách bảo mật Melsou',
      description: 'Chính sách giải thích Melsou thu thập thông tin nào, sử dụng thông tin đó như thế nào và những lựa chọn của người dùng đối với dữ liệu của mình.',
      view: 'privacy',
      modal: 'privacyPolicyModal'
    },
    '/chinh-sach-bao-hanh': {
      title: 'Chính sách bảo hành, đổi trả và hoàn tiền Melsou',
      description: 'Chính sách bảo hành, đổi trả và hoàn tiền áp dụng cho sản phẩm Melsou được sản xuất theo yêu cầu và cá nhân hóa.',
      view: 'warranty',
      modal: 'warrantyPolicyModal'
    },
    '/wordpress-oauth-callback': {
      title: 'Xác thực WordPress OAuth — Melsou',
      description: 'Xác thực liên kết tài khoản WordPress CMS cho Melsou.',
      view: 'wp-oauth-callback'
    }
  };

  const path = window.location.pathname.replace(/\/$/, '') || '/';
  const blogMatch = path.match(/^\/blog\/([a-z0-9-]+)$/);
  const route = routes[path] || (blogMatch ? {
    title: 'Chuyện của Melsou',
    description: 'Cảm hứng chế tác, bí quyết sắp xếp ảnh và những câu chuyện lưu giữ ký ức qua năm tháng.',
    view: 'blog-post',
    slug: blogMatch[1]
  } : null);
  if (!route) return;

  document.title = route.title;
  const description = document.querySelector('meta[name="description"]');
  if (description) description.content = route.description;
  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) canonical.href = `https://melsou.com${path === '/' ? '/' : path}`;

  const promoteHeading = (id) => {
    const heading = document.getElementById(id);
    if (!heading || heading.tagName === 'H1') return;
    const h1 = document.createElement('h1');
    for (const attribute of heading.attributes) h1.setAttribute(attribute.name, attribute.value);
    h1.innerHTML = heading.innerHTML;
    heading.replaceWith(h1);
  };

  const activate = () => {
    if (route.view === 'home') return;
    document.querySelectorAll('.page').forEach((page) => page.classList.remove('active'));

    if (route.view === 'templates') {
      document.getElementById('page-templates')?.classList.add('active');
      promoteHeading(route.heading);
      return;
    }

    if (route.view === 'hero' || route.view === 'values' || route.view === 'pricing') {
      const home = document.getElementById('page-home');
      home?.classList.add('active');
      home?.querySelectorAll(':scope > .hero, :scope > section').forEach((section) => {
        const selected = route.view === 'hero' ? section.matches('.hero') : section.id === route.view;
        section.style.display = selected ? '' : 'none';
      });
      promoteHeading(route.heading);
      return;
    }

    if (route.view === 'wp-oauth-callback') {
      const home = document.getElementById('page-home');
      if (home) home.classList.add('active');
      const runCallback = () => {
        if (typeof window.handleWordPressOAuthCallbackPage === 'function') {
          window.handleWordPressOAuthCallbackPage();
        }
      };
      if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', runCallback, { once: true });
      } else {
        runCallback();
      }
      return;
    }

    if (route.view === 'blog-post') {
      const modal = document.getElementById('blogArticleReaderModal');
      const body = document.getElementById('readerBody');
      if (!modal || !body) return;
      modal.classList.add('open');
      modal.setAttribute('aria-modal', 'false');
      modal.style.position = 'relative';
      modal.style.display = 'flex';
      body.textContent = 'Đang tải câu chuyện...';
      const fetchPost = (typeof window.codexGetPublishedPost === 'function')
        ? window.codexGetPublishedPost
        : ((slug) => fetch(`/api/blog/${encodeURIComponent(slug)}`).then(r => r.json()));
      fetchPost(route.slug).catch(async (err) => {
        if (route.slug === 'cau-chuyen-dau-tien-cua-melsou') {
          return fetchPost('cau-chuyen-ve-melsou-khi-cam-xuc-can-mot-noi-de-cat-giu');
        }
        throw err;
      }).then(({ post }) => {
        const plainText = (html) => new DOMParser().parseFromString(String(html || ''), 'text/html').body.textContent.trim();
        const title = plainText(post.title);
        document.title = `${title} — Melsou`;
        const description = document.querySelector('meta[name="description"]');
        if (description) description.content = plainText(post.excerpt).slice(0, 160);
        const titleElement = document.getElementById('readerTitle');
        if (titleElement) {
          titleElement.textContent = title;
          titleElement.id = 'blogPostPageHeading';
          promoteHeading(titleElement.id);
        }
        const badge = document.getElementById('readerCategoryBadge');
        if (badge) badge.textContent = post.category?.name || 'CHUYỆN KỂ';
        const dateEl = document.getElementById('readerPublishDate');
        if (dateEl) dateEl.textContent = post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('vi-VN') : '';
        const cover = document.getElementById('readerCoverImg');
        if (cover) {
          if (post.featuredImage) cover.src = post.featuredImage;
          else cover.closest('div').style.display = 'none';
        }
        const sanitize = window.sanitizeWordPressHtml || (typeof sanitizeWordPressHtml === 'function' ? sanitizeWordPressHtml : (html) => html);
        body.innerHTML = sanitize(post.content);
        const interactionsBar = document.getElementById('blogPostInteractionsBar');
        const commentsSection = document.getElementById('blogCommentsSection');
        if (interactionsBar) interactionsBar.style.display = '';
        if (commentsSection) commentsSection.style.display = '';
        const activeSlug = post.slug || route.slug;
        if (typeof window.initBlogInteractions === 'function') {
          window.initBlogInteractions(activeSlug);
        } else {
          window.addEventListener('melsou-blog-interactions-ready', () => {
            if (typeof window.initBlogInteractions === 'function') {
              window.initBlogInteractions(activeSlug);
            }
          }, { once: true });
        }
      }).catch((error) => {
        console.error('BLOG POST FETCH ERROR:', error);
        body.textContent = error?.status === 404 ? 'Không tìm thấy câu chuyện này.' : 'Câu chuyện đang tạm thời chưa tải được. Vui lòng thử lại sau.';
        const interactionsBar = document.getElementById('blogPostInteractionsBar');
        const commentsSection = document.getElementById('blogCommentsSection');
        if (interactionsBar) interactionsBar.style.display = 'none';
        if (commentsSection) commentsSection.style.display = 'none';
      });
      return;
    }

    const modal = document.getElementById(route.modal);
    if (modal) {
      window.__policyModalDirectAccess = true;
      const home = document.getElementById('page-home');
      if (home) home.classList.add('active');
      modal.classList.add('open');
      modal.classList.add('policy-modal-backdrop');
      modal.setAttribute('aria-modal', 'true');
      modal.style.position = 'fixed';
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      const heading = modal.querySelector('h3');
      if (heading) {
        heading.id = `${route.view}PageHeading`;
        promoteHeading(heading.id);
      }
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', activate);
  else activate();
}());
