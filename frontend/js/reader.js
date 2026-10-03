document.addEventListener('DOMContentLoaded', async () => {
  document.body.classList.add('reader-page-body');

  const urlParams = new URLSearchParams(window.location.search);
  const chapterId = urlParams.get('id');
  const requestedPage = Math.max(1, parseInt(urlParams.get('page') || '1', 10));

  if (!chapterId) {
    window.location.href = '/comics.html';
    return;
  }

  // Never expose chapter pages to anonymous visitors.
  if (!Auth.isLoggedIn()) {
    const target = `${window.location.pathname}${window.location.search}`;
    openRegistrationPrompt(target);
    return;
  }

  const readerContainer = document.getElementById('reader-pages');
  const progressBar = document.getElementById('reader-progress');
  const pagePill = document.getElementById('page-pill');

  let currentChapter = null;
  let allChapters = [];
  let currentPageIndex = requestedPage;
  let zoomLevel = 1.0;
  let touchStartX = 0;
  let touchStartY = 0;
  let lastTapTime = 0;

  let readerPrefs = { reading_mode: 'vertical', fit_mode: 'width', image_quality: 'high' };

  try {
    const res = await API.get(`/chapters/${encodeURIComponent(chapterId)}`);
    currentChapter = res.chapter;
    allChapters = res.allChapters || [];

    if (Auth.isLoggedIn()) {
      API.get('/platform/reader/preferences').then(x => {
        if (x.preferences) {
          readerPrefs = { ...readerPrefs, ...x.preferences };
          applyReaderPrefs();
        }
      }).catch(() => {});
    }

    // View tracking
    const viewKey = `elder-veil-viewed-${currentChapter.comicId}`;
    if (!sessionStorage.getItem(viewKey)) {
      API.post(`/comics/${encodeURIComponent(currentChapter.comicId)}/view`, {})
        .then(v => sessionStorage.setItem(viewKey, '1'))
        .catch(() => {});
    }

    document.title = `Chapter ${currentChapter.chapterNumber} — Elder's Veil Reader`;

    // Render header elements
    const titleEl = document.getElementById('reader-comic-title');
    const chTitleEl = document.getElementById('reader-chapter-title');
    const selectorEl = document.getElementById('chapter-selector');

    if (titleEl) titleEl.textContent = res.comic?.title || currentChapter.title || `Chapter ${currentChapter.chapterNumber}`;
    if (chTitleEl) chTitleEl.textContent = `Ch. ${currentChapter.chapterNumber}${currentChapter.title ? `: ${currentChapter.title}` : ''}`;

    if (selectorEl) {
      selectorEl.innerHTML = allChapters.map(ch => `
        <option value="${ch.id}" ${ch.id === currentChapter.id ? 'selected' : ''}>
          Chapter ${ch.chapterNumber}${ch.title ? `: ${ch.title}` : ''}
        </option>
      `).join('');

      selectorEl.addEventListener('change', (e) => {
        window.location.href = `/reader.html?id=${e.target.value}`;
      });
    }

    const pages = currentChapter.pages || [];

    // Next page preloading helper for performance
    const preloadNextPages = (index) => {
      const next1 = pages[index];
      const next2 = pages[index + 1];
      if (next1) { const img1 = new Image(); img1.src = API.assetUrl(next1); }
      if (next2) { const img2 = new Image(); img2.src = API.assetUrl(next2); }
    };

    function applyReaderPrefs() {
      const modeEl = document.getElementById('reader-mode');
      const fitEl = document.getElementById('reader-fit');
      if (modeEl) modeEl.value = readerPrefs.reading_mode || 'vertical';
      if (fitEl) fitEl.value = readerPrefs.fit_mode || 'width';

      readerContainer.classList.toggle('reader-horizontal', readerPrefs.reading_mode === 'horizontal');
      readerContainer.classList.toggle('reader-single', readerPrefs.reading_mode === 'single' || readerPrefs.reading_mode === 'double');

      document.querySelectorAll('.reader-image-wrap').forEach((wrap, i) => {
        const img = wrap.querySelector('img');
        if (img) {
          img.classList.toggle('fit-contain', readerPrefs.fit_mode === 'contain');
          img.classList.toggle('fit-original', readerPrefs.fit_mode === 'original');
          img.style.transform = `scale(${zoomLevel})`;
        }
        if (readerPrefs.reading_mode === 'single') {
          wrap.style.display = (i === currentPageIndex - 1) ? 'block' : 'none';
        } else {
          wrap.style.display = 'block';
        }
      });
    }

    if (pages.length === 0) {
      readerContainer.innerHTML = `
        <div class="reader-page-error" role="status">
          <i class="fas fa-images" aria-hidden="true"></i>
          <strong>No page images are linked to this chapter.</strong>
          <span>If pages were uploaded before a server redeploy, the upload storage may have been temporary. Restore persistent upload storage and upload the missing pages again.</span>
        </div>
      `;
    } else {
      const isPdfChapter = pages.length === 1 && /\.pdf(?:$|[?#])/i.test(String(pages[0]));
      if (isPdfChapter) {
        const pdfUrl = API.assetUrl(pages[0]);
        readerContainer.innerHTML = `
          <div class="reader-pdf-wrap" id="page-1" data-page="1">
            <div class="reader-pdf-toolbar"><i class="fas fa-file-pdf"></i><span>PDF Chapter</span><a class="btn btn-secondary btn-sm" href="${pdfUrl}" target="_blank" rel="noopener noreferrer"><i class="fas fa-up-right-from-square"></i> Open PDF</a></div>
            <iframe class="reader-pdf-frame" src="${pdfUrl}#toolbar=1&navpanes=0&view=FitH" title="PDF comic chapter"></iframe>
          </div>
        `;
      } else {
        readerContainer.innerHTML = pages.map((url, idx) => `
          <div class="reader-image-wrap" id="page-${idx + 1}" data-page="${idx + 1}">
          <img src="${API.assetUrl(url)}" class="reader-image" alt="Page ${idx + 1}" loading="${idx < 3 ? 'eager' : 'lazy'}" decoding="async" />
          </div>
        `).join('');
      }

      // Do not silently replace a missing comic page with the site icon. Keep
      // the failed page visible and give readers a direct retry/open action.
      readerContainer.querySelectorAll('.reader-image').forEach(img => {
        img.addEventListener('error', () => {
          if (img.dataset.failed === 'true') return;
          img.dataset.failed = 'true';
          img.hidden = true;
          const message = document.createElement('div');
          message.className = 'reader-page-error';
          message.setAttribute('role', 'alert');
          message.innerHTML = '<i class="fas fa-triangle-exclamation" aria-hidden="true"></i><strong>This page image could not be loaded.</strong><span>The upload may be missing from the server. If this began after a redeploy, restore persistent upload storage and re-upload any lost pages.</span>';
          const actions = document.createElement('div');
          actions.className = 'reader-page-error-actions';
          const retry = document.createElement('button');
          retry.type = 'button';
          retry.className = 'btn btn-secondary btn-sm';
          retry.textContent = 'Try again';
          retry.addEventListener('click', () => {
            message.remove();
            img.dataset.failed = 'false';
            img.hidden = false;
            img.src = img.src;
          });
          const open = document.createElement('a');
          open.className = 'btn btn-secondary btn-sm';
          open.href = img.src;
          open.target = '_blank';
          open.rel = 'noopener noreferrer';
          open.textContent = 'Open image';
          actions.append(retry, open);
          message.append(actions);
          img.parentElement.append(message);
        });
      });
    }

    applyReaderPrefs();
    preloadNextPages(currentPageIndex);

    if (pagePill) pagePill.textContent = `Page ${currentPageIndex} / ${pages.length}`;
    if (requestedPage > 1) {
      setTimeout(() => document.getElementById(`page-${requestedPage}`)?.scrollIntoView({ behavior: 'auto', block: 'start' }), 200);
    }

    // Prev / Next Chapter Buttons
    const currIdx = allChapters.findIndex(ch => ch.id === currentChapter.id);
    const prevCh = currIdx > 0 ? allChapters[currIdx - 1] : null;
    const nextCh = currIdx < allChapters.length - 1 ? allChapters[currIdx + 1] : null;

    const navFooter = document.getElementById('reader-nav-footer');
    if (navFooter) {
      navFooter.innerHTML = `
        <button class="btn btn-secondary" ${!prevCh ? 'disabled' : ''} id="nav-footer-prev">
          <i class="fas fa-chevron-left"></i> Previous Chapter
        </button>
        <button class="btn btn-primary" ${!nextCh ? 'disabled' : ''} id="nav-footer-next">
          Next Chapter <i class="fas fa-chevron-right"></i>
        </button>
      `;
      document.getElementById('nav-footer-prev')?.addEventListener('click', () => {
        if (prevCh) window.location.href = `/reader.html?id=${prevCh.id}`;
      });
      document.getElementById('nav-footer-next')?.addEventListener('click', () => {
        if (nextCh) window.location.href = `/reader.html?id=${nextCh.id}`;
      });
    }

    // Reader Progress Sync & Scroll Tracking
    let progressTimer = null;
    const saveReadingProgress = (pNum) => {
      if (!Auth.isLoggedIn()) return;
      clearTimeout(progressTimer);
      progressTimer = setTimeout(() => {
        API.post('/platform/progress/sync', {
          comicId: currentChapter.comicId,
          chapterId: currentChapter.id,
          pageNumber: pNum
        }).catch(() => {});
      }, 500);
    };

    // Use IntersectionObserver for zero-layout-thrashing page tracking
    if ('IntersectionObserver' in window) {
      const pageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const pNum = parseInt(entry.target.getAttribute('data-page'), 10);
            if (pNum && pNum !== currentPageIndex) {
              currentPageIndex = pNum;
              if (pagePill) pagePill.textContent = `Page ${currentPageIndex} / ${pages.length}`;
              preloadNextPages(currentPageIndex);
              saveReadingProgress(currentPageIndex);
            }
          }
        });
      }, { threshold: 0.4 });

      document.querySelectorAll('.reader-image-wrap').forEach(el => pageObserver.observe(el));
    }

    // Throttled scrollbar indicator update
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollTop = window.scrollY;
          const docHeight = document.documentElement.scrollHeight - window.innerHeight;
          const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
          if (progressBar) progressBar.style.width = `${Math.min(100, Math.max(0, scrollPercent))}%`;
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });

    // Control selectors
    const modeEl = document.getElementById('reader-mode');
    const fitEl = document.getElementById('reader-fit');

    if (modeEl) {
      modeEl.value = readerPrefs.reading_mode || 'vertical';
      modeEl.addEventListener('change', () => {
        readerPrefs.reading_mode = modeEl.value;
        applyReaderPrefs();
        if (Auth.isLoggedIn()) API.put('/platform/reader/preferences', { readingMode: readerPrefs.reading_mode, fitMode: readerPrefs.fit_mode }).catch(() => {});
      });
    }

    if (fitEl) {
      fitEl.value = readerPrefs.fit_mode || 'width';
      fitEl.addEventListener('change', () => {
        readerPrefs.fit_mode = fitEl.value;
        applyReaderPrefs();
        if (Auth.isLoggedIn()) API.put('/platform/reader/preferences', { readingMode: readerPrefs.reading_mode, fitMode: readerPrefs.fit_mode }).catch(() => {});
      });
    }

    // Keyboard Shortcuts (Requirement 9)
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

      if (e.key === 'ArrowLeft') {
        if (readerPrefs.reading_mode === 'single' && currentPageIndex > 1) {
          currentPageIndex--;
          applyReaderPrefs();
          if (pagePill) pagePill.textContent = `Page ${currentPageIndex} / ${pages.length}`;
        } else if (prevCh) {
          window.location.href = `/reader.html?id=${prevCh.id}`;
        }
      } else if (e.key === 'ArrowRight' || e.key === ' ') {
        if (readerPrefs.reading_mode === 'single' && currentPageIndex < pages.length) {
          currentPageIndex++;
          applyReaderPrefs();
          preloadNextPages(currentPageIndex);
          if (pagePill) pagePill.textContent = `Page ${currentPageIndex} / ${pages.length}`;
        } else if (nextCh && e.key === 'ArrowRight') {
          window.location.href = `/reader.html?id=${nextCh.id}`;
        }
      } else if (e.key === 'Escape' && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    });

    // Mobile Touch Gestures & Double Tap Zoom (Requirement 9)
    readerContainer.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    readerContainer.addEventListener('touchend', (e) => {
      if (e.changedTouches.length === 1) {
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const diffX = touchEndX - touchStartX;
        const diffY = touchEndY - touchStartY;

        // Double tap zoom
        const now = Date.now();
        if (now - lastTapTime < 300) {
          zoomLevel = zoomLevel === 1.0 ? 1.5 : 1.0;
          applyReaderPrefs();
        }
        lastTapTime = now;

        // Swipe left / right for single page mode
        if (readerPrefs.reading_mode === 'single' && Math.abs(diffX) > 50 && Math.abs(diffY) < 40) {
          if (diffX < 0 && currentPageIndex < pages.length) {
            currentPageIndex++;
            applyReaderPrefs();
            preloadNextPages(currentPageIndex);
            if (pagePill) pagePill.textContent = `Page ${currentPageIndex} / ${pages.length}`;
          } else if (diffX > 0 && currentPageIndex > 1) {
            currentPageIndex--;
            applyReaderPrefs();
            if (pagePill) pagePill.textContent = `Page ${currentPageIndex} / ${pages.length}`;
          }
        }
      }
    }, { passive: true });

    // Fullscreen Toggle
    const fsBtn = document.getElementById('fullscreen-btn');
    if (fsBtn) {
      fsBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      });
    }

  } catch (err) {
    const isPremiumBlock = err.message && /exclusively|premium|403/i.test(err.message);
    if (isPremiumBlock) {
      readerContainer.innerHTML = `
        <div style="max-width:550px; margin:4rem auto; text-align:center; padding:2.5rem; background:var(--surface); border:1px solid var(--border); border-radius:var(--radius-section);">
          <div style="font-size:3.5rem; color:var(--premium-gold); margin-bottom:1rem;">
            <i class="fas fa-crown"></i>
          </div>
          <h2 style="font-size:1.6rem; font-weight:700; margin-bottom:0.75rem; color:var(--text);">🔒 Premium Chapter Access Required</h2>
          <p style="color:var(--muted-text); font-size:1rem; line-height:1.6; margin-bottom:1.75rem;">
            This chapter is exclusive to Premium members. Upgrade your account to enjoy unlimited access.
          </p>
          <div style="display:flex; justify-content:center; gap:1rem; flex-wrap:wrap;">
            <a href="/premium.html" class="btn btn-primary" style="background:var(--grad-gold); color:#000; font-weight:800; padding:0.75rem 1.75rem;">
              <i class="fas fa-crown"></i> GET PREMIUM ACCESS
            </a>
            <a href="/comics.html" class="btn btn-secondary">
              Return to Catalog
            </a>
          </div>
        </div>
      `;
    } else {
      readerContainer.innerHTML = `
        <div style="text-align:center; padding:5rem 1rem;">
          <i class="fas fa-exclamation-triangle" style="font-size:3rem; color:var(--error); margin-bottom:1rem;"></i>
          <h2>Error Loading Reader</h2>
          <p style="color:var(--muted-text); margin-bottom:1.5rem;">${err.message}</p>
          <a href="/comics.html" class="btn btn-primary">Return to Catalog</a>
        </div>
      `;
    }
  }
});
