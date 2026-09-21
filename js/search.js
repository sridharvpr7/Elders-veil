/* ==========================================================================
   ComicVerse - Search & Autocomplete Module (js/search.js)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.querySelector('.search-input-box');
  const searchPopover = document.querySelector('.search-results-popover');

  if (!searchInput || !searchPopover) return;

  let allComics = [];

  // Pre-fetch comics JSON for search
  Utils.fetchJSON('data/comics.json').then(data => {
    allComics = data || [];
  });

  const performSearch = Utils.debounce((query) => {
    const q = query.trim().toLowerCase();
    if (!q) {
      searchPopover.classList.remove('active');
      searchPopover.innerHTML = '';
      return;
    }

    const matches = allComics.filter(comic => {
      const titleMatch = comic.title.toLowerCase().includes(q);
      const authorMatch = (comic.author || '').toLowerCase().includes(q);
      const artistMatch = (comic.artist || '').toLowerCase().includes(q);
      const genreMatch = (comic.genres || []).some(g => g.toLowerCase().includes(q));
      const tagMatch = (comic.tags || []).some(t => t.toLowerCase().includes(q));
      return titleMatch || authorMatch || artistMatch || genreMatch || tagMatch;
    }).slice(0, 5); // Limit popover to 5 top matches

    if (matches.length === 0) {
      searchPopover.innerHTML = `
        <div style="padding: 1rem; text-align: center; color: var(--text-muted); font-size: 0.88rem;">
          No comics found for "${query}"
        </div>
      `;
    } else {
      searchPopover.innerHTML = matches.map(c => `
        <a href="comic.html?id=${c.id}" class="search-result-item">
          <img src="${c.cover}" alt="${c.title}" class="search-result-thumb" onerror="Utils.handleImageError(this, '${c.title}')">
          <div class="search-result-info">
            <div class="search-result-title">${c.title}</div>
            <div class="search-result-meta">${c.author} • ${c.genres.slice(0, 2).join(', ')}</div>
          </div>
        </a>
      `).join('');
    }

    searchPopover.classList.add('active');
  }, 200);

  searchInput.addEventListener('input', (e) => {
    performSearch(e.target.value);
  });

  searchInput.addEventListener('focus', (e) => {
    if (e.target.value.trim().length > 0) {
      performSearch(e.target.value);
    }
  });

  // Close search popover when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-wrapper')) {
      searchPopover.classList.remove('active');
    }
  });

  // Pressing Enter in search box redirects to library with search query
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const q = searchInput.value.trim();
      if (q) {
        window.location.href = `comics.html?search=${encodeURIComponent(q)}`;
      }
    }
  });
});
