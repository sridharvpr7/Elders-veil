/* ==========================================================================
   ComicVerse - Comic Details Page Controller (js/comic-details.js)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', async () => {
  const comicId = Router.getParam('id');
  const detailsContainer = document.getElementById('comic-details-container');
  const chaptersListContainer = document.getElementById('chapters-list-container');

  if (!detailsContainer) return; // Not on comic details page

  if (!comicId) {
    Router.redirectTo404();
    return;
  }

  // Fetch comic & chapter data
  const [comics, allChapters] = await Promise.all([
    Utils.fetchJSON('data/comics.json'),
    Utils.fetchJSON('data/chapters.json')
  ]);

  const comic = (comics || []).find(c => c.id === comicId);

  if (!comic) {
    detailsContainer.innerHTML = `
      <div style="text-align: center; padding: 5rem 1rem;">
        <i class="ri-error-warning-line" style="font-size: 3.5rem; color: var(--danger); margin-bottom: 1rem; display: block;"></i>
        <h2>Comic Not Found</h2>
        <p style="color: var(--text-secondary); margin: 1rem 0 2rem;">The comic you are looking for does not exist or may have been removed.</p>
        <a href="comics.html" class="btn btn-primary"><i class="ri-arrow-left-line"></i> Return to Library</a>
      </div>
    `;
    return;
  }

  // Check LocalStorage for reading progress & favorite state
  const progress = Storage.getComicProgress(comic.id);
  const isFav = Storage.isFavorite(comic.id);

  // 1. Render Comic Main Details Header
  const genresHTML = (comic.genres || []).map(g => `<a href="comics.html?genre=${encodeURIComponent(g)}" class="tag-pill">${g}</a>`).join(' ');
  const tagsHTML = (comic.tags || []).map(t => `<span class="tag-pill" style="background:var(--bg-card); border:1px solid var(--border); color:var(--text-secondary);">${t}</span>`).join(' ');

  detailsContainer.innerHTML = `
    <div style="position: relative; border-radius: var(--radius-xl); overflow: hidden; margin-bottom: 2.5rem; background: var(--bg-card); border: 1px solid var(--border);">
      <img src="${comic.banner}" alt="${comic.title} Banner" style="position: absolute; top:0; left:0; width:100%; height:100%; object-fit:cover; filter:brightness(0.35);" onerror="Utils.handleImageError(this, '${comic.title}')">
      <div style="position: relative; z-index: 2; padding: 2.5rem; display: grid; grid-template-columns: 220px 1fr; gap: 2.5rem; align-items: flex-start;">
        
        <div style="width: 220px; border-radius: var(--radius-md); overflow: hidden; box-shadow: var(--shadow-lg); border: 2px solid rgba(255,255,255,0.15);">
          <img src="${comic.cover}" alt="${comic.title} Cover" style="width:100%; height: auto; object-fit:cover;" onerror="Utils.handleImageError(this, '${comic.title}')">
        </div>

        <div style="display: flex; flex-direction: column; gap: 1rem;">
          <div style="display: flex; gap: 0.6rem; align-items: center; flex-wrap: wrap;">
            <span class="badge badge-status-${comic.status}">${comic.status}</span>
            <span class="badge" style="background: var(--accent-light); color: var(--accent);">${comic.type}</span>
            <span style="color: var(--text-secondary); font-size: 0.85rem;">Released ${comic.releaseYear}</span>
          </div>

          <h1 style="color: #fff; font-size: 2.4rem;">${comic.title}</h1>

          <div style="display: flex; gap: 1.5rem; color: var(--text-secondary); font-size: 0.92rem; flex-wrap: wrap;">
            <span><strong style="color: #fff;">Author:</strong> ${comic.author}</span>
            <span><strong style="color: #fff;">Artist:</strong> ${comic.artist}</span>
            <span><strong style="color: #fff;">Rating:</strong> <i class="ri-star-fill" style="color:#fbbf24;"></i> ${comic.rating}</span>
            <span><strong style="color: #fff;">Views:</strong> ${Utils.formatViews(comic.views)}</span>
          </div>

          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.2rem;">
            ${genresHTML} ${tagsHTML}
          </div>

          <p style="color: rgba(255,255,255,0.8); font-size: 0.98rem; line-height: 1.6; max-width: 800px; margin-top: 0.5rem;">
            ${comic.description}
          </p>

          <div style="display: flex; gap: 1rem; align-items: center; margin-top: 1rem; flex-wrap: wrap;">
            <a href="reader.html?comic=${comic.id}${progress ? '&chapter=' + progress.chapterId : ''}" class="btn btn-primary" style="padding: 0.75rem 1.8rem; font-size: 1rem;">
              <i class="ri-play-fill"></i> ${progress ? `Continue (Ch. ${progress.chapterNumber} - Pg. ${progress.pageNumber})` : 'Start Reading'}
            </a>
            <button class="btn btn-secondary ${isFav ? 'active' : ''}" data-fav-id="${comic.id}" style="padding: 0.75rem 1.4rem;">
              <i class="${isFav ? 'ri-heart-fill' : 'ri-heart-line'}" style="${isFav ? 'color: var(--danger)' : ''}"></i>
              ${isFav ? 'Favorited' : 'Add to Favorites'}
            </button>
          </div>
        </div>

      </div>
    </div>
  `;

  // 2. Render Chapter Directory List
  const comicChapters = (allChapters || [])
    .filter(ch => ch.comicId === comic.id)
    .sort((a, b) => b.chapterNumber - a.chapterNumber); // Newest chapter first

  if (!chaptersListContainer) return;

  if (comicChapters.length === 0) {
    chaptersListContainer.innerHTML = `
      <div style="padding: 2rem; text-align: center; color: var(--text-muted); background: var(--bg-card); border-radius: var(--radius-md);">
        No chapters available yet for this comic.
      </div>
    `;
  } else {
    chaptersListContainer.innerHTML = comicChapters.map(ch => {
      const isRead = progress && progress.chapterId === ch.id;
      return `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.25rem; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md); margin-bottom: 0.75rem; transition: all var(--transition-fast);">
          <div style="display: flex; align-items: center; gap: 1rem;">
            <div style="width: 42px; height: 42px; background: var(--accent-light); color: var(--accent); border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; font-weight: 700;">
              Ch.${ch.chapterNumber}
            </div>
            <div>
              <a href="reader.html?comic=${comic.id}&chapter=${ch.id}" style="font-weight: 600; color: var(--text-primary); font-size: 1rem;">
                ${ch.title}
              </a>
              <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.15rem;">
                Released on ${Utils.formatDate(ch.releaseDate)} • ${ch.pages ? ch.pages.length : 0} Pages
              </div>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 1rem;">
            ${isRead ? `<span style="font-size: 0.78rem; padding: 0.2rem 0.6rem; background: rgba(16,185,129,0.15); color: var(--success); border-radius: var(--radius-sm); font-weight: 600;"><i class="ri-check-line"></i> Reading (${progress.progressPercentage}%)</span>` : ''}
            <a href="reader.html?comic=${comic.id}&chapter=${ch.id}" class="btn btn-secondary" style="padding: 0.45rem 1rem; font-size: 0.85rem;">
              Read <i class="ri-arrow-right-line"></i>
            </a>
          </div>
        </div>
      `;
    }).join('');
  }
});
