document.addEventListener('DOMContentLoaded', async () => {
  renderNavbar('');
  renderFooter();

  const urlParams = new URLSearchParams(window.location.search);
  const slug = urlParams.get('slug') || urlParams.get('id');

  if (!slug) {
    window.location.href = '/comics.html';
    return;
  }

  const detailContainer = document.getElementById('comic-details-content');

  try {
    const res = await API.get(`/comics/slug/${encodeURIComponent(slug)}`);
    const { comic, chapters, isBookmarked, isFavorite } = res;

    document.title = `${comic.title} — Elder's Veil`;

    const bannerUrl = comic.bannerImage || comic.coverImage;
    const coverUrl = comic.coverImage;

    detailContainer.innerHTML = `
      <div class="comic-detail-header">
        <img src="${bannerUrl}" class="comic-banner-img" alt="Banner" />
        <div class="comic-detail-content">
          <div class="comic-cover-wrap">
            <img src="${coverUrl}" alt="${comic.title}" />
          </div>
          <div class="comic-info">
            <div style="display:flex; gap:0.5rem;">
              <span class="badge badge-purple">${comic.type}</span>
              <span class="badge badge-cyan">${comic.status}</span>
            </div>
            <h1 class="comic-info-title">${comic.title}</h1>
            <div class="comic-meta-row">
              <div class="comic-meta-item"><i class="fas fa-user-edit"></i> Author: <strong>${comic.author || 'Unknown'}</strong></div>
              <div class="comic-meta-item"><i class="fas fa-paint-brush"></i> Artist: <strong>${comic.artist || 'Unknown'}</strong></div>
              <div class="comic-meta-item"><i class="fas fa-star" style="color:var(--accent-gold);"></i> Rating: <strong>${Number(comic.rating).toFixed(1)}</strong></div>
              <div class="comic-meta-item"><i class="fas fa-eye"></i> Views: <strong>${Number(comic.views).toLocaleString()}</strong></div>
            </div>
            <div class="comic-genres-list">
              ${(comic.genres || []).map(g => `<span class="badge badge-purple" style="opacity:0.8;">${g}</span>`).join('')}
            </div>
            <div class="comic-actions">
              ${chapters.length > 0 ? `
                <a href="/reader.html?id=${chapters[0].id}" class="btn btn-primary">
                  <i class="fas fa-book-open"></i> Read First Chapter
                </a>
              ` : '<button class="btn btn-secondary" disabled>No Chapters Available</button>'}

              <button class="btn ${isBookmarked ? 'btn-primary' : 'btn-secondary'}" id="bookmark-toggle-btn">
                <i class="fas fa-bookmark"></i> ${isBookmarked ? 'Bookmarked' : 'Bookmark'}
              </button>

              <button class="btn ${isFavorite ? 'btn-primary' : 'btn-secondary'}" id="favorite-toggle-btn">
                <i class="fas fa-heart" style="${isFavorite ? 'color:#ffffff' : 'color:var(--accent-pink)'}"></i> ${isFavorite ? 'Favorited' : 'Favorite'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="comic-description-box">
        <h3 style="color:var(--text-primary); margin-bottom:0.75rem;"><i class="fas fa-align-left text-gradient"></i> Synopsis</h3>
        <p>${comic.description || 'No description provided.'}</p>
      </div>

      <div class="chapters-section">
        <div class="chapters-header">
          <h3><i class="fas fa-list text-gradient"></i> Chapters (${chapters.length})</h3>
        </div>
        <div class="chapters-list">
          ${chapters.map(ch => `
            <a href="/reader.html?id=${ch.id}" class="chapter-item">
              <div>
                <div class="chapter-title">Chapter ${ch.chapterNumber}: ${ch.title || 'Untitled'}</div>
                <div class="chapter-date"><i class="far fa-clock"></i> ${ch.releaseDate || ''}</div>
              </div>
              <i class="fas fa-chevron-right" style="color:var(--text-muted);"></i>
            </a>
          `).join('')}
        </div>
      </div>
    `;

    // Bind Bookmark & Favorite buttons
    const bookmarkBtn = document.getElementById('bookmark-toggle-btn');
    const favoriteBtn = document.getElementById('favorite-toggle-btn');

    if (bookmarkBtn) {
      bookmarkBtn.addEventListener('click', async () => {
        if (!Auth.isLoggedIn()) {
          showToast('Please sign in to bookmark comics.', 'error');
          return;
        }
        try {
          if (bookmarkBtn.classList.contains('btn-primary')) {
            await API.delete(`/users/me/bookmarks/${comic.id}`);
            bookmarkBtn.className = 'btn btn-secondary';
            bookmarkBtn.innerHTML = '<i class="fas fa-bookmark"></i> Bookmark';
            showToast('Removed from bookmarks.', 'info');
          } else {
            await API.post('/users/me/bookmarks', { comicId: comic.id });
            bookmarkBtn.className = 'btn btn-primary';
            bookmarkBtn.innerHTML = '<i class="fas fa-bookmark"></i> Bookmarked';
            showToast('Added to bookmarks!', 'success');
          }
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    }

    if (favoriteBtn) {
      favoriteBtn.addEventListener('click', async () => {
        if (!Auth.isLoggedIn()) {
          showToast('Please sign in to favorite comics.', 'error');
          return;
        }
        try {
          if (favoriteBtn.classList.contains('btn-primary')) {
            await API.delete(`/users/me/favorites/${comic.id}`);
            favoriteBtn.className = 'btn btn-secondary';
            favoriteBtn.innerHTML = '<i class="fas fa-heart" style="color:var(--accent-pink)"></i> Favorite';
            showToast('Removed from favorites.', 'info');
          } else {
            await API.post('/users/me/favorites', { comicId: comic.id });
            favoriteBtn.className = 'btn btn-primary';
            favoriteBtn.innerHTML = '<i class="fas fa-heart" style="color:#ffffff"></i> Favorited';
            showToast('Added to favorites!', 'success');
          }
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    }

  } catch (err) {
    detailContainer.innerHTML = `
      <div style="text-align:center; padding:5rem 1rem;">
        <i class="fas fa-exclamation-triangle" style="font-size:3rem; color:var(--accent-pink); margin-bottom:1rem;"></i>
        <h2>Comic Not Found</h2>
        <p style="color:var(--text-secondary); margin-bottom:1.5rem;">${err.message}</p>
        <a href="/comics.html" class="btn btn-primary">Return to Catalog</a>
      </div>
    `;
  }
});
