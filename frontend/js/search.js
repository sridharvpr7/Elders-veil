document.addEventListener('DOMContentLoaded', async () => {
  renderNavbar('comics');
  renderFooter();

  const urlParams = new URLSearchParams(window.location.search);
  const initialQuery = urlParams.get('q') || urlParams.get('search') || '';
  const initialGenre = urlParams.get('genre') || '';

  const searchInput = document.getElementById('search-input');
  const clearBtn = document.getElementById('clear-search-btn');
  const genreSelect = document.getElementById('filter-genre');
  const statusSelect = document.getElementById('filter-status');
  const premiumSelect = document.getElementById('filter-premium');
  const sortSelect = document.getElementById('filter-sort');
  const resultsContainer = document.getElementById('search-results');
  const recentBox = document.getElementById('recent-chips-container');

  if (searchInput) searchInput.value = initialQuery;
  if (genreSelect && initialGenre) genreSelect.value = initialGenre;
  if (clearBtn && initialQuery) clearBtn.style.display = 'block';

  // Recent Searches in localStorage
  const getRecentSearches = () => {
    try {
      return JSON.parse(localStorage.getItem('ev_recent_searches') || '[]');
    } catch (e) { return []; }
  };

  const saveRecentSearch = (term) => {
    if (!term || term.length < 2) return;
    let list = getRecentSearches().filter(x => x.toLowerCase() !== term.toLowerCase());
    list.unshift(term);
    localStorage.setItem('ev_recent_searches', JSON.stringify(list.slice(0, 6)));
    renderRecentSearches();
  };

  const renderRecentSearches = () => {
    if (!recentBox) return;
    const list = getRecentSearches();
    if (list.length === 0) {
      document.getElementById('recent-searches-box').style.display = 'none';
      return;
    }
    document.getElementById('recent-searches-box').style.display = 'flex';
    recentBox.innerHTML = list.map(term => `
      <span class="recent-chip" data-term="${term}">${term} <i class="fas fa-times" style="font-size:0.7rem; opacity:0.6;"></i></span>
    `).join('');

    recentBox.querySelectorAll('.recent-chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        const term = chip.getAttribute('data-term');
        if (e.target.classList.contains('fa-times')) {
          const updated = getRecentSearches().filter(x => x !== term);
          localStorage.setItem('ev_recent_searches', JSON.stringify(updated));
          renderRecentSearches();
        } else {
          searchInput.value = term;
          if (clearBtn) clearBtn.style.display = 'block';
          performSearch();
        }
      });
    });
  };

  renderRecentSearches();

  async function performSearch() {
    if (!resultsContainer) return;
    resultsContainer.innerHTML = renderSkeletonGrid(8);

    try {
      const q = searchInput ? searchInput.value.trim() : '';
      const genre = genreSelect ? genreSelect.value : '';
      const status = statusSelect ? statusSelect.value : '';
      const premium = premiumSelect ? premiumSelect.value : '';
      const sort = sortSelect ? sortSelect.value : 'popular';

      if (q) saveRecentSearch(q);

      const res = await API.get(`/comics?search=${encodeURIComponent(q)}&genre=${encodeURIComponent(genre)}&status=${encodeURIComponent(status)}&sort=${encodeURIComponent(sort)}`);
      let comics = res.comics || [];

      // Filter by premium access locally
      if (premium === 'free') {
        comics = comics.filter(c => !c.isPremium && !c.is_premium);
      } else if (premium === 'premium') {
        comics = comics.filter(c => c.isPremium || c.is_premium);
      }

      if (comics.length === 0) {
        resultsContainer.innerHTML = renderEmptyState(
          'fa-search-minus',
          'No Comics Found',
          `No published comics matched your search criteria "${q || genre || 'filters'}". Try searching for another title, author, or genre.`,
          '<button class="btn btn-secondary" id="reset-filters-btn"><i class="fas fa-redo"></i> Reset Filters</button>'
        );
        document.getElementById('reset-filters-btn')?.addEventListener('click', () => {
          if (searchInput) searchInput.value = '';
          if (genreSelect) genreSelect.value = '';
          if (statusSelect) statusSelect.value = '';
          if (premiumSelect) premiumSelect.value = '';
          if (clearBtn) clearBtn.style.display = 'none';
          performSearch();
        });
      } else {
        resultsContainer.innerHTML = `
          <div style="font-size:0.9rem; color:var(--muted-text); margin-bottom:1rem;">Found ${comics.length} comic(s)</div>
          <div class="comic-grid">
            ${comics.map(renderComicCard).join('')}
          </div>
        `;
      }
    } catch (err) {
      resultsContainer.innerHTML = renderEmptyState('fa-exclamation-triangle', 'Search Error', err.message);
    }
  }

  // Event Listeners
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      if (clearBtn) clearBtn.style.display = searchInput.value.trim() ? 'block' : 'none';
      clearTimeout(window.searchTimer);
      window.searchTimer = setTimeout(performSearch, 350);
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      clearBtn.style.display = 'none';
      performSearch();
    });
  }

  [genreSelect, statusSelect, premiumSelect, sortSelect].forEach(select => {
    if (select) select.addEventListener('change', performSearch);
  });

  performSearch();
});
