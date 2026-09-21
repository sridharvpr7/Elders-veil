/* ==========================================================================
   ComicVerse - Immersive Comic Reader Controller (js/reader.js)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', async () => {
  const comicId = Router.getParam('comic');
  const targetChapterId = Router.getParam('chapter');

  const readerContainer = document.getElementById('reader-pages-container');
  const comicTitleEl = document.getElementById('reader-comic-title');
  const chapterTitleEl = document.getElementById('reader-chapter-title');
  const progressFill = document.getElementById('reader-progress-fill');
  const pageCounterEl = document.getElementById('reader-page-counter');
  const chapterSelect = document.getElementById('reader-chapter-select');
  const prevChapterBtn = document.getElementById('reader-prev-chapter-btn');
  const nextChapterBtn = document.getElementById('reader-next-chapter-btn');
  const fitWidthBtn = document.getElementById('reader-fit-width-btn');
  const fullscreenBtn = document.getElementById('reader-fullscreen-btn');
  const shortcutsBtn = document.getElementById('reader-shortcuts-btn');
  const shortcutsModal = document.getElementById('shortcuts-modal');
  const closeShortcutsBtn = document.getElementById('close-shortcuts-btn');

  if (!readerContainer) return; // Not on reader page

  if (!comicId) {
    Router.redirectTo404();
    return;
  }

  // Fetch comic & chapter list
  const [comics, allChapters] = await Promise.all([
    Utils.fetchJSON('data/comics.json'),
    Utils.fetchJSON('data/chapters.json')
  ]);

  const comic = (comics || []).find(c => c.id === comicId);
  if (!comic) {
    Router.redirectTo404();
    return;
  }

  const comicChapters = (allChapters || [])
    .filter(ch => ch.comicId === comic.id)
    .sort((a, b) => a.chapterNumber - b.chapterNumber); // Ascending chapter order

  if (comicChapters.length === 0) {
    readerContainer.innerHTML = `
      <div style="text-align:center; padding: 5rem 1rem; color: var(--text-secondary);">
        <h3>No chapters available for this comic.</h3>
        <a href="comic.html?id=${comic.id}" class="btn btn-primary" style="margin-top: 1.5rem;">Back to Details</a>
      </div>
    `;
    return;
  }

  // Determine current chapter
  let currentChapter = comicChapters.find(ch => ch.id === targetChapterId) || comicChapters[0];
  let currentPageIndex = 0;
  let readerMode = 'vertical'; // 'vertical' continuous or 'single' page mode

  // Populate Chapter Select Dropdown
  if (chapterSelect) {
    chapterSelect.innerHTML = comicChapters.map(ch => `
      <option value="${ch.id}" ${ch.id === currentChapter.id ? 'selected' : ''}>
        Ch. ${ch.chapterNumber}: ${ch.title}
      </option>
    `).join('');

    chapterSelect.addEventListener('change', (e) => {
      loadChapter(e.target.value);
    });
  }

  // Load Chapter Function
  function loadChapter(chId) {
    const foundCh = comicChapters.find(ch => ch.id === chId);
    if (!foundCh) return;
    
    currentChapter = foundCh;
    if (comicTitleEl) comicTitleEl.textContent = comic.title;
    if (chapterTitleEl) chapterTitleEl.textContent = `Chapter ${currentChapter.chapterNumber}: ${currentChapter.title}`;
    if (chapterSelect) chapterSelect.value = currentChapter.id;

    // Update Next/Prev Chapter Buttons
    const currIdx = comicChapters.findIndex(ch => ch.id === currentChapter.id);
    if (prevChapterBtn) {
      prevChapterBtn.disabled = currIdx <= 0;
      prevChapterBtn.onclick = () => currIdx > 0 && loadChapter(comicChapters[currIdx - 1].id);
    }
    if (nextChapterBtn) {
      nextChapterBtn.disabled = currIdx >= comicChapters.length - 1;
      nextChapterBtn.onclick = () => currIdx < comicChapters.length - 1 && loadChapter(comicChapters[currIdx + 1].id);
    }

    // Render Comic Pages
    const pages = currentChapter.pages || [];
    if (pages.length === 0) {
      readerContainer.innerHTML = `<div style="text-align:center; padding:4rem;">No page images in this chapter.</div>`;
      return;
    }

    readerContainer.innerHTML = pages.map((pageUrl, idx) => `
      <div class="reader-page-item" data-page="${idx + 1}">
        <img src="${pageUrl}" alt="Page ${idx + 1}" class="reader-page-img" loading="${idx < 2 ? 'eager' : 'lazy'}" onerror="Utils.handleImageError(this, 'Page ${idx + 1}')">
        <span class="reader-page-number-indicator">Page ${idx + 1} / ${pages.length}</span>
      </div>
    `).join('');

    // Restore saved progress if matching this chapter
    const saved = Storage.getComicProgress(comic.id);
    if (saved && saved.chapterId === currentChapter.id && saved.pageNumber > 1) {
      setTimeout(() => scrollToPage(saved.pageNumber), 150);
    } else {
      window.scrollTo(0, 0);
      updateProgressState(1, pages.length);
    }
  }

  // Scroll Event Listener to calculate reading progress
  let scrollTimeout;
  window.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      const pageElements = document.querySelectorAll('.reader-page-item');
      if (pageElements.length === 0) return;

      const totalPages = pageElements.length;
      let visiblePage = 1;

      pageElements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top <= window.innerHeight * 0.5 && rect.bottom >= 0) {
          visiblePage = parseInt(el.getAttribute('data-page'), 10) || 1;
        }
      });

      updateProgressState(visiblePage, totalPages);
    }, 100);
  });

  function updateProgressState(pageNum, totalPages) {
    currentPageIndex = pageNum;
    const percent = Math.min(100, Math.round((pageNum / totalPages) * 100));
    
    if (progressFill) progressFill.style.width = `${percent}%`;
    if (pageCounterEl) pageCounterEl.textContent = `Page ${pageNum} / ${totalPages}`;

    // Auto save to LocalStorage
    Storage.saveProgress(comic.id, currentChapter.id, currentChapter.chapterNumber, pageNum, totalPages);
  }

  function scrollToPage(pageNum) {
    const targetEl = document.querySelector(`.reader-page-item[data-page="${pageNum}"]`);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // Zoom / Fit Toggle
  let isFitScreen = false;
  if (fitWidthBtn) {
    fitWidthBtn.addEventListener('click', () => {
      const container = document.querySelector('.reader-container');
      isFitScreen = !isFitScreen;
      container.classList.toggle('fit-screen', isFitScreen);
      container.classList.toggle('fit-width', !isFitScreen);
      fitWidthBtn.classList.toggle('active', isFitScreen);
      UI.showToast(isFitScreen ? 'Fit to Screen' : 'Fit to Width', 'info');
    });
  }

  // Fullscreen Toggle
  if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', toggleFullscreen);
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        UI.showToast('Fullscreen mode not available', 'error');
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }

  // Keyboard Shortcuts Handler
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

    const totalPages = (currentChapter.pages || []).length;

    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
      case ' ':
        if (currentPageIndex < totalPages) {
          scrollToPage(currentPageIndex + 1);
        } else if (e.key !== ' ') {
          // Trigger next chapter if at end of pages
          if (nextChapterBtn && !nextChapterBtn.disabled) nextChapterBtn.click();
        }
        break;

      case 'ArrowUp':
      case 'ArrowLeft':
        if (currentPageIndex > 1) {
          scrollToPage(currentPageIndex - 1);
        }
        break;

      case 'f':
      case 'F':
        toggleFullscreen();
        break;

      case '?':
        if (shortcutsModal) shortcutsModal.classList.toggle('active');
        break;

      case 'Escape':
        if (shortcutsModal) shortcutsModal.classList.remove('active');
        break;
    }
  });

  // Shortcut Modal Listeners
  if (shortcutsBtn && shortcutsModal) {
    shortcutsBtn.addEventListener('click', () => shortcutsModal.classList.add('active'));
  }
  if (closeShortcutsBtn && shortcutsModal) {
    closeShortcutsBtn.addEventListener('click', () => shortcutsModal.classList.remove('active'));
  }

  // Initial Load
  loadChapter(currentChapter.id);
});
