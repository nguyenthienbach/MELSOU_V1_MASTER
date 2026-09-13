(function () {
  const routes = {
    '/': {
      title: 'melsou — Gói tâm tình trong dáng hình thanh âm',
      description: 'Chiếc máy ảnh có thể giữ lại hình dáng khoảnh khắc, nhưng lại vô tình bỏ quên âm thanh. Melsou hòa quyện giai điệu và kỷ vật để mỗi trang ảnh biết cất lời.',
      view: 'home'
    },
    '/ve-melsou': {
      title: 'Về Melsou — Bốn giá trị tạo nên trải nghiệm độc bản',
      description: 'Khám phá cách Melsou kết nối hình ảnh và thanh âm vào từng trang sách.',
      view: 'values',
      heading: 'valSectionTitle'
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
    }
  };

  const path = window.location.pathname.replace(/\/$/, '') || '/';
  const route = routes[path];
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

    if (route.view === 'values' || route.view === 'pricing') {
      const home = document.getElementById('page-home');
      home?.classList.add('active');
      home?.querySelectorAll(':scope > .hero, :scope > section').forEach((section) => {
        section.hidden = section.id !== route.view;
      });
      promoteHeading(route.heading);
      return;
    }

    const modal = document.getElementById(route.modal);
    if (modal) {
      modal.classList.add('open');
      modal.setAttribute('aria-modal', 'false');
      modal.style.position = 'relative';
      modal.style.display = 'flex';
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
