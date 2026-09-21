/* ==========================================================================
   ComicVerse - Reading History Controller (js/history.js)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', async () => {
  const historyListContainer = document.getElementById('history-list-container');
  const emptyStateEl = document.getElementById('history-empty-state');
  const clearHistoryBtn = document.getElementById('clear-history-btn');

  if (!historyListContainer) return; // Not on history page

  const comics = await Utils.fetchJSON('data/comics.json');
  const comicMap = new Map((comics || []).map(c => [c.id, c]));

  function renderHistory() {
    const history = Storage.getHistory();

    if (!history || history.length === 0) {
      historyListContainer.style.display = 'none';
      if (emptyStateEl) emptyStateEl.style.display = 'block';
      if (clearHistoryBtn) clearHistoryBtn.style.display = 'none';
    } else {
      if (emptyStateEl) emptyStateEl.style.display = 'none';
      if (clearHistoryBtn) clearHistoryBtn.style.display = 'inline-flex';
      historyListContainer.style.display = 'block';

      historyListContainer.innerHTML = history.map(item => {
        const comic = comicMap.get(item.comicId);
        if (!comic) return '';

        return `
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 1.5rem; padding: 1.25rem; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md); margin-bottom: 1rem; flex-wrap: wrap;" data-history-id="${comic.id}">
            <div style="display: flex; align-items: center; gap: 1.25rem;">
              <img src="${comic.cover}" alt="${comic.title}" style="width: 60px; height: 85px; border-radius: 8px; object-fit: cover;" onerror="Utils.handleImageError(this, '${comic.title}')">
              <div>
                <a href="comic.html?id=${comic.id}" style="font-weight: 700; font-size: 1.1rem; color: var(--text-primary);">${comic.title}</a>
                <div style="font-size: 0.9rem; color: var(--accent); font-weight: 600; margin-top: 0.2rem;">
                  Chapter ${item.chapterNumber} • Page ${item.pageNumber} / ${item.totalPages} (${item.progressPercentage}% completed)
                </div>
                <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem;">
                  Last read on ${Utils.formatDate(item.lastReadTime)}
                </div>
                <div style="width: 220px; height: 5px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden; margin-top: 0.5rem;">
                  <div style="height: 100%; width: ${item.progressPercentage}%; background: var(--accent);"></div>
                </div>
              </div>
            </div>

            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <a href="reader.html?comic=${comic.id}&chapter=${item.chapterId}" class="btn btn-primary" style="padding: 0.55rem 1.2rem; font-size: 0.9rem;">
                <i class="ri-play-fill"></i> Continue Reading
              </a>
              <button class="btn btn-secondary remove-history-item-btn" data-remove-id="${comic.id}" title="Remove from history">
                <i class="ri-delete-bin-line" style="color: var(--danger);"></i>
              </button>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  // Remove individual entry
  historyListContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-remove-id]');
    if (btn) {
      const id = btn.getAttribute('data-remove-id');
      Storage.removeFromHistory(id);
      UI.showToast('Removed from reading history', 'info');
      renderHistory();
    }
  });

  // Clear All History
  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear your entire reading history?')) {
        Storage.clearHistory();
        UI.showToast('Reading history cleared', 'success');
        renderHistory();
      }
    });
  }

  renderHistory();
});
