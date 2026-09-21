/* ==========================================================================
   ComicVerse - Library Catalog Controller (js/comics.js)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', async () => {
  const catalogGrid = document.getElementById('catalog-comics-grid');
  const genresFilterContainer = document.getElementById('genre-filter-buttons');
  const searchInput = document.getElementById('catalog-search-input');
  const statusSelect = document.getElementById('filter-status');
  const typeSelect = document.getElementById('filter-type');
  const sortSelect = document.getElementById('sort-by');
  const resultsCountEl = document.getElementById('results-count');

  if (!catalogGrid) return; // Not on catalog page

  UI.renderSkeletonGrid(catalogGrid, 8);

  // Fetch comics & genres JSON
  const [comicsData, genresData] = await Promise.all([
    Utils.fetchJSON('data/comics.json'),
    Utils.fetchJSON('data/genres.json')
  ]);

  const allComics = comicsData || [];
  const genres = genresData || [];

  let selectedGenre = 'All';

  // 1. Populate Genre Filter Buttons
  if (genresFilterContainer) {
    let genreBtnsHTML = `<button class="btn btn-secondary active" data-genre="All">All Genres</button>`;
    genres.forEach(g => {
      genreBtnsHTML += `<button class="btn btn-secondary" data-genre="${g}">${g}</button>`;
    });
    genresFilterContainer.innerHTML = genreBtnsHTML;

    genresFilterContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-genre]');
      if (btn) {
        genresFilterContainer.querySelectorAll('[data-genre]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedGenre = btn.getAttribute('data-genre');
        applyFilters();
      }
    });
  }

  // Check URL query parameters (e.g. ?search=Naruto or ?genre=Action)
  const initialSearch = Router.getParam('search');
  const initialGenre = Router.getParam('genre');

  if (initialSearch && searchInput) {
    searchInput.value = initialSearch;
  }
  if (initialGenre && genres.includes(initialGenre)) {
    selectedGenre = initialGenre;
    if (genresFilterContainer) {
      const targetBtn = genresFilterContainer.querySelector(`[data-genre="${initialGenre}"]`);
      if (targetBtn) {
        genresFilterContainer.querySelectorAll('[data-genre]').forEach(b => b.classList.remove('active'));
        targetBtn.classList.add('active');
      }
    }
  }

  // 2. Filter & Sort Engine
  function applyFilters() {
    let filtered = [...allComics];

    // Search query filter
    const searchVal = searchInput ? searchInput.value.trim().toLowerCase() : '';
    if (searchVal) {
      filtered = filtered.filter(c => 
        c.title.toLowerCase().includes(searchVal) ||
        (c.author || '').toLowerCase().includes(searchVal) ||
        (c.artist || '').toLowerCase().includes(searchVal) ||
        (c.tags || []).some(t => t.toLowerCase().includes(searchVal))
      );
    }

    // Genre filter
    if (selectedGenre !== 'All') {
      filtered = filtered.filter(c => (c.genres || []).includes(selectedGenre));
    }

    // Status filter
    const statusVal = statusSelect ? statusSelect.value : 'all';
    if (statusVal !== 'all') {
      filtered = filtered.filter(c => c.status === statusVal);
    }

    // Type filter
    const typeVal = typeSelect ? typeSelect.value : 'all';
    if (typeVal !== 'all') {
      filtered = filtered.filter(c => c.type === typeVal);
    }

    // Sort options
    const sortVal = sortSelect ? sortSelect.value : 'latest';
    filtered.sort((a, b) => {
      switch (sortVal) {
        case 'oldest':
          return (a.releaseYear || 2026) - (b.releaseYear || 2026);
        case 'popular':
          return (b.views || 0) - (a.views || 0);
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'az':
          return a.title.localeCompare(b.title);
        case 'za':
          return b.title.localeCompare(a.title);
        case 'latest':
        default:
          return (b.releaseYear || 2026) - (a.releaseYear || 2026);
      }
    });

    // Render results
    if (resultsCountEl) {
      resultsCountEl.textContent = `${filtered.length} ${filtered.length === 1 ? 'Comic' : 'Comics'} Found`;
    }

    if (filtered.length === 0) {
      catalogGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; color: var(--text-muted);">
          <i class="ri-search-eye-line" style="font-size: 3rem; color: var(--accent); display: block; margin-bottom: 1rem;"></i>
          <h3>No comics match your current filters</h3>
          <p style="margin-top: 0.5rem; font-size: 0.95rem;">Try resetting your search query or selecting a different genre.</p>
        </div>
      `;
    } else {
      catalogGrid.innerHTML = filtered.map(c => UI.createComicCard(c)).join('');
    }
  }

  // Event Listeners for Filters
  if (searchInput) searchInput.addEventListener('input', Utils.debounce(applyFilters, 200));
  if (statusSelect) statusSelect.addEventListener('change', applyFilters);
  if (typeSelect) typeSelect.addEventListener('change', applyFilters);
  if (sortSelect) sortSelect.addEventListener('change', applyFilters);

  // Initial render
  applyFilters();
});
