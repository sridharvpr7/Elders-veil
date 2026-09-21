/* ==========================================================================
   ComicVerse - Homepage Controller (js/home.js)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', async () => {
  const heroContainer = document.getElementById('hero-banner-container');
  const trendingGrid = document.getElementById('trending-comics-grid');
  const latestGrid = document.getElementById('latest-comics-grid');
  const popularGrid = document.getElementById('popular-comics-grid');
  const continueReadingSection = document.getElementById('continue-reading-section');

  if (!heroContainer) return; // Not on home page

  // Show skeleton loaders initial state
  if (trendingGrid) UI.renderSkeletonGrid(trendingGrid, 4);
  if (latestGrid) UI.renderSkeletonGrid(latestGrid, 4);
  if (popularGrid) UI.renderSkeletonGrid(popularGrid, 4);

  // Fetch all data
  const [comics, featured] = await Promise.all([
    Utils.fetchJSON('data/comics.json'),
    Utils.fetchJSON('data/featured.json')
  ]);

  if (!comics || !featured) {
    UI.showToast('Failed to load homepage content', 'error');
    return;
  }

  const comicMap = new Map(comics.map(c => [c.id, c]));

  // 1. Render Hero Banner
  const heroComic = comicMap.get(featured.heroComic) || comics[0];
  if (heroComic) {
    const isFav = Storage.isFavorite(heroComic.id);
    const progress = Storage.getComicProgress(heroComic.id);
    const genresHTML = (heroComic.genres || []).map(g => `<span class="tag-pill">${g}</span>`).join(' ');

    heroContainer.innerHTML = `
      <div class="hero-banner">
        <img src="${heroComic.banner}" alt="${heroComic.title} Banner" class="hero-bg-img" onerror="Utils.handleImageError(this, '${heroComic.title}')">
        <div class="hero-overlay"></div>
        <div class="hero-content">
          <div class="hero-cover-wrap">
            <img src="${heroComic.cover}" alt="${heroComic.title} Cover" style="width:100%; height:100%; object-fit:cover;" onerror="Utils.handleImageError(this, '${heroComic.title}')">
          </div>
          <div class="hero-details">
            <span class="hero-badge"><i class="ri-fire-fill"></i> Featured Spotlight</span>
            <h1 class="hero-title">${heroComic.title}</h1>
            <div class="hero-meta">
              <span><i class="ri-star-fill" style="color:#fbbf24;"></i> ${heroComic.rating}</span>
              <span><i class="ri-book-open-line"></i> ${heroComic.latestChapter}</span>
              <span><i class="ri-eye-line"></i> ${Utils.formatViews(heroComic.views)} Views</span>
              <div style="display:inline-flex; gap:0.4rem;">${genresHTML}</div>
            </div>
            <p class="hero-description">${heroComic.description}</p>
            <div class="hero-actions">
              <a href="reader.html?comic=${heroComic.id}" class="btn btn-primary">
                <i class="ri-play-fill"></i> ${progress ? 'Continue Chapter ' + progress.chapterNumber : 'Read Now'}
              </a>
              <a href="comic.html?id=${heroComic.id}" class="btn btn-secondary">
                <i class="ri-information-line"></i> Comic Details
              </a>
              <button class="btn btn-secondary ${isFav ? 'active' : ''}" data-fav-id="${heroComic.id}">
                <i class="${isFav ? 'ri-heart-fill' : 'ri-heart-line'}" style="${isFav ? 'color:var(--danger)' : ''}"></i>
                ${isFav ? 'Favorited' : 'Add Favorite'}
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // 2. Render Continue Reading Prompt (if user has active history)
  const history = Storage.getHistory();
  if (history && history.length > 0 && continueReadingSection) {
    const lastRead = history[0];
    const comic = comicMap.get(lastRead.comicId);
    if (comic) {
      continueReadingSection.style.display = 'block';
      continueReadingSection.innerHTML = `
        <div style="background: var(--bg-card); border: 1px solid var(--accent); border-radius: var(--radius-md); padding: 1.25rem 1.5rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; margin-bottom: 2.5rem; box-shadow: var(--shadow-glow);">
          <div style="display: flex; align-items: center; gap: 1rem;">
            <img src="${comic.cover}" style="width: 50px; height: 70px; border-radius: 6px; object-fit: cover;" alt="${comic.title}">
            <div>
              <div style="font-size: 0.8rem; color: var(--accent); font-weight: 700; text-transform: uppercase;">Continue Reading</div>
              <h4 style="margin: 0.1rem 0;">${comic.title} - Chapter ${lastRead.chapterNumber}</h4>
              <div style="font-size: 0.85rem; color: var(--text-secondary);">Page ${lastRead.pageNumber} / ${lastRead.totalPages} (${lastRead.progressPercentage}% Completed)</div>
            </div>
          </div>
          <a href="reader.html?comic=${comic.id}&chapter=${lastRead.chapterId}" class="btn btn-primary">
            <i class="ri-play-fill"></i> Resume Reading
          </a>
        </div>
      `;
    }
  }

  // 3. Helper to populate grids
  const populateGrid = (gridEl, idList) => {
    if (!gridEl) return;
    const items = idList.map(id => comicMap.get(id)).filter(Boolean);
    if (items.length === 0) {
      gridEl.innerHTML = `<p style="color: var(--text-muted);">No comics available.</p>`;
      return;
    }
    gridEl.innerHTML = items.map(comic => UI.createComicCard(comic)).join('');
  };

  populateGrid(trendingGrid, featured.trending || []);
  populateGrid(latestGrid, featured.latest || []);
  populateGrid(popularGrid, featured.popular || []);
});
