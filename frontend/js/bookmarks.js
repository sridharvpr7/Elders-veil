document.addEventListener('DOMContentLoaded', async () => {
  renderNavbar('');
  renderFooter();

  if (!Auth.isLoggedIn()) {
    window.location.href=sitePath('login.html');
    return;
  }

  const container = document.getElementById('bookmarks-grid');

  try {
    const res = await API.get('/users/me/bookmarks');
    const bookmarks = res.bookmarks || [];

    if (bookmarks.length === 0) {
      container.innerHTML = `
        <div style="text-align:center; padding:4rem 1rem;">
          <i class="far fa-bookmark" style="font-size:3rem; color:var(--text-muted); margin-bottom:1rem;"></i>
          <h3>Your Bookmarks Library is Empty</h3>
          <p style="color:var(--text-secondary); margin-top:0.5rem;">Explore comics and click 'Bookmark' to save them here for quick access.</p>
          <a href="${sitePath('comics.html')}" class="btn btn-primary" style="margin-top:1.5rem;">Browse Comics</a>
        </div>
      `;
    } else {
      container.innerHTML = `
        <div class="comic-grid">
          ${bookmarks.map(renderComicCard).join('')}
        </div>
      `;
    }
  } catch (err) {
    container.innerHTML = `<p style="color:var(--accent-pink); text-align:center;">Failed to load bookmarks: ${err.message}</p>`;
  }
});
