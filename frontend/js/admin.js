document.addEventListener('DOMContentLoaded', async () => {
  renderNavbar('admin');
  renderFooter();

  if (!Auth.isLoggedIn() || !Auth.isAdmin()) {
    showToast('Access denied. Administrator privileges required.', 'error');
    setTimeout(() => window.location.href = '/login.html', 1000);
    return;
  }

  // Load Dashboard Statistics
  const statComics = document.getElementById('stat-comics');
  const statChapters = document.getElementById('stat-chapters');
  const statUsers = document.getElementById('stat-users');
  const statViews = document.getElementById('stat-views');
  const statEngine = document.getElementById('stat-engine');

  try {
    const stats = await API.get('/admin/statistics');
    if (statComics) statComics.textContent = stats.totalComics;
    if (statChapters) statChapters.textContent = stats.totalChapters;
    if (statUsers) statUsers.textContent = stats.totalUsers;
    if (statViews) statViews.textContent = Number(stats.totalViews).toLocaleString();
    if (statEngine) statEngine.textContent = stats.systemStatus;
  } catch (err) {}

  // Load Admin Comic Table if present
  const comicsTableBody = document.getElementById('admin-comics-tbody');
  if (comicsTableBody) {
    try {
      const res = await API.get('/comics?limit=100');
      if (res.comics && res.comics.length > 0) {
        comicsTableBody.innerHTML = res.comics.map(c => `
          <tr>
            <td>
              <div style="display:flex; align-items:center; gap:0.75rem;">
                <img src="${c.coverImage || '/uploads/covers/default.jpg'}" style="width:36px; height:48px; border-radius:4px; object-fit:cover;" alt="Cover" />
                <strong>${c.title}</strong>
              </div>
            </td>
            <td><span class="badge badge-purple">${c.type}</span></td>
            <td><span class="badge badge-cyan">${c.status}</span></td>
            <td>${c.chapterCount || 0}</td>
            <td><i class="fas fa-eye"></i> ${Number(c.views).toLocaleString()}</td>
            <td>
              <button class="btn btn-secondary btn-sm delete-comic-btn" data-id="${c.id}" style="color:var(--accent-pink);">
                <i class="fas fa-trash"></i> Delete
              </button>
            </td>
          </tr>
        `).join('');

        // Bind delete buttons
        document.querySelectorAll('.delete-comic-btn').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            const comicId = e.currentTarget.getAttribute('data-id');
            if (confirm('Are you sure you want to permanently delete this comic?')) {
              try {
                await API.delete(`/comics/${comicId}`);
                showToast('Comic deleted successfully.', 'success');
                setTimeout(() => location.reload(), 500);
              } catch (err) {
                showToast(err.message, 'error');
              }
            }
          });
        });
      } else {
        comicsTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No comics in database yet.</td></tr>';
      }
    } catch (err) {
      comicsTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--accent-pink);">Error: ${err.message}</td></tr>`;
    }
  }

  // Load Admin Users Table if present
  const usersTableBody = document.getElementById('admin-users-tbody');
  if (usersTableBody) {
    try {
      const res = await API.get('/admin/users');
      if (res.users && res.users.length > 0) {
        usersTableBody.innerHTML = res.users.map(u => `
          <tr>
            <td>
              <div style="display:flex; align-items:center; gap:0.75rem;">
                <img src="${u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}" style="width:36px; height:36px; border-radius:50%; object-fit:cover;" alt="Avatar" />
                <strong>${u.username}</strong>
              </div>
            </td>
            <td>${u.email}</td>
            <td><span class="badge ${u.role === 'admin' ? 'badge-purple' : 'badge-cyan'}">${u.role}</span></td>
            <td>${new Date(u.created_at || Date.now()).toLocaleDateString()}</td>
          </tr>
        `).join('');
      }
    } catch (err) {}
  }
});
