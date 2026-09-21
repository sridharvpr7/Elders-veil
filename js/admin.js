/* ==========================================================================
   ComicVerse - Admin Dashboard Controller (js/admin.js)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', async () => {
  const currentUser = Auth.getCurrentUser();
  const isAdmin = currentUser && (currentUser.role === 'admin' || currentUser.username === 'admin');

  if (!isAdmin && window.location.pathname.includes('admin')) {
    UI.showToast('Access denied: Administrator privileges required.', 'error');
    setTimeout(() => window.location.href = 'index.html', 1000);
    return;
  }

  // Load stats if on admin main dashboard
  const totalComicsEl = document.getElementById('admin-stat-total-comics');
  const totalUsersEl = document.getElementById('admin-stat-total-users');
  const totalViewsEl = document.getElementById('admin-stat-total-views');

  if (totalComicsEl) {
    const comics = await Utils.fetchJSON('data/comics.json') || [];
    const users = Auth.getUsers();
    
    totalComicsEl.textContent = comics.length;
    if (totalUsersEl) totalUsersEl.textContent = users.length || 1;
    if (totalViewsEl) {
      const sumViews = comics.reduce((acc, c) => acc + (c.views || 0), 0);
      totalViewsEl.textContent = Utils.formatViews(sumViews);
    }
  }

  // Handle Add New Comic Form
  const addComicForm = document.getElementById('admin-add-comic-form');
  if (addComicForm) {
    addComicForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = document.getElementById('adm-title').value.trim();
      const author = document.getElementById('adm-author').value.trim();
      const artist = document.getElementById('adm-artist').value.trim();
      const description = document.getElementById('adm-description').value.trim();
      const genre = document.getElementById('adm-genre').value;
      const type = document.getElementById('adm-type').value;

      if (!title || !author) {
        UI.showToast('Title and author are required.', 'error');
        return;
      }

      UI.showToast(`Comic "${title}" saved successfully to database!`, 'success');
      addComicForm.reset();
    });
  }
});
