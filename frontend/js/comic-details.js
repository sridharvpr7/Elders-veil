document.addEventListener('DOMContentLoaded', async () => {
  renderNavbar('');
  renderFooter();

  const urlParams = new URLSearchParams(window.location.search);
  const slug = urlParams.get('slug') || urlParams.get('id');

  if (!slug) {
    window.location.href = '/comics.html';
    return;
  }

  // Comic pages are readable only after registration/login.
  if (!Auth.isLoggedIn()) {
    const target = `${window.location.pathname}${window.location.search}`;
    openRegistrationPrompt(target);
    return;
  }

  const detailContainer = document.getElementById('comic-details-content');

  try {
    const res = await API.get(`/comics/slug/${encodeURIComponent(slug)}`);
    const { comic, chapters = [], isBookmarked, isFavorite, requiresPremium, premiumChapterCount } = res;

    document.title = `${comic.title} — Elder's Veil`;

    const bannerUrl = API.assetUrl(comic.bannerImage || comic.coverImage) || API.assetUrl('/assets/icon.png');
    const coverUrl = API.assetUrl(comic.coverImage) || API.assetUrl('/assets/icon.png');
    const creator = comic.creator || { id: comic.creatorId, username: comic.author || 'Elder\'s Veil Creator', avatar: '', followers: 0 };

    // Check user reading history for Continue Reading button
    let historyItem = null;
    if (Auth.isLoggedIn()) {
      try {
        const histRes = await API.get('/users/me/history');
        const histList = histRes.history || [];
        historyItem = histList.find(h => h.comicId === comic.id || h.comic_id === comic.id);
      } catch (e) {}
    }

    // Check creator follow status
    let isFollowingCreator = false;
    if (Auth.isLoggedIn() && comic.creatorId) {
      try {
        const fRes = await API.get(`/engagement/creators/${comic.creatorId}/following-status`);
        isFollowingCreator = !!fRes.following;
      } catch (e) {}
    }

    let chaptersSortAsc = true;
    let filteredChapters = [...chapters];

    detailContainer.innerHTML = `
      <div class="comic-detail-header">
        <img src="${bannerUrl}" class="comic-banner-img" alt="Banner" />
        <div class="comic-detail-content">
          <div class="comic-cover-wrap">
            <img src="${coverUrl}" alt="${comic.title}" onerror="this.onerror=null;this.src='/assets/icon.png';" />
          </div>
          <div class="comic-info">
            <div style="display:flex; gap:0.5rem; flex-wrap:wrap; align-items:center;">
              <span class="badge badge-purple">${comic.type || 'Manga'}</span>
              <span class="badge badge-cyan">${comic.status || 'Ongoing'}</span>
              ${comic.isPremium || comic.is_premium ? '<span class="badge premium-gold-badge"><i class="fas fa-crown"></i> Premium</span>' : ''}
            </div>
            <h1 class="comic-info-title">${comic.title}</h1>
            
            <div class="comic-meta-row">
              <div class="comic-meta-item"><i class="fas fa-star" style="color:var(--premium-gold);"></i> <strong>${Number(comic.rating || 4.5).toFixed(1)}</strong></div>
              <div class="comic-meta-item"><i class="fas fa-eye"></i> <strong>${Number(comic.views || 0).toLocaleString()} Views</strong></div>
              <div class="comic-meta-item"><i class="fas fa-heart" style="color:var(--accent);"></i> <strong>${Number(comic.likes || comic.like_count || 0).toLocaleString()} Likes</strong></div>
              <div class="comic-meta-item"><i class="fas fa-bookmark"></i> <strong>${Number(comic.bookmarks || comic.bookmark_count || 0).toLocaleString()} Favorites</strong></div>
            </div>

            <div class="comic-genres-list" style="margin-top:0.75rem;">
              ${(comic.genres || []).map(g => `<span class="badge badge-purple" style="opacity:0.9;">${g}</span>`).join('')}
            </div>

            <!-- Action Buttons -->
            <div class="comic-actions" style="margin-top:1.25rem;">
              ${historyItem ? `
                <a href="/reader.html?id=${historyItem.chapterId}&page=${historyItem.pageNumber || 1}" class="btn btn-primary">
                  <i class="fas fa-play"></i> CONTINUE READING
                </a>
              ` : (chapters.length > 0 ? `
                <a href="/reader.html?id=${chapters[0].id}" class="btn btn-primary">
                  <i class="fas fa-play"></i> READ NOW
                </a>
              ` : '<button class="btn btn-secondary" disabled>No Chapters Available</button>')}

              <button class="btn ${isFavorite ? 'btn-primary' : 'btn-secondary'}" id="favorite-toggle-btn">
                <i class="fas fa-heart" style="${isFavorite ? 'color:#ffffff' : 'color:var(--accent)'}"></i> ${isFavorite ? 'FAVORITED' : 'FAVORITE'}
              </button>

              <button class="btn ${isBookmarked ? 'btn-primary' : 'btn-secondary'}" id="bookmark-toggle-btn">
                <i class="fas fa-bookmark"></i> ${isBookmarked ? 'READ LATER' : 'READ LATER'}
              </button>

              <button class="btn btn-secondary" id="add-to-list-btn">
                <i class="fas fa-folder-plus"></i> ADD TO LIST
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Creator Info Section -->
      <div class="comic-description-box" style="margin-top:1.5rem;">
        <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:1rem;">
          <div style="display:flex; align-items:center; gap:1rem;">
            <img src="${API.assetUrl(creator.avatar) || ''}" style="width:54px; height:54px; border-radius:50%; object-fit:cover; border:2px solid var(--creator-accent);" alt="Creator Avatar" />
            <div>
              <div style="font-weight:700; font-size:1.1rem; color:var(--text);">${comic.author || creator.username || 'Creator'} <span class="badge badge-purple" style="font-size:0.65rem; margin-left:0.3rem;">CREATOR</span></div>
              <div style="font-size:0.85rem; color:var(--muted-text);"><i class="fas fa-users"></i> ${creator.followers || 0} Followers</div>
            </div>
          </div>
          ${comic.creatorId ? `
            <button class="btn ${isFollowingCreator ? 'btn-primary' : 'btn-secondary'}" id="creator-follow-btn">
              <i class="fas ${isFollowingCreator ? 'fa-user-check' : 'fa-user-plus'}"></i> ${isFollowingCreator ? 'FOLLOWING' : 'FOLLOW CREATOR'}
            </button>
          ` : ''}
        </div>
      </div>

      <!-- Synopsis -->
      <div class="comic-description-box" style="margin-top:1.5rem;">
        <h3 style="color:var(--text); margin-bottom:0.75rem;"><i class="fas fa-align-left text-gradient"></i> Description</h3>
        <p style="line-height:1.6; color:var(--muted-text);">${comic.description || 'No description provided.'}</p>
      </div>

      <!-- Chapters Section -->
      <div class="chapters-section" style="margin-top:2rem;">
        <div class="chapters-header" style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:1rem; margin-bottom:1rem;">
          <h3><i class="fas fa-list text-gradient"></i> Chapters (${chapters.length})</h3>
          
          <div style="display:flex; gap:0.75rem; align-items:center; flex-wrap:wrap;">
            <div style="position:relative; min-width:200px;">
              <input type="text" id="chapter-search-input" class="form-input" style="padding-left:2.2rem; min-height:38px; font-size:0.85rem;" placeholder="Search chapter..." />
              <i class="fas fa-search" style="position:absolute; left:0.8rem; top:50%; transform:translateY(-50%); color:var(--muted-text); font-size:0.8rem;"></i>
            </div>
            <button class="btn btn-secondary btn-sm" id="chapter-sort-btn">
              <i class="fas fa-sort"></i> Sort: Ascending
            </button>
          </div>
        </div>

        ${requiresPremium ? `
          <div class="premium-access-panel" style="padding:2.5rem; text-align:center; border:1px solid rgba(234,179,8,.45); border-radius:14px; background:linear-gradient(135deg,rgba(234,179,8,.08),rgba(17,24,39,.45));">
            <i class="fas fa-lock" style="font-size:2.5rem; color:var(--premium-gold); margin-bottom:0.8rem;"></i>
            <h3 style="color:var(--text); margin-bottom:0.4rem;">🔒 Premium Access Required</h3>
            <p style="color:var(--muted-text); margin-bottom:1.5rem;">This comic is available exclusively to Premium members. Unlock unlimited access to read all chapters.</p>
            <a href="/premium.html" class="btn btn-primary" style="background:var(--grad-gold); color:#000; font-weight:800;"><i class="fas fa-crown"></i> GET PREMIUM ACCESS</a>
          </div>` : `
          <div class="chapters-list" id="chapters-list-container">
            <!-- Dynamic chapter items -->
          </div>`}
      </div>

      <!-- Comments Section -->
      <div class="comic-description-box" style="margin-top:2rem;">
        <h3 style="margin-bottom:1rem;"><i class="fas fa-comments text-gradient"></i> Discussion & Comments</h3>
        
        <div id="comments-form-container" style="margin-bottom:1.5rem;">
          <div class="form-group">
            <textarea id="comment-text-input" class="form-textarea" rows="3" placeholder="Share your thoughts on this comic..."></textarea>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <label style="font-size:0.85rem; color:var(--muted-text); cursor:pointer; display:flex; align-items:center; gap:0.4rem;">
              <input type="checkbox" id="comment-spoiler-chk" /> Contains Spoilers
            </label>
            <button class="btn btn-primary btn-sm" id="post-comment-btn"><i class="fas fa-paper-plane"></i> Post Comment</button>
          </div>
        </div>

        <div id="comments-list-box" style="display:flex; flex-direction:column; gap:1rem;">
          <div style="text-align:center; padding:1.5rem; color:var(--muted-text);">Loading comments...</div>
        </div>
      </div>
    `;

    // Render Chapters List Function
    const renderChapters = () => {
      const listEl = document.getElementById('chapters-list-container');
      if (!listEl) return;
      if (filteredChapters.length === 0) {
        listEl.innerHTML = renderEmptyState('fa-list', 'No Chapters Match', 'No chapters match your search query.');
        return;
      }
      listEl.innerHTML = filteredChapters.map(ch => {
        const isPrem = !!ch.isPremium;
        const releaseTime = new Date(ch.releaseDate || ch.createdAt || Date.now()).toLocaleDateString();
        return `
          <a href="/reader.html?id=${ch.id}" class="chapter-item" style="display:flex; align-items:center; justify-content:space-between; padding:0.9rem 1.25rem; background:var(--surface); border:1px solid var(--border); border-radius:var(--radius-sm); margin-bottom:0.5rem; text-decoration:none; color:var(--text); transition:all var(--transition-fast);">
            <div>
              <div style="font-weight:700; font-size:0.95rem;">
                Chapter ${ch.chapterNumber}${ch.title ? `: ${ch.title}` : ''}
                ${isPrem ? '<span class="badge premium-gold-badge" style="font-size:0.65rem; margin-left:0.5rem;">🔒 Premium</span>' : ''}
              </div>
              <div style="font-size:0.78rem; color:var(--muted-text); margin-top:0.25rem;"><i class="far fa-clock"></i> ${releaseTime}</div>
            </div>
            <i class="fas fa-chevron-right" style="color:var(--muted-text);"></i>
          </a>
        `;
      }).join('');
    };

    renderChapters();

    // Bind Chapter Search & Sort
    const searchInput = document.getElementById('chapter-search-input');
    const sortBtn = document.getElementById('chapter-sort-btn');

    if (searchInput) {
      searchInput.addEventListener('input', () => {
        const q = searchInput.value.toLowerCase().trim();
        filteredChapters = chapters.filter(c => 
          String(c.chapterNumber).includes(q) || (c.title && c.title.toLowerCase().includes(q))
        );
        renderChapters();
      });
    }

    if (sortBtn) {
      sortBtn.addEventListener('click', () => {
        chaptersSortAsc = !chaptersSortAsc;
        sortBtn.innerHTML = `<i class="fas fa-sort"></i> Sort: ${chaptersSortAsc ? 'Ascending' : 'Descending'}`;
        filteredChapters.sort((a, b) => chaptersSortAsc ? (a.chapterNumber - b.chapterNumber) : (b.chapterNumber - a.chapterNumber));
        renderChapters();
      });
    }

    // Bind Favorite & Bookmark Buttons
    const favBtn = document.getElementById('favorite-toggle-btn');
    const bkmBtn = document.getElementById('bookmark-toggle-btn');

    if (favBtn) {
      favBtn.onclick = async () => {
        if (!Auth.isLoggedIn()) return window.location.href = '/login.html';
        try {
          if (favBtn.classList.contains('btn-primary')) {
            await API.delete(`/users/me/favorites/${comic.id}`);
            favBtn.className = 'btn btn-secondary';
            favBtn.innerHTML = '<i class="fas fa-heart" style="color:var(--accent)"></i> FAVORITE';
            showToast('Removed from favorites.', 'info');
          } else {
            await API.post('/users/me/favorites', { comicId: comic.id });
            favBtn.className = 'btn btn-primary';
            favBtn.innerHTML = '<i class="fas fa-heart" style="color:#ffffff"></i> FAVORITED';
            showToast('Added to favorites!', 'success');
          }
        } catch (e) { showToast(e.message, 'error'); }
      };
    }

    if (bkmBtn) {
      bkmBtn.onclick = async () => {
        if (!Auth.isLoggedIn()) return window.location.href = '/login.html';
        try {
          if (bkmBtn.classList.contains('btn-primary')) {
            await API.delete(`/users/me/bookmarks/${comic.id}`);
            bkmBtn.className = 'btn btn-secondary';
            bkmBtn.innerHTML = '<i class="fas fa-bookmark"></i> READ LATER';
            showToast('Removed from bookmarks.', 'info');
          } else {
            await API.post('/users/me/bookmarks', { comicId: comic.id });
            bkmBtn.className = 'btn btn-primary';
            bkmBtn.innerHTML = '<i class="fas fa-bookmark"></i> READ LATER';
            showToast('Saved for later reading!', 'success');
          }
        } catch (e) { showToast(e.message, 'error'); }
      };
    }

    // Bind Creator Follow Button
    const followBtn = document.getElementById('creator-follow-btn');
    if (followBtn && comic.creatorId) {
      followBtn.onclick = async () => {
        if (!Auth.isLoggedIn()) return window.location.href = '/login.html';
        try {
          const res = await API.post(`/engagement/creators/${comic.creatorId}/follow`, {});
          const following = !!res.following;
          followBtn.className = `btn ${following ? 'btn-primary' : 'btn-secondary'}`;
          followBtn.innerHTML = `<i class="fas ${following ? 'fa-user-check' : 'fa-user-plus'}"></i> ${following ? 'FOLLOWING' : 'FOLLOW CREATOR'}`;
          showToast(following ? 'Followed creator!' : 'Unfollowed creator.', following ? 'success' : 'info');
        } catch (e) { showToast(e.message, 'error'); }
      };
    }

    // Bind Add to List Button
    const addListBtn = document.getElementById('add-to-list-btn');
    if (addListBtn) {
      addListBtn.onclick = async () => {
        if (!Auth.isLoggedIn()) return window.location.href = '/login.html';
        try {
          const res = await API.get('/platform/lists');
          const lists = res.lists || [];
          if (lists.length === 0) {
            showToast('Please create a custom reading list first in your Library.', 'warning');
            setTimeout(() => window.location.href = '/library.html', 1500);
            return;
          }
          const listNames = lists.map((l, i) => `${i + 1}. ${l.name}`).join('\n');
          const choice = prompt(`Select list number to add this comic:\n${listNames}`);
          const idx = parseInt(choice, 10) - 1;
          if (idx >= 0 && idx < lists.length) {
            await API.post(`/platform/lists/${lists[idx].id}/items`, { comicId: comic.id });
            showToast(`Added to "${lists[idx].name}"!`, 'success');
          }
        } catch (e) { showToast(e.message, 'error'); }
      };
    }

    // Load & Render Comments
    const loadComments = async () => {
      const box = document.getElementById('comments-list-box');
      if (!box) return;
      try {
        const cRes = await API.get(`/platform/comics/${comic.id}/comments`);
        const comments = cRes.comments || [];
        if (comments.length === 0) {
          box.innerHTML = '<div style="text-align:center; padding:1.5rem; color:var(--muted-text); font-size:0.9rem;">No comments yet. Be the first to start the discussion!</div>';
          return;
        }
        box.innerHTML = comments.map(c => `
          <div style="padding:1rem; background:var(--surface); border:1px solid var(--border); border-radius:var(--radius-md);">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:0.5rem;">
              <div style="display:flex; align-items:center; gap:0.6rem;">
                <img src="${API.assetUrl(c.avatar) || ''}" style="width:32px; height:32px; border-radius:50%; object-fit:cover;" alt="Avatar" />
                <span style="font-weight:700; font-size:0.9rem;">${c.username || 'Reader'}</span>
                ${c.is_pinned ? '<span class="badge badge-purple" style="font-size:0.65rem;">PINNED</span>' : ''}
              </div>
              <span style="font-size:0.75rem; color:var(--muted-text);">${new Date(c.created_at || Date.now()).toLocaleDateString()}</span>
            </div>
            <p style="font-size:0.9rem; color:var(--text); line-height:1.5;">${String(c.body || '').replace(/</g, '&lt;')}</p>
          </div>
        `).join('');
      } catch (e) {
        box.innerHTML = '<div style="text-align:center; padding:1rem; color:var(--muted-text);">Unable to load comments.</div>';
      }
    };

    loadComments();

    // Post Comment Handler
    const postCommentBtn = document.getElementById('post-comment-btn');
    if (postCommentBtn) {
      postCommentBtn.onclick = async () => {
        if (!Auth.isLoggedIn()) return window.location.href = '/login.html';
        const txt = document.getElementById('comment-text-input').value.trim();
        const isSpoiler = document.getElementById('comment-spoiler-chk').checked;
        if (!txt) return showToast('Comment text cannot be empty.', 'warning');
        try {
          await API.post(`/platform/comics/${comic.id}/comments`, { body: txt, spoiler: isSpoiler });
          document.getElementById('comment-text-input').value = '';
          document.getElementById('comment-spoiler-chk').checked = false;
          showToast('Comment posted successfully!', 'success');
          loadComments();
        } catch (e) { showToast(e.message, 'error'); }
      };
    }

  } catch (err) {
    detailContainer.innerHTML = `
      <div style="text-align:center; padding:5rem 1rem;">
        <i class="fas fa-exclamation-triangle" style="font-size:3rem; color:var(--error); margin-bottom:1rem;"></i>
        <h2>Comic Not Found</h2>
        <p style="color:var(--muted-text); margin-bottom:1.5rem;">${err.message}</p>
        <a href="/comics.html" class="btn btn-primary">Return to Catalog</a>
      </div>
    `;
  }
});
