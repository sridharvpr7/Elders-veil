document.addEventListener('DOMContentLoaded', async () => {
  document.body.classList.add('reader-page-body');

  const urlParams = new URLSearchParams(window.location.search);
  const chapterId = urlParams.get('id');

  if (!chapterId) {
    window.location.href = '/comics.html';
    return;
  }

  const readerContainer = document.getElementById('reader-pages');
  const progressBar = document.getElementById('reader-progress');
  const pagePill = document.getElementById('page-pill');

  let currentChapter = null;
  let allChapters = [];
  let currentPageIndex = 1;

  try {
    const res = await API.get(`/chapters/${encodeURIComponent(chapterId)}`);
    currentChapter = res.chapter;
    allChapters = res.allChapters || [];

    document.title = `Chapter ${currentChapter.chapterNumber} — Elder's Veil Reader`;

    // Render header title & controls
    const titleEl = document.getElementById('reader-comic-title');
    const chTitleEl = document.getElementById('reader-chapter-title');
    const selectorEl = document.getElementById('chapter-selector');

    if (titleEl) titleEl.textContent = currentChapter.title || `Chapter ${currentChapter.chapterNumber}`;
    if (chTitleEl) chTitleEl.textContent = `Ch. ${currentChapter.chapterNumber}`;

    if (selectorEl) {
      selectorEl.innerHTML = allChapters.map(ch => `
        <option value="${ch.id}" ${ch.id === currentChapter.id ? 'selected' : ''}>
          Chapter ${ch.chapterNumber}: ${ch.title || ''}
        </option>
      `).join('');

      selectorEl.addEventListener('change', (e) => {
        window.location.href = `/reader.html?id=${e.target.value}`;
      });
    }

    // Render Pages
    const pages = currentChapter.pages || [];
    if (pages.length === 0) {
      readerContainer.innerHTML = `
        <div style="text-align:center; padding:5rem 1rem;">
          <p style="color:var(--text-secondary);">No pages uploaded for this chapter yet.</p>
        </div>
      `;
    } else {
      readerContainer.innerHTML = pages.map((url, idx) => `
        <div class="reader-image-wrap" id="page-${idx + 1}" data-page="${idx + 1}">
          <img src="${url}" class="reader-image" alt="Page ${idx + 1}" loading="lazy" />
        </div>
      `).join('');
    }

    // Prev / Next Chapter Buttons
    const currIdx = allChapters.findIndex(ch => ch.id === currentChapter.id);
    const prevCh = currIdx > 0 ? allChapters[currIdx - 1] : null;
    const nextCh = currIdx < allChapters.length - 1 ? allChapters[currIdx + 1] : null;

    const prevBtn = document.getElementById('prev-ch-btn');
    const nextBtn = document.getElementById('next-ch-btn');
    const navFooter = document.getElementById('reader-nav-footer');

    if (prevBtn) {
      if (prevCh) {
        prevBtn.onclick = () => window.location.href = `/reader.html?id=${prevCh.id}`;
      } else {
        prevBtn.disabled = true;
      }
    }
    if (nextBtn) {
      if (nextCh) {
        nextBtn.onclick = () => window.location.href = `/reader.html?id=${nextCh.id}`;
      } else {
        nextBtn.disabled = true;
      }
    }

    if (navFooter) {
      navFooter.innerHTML = `
        <button class="btn btn-secondary" ${!prevCh ? 'disabled' : ''} onclick="${prevCh ? `location.href='/reader.html?id=${prevCh.id}'` : ''}">
          <i class="fas fa-chevron-left"></i> Previous Chapter
        </button>
        <button class="btn btn-primary" ${!nextCh ? 'disabled' : ''} onclick="${nextCh ? `location.href='/reader.html?id=${nextCh.id}'` : ''}">
          Next Chapter <i class="fas fa-chevron-right"></i>
        </button>
      `;
    }

    // Track scroll reading progress
    window.addEventListener('scroll', () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

      if (progressBar) progressBar.style.width = `${Math.min(100, Math.max(0, scrollPercent))}%`;

      // Find current visible page
      const pageElements = document.querySelectorAll('.reader-image-wrap');
      pageElements.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.top <= window.innerHeight / 2 && rect.bottom >= window.innerHeight / 2) {
          const pageNum = parseInt(el.getAttribute('data-page'), 10);
          if (pageNum && pageNum !== currentPageIndex) {
            currentPageIndex = pageNum;
            if (pagePill) pagePill.textContent = `Page ${currentPageIndex} / ${pages.length}`;
            
            // Save progress to backend asynchronously if logged in
            if (Auth.isLoggedIn()) {
              API.post('/users/me/history', {
                comicId: currentChapter.comicId,
                chapterId: currentChapter.id,
                pageNumber: currentPageIndex
              }).catch(() => {});
            }
          }
        }
      });
    });

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft' && prevCh) {
        window.location.href = `/reader.html?id=${prevCh.id}`;
      } else if (e.key === 'ArrowRight' && nextCh) {
        window.location.href = `/reader.html?id=${nextCh.id}`;
      }
    });

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
    readerContainer.innerHTML = `
      <div style="text-align:center; padding:5rem 1rem;">
        <i class="fas fa-exclamation-triangle" style="font-size:3rem; color:var(--accent-pink); margin-bottom:1rem;"></i>
        <h2>Error Loading Reader</h2>
        <p style="color:var(--text-secondary); margin-bottom:1.5rem;">${err.message}</p>
        <a href="/comics.html" class="btn btn-primary">Return to Catalog</a>
      </div>
    `;
  }
});
