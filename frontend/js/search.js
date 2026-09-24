document.addEventListener('DOMContentLoaded', async () => {
  renderNavbar('comics');
  renderFooter();

  const urlParams = new URLSearchParams(window.location.search);
  const initialQuery = urlParams.get('q') || '';

  const searchInput = document.getElementById('search-input');
  const resultsContainer = document.getElementById('search-results');
  const languageSelect = document.getElementById('search-language');

  if (searchInput) searchInput.value = initialQuery;

  async function performSearch() {
    if (!resultsContainer) return;
    resultsContainer.innerHTML = renderSkeletonGrid(8);

    try {
      const q = searchInput ? searchInput.value.trim() : '';
      const language = languageSelect ? languageSelect.value : '';
      const res = await API.get(`/comics?search=${encodeURIComponent(q)}&language=${encodeURIComponent(language)}`);

      if (!res.comics || res.comics.length === 0) {
        resultsContainer.innerHTML = `
          <div style="text-align:center; padding:4rem 1rem; grid-column: 1 / -1;">
            <i class="fas fa-search-minus" style="font-size:3rem; color:var(--text-muted); margin-bottom:1rem;"></i>
            <h3>No comics found matching "${q}"</h3>
            <p style="color:var(--text-secondary); margin-top:0.5rem;">Check spelling or try searching for another author, genre, or keyword.</p>
          </div>
        `;
      } else {
        resultsContainer.innerHTML = `
          <div class="comic-grid">
            ${res.comics.map(renderComicCard).join('')}
          </div>
        `;
      }
    } catch (err) {
      resultsContainer.innerHTML = `<p style="color:var(--accent-pink);">Search error: ${err.message}</p>`;
    }
  }

  if (languageSelect) languageSelect.addEventListener('change', performSearch);

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(window.searchTimer);
      window.searchTimer = setTimeout(performSearch, 300);
    });
  }

  performSearch();
});
