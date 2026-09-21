document.addEventListener('DOMContentLoaded', async () => {
  renderNavbar('');
  renderFooter();

  if (!Auth.isLoggedIn()) {
    window.location.href = '/login.html';
    return;
  }

  const container = document.getElementById('history-container');

  try {
    const res = await API.get('/users/me/history');
    const history = res.history || [];

    if (history.length === 0) {
      container.innerHTML = `
        <div style="text-align:center; padding:4rem 1rem;">
          <i class="fas fa-history" style="font-size:3rem; color:var(--text-muted); margin-bottom:1rem;"></i>
          <h3>No Reading History Recorded</h3>
          <p style="color:var(--text-secondary); margin-top:0.5rem;">Start reading chapters and your exact progress will be automatically tracked here.</p>
          <a href="/comics.html" class="btn btn-primary" style="margin-top:1.5rem;">Start Reading</a>
        </div>
      `;
    } else {
      container.innerHTML = `
        <div class="history-list">
          ${history.map(item => `
            <div class="history-card">
              <div class="history-thumb-wrap">
                <img src="${item.comicCover || '/uploads/covers/default.jpg'}" class="history-thumb" alt="Cover" />
                <div>
                  <h4 style="font-size:1.1rem;"><a href="/comic.html?slug=${item.comicSlug}">${item.comicTitle || 'Untitled'}</a></h4>
                  <p style="color:var(--accent-cyan-light); font-size:0.9rem; font-weight:600;">
                    Chapter ${item.chapterNumber || 1}: ${item.chapterTitle || ''} — Page ${item.pageNumber || 1}
                  </p>
                  <p style="font-size:0.8rem; color:var(--text-muted);"><i class="far fa-clock"></i> Last read ${new Date(item.updatedAt).toLocaleString()}</p>
                </div>
              </div>
              <a href="/reader.html?id=${item.chapterId}&page=${item.pageNumber}" class="btn btn-primary btn-sm">
                <i class="fas fa-play"></i> Continue Reading
              </a>
            </div>
          `).join('')}
        </div>
      `;
    }
  } catch (err) {
    container.innerHTML = `<p style="color:var(--accent-pink); text-align:center;">Failed to load reading history: ${err.message}</p>`;
  }
});
