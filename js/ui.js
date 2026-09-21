/* ==========================================================================
   ComicVerse - UI Component Renderers & Toasts (js/ui.js)
   ========================================================================== */

const UI = {
  /**
   * Create HTML for a standard comic card
   */
  createComicCard(comic) {
    const isFav = Storage.isFavorite(comic.id);
    const progress = Storage.getComicProgress(comic.id);
    const genresHTML = (comic.genres || []).slice(0, 2)
      .map(g => `<span class="tag-pill">${g}</span>`).join('');

    return `
      <div class="comic-card fade-in" data-id="${comic.id}">
        <a href="comic.html?id=${comic.id}" class="comic-card-cover-link" aria-label="Read ${comic.title}">
          <img src="${comic.cover}" alt="${comic.title} Cover" class="comic-card-cover" loading="lazy" onerror="Utils.handleImageError(this, '${comic.title}')">
          <div class="comic-card-badges">
            <span class="badge badge-status-${comic.status || 'ongoing'}">${comic.status || 'ongoing'}</span>
            <span class="badge badge-rating"><i class="ri-star-fill"></i> ${comic.rating || '4.5'}</span>
          </div>
        </a>
        <button class="fav-btn-floating ${isFav ? 'active' : ''}" data-fav-id="${comic.id}" title="${isFav ? 'Remove from Favorites' : 'Add to Favorites'}" aria-label="Toggle Favorite">
          <i class="${isFav ? 'ri-heart-fill' : 'ri-heart-line'}"></i>
        </button>
        <div class="comic-card-content">
          <a href="comic.html?id=${comic.id}" class="comic-card-title">${comic.title}</a>
          <div class="comic-card-genres">${genresHTML}</div>
          <div class="comic-card-meta">
            <span><i class="ri-book-open-line"></i> ${comic.latestChapter || 'Chapter 1'}</span>
            <span><i class="ri-eye-line"></i> ${Utils.formatViews(comic.views)}</span>
          </div>
          ${progress ? `
            <div style="margin-top: 0.4rem; height: 4px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden;" title="${progress.progressPercentage}% read">
              <div style="height: 100%; width: ${progress.progressPercentage}%; background: var(--accent);"></div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  },

  /**
   * Render grid of skeleton loaders while fetching JSON
   */
  renderSkeletonGrid(container, count = 8) {
    let skeletons = '';
    for (let i = 0; i < count; i++) {
      skeletons += `<div class="skeleton skeleton-card"></div>`;
    }
    container.innerHTML = skeletons;
  },

  /**
   * Display toast message
   */
  showToast(message, type = 'info') {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const iconMap = {
      success: 'ri-checkbox-circle-fill',
      error: 'ri-error-warning-fill',
      info: 'ri-information-fill'
    };

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<i class="${iconMap[type] || iconMap.info}"></i> <span>${message}</span>`;
    
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },

  /**
   * Render star rating icons HTML
   */
  renderStarRating(rating) {
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    let starsHTML = '';
    
    for (let i = 0; i < fullStars; i++) {
      starsHTML += `<i class="ri-star-fill" style="color: #fbbf24;"></i>`;
    }
    if (hasHalf) {
      starsHTML += `<i class="ri-star-half-fill" style="color: #fbbf24;"></i>`;
    }
    const emptyCount = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyCount; i++) {
      starsHTML += `<i class="ri-star-line" style="color: var(--text-muted);"></i>`;
    }
    return starsHTML;
  }
};
