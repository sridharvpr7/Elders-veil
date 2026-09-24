document.addEventListener('DOMContentLoaded', async () => {
  renderNavbar('comics');
  renderFooter();

  const gridContainer = document.getElementById('comics-grid');
  const searchInput = document.getElementById('filter-search');
  const genreSelect = document.getElementById('filter-genre');
  const typeSelect = document.getElementById('filter-type');
  const languageSelect = document.getElementById('filter-language');
  const sortSelect = document.getElementById('filter-sort');

  // Load Genres dropdown
  try {
    const genreRes = await API.get('/comics/genres');
    if (genreSelect && genreRes.genres) {
      genreRes.genres.forEach(g => {
        const opt = document.createElement('option');
        opt.value = g.name;
        opt.textContent = g.name;
        genreSelect.appendChild(opt);
      });
    }
  } catch (err) {}

  async function loadComics() {
    if (gridContainer) gridContainer.innerHTML = renderSkeletonGrid(8);

    try {
      const search = searchInput ? searchInput.value.trim() : '';
      const genre = genreSelect ? genreSelect.value : '';
      const type = typeSelect ? typeSelect.value : '';
      const sortBy = sortSelect ? sortSelect.value : 'latest';
      const language = languageSelect ? languageSelect.value : '';

      const url = `/comics?search=${encodeURIComponent(search)}&genre=${encodeURIComponent(genre)}&type=${encodeURIComponent(type)}&language=${encodeURIComponent(language)}&sortBy=${encodeURIComponent(sortBy)}`;
      const res = await API.get(url);

      if (gridContainer) {
        if (!res.comics || res.comics.length === 0) {
          gridContainer.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem;">
              <i class="fas fa-ghost" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 1rem;"></i>
              <h3>No comics match your criteria</h3>
              <p style="color: var(--text-secondary); margin-top: 0.5rem;">Try adjusting your filters or search keywords.</p>
            </div>
          `;
        } else {
          gridContainer.innerHTML = `
            <div class="comic-grid">
              ${res.comics.map(renderComicCard).join('')}
            </div>
          `;
        }
      }
    } catch (err) {
      if (gridContainer) {
        gridContainer.innerHTML = `<p style="color:var(--accent-pink);">Failed to load comics: ${err.message}</p>`;
      }
    }
  }

  [searchInput, genreSelect, typeSelect, languageSelect, sortSelect].forEach(input => {
    if (input) {
      input.addEventListener('change', loadComics);
      if (input === searchInput) {
        input.addEventListener('keyup', (e) => {
          if (e.key === 'Enter') loadComics();
        });
      }
    }
  });

  loadComics();
});
