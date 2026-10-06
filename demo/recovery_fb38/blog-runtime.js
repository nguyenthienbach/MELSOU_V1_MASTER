/**
 * MELSOU BLOG RUNTIME (FB #1: Hybrid Google-style Pagination + Swipe Carousel)
 * Client-side only. Zero document reload. Zero layout jump.
 */
(function() {
  'use strict';

  var BLOG_PAGE_SIZE = 4;
  var activeBlogCategory = 'all';
  var currentLoadedBlogPosts = [];
  var currentBlogPage = 1;
  var currentBlogTotalPages = 1;
  var currentBlogTotalPosts = 0;
  var blogSearchQuery = '';
  var blogListRequestId = 0;
  var blogSsrFingerprint = '';
  var blogPagesCache = new Map();
  var isBlogTransitioning = false;
  var suppressCardClickUntil = 0;

  var blogDragState = {
    isDown: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    hasMoved: false,
    isHorizontalIntent: false
  };

  function plainWordPressText(html) {
    if (!html) return '';
    try {
      var doc = new DOMParser().parseFromString(String(html), 'text/html');
      return (doc.body.textContent || '').trim();
    } catch (e) {
      return String(html).replace(/<[^>]*>/g, '').trim();
    }
  }

  function escapeBlogHtml(value) {
    return String(value || '').replace(/[&<>"']/g, function(character) {
      switch (character) {
        case '&': return '&amp;';
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '"': return '&quot;';
        case "'": return '&#39;';
        default: return character;
      }
    });
  }

  function safeBlogImageUrl(value) {
    var fallback = 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600';
    if (!value) return fallback;
    try {
      var parsed = new URL(String(value), window.location.origin);
      if (parsed.protocol !== 'https:') return fallback;
      if (parsed.hostname.includes('wordpress.com') && !parsed.searchParams.has('w')) {
        parsed.searchParams.set('w', '600');
        parsed.searchParams.set('strip', 'all');
      }
      return parsed.href;
    } catch (e) {
      return fallback;
    }
  }

  function blogPostsFingerprint(posts) {
    return JSON.stringify((Array.isArray(posts) ? posts : []).map(function(post) {
      return [
        post && post.slug ? post.slug : '',
        post && post.modifiedAt ? post.modifiedAt : '',
        plainWordPressText(post && post.title ? post.title : ''),
        plainWordPressText(post && post.excerpt ? post.excerpt : ''),
        plainWordPressText(post && post.content ? post.content : ''),
        safeBlogImageUrl(post && post.featuredImage ? post.featuredImage : ''),
        post && post.category ? post.category.id : ''
      ];
    }));
  }

  function renderBlogCardHtml(post) {
    var title = escapeBlogHtml(plainWordPressText(post && post.title ? post.title : ''));
    var excerpt = escapeBlogHtml(plainWordPressText(post && post.excerpt ? post.excerpt : ''));
    var category = escapeBlogHtml(plainWordPressText(post && post.category && post.category.name ? post.category.name : 'Kỷ vật'));
    var date = post && post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('vi-VN') : '';
    var imgUrl = escapeBlogHtml(safeBlogImageUrl(post && post.featuredImage ? post.featuredImage : ''));
    var slug = escapeBlogHtml(post && post.slug ? post.slug : '');

    return '<article class="blog-card-item" data-blog-slug="' + slug + '">' +
      '<a href="/blog/' + slug + '" class="blog-card-link" onclick="handleBlogCardClick(event, \'' + slug + '\')">' +
        '<div class="blog-card-image-wrap">' +
          '<img src="' + imgUrl + '" alt="' + title + '" class="blog-card-img" loading="lazy" width="360" height="225" draggable="false" />' +
        '</div>' +
        '<div class="blog-card-body">' +
          '<div>' +
            '<div class="blog-card-meta">' +
              '<span class="blog-card-category">' + category + '</span>' +
              '<span class="blog-card-date">' + date + '</span>' +
            '</div>' +
            '<h3 class="blog-card-title">' + title + '</h3>' +
            '<p class="blog-card-excerpt">' + excerpt + '</p>' +
          '</div>' +
          '<div class="blog-card-footer">' +
            '<span class="blog-card-cta">Đọc tiếp câu chuyện →</span>' +
          '</div>' +
        '</div>' +
      '</a>' +
    '</article>';
  }

  function handleBlogCardClick(event, slug) {
    if (Date.now() < suppressCardClickUntil) {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      return false;
    }
    return true;
  }

  async function fetchBlogPageData(category, page, queryText) {
    var cacheKey = String(category) + ':' + String(queryText || '') + ':' + String(page);
    if (blogPagesCache.has(cacheKey)) {
      return blogPagesCache.get(cacheKey);
    }

    var result;
    if (typeof window.codexGetPublishedPosts === 'function') {
      result = await window.codexGetPublishedPosts({ page: page, perPage: BLOG_PAGE_SIZE, category: category });
    } else {
      var url = '/api/blog?page=' + encodeURIComponent(page) + '&perPage=' + encodeURIComponent(BLOG_PAGE_SIZE) +
        (category === 'all' ? '' : '&category=' + encodeURIComponent(category));
      var res = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (!res.ok) throw new Error('BLOG_FETCH_FAILED');
      result = await res.json();
    }

    var posts = Array.isArray(result && result.posts) ? result.posts : [];
    var total = Number(result && result.pagination && result.pagination.total ? result.pagination.total : posts.length);
    var totalPages = Math.max(1, Number(result && result.pagination && result.pagination.totalPages ? result.pagination.totalPages : Math.ceil(total / BLOG_PAGE_SIZE)));

    var data = { posts: posts, total: total, totalPages: totalPages };
    blogPagesCache.set(cacheKey, data);
    return data;
  }

  function prefetchNextBlogPage(category, page, queryText, totalPages) {
    if (page < totalPages) {
      var nextPage = page + 1;
      var cacheKey = String(category) + ':' + String(queryText || '') + ':' + String(nextPage);
      if (!blogPagesCache.has(cacheKey)) {
        fetchBlogPageData(category, nextPage, queryText).catch(function() {});
      }
    }
  }

  function hydrateSsrBlogPosts() {
    var payload = document.getElementById('melsouSsrBlogPosts');
    if (!payload) return false;
    try {
      var parsed = JSON.parse(payload.textContent || '{}');
      var posts = Array.isArray(parsed.posts)
        ? parsed.posts.filter(function(post) { return post && /^[a-z0-9-]+$/.test(String(post.slug || '')); })
        : [];
      currentLoadedBlogPosts = posts;
      currentBlogPage = Number(parsed.pagination && parsed.pagination.page ? parsed.pagination.page : 1) || 1;
      currentBlogTotalPosts = Number(parsed.pagination && parsed.pagination.total ? parsed.pagination.total : posts.length) || posts.length;
      currentBlogTotalPages = Number(parsed.pagination && parsed.pagination.totalPages ? parsed.pagination.totalPages : 1) || Math.max(1, Math.ceil(currentBlogTotalPosts / BLOG_PAGE_SIZE));
      blogSsrFingerprint = blogPostsFingerprint(posts);

      // Seed cache for page 1
      blogPagesCache.set('all::' + currentBlogPage, {
        posts: posts,
        total: currentBlogTotalPosts,
        totalPages: currentBlogTotalPages
      });

      renderBlogPagination();
      updateBlogCarouselArrows();
      prefetchNextBlogPage('all', currentBlogPage, '', currentBlogTotalPages);
      return true;
    } catch (error) {
      console.warn('Invalid SSR Blog payload:', error);
      return false;
    }
  }

  function renderBlogPagination() {
    var container = document.getElementById('blogPagination');
    if (!container) return;

    var totalPages = currentBlogTotalPages;
    var currentPage = currentBlogPage;

    if (totalPages <= 1) {
      container.style.display = 'none';
      container.innerHTML = '';
      return;
    }

    container.style.display = 'flex';

    var isEn = (window.currentAppLanguage === 'en');
    var prevLabel = isEn ? 'Previous stories' : 'Trang bài viết trước';
    var nextLabel = isEn ? 'Next stories' : 'Trang bài viết tiếp theo';

    var isMobile = (typeof window !== 'undefined' && window.innerWidth <= 480);
    var pagesToShow = [];
    if (isMobile) {
      if (totalPages <= 5) {
        for (var im = 1; im <= totalPages; im++) pagesToShow.push(im);
      } else {
        pagesToShow.push(1);
        if (currentPage <= 2) {
          pagesToShow.push(2);
          pagesToShow.push(3);
          pagesToShow.push('dots');
          pagesToShow.push(totalPages);
        } else if (currentPage >= totalPages - 1) {
          pagesToShow.push('dots');
          pagesToShow.push(totalPages - 2);
          pagesToShow.push(totalPages - 1);
          pagesToShow.push(totalPages);
        } else {
          pagesToShow.push('dots');
          pagesToShow.push(currentPage);
          pagesToShow.push('dots');
          pagesToShow.push(totalPages);
        }
      }
    } else {
      if (totalPages <= 7) {
        for (var i = 1; i <= totalPages; i++) pagesToShow.push(i);
      } else {
        pagesToShow.push(1);
        if (currentPage <= 4) {
          for (var p = 2; p <= 5; p++) pagesToShow.push(p);
          pagesToShow.push('dots');
          pagesToShow.push(totalPages);
        } else if (currentPage >= totalPages - 3) {
          pagesToShow.push('dots');
          for (var p2 = totalPages - 4; p2 <= totalPages; p2++) pagesToShow.push(p2);
        } else {
          pagesToShow.push('dots');
          pagesToShow.push(currentPage - 1);
          pagesToShow.push(currentPage);
          pagesToShow.push(currentPage + 1);
          pagesToShow.push('dots');
          pagesToShow.push(totalPages);
        }
      }
    }

    var html = '<button type="button" class="blog-page-btn blog-page-arrow" id="blogPaginationPrevBtn" onclick="goToBlogPage(' + (currentPage - 1) + ', -1)" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();goToBlogPage(' + (currentPage - 1) + ', -1)}" ' +
      (currentPage <= 1 ? ' disabled aria-disabled="true"' : '') +
      ' aria-label="' + prevLabel + '" title="' + prevLabel + '">‹</button>';

    for (var idx = 0; idx < pagesToShow.length; idx++) {
      var item = pagesToShow[idx];
      if (item === 'dots') {
        html += '<span class="blog-page-dots" aria-hidden="true">…</span>';
      } else {
        var isActive = (item === currentPage);
        html += '<button type="button" class="blog-page-btn' + (isActive ? ' active' : '') + '" onclick="goToBlogPage(' + item + ')" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();goToBlogPage(' + item + ')}" ' +
          (isActive ? ' aria-current="page"' : '') +
          ' aria-label="' + (isEn ? 'Page ' + item : 'Trang ' + item) + '">' +
          item +
        '</button>';
      }
    }

    html += '<button type="button" class="blog-page-btn blog-page-arrow" id="blogPaginationNextBtn" onclick="goToBlogPage(' + (currentPage + 1) + ', 1)" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();goToBlogPage(' + (currentPage + 1) + ', 1)}" ' +
      (currentPage >= totalPages ? ' disabled aria-disabled="true"' : '') +
      ' aria-label="' + nextLabel + '" title="' + nextLabel + '">›</button>';

    container.innerHTML = html;
  }

  function updateBlogCarouselArrows() {
    var prevBtn = document.getElementById('blogCarouselPrevBtn');
    var nextBtn = document.getElementById('blogCarouselNextBtn');
    if (!prevBtn || !nextBtn) return;

    if (currentBlogTotalPages <= 1) {
      prevBtn.style.display = 'none';
      nextBtn.style.display = 'none';
      return;
    }

    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      prevBtn.style.display = 'none';
      nextBtn.style.display = 'none';
    } else {
      prevBtn.style.display = 'flex';
      nextBtn.style.display = 'flex';
    }

    prevBtn.disabled = (currentBlogPage <= 1);
    nextBtn.disabled = (currentBlogPage >= currentBlogTotalPages);
  }

  function scrollBlogCarousel(direction) {
    if (direction > 0) {
      if (currentBlogPage < currentBlogTotalPages) {
        goToBlogPage(currentBlogPage + 1, 1);
      }
    } else if (direction < 0) {
      if (currentBlogPage > 1) {
        goToBlogPage(currentBlogPage - 1, -1);
      }
    }
  }

  async function goToBlogPage(targetPage, direction) {
    if (typeof window !== 'undefined') window.blogStorefrontLoaded = true;
    if (isBlogTransitioning) return;
    if (targetPage < 1 || targetPage > currentBlogTotalPages) return;
    if (targetPage === currentBlogPage && typeof direction === 'undefined') return;

    var track = document.getElementById('publicBlogList');
    if (!track) return;

    var isEn = (window.currentAppLanguage === 'en');
    var slideDirection = typeof direction !== 'undefined' ? direction : (targetPage > currentBlogPage ? 1 : -1);
    isBlogTransitioning = true;

    var prefersReducedMotion = typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Slide-out animation
    if (!prefersReducedMotion) {
      track.style.transition = 'transform 0.18s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.18s ease';
      track.style.transform = 'translateX(' + (slideDirection > 0 ? '-36px' : '36px') + ')';
      track.style.opacity = '0.35';
    }

    try {
      var pagePosts = [];
      if (blogSearchQuery) {
        var filtered = getFilteredBlogPosts();
        var startIdx = (targetPage - 1) * BLOG_PAGE_SIZE;
        pagePosts = filtered.slice(startIdx, startIdx + BLOG_PAGE_SIZE);
      } else {
        var data = await fetchBlogPageData(activeBlogCategory, targetPage, blogSearchQuery);
        pagePosts = data.posts;
        currentBlogTotalPages = data.totalPages;
        currentBlogTotalPosts = data.total;
      }

      currentBlogPage = targetPage;
      currentLoadedBlogPosts = pagePosts;

      if (pagePosts.length === 0) {
        track.innerHTML = '<div class="blog-empty-state" style="width:100%;grid-column:1/-1">' +
          '<h3 style="font-size:17.5px;font-weight:700;color:var(--dark);margin-bottom:6px">' +
            (isEn ? 'No stories on this page.' : 'Chưa có câu chuyện nào ở trang này.') +
          '</h3>' +
        '</div>';
      } else {
        track.innerHTML = pagePosts
          .filter(function(post) { return post && /^[a-z0-9-]+$/.test(String(post.slug || '')); })
          .map(renderBlogCardHtml)
          .join('');
      }

      renderBlogPagination();
      updateBlogCarouselArrows();
      prefetchNextBlogPage(activeBlogCategory, targetPage, blogSearchQuery, currentBlogTotalPages);

      // Slide-in animation
      if (!prefersReducedMotion) {
        track.style.transition = 'none';
        track.style.transform = 'translateX(' + (slideDirection > 0 ? '36px' : '-36px') + ')';
        track.style.opacity = '0.35';
        requestAnimationFrame(function() {
          requestAnimationFrame(function() {
            track.style.transition = 'transform 0.22s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.22s ease';
            track.style.transform = 'translateX(0)';
            track.style.opacity = '1';
          });
        });
      } else {
        track.style.transform = '';
        track.style.opacity = '';
      }
    } catch (err) {
      console.warn('goToBlogPage error:', err);
    } finally {
      setTimeout(function() {
        isBlogTransitioning = false;
        if (track) {
          track.style.transform = '';
          track.style.opacity = '';
          track.style.transition = '';
        }
      }, prefersReducedMotion ? 40 : 250);
    }
  }

  function getFilteredBlogPosts() {
    return (currentLoadedBlogPosts || []).filter(function(post) {
      var matchesCategory = activeBlogCategory === 'all' ||
        String(post.category && post.category.id) === String(activeBlogCategory) ||
        (post.category && post.category.slug === activeBlogCategory);
      if (!matchesCategory) return false;

      if (!blogSearchQuery) return true;
      var titleMatch = post.title && post.title.toLowerCase().includes(blogSearchQuery);
      var excerptMatch = post.excerpt && plainWordPressText(post.excerpt).toLowerCase().includes(blogSearchQuery);
      var contentMatch = post.content && plainWordPressText(post.content).toLowerCase().includes(blogSearchQuery);
      return Boolean(titleMatch || excerptMatch || contentMatch);
    });
  }

  async function renderPublicBlog(category, page) {
    category = category || 'all';
    page = page || 1;
    var list = document.getElementById('publicBlogList');
    if (!list) return;
    var requestId = ++blogListRequestId;
    var isEn = (window.currentAppLanguage === 'en');

    if (!currentLoadedBlogPosts || !currentLoadedBlogPosts.length) {
      list.innerHTML = '<div class="blog-empty-state"><div style="font-size:32px;margin-bottom:10px">⏳</div><p>' +
        (isEn ? 'Loading stories...' : 'Đang tải những câu chuyện...') +
      '</p></div>';
    }

    try {
      var result = await fetchBlogPageData(category, page, blogSearchQuery);
      if (requestId !== blogListRequestId) return;
      if (page === 1 && category === 'all' && currentBlogPage > 1) return;

      var allPosts = result.posts || [];
      currentBlogPage = page;
      currentBlogTotalPages = result.totalPages || 1;
      currentBlogTotalPosts = result.total || allPosts.length;
      currentLoadedBlogPosts = allPosts;

      var nextFingerprint = blogPostsFingerprint(allPosts);
      if (page === 1 && category === 'all' && !blogSearchQuery && blogSsrFingerprint === nextFingerprint) {
        blogSsrFingerprint = '';
        renderBlogPagination();
        updateBlogCarouselArrows();
        return;
      }
      blogSsrFingerprint = '';
      renderFilteredBlogPosts();
    } catch (error) {
      if (requestId !== blogListRequestId) return;
      console.warn('renderPublicBlog error:', error);
      if (currentLoadedBlogPosts.length > 0) return;
      list.innerHTML = '<div class="blog-empty-state"><p>' +
        (isEn ? 'Stories are temporarily unavailable. Please try again later.' : 'Câu chuyện đang tạm thời chưa tải được. Vui lòng thử lại sau.') +
      '</p></div>';
    }
  }

  function renderFilteredBlogPosts() {
    var list = document.getElementById('publicBlogList');
    if (!list) return;
    var isEn = (window.currentAppLanguage === 'en');
    var filtered = getFilteredBlogPosts();

    if (filtered.length === 0) {
      var emptyMsg = blogSearchQuery
        ? (isEn ? 'No matching stories found.' : 'Không tìm thấy câu chuyện phù hợp.')
        : (isEn ? 'The first stories of Melsou are being prepared...' : 'Những câu chuyện đầu tiên của Melsou đang được chuẩn bị...');
      var emptySub = blogSearchQuery
        ? (isEn ? 'Try another keyword or select "All stories"' : 'Vui lòng thử từ khóa khác hoặc chọn "Tất cả bài viết"')
        : (isEn ? 'We will soon share cherished stories from Melsou.' : 'Chúng tôi sẽ sớm chia sẻ những câu chuyện từ xưởng in Melsou đến bạn.');
      list.innerHTML = '<div class="blog-empty-state" style="width:100%;grid-column:1/-1">' +
        '<h3 style="font-size:17.5px;font-weight:700;color:var(--dark);margin-bottom:6px">' + emptyMsg + '</h3>' +
        '<p style="font-size:13px;color:var(--gray);max-width:500px;margin:0 auto;line-height:1.6">' + emptySub + '</p>' +
      '</div>';
      renderBlogPagination();
      updateBlogCarouselArrows();
      return;
    }

    list.innerHTML = filtered
      .filter(function(post) { return post && /^[a-z0-9-]+$/.test(String(post.slug || '')); })
      .map(renderBlogCardHtml)
      .join('');

    renderBlogPagination();
    updateBlogCarouselArrows();
  }

  function filterBlogCategory(category, btn) {
    activeBlogCategory = category;
    var container = document.getElementById('blogCategoryTabs');
    if (container) {
      var chips = container.querySelectorAll('.sal-chip');
      chips.forEach(function(c) { c.classList.remove('active'); });
      if (btn) btn.classList.add('active');
    }
    currentBlogPage = 1;
    renderPublicBlog(category, 1);
  }

  function handleBlogSearch(val) {
    var cleanVal = String(val || '').trim();
    var clearBtn = document.getElementById('blogSearchClearBtn');
    if (!cleanVal) {
      blogSearchQuery = '';
      if (clearBtn) clearBtn.style.display = 'none';
    } else {
      blogSearchQuery = cleanVal.toLowerCase();
      if (clearBtn) clearBtn.style.display = 'block';
    }
    currentBlogPage = 1;
    renderFilteredBlogPosts();
  }

  function clearBlogSearch() {
    var input = document.getElementById('blog-search-query');
    if (input) {
      input.value = '';
      input.focus();
    }
    handleBlogSearch('');
  }

  function initBlogGestures() {
    var container = document.querySelector('.blog-carousel-container');
    var track = document.getElementById('publicBlogList');
    if (!container || !track || container.__melsouGesturesInit) return;
    container.__melsouGesturesInit = true;

    var onPointerDown = function(e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      blogDragState.isDown = true;
      blogDragState.startX = e.clientX;
      blogDragState.startY = e.clientY;
      blogDragState.currentX = e.clientX;
      blogDragState.currentY = e.clientY;
      blogDragState.hasMoved = false;
      blogDragState.isHorizontalIntent = false;
    };

    var onPointerMove = function(e) {
      if (!blogDragState.isDown) return;
      blogDragState.currentX = e.clientX;
      blogDragState.currentY = e.clientY;

      var dx = blogDragState.currentX - blogDragState.startX;
      var dy = blogDragState.currentY - blogDragState.startY;

      if (!blogDragState.isHorizontalIntent) {
        if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 10) {
          blogDragState.isDown = false;
          track.style.transform = '';
          return;
        }
        if (Math.abs(dx) > 10) {
          blogDragState.isHorizontalIntent = true;
        }
      }

      if (blogDragState.isHorizontalIntent) {
        blogDragState.hasMoved = true;
        if (e.cancelable) e.preventDefault();

        var moveX = dx;
        if ((currentBlogPage <= 1 && dx > 0) || (currentBlogPage >= currentBlogTotalPages && dx < 0)) {
          moveX = dx * 0.25;
        }
        track.style.transition = 'none';
        track.style.transform = 'translateX(' + moveX + 'px)';
      }
    };

    var onPointerUp = function(e) {
      if (!blogDragState.isDown) return;
      blogDragState.isDown = false;

      var dx = blogDragState.currentX - blogDragState.startX;

      if (blogDragState.hasMoved) {
        suppressCardClickUntil = Date.now() + 350;
        track.style.transition = 'transform 0.25s cubic-bezier(0.25, 1, 0.5, 1)';
        track.style.transform = '';

        var threshold = 45;
        if (dx < -threshold && currentBlogPage < currentBlogTotalPages) {
          goToBlogPage(currentBlogPage + 1, 1);
        } else if (dx > threshold && currentBlogPage > 1) {
          goToBlogPage(currentBlogPage - 1, -1);
        }
      } else {
        track.style.transform = '';
      }
    };

    container.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointermove', onPointerMove, { passive: false });
    window.addEventListener('pointerup', onPointerUp, { passive: true });
    window.addEventListener('pointercancel', onPointerUp, { passive: true });

    var wheelTimeout = null;
    container.addEventListener('wheel', function(e) {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 30) {
        if (wheelTimeout) return;
        if (e.deltaX > 40 && currentBlogPage < currentBlogTotalPages) {
          wheelTimeout = setTimeout(function() { wheelTimeout = null; }, 400);
          goToBlogPage(currentBlogPage + 1, 1);
        } else if (e.deltaX < -40 && currentBlogPage > 1) {
          wheelTimeout = setTimeout(function() { wheelTimeout = null; }, 400);
          goToBlogPage(currentBlogPage - 1, -1);
        }
      }
    }, { passive: true });
  }

  // Export functions to window
  window.goToBlogPage = goToBlogPage;
  window.scrollBlogCarousel = scrollBlogCarousel;
  window.renderBlogPagination = renderBlogPagination;
  window.updateBlogCarouselArrows = updateBlogCarouselArrows;
  window.hydrateSsrBlogPosts = hydrateSsrBlogPosts;
  window.renderPublicBlog = renderPublicBlog;
  window.renderFilteredBlogPosts = renderFilteredBlogPosts;
  window.filterBlogCategory = filterBlogCategory;
  window.handleBlogSearch = handleBlogSearch;
  window.clearBlogSearch = clearBlogSearch;
  window.handleBlogCardClick = handleBlogCardClick;
  window.initBlogGestures = initBlogGestures;
  window.__melsouBlogRuntime = {
    get currentLoadedBlogPosts() { return currentLoadedBlogPosts; },
    get currentBlogPage() { return currentBlogPage; },
    get currentBlogTotalPages() { return currentBlogTotalPages; },
    goToBlogPage: goToBlogPage,
    scrollBlogCarousel: scrollBlogCarousel,
    renderBlogPagination: renderBlogPagination,
    updateBlogCarouselArrows: updateBlogCarouselArrows,
    hydrateSsrBlogPosts: hydrateSsrBlogPosts,
    renderPublicBlog: renderPublicBlog,
    renderFilteredBlogPosts: renderFilteredBlogPosts,
    filterBlogCategory: filterBlogCategory,
    handleBlogSearch: handleBlogSearch,
    clearBlogSearch: clearBlogSearch,
    initBlogGestures: initBlogGestures
  };

  // Auto-init
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
        hydrateSsrBlogPosts();
        initBlogGestures();
      });
    } else {
      hydrateSsrBlogPosts();
      initBlogGestures();
    }
    window.addEventListener('resize', updateBlogCarouselArrows, { passive: true });
  }
})();
