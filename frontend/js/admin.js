document.addEventListener('DOMContentLoaded', async () => {
  renderNavbar('admin'); renderFooter();
  if (!Auth.isLoggedIn() || !Auth.isAdmin()) { showToast('Access denied. Administrator privileges required.', 'error'); setTimeout(() => location.href=sitePath('login.html'), 800); return; }

  try {
    const stats = await API.get('/admin/statistics');
    const map = { 'stat-comics':'totalComics','stat-chapters':'totalChapters','stat-users':'totalUsers','stat-views':'totalViews','stat-likes':'totalLikes','stat-pending':'pendingSubmissions','stat-creators':'totalCreators','stat-premium':'totalPremiumUsers','stat-bookmarks':'totalBookmarks','stat-active':'totalActiveUsers','stat-rejected':'rejectedSubmissions','stat-chapter-views':'totalChapterViews','stat-pending-comics':'pendingComics','stat-pending-chapters':'pendingChapters' };
    Object.entries(map).forEach(([id,key])=>{const el=document.getElementById(id);if(el)el.textContent=Number(stats[key]||0).toLocaleString();});
    const engine=document.getElementById('stat-engine'); if(engine)engine.textContent=stats.systemStatus;
  } catch(err) {}

  try {
    const pending = await API.get('/admin/pending-submissions');
    const list = document.getElementById('pending-preview-list');
    const items = [...(pending.comics||[]).map(c=>({kind:'Comic',title:c.title,id:c.id,status:c.publishStatus,note:c.reviewNote})), ...(pending.chapters||[]).map(c=>({kind:`Chapter ${c.chapterNumber}`,title:c.title,id:c.id,status:c.publishStatus,note:c.reviewNote}))].filter(x=>x.status==='pending');
    if(list) list.innerHTML = items.length ? `<div class="pending-mini-list">${items.slice(0,6).map(x=>`<div class="pending-mini-row"><div><span class="badge badge-purple">${x.kind}</span><strong>${x.title||'Untitled'}</strong></div><a class="btn btn-secondary btn-sm" href="${sitePath('admin/review.html')}">Review</a></div>`).join('')}</div>` : '<div class="empty-review"><i class="fas fa-check-circle"></i><span>No pending submissions.</span></div>';
  } catch(err) {}

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
          <tr class="${['admin','super_admin'].includes(u.role)?'admin-pinned-row':''}">
            <td>
              <div style="display:flex; align-items:center; gap:0.75rem;">
                <img src="${u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}" style="width:36px; height:36px; border-radius:50%; object-fit:cover;" alt="Avatar" />
                <strong>${u.username}</strong>
              </div>
            </td>
            <td>${u.email}</td>
            <td>${u.phone || '—'}</td>
            <td><span class="badge ${u.role === 'admin' || u.role === 'super_admin' ? 'badge-purple' : u.role === 'creator' ? 'badge-cyan' : 'badge-cyan'}">${u.role}</span></td>
            <td><span class="badge ${u.account_status === 'active' ? 'badge-cyan' : 'badge-purple'}">${u.account_status || 'active'}</span></td>
            <td>${u.is_premium ? '<span class="premium-badge"><i class="fas fa-crown"></i> Premium</span>' : (u.premium_expired ? '<span class="badge badge-purple">Expired</span>' : 'Free')}</td><td>${u.premium_expires_at ? new Date(u.premium_expires_at).toLocaleDateString() : '—'}</td>
            <td>
              ${!['admin','super_admin'].includes(u.role) ? `<button class="btn btn-secondary btn-sm user-status-btn" data-id="${u.id}" data-status="${u.account_status === 'blocked' ? 'active' : 'blocked'}">${u.account_status === 'blocked' ? 'Unblock' : 'Block'}</button>
              <button class="btn btn-secondary btn-sm user-status-btn" data-id="${u.id}" data-status="${u.account_status === 'banned' ? 'active' : 'banned'}">${u.account_status === 'banned' ? 'Unban' : 'Ban'}</button>
              <button class="btn btn-secondary btn-sm premium-btn" data-id="${u.id}" data-premium="${u.is_premium ? 'false' : 'true'}">${u.is_premium ? 'Remove Premium' : 'Make Premium'}</button>
              <button class="btn btn-secondary btn-sm role-btn" data-id="${u.id}" data-role="${u.role==='creator'?'user':'creator'}">${u.role==='creator'?'Remove Writer':'Make Writer'}</button>
              <button class="btn btn-secondary btn-sm role-btn" data-id="${u.id}" data-role="admin">Make Admin</button>` : '<span>Admin</span>'}
            </td>
            <td>${new Date(u.created_at || Date.now()).toLocaleDateString()}</td>
          </tr>
        `).join('');
      }
      document.querySelectorAll('.user-status-btn').forEach(btn => btn.addEventListener('click', async () => {
        try { await API.request(`/admin/users/${btn.dataset.id}/status`, { method:'PATCH', headers:API.getHeaders(true), body:JSON.stringify({status:btn.dataset.status}) }); showToast('Account status updated.', 'success'); location.reload(); } catch(e){ showToast(e.message,'error'); }
      }));
      document.querySelectorAll('.role-btn').forEach(btn => btn.addEventListener('click', async () => {
        try { await API.request(`/admin/users/${btn.dataset.id}/role`, { method:'PATCH', headers:API.getHeaders(true), body:JSON.stringify({role:btn.dataset.role}) }); showToast('Role updated.','success'); location.reload(); } catch(e){ showToast(e.message,'error'); }
      }));
      document.querySelectorAll('.premium-btn').forEach(btn => btn.addEventListener('click', async () => {
        try { await API.request(`/admin/users/${btn.dataset.id}/premium`, { method:'PATCH', headers:API.getHeaders(true), body:JSON.stringify({isPremium:btn.dataset.premium === 'true',durationMonths:1}) }); showToast('Premium status updated.', 'success'); location.reload(); } catch(e){ showToast(e.message,'error'); }
      }));
    } catch (err) {}
  }
});
