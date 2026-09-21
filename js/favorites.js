/* ==========================================================================
   ComicVerse - Favorites Page Controller (js/favorites.js)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', async () => {
  const favoritesGrid = document.getElementById('favorites-comics-grid');
  const emptyStateEl = document.getElementById('favorites-empty-state');
  const favCountEl = document.getElementById('favorites-count');

  if (!favoritesGrid) return; // Not on favorites page

  UI.renderSkeletonGrid(favoritesGrid, 4);

  const comics = await Utils.fetchJSON('data/comics.json');
  const allComics = comics || [];

  function renderFavorites() {
    const favIds = Storage.getFavorites();
    const favComics = allComics.filter(c => favIds.includes(c.id));

    if (favCountEl) {
      favCountEl.textContent = `${favComics.length} ${favComics.length === 1 ? 'Comic' : 'Comics'} Bookmarked`;
    }

    if (favComics.length === 0) {
      favoritesGrid.style.display = 'none';
      if (emptyStateEl) emptyStateEl.style.display = 'block';
    } else {
      if (emptyStateEl) emptyStateEl.style.display = 'none';
      favoritesGrid.style.display = 'grid';
      favoritesGrid.innerHTML = favComics.map(c => UI.createComicCard(c)).join('');
    }
  }

  // Listen for favorite toggle events
  window.addEventListener('favorites-updated', () => {
    renderFavorites();
  });

  renderFavorites();
});
