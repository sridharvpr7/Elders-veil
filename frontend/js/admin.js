document.addEventListener('DOMContentLoaded', async () => {
  renderNavbar('admin'); renderFooter();
  if (!Auth.isLoggedIn() || !Auth.isAdmin()) { showToast('Access denied. Administrator privileges required.', 'error'); setTimeout(() => location.href='/login.html', 800); return; }

  try {
    const stats = await API.get('/admin/statistics');
    const map = {
      'stat-comics':'totalComics',
      'stat-chapters':'totalChapters',
      'stat-users':'totalUsers',
      'stat-views':'totalViews',
      'stat-likes':'totalLikes',
      'stat-pending':'pendingSubmissions',
      'stat-creators':'totalCreators',
      'stat-premium':'totalPremiumUsers',
      'stat-pending-premium':'pendingPremiumRequests',
      'stat-bookmarks':'totalBookmarks',
      'stat-active':'totalActiveUsers',
      'stat-rejected':'rejectedSubmissions'
    };
    Object.entries(map).forEach(([id,key])=>{
      const el=document.getElementById(id);
      if(el) el.textContent=Number(stats[key] || stats[key.replace(/([A-Z])/g, '_$1').toLowerCase()] || 0).toLocaleString();
    });
    const engine=document.getElementById('stat-engine'); if(engine)engine.textContent=stats.systemStatus;
  } catch(err) {}

  // Load Premium Requests
  const premReqContainer = document.getElementById('admin-premium-requests-container');
  if (premReqContainer) {
    try {
      const res = await API.get('/admin/premium-requests');
      const requests = res.requests || [];

      if (requests.length === 0) {
        premReqContainer.innerHTML = '<p style="color:var(--text-secondary); padding:1rem; text-align:center;">No pending or previous premium requests.</p>';
      } else {
        premReqContainer.innerHTML = `
          <table class="data-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Mobile Number</th>
                <th>Request Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${requests.map(r => `
                <tr>
                  <td><strong>${r.username || 'User'}</strong></td>
                  <td>${r.email || '—'}</td>
                  <td>${r.mobile_number || r.phone || '—'}</td>
                  <td>${new Date(r.requested_at || r.created_at || Date.now()).toLocaleString()}</td>
                  <td>
                    <span class="badge ${r.status === 'approved' ? 'badge-cyan' : r.status === 'rejected' ? 'badge-purple' : 'badge-purple'}" style="${r.status === 'pending' ? 'background:#eab308; color:#000;' : ''}">
                      ${(r.status || 'pending').toUpperCase()}
                    </span>
                  </td>
                  <td>
                    ${r.status === 'pending' ? `
                      <button class="btn btn-primary btn-sm approve-prem-btn" data-id="${r.id}" data-username="${r.username}">
                        <i class="fas fa-check"></i> Approve
                      </button>
                      <button class="btn btn-secondary btn-sm reject-prem-btn" data-id="${r.id}" data-username="${r.username}" style="color:var(--accent-pink);">
                        <i class="fas fa-times"></i> Reject
                      </button>
                    ` : `
                      <span style="font-size:0.85rem; color:var(--text-muted);">
                        ${r.status === 'approved' ? 'Approved' : 'Rejected'}
                      </span>
                    `}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;

        document.querySelectorAll('.approve-prem-btn').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            const reqId = e.currentTarget.getAttribute('data-id');
            const username = e.currentTarget.getAttribute('data-username');
            if (confirm(`Approve Premium membership for user "${username}"?`)) {
              try {
                await API.post(`/admin/premium-requests/${reqId}/approve`, {});
                showToast(`Premium approved for ${username}!`, 'success');
                setTimeout(() => location.reload(), 600);
              } catch (err) {
                showToast(err.message, 'error');
              }
            }
          });
        });

        document.querySelectorAll('.reject-prem-btn').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            const reqId = e.currentTarget.getAttribute('data-id');
            const username = e.currentTarget.getAttribute('data-username');
            if (confirm(`Reject Premium request for user "${username}"?`)) {
              try {
                await API.post(`/admin/premium-requests/${reqId}/reject`, {});
                showToast(`Premium request rejected for ${username}.`, 'info');
                setTimeout(() => location.reload(), 600);
              } catch (err) {
                showToast(err.message, 'error');
              }
            }
          });
        });
      }
    } catch (err) {
      premReqContainer.innerHTML = `<p style="color:var(--accent-pink); padding:1rem;">Error loading premium requests: ${err.message}</p>`;
    }
  }

  try {
    const pending = await API.get('/admin/pending-submissions');
    const list = document.getElementById('pending-preview-list');
    const items = [...(pending.comics||[]).map(c=>({kind:'Comic',title:c.title,id:c.id,status:c.publishStatus,note:c.reviewNote})), ...(pending.chapters||[]).map(c=>({kind:`Chapter ${c.chapterNumber}`,title:c.title,id:c.id,status:c.publishStatus,note:c.reviewNote}))].filter(x=>x.status==='pending');
    if(list) list.innerHTML = items.length ? `<div class="pending-mini-list">${items.slice(0,6).map(x=>`<div class="pending-mini-row"><div><span class="badge badge-purple">${x.kind}</span><strong>${x.title||'Untitled'}</strong></div><a class="btn btn-secondary btn-sm" href="/admin/review.html">Review</a></div>`).join('')}</div>` : '<div class="empty-review"><i class="fas fa-check-circle"></i><span>No pending submissions.</span></div>';
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
              ${u.id === (Auth.getUser()?.id || '') ? '<span class="badge badge-purple">Current Admin</span>' : `
              ${u.role !== 'admin' ? `<button class="btn btn-secondary btn-sm user-status-btn" data-id="${u.id}" data-status="${u.account_status === 'blocked' ? 'active' : 'blocked'}">${u.account_status === 'blocked' ? 'Unblock' : 'Block'}</button>
              <button class="btn btn-secondary btn-sm user-status-btn" data-id="${u.id}" data-status="${u.account_status === 'banned' ? 'active' : 'banned'}">${u.account_status === 'banned' ? 'Unban' : 'Ban'}</button>
              <button class="btn btn-secondary btn-sm premium-btn" data-id="${u.id}" data-premium="${u.is_premium ? 'false' : 'true'}">${u.is_premium ? 'Remove Premium' : 'Make Premium'}</button>
              <button class="btn btn-secondary btn-sm role-btn" data-id="${u.id}" data-role="${u.role==='creator'?'user':'creator'}">${u.role==='creator'?'Remove Writer':'Make Writer'}</button>
              <button class="btn btn-secondary btn-sm role-btn promote-admin-btn" data-id="${u.id}" data-role="admin">Make Admin</button>` : `
              <button class="btn btn-secondary btn-sm role-btn remove-admin-btn" data-id="${u.id}" data-role="user">Remove Admin</button>`}
              <button class="btn btn-secondary btn-sm delete-user-btn" data-id="${u.id}" style="color:var(--accent-pink);"><i class="fas fa-trash"></i> Delete User</button>
              `}
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
      document.querySelectorAll('.delete-user-btn').forEach(btn => btn.addEventListener('click', async () => {
        const row = btn.closest('tr');
        const username = row?.querySelector('strong')?.textContent || 'this user';
        if (!confirm(`Delete ${username} permanently? An account-deletion email will be attempted before the account is removed.`)) return;
        try {
          await API.request(`/admin/users/${btn.dataset.id}`, { method:'DELETE', headers:API.getHeaders(true) });
          showToast('User deleted successfully.','success');
          location.reload();
        } catch(e) { showToast(e.message,'error'); }
      }));

      document.querySelectorAll('.premium-btn').forEach(btn => btn.addEventListener('click', async () => {
        try { await API.request(`/admin/users/${btn.dataset.id}/premium`, { method:'PATCH', headers:API.getHeaders(true), body:JSON.stringify({isPremium:btn.dataset.premium === 'true',durationMonths:1}) }); showToast('Premium status updated.', 'success'); location.reload(); } catch(e){ showToast(e.message,'error'); }
      }));
    } catch (err) {}
  }
});
