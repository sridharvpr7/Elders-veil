function getUserManualUrl() {
  const parts = window.location.pathname.split('/').filter(Boolean);
  const base = window.location.hostname.endsWith('github.io') && parts.length
    ? `/${parts[0]}/`
    : '/';
  return `${base}user-manual/index.html`;
}

function showToast(message, type = 'info', duration = 4000) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  const iconMap = {
    success: 'fa-check-circle',
    error: 'fa-exclamation-circle',
    warning: 'fa-exclamation-triangle',
    info: 'fa-info-circle'
  };
  const icon = iconMap[type] || 'fa-info-circle';
  toast.innerHTML = `<i class="fas ${icon}"></i> <span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

function renderEmptyState(icon = 'fa-folder-open', title = 'No Items Found', desc = 'There is nothing to display here yet.', actionHtml = '') {
  return `
    <div class="empty-state">
      <i class="fas ${icon} empty-state-icon"></i>
      <h3 class="empty-state-title">${title}</h3>
      <p class="empty-state-desc">${desc}</p>
      ${actionHtml}
    </div>
  `;
}

function renderNavbar(activePage = 'home') {
  const user = Auth.getUser();
  const premiumActive = !!(user && user.is_premium && (!user.premium_expires_at || new Date(user.premium_expires_at).getTime() > Date.now()));
  const premiumBadge = premiumActive ? '<span class="badge premium-gold-badge"><i class="fas fa-crown"></i> Premium</span>' : '';
  const isLoggedIn = Auth.isLoggedIn();
  const isAdmin = Auth.isAdmin();
  const isCreator = !!(user && user.role === 'creator');
  const canAdminUpload = !!(user && user.role === 'admin');

  const userAvatar = (user && user.avatar) 
    ? user.avatar 
    : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';

  // Read cached unread notification count instantly for immediate UI display
  const cachedUnread = localStorage.getItem('ev_notif_unread') || '0';

  const html = `
    <nav class="app-navbar">
      <div class="container navbar-container">
        <div class="nav-left">
          <a href="/index.html" class="navbar-logo">
            <i class="fas fa-book-open"></i>
            <span>ELDER'S <span class="text-gradient">VEIL</span></span>
          </a>
          <div class="nav-links">
            <a href="/index.html" class="nav-link ${activePage === 'home' ? 'active' : ''}">Home</a>
            <a href="/comics.html" class="nav-link ${activePage === 'comics' ? 'active' : ''}">Comics</a>
            <a href="/latest.html" class="nav-link ${activePage === 'latest' ? 'active' : ''}">Latest</a>
            <a href="/popular.html" class="nav-link ${activePage === 'popular' ? 'active' : ''}">Trending</a>
            <a href="/premium-comics.html" class="nav-link ${activePage === 'premium' ? 'active' : ''}"><i class="fas fa-crown"></i> Premium</a>
            <a href="/community.html" class="nav-link ${activePage === 'creators' ? 'active' : ''}">Creators</a>
          </div>
        </div>

        <div class="nav-right">
          ${premiumBadge}
          <div class="nav-search">
            <i class="fas fa-search"></i>
            <input type="text" id="global-search-input" placeholder="Search title, creator, genre..." />
          </div>

          ${isLoggedIn ? `
            <div class="nav-notifications" id="nav-notif-dropdown-container">
              <button class="nav-icon-btn" id="nav-notif-btn" aria-label="Notifications">
                <i class="fas fa-bell"></i>
                <span class="notif-badge" id="nav-notif-count" style="${parseInt(cachedUnread, 10) > 0 ? 'display:inline-block;' : 'display:none;'}">${cachedUnread}</span>
              </button>
              <div class="notif-dropdown-menu" id="nav-notif-dropdown">
                <div class="notif-header">
                  <span>Notifications</span>
                  <a href="/notifications.html" style="font-size:0.8rem; color:var(--primary);">View All</a>
                </div>
                <div id="nav-notif-list" style="display:flex; flex-direction:column; gap:0.4rem;">
                  <div style="text-align:center; padding:1rem; color:var(--muted-text); font-size:0.85rem;">Loading notifications...</div>
                </div>
              </div>
            </div>

            <a href="/library.html" class="nav-link ${activePage === 'library' ? 'active' : ''}"><i class="fas fa-bookmark"></i> Library</a>

            <div class="user-menu">
              <button class="user-avatar-btn" id="user-menu-btn" aria-label="Account Menu">
                <img src="${userAvatar}" class="avatar-img" alt="User" />
                <span class="user-username-label">${user ? user.username : 'Account'}</span>
                <i class="fas fa-chevron-down" style="font-size:0.75rem; color:var(--muted-text);"></i>
              </button>
              <div class="dropdown-menu" id="user-dropdown-menu">
                <a href="/profile.html" class="dropdown-item"><i class="fas fa-user-cog"></i> Profile & Settings</a>
                <a href="/library.html" class="dropdown-item"><i class="fas fa-bookmark"></i> My Library</a>
                <a href="/connections.html" class="dropdown-item"><i class="fas fa-users"></i> Following & Followers</a>
                <a href="/notifications.html" class="dropdown-item"><i class="fas fa-bell"></i> Notification Center</a>
                <a href="${getUserManualUrl()}" class="dropdown-item" target="_blank" rel="noopener noreferrer"><i class="fas fa-book-open"></i> User Manual</a>
                <a href="/platform.html" class="dropdown-item"><i class="fas fa-layer-group"></i> Platform Features</a>
                ${isCreator ? `<a href="/creator/dashboard.html" class="dropdown-item" style="color:var(--creator-accent);"><i class="fas fa-pen-nib"></i> Creator Studio</a>` : `<a href="/profile.html?tab=settings" class="dropdown-item"><i class="fas fa-feather"></i> Become Creator</a>`}
                ${canAdminUpload ? `<a href="/admin/upload.html" class="dropdown-item"><i class="fas fa-cloud-upload-alt"></i> Upload Comic</a>` : ''}
                ${isAdmin ? `<a href="/admin/index.html" class="dropdown-item" style="color:var(--primary); font-weight:700;"><i class="fas fa-user-shield"></i> Admin Portal</a>` : ''}
                <hr style="border-color:var(--border); margin:0.25rem 0;" />
                <button class="dropdown-item danger" id="logout-btn"><i class="fas fa-sign-out-alt"></i> Logout</button>
              </div>
            </div>
          ` : `
            <a href="/library.html" class="nav-link"><i class="fas fa-bookmark"></i> Library</a>
            <div class="nav-auth-buttons" style="display:flex; gap:0.75rem;">
              <a href="/login.html" class="btn btn-secondary btn-sm">Sign In</a>
              <a href="/register.html" class="btn btn-primary btn-sm">Register</a>
            </div>
          `}

          <!-- Mobile Hamburger Toggle -->
          <button class="mobile-toggle" id="mobile-nav-toggle" aria-label="Open Mobile Menu">
            <i class="fas fa-bars"></i>
          </button>
        </div>
      </div>
    </nav>

    <!-- Mobile Drawer Overlay & Panel -->
    <div class="mobile-nav-overlay" id="mobile-nav-overlay"></div>
    <aside class="mobile-nav-drawer" id="mobile-nav-drawer">
      <div class="mobile-drawer-header">
        <a href="/index.html" class="navbar-logo">
          <i class="fas fa-book-open"></i>
          <span>ELDER'S <span class="text-gradient">VEIL</span></span>
        </a>
        <button class="mobile-close-btn" id="mobile-nav-close" aria-label="Close Mobile Menu">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="mobile-drawer-body">
        <div class="mobile-search">
          <i class="fas fa-search"></i>
          <input type="text" id="mobile-search-input" placeholder="Search title, creator, genre..." />
        </div>

        ${isLoggedIn ? `
          <div class="mobile-user-card">
            <img src="${userAvatar}" class="avatar-img" alt="Avatar" />
            <div class="mobile-user-details">
              <strong>${user ? user.username : 'User'}</strong>
              <small>${user ? user.email : ''}</small>
              ${premiumBadge ? `<div style="margin-top:0.2rem;">${premiumBadge}</div>` : ''}
            </div>
          </div>
        ` : ''}

        <div class="mobile-drawer-nav">
          <div class="mobile-nav-section-title">Navigation</div>
          <a href="/index.html" class="mobile-nav-link ${activePage === 'home' ? 'active' : ''}"><i class="fas fa-home"></i> Home</a>
          <a href="/comics.html" class="mobile-nav-link ${activePage === 'comics' ? 'active' : ''}"><i class="fas fa-book"></i> Comics</a>
          <a href="/latest.html" class="mobile-nav-link ${activePage === 'latest' ? 'active' : ''}"><i class="fas fa-clock"></i> Latest</a>
          <a href="/popular.html" class="mobile-nav-link ${activePage === 'popular' ? 'active' : ''}"><i class="fas fa-fire"></i> Trending</a>
          <a href="/premium-comics.html" class="mobile-nav-link premium-nav-link ${activePage === 'premium' ? 'active' : ''}"><i class="fas fa-crown"></i> Premium Comics</a>
          <a href="/community.html" class="mobile-nav-link ${activePage === 'creators' ? 'active' : ''}"><i class="fas fa-users"></i> Creators</a>
          <a href="${getUserManualUrl()}" class="mobile-nav-link" target="_blank" rel="noopener noreferrer"><i class="fas fa-book-open"></i> User Manual</a>

          ${isLoggedIn ? `
            <div class="mobile-nav-section-title">My Account</div>
            <a href="/library.html" class="mobile-nav-link ${activePage === 'library' ? 'active' : ''}"><i class="fas fa-bookmark"></i> My Library</a>
            <a href="/profile.html" class="mobile-nav-link"><i class="fas fa-user-cog"></i> Profile Settings</a>
            <a href="/connections.html" class="mobile-nav-link"><i class="fas fa-users"></i> Following & Followers</a>
            <a href="/notifications.html" class="mobile-nav-link"><i class="fas fa-bell"></i> Notifications</a>
            <a href="/platform.html" class="mobile-nav-link"><i class="fas fa-layer-group"></i> Platform Features</a>
            ${isCreator ? `<a href="/creator/dashboard.html" class="mobile-nav-link"><i class="fas fa-pen-nib"></i> Creator Studio</a>` : ''}
            ${canAdminUpload ? `<a href="/admin/upload.html" class="mobile-nav-link"><i class="fas fa-cloud-upload-alt"></i> Upload Comic</a>` : ''}
            ${isAdmin ? `<a href="/admin/index.html" class="mobile-nav-link admin-highlight"><i class="fas fa-user-shield"></i> Admin Portal</a>` : ''}
            <button class="mobile-nav-link danger" id="mobile-logout-btn"><i class="fas fa-sign-out-alt"></i> Logout</button>
          ` : `
            <div class="mobile-auth-actions">
              <a href="/login.html" class="btn btn-secondary" style="width:100%"><i class="fas fa-sign-in-alt"></i> Sign In</a>
              <a href="/register.html" class="btn btn-primary" style="width:100%"><i class="fas fa-user-plus"></i> Register</a>
            </div>
          `}
        </div>
      </div>
    </aside>
  `;

  const headerEl = document.getElementById('app-header');
  if (headerEl) {
    headerEl.innerHTML = html;
    
    // Bind desktop search input Enter key
    const searchInput = document.getElementById('global-search-input');
    if (searchInput) {
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && searchInput.value.trim() !== '') {
          window.location.href = `/search.html?q=${encodeURIComponent(searchInput.value.trim())}`;
        }
      });
    }

    // Bind User Dropdown Toggle (Desktop)
    const menuBtn = document.getElementById('user-menu-btn');
    const dropdownMenu = document.getElementById('user-dropdown-menu');
    if (menuBtn && dropdownMenu) {
      menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownMenu.classList.toggle('show');
      });
      document.addEventListener('click', () => dropdownMenu.classList.remove('show'));
    }

    // Bind Notifications Dropdown Toggle & Data Fetching asynchronously
    if (isLoggedIn) {
      const notifBtn = document.getElementById('nav-notif-btn');
      const notifDropdown = document.getElementById('nav-notif-dropdown');
      const notifCount = document.getElementById('nav-notif-count');
      const notifList = document.getElementById('nav-notif-list');

      const fetchNotifications = async () => {
        if (document.visibilityState === 'hidden') return;
        try {
          const res = (typeof API.getCached === 'function') 
            ? await API.getCached('/notifications', 30000) 
            : await API.get('/notifications');
          const notifications = res.notifications || [];
          const unreadCount = notifications.filter(n => !n.read).length;
          
          localStorage.setItem('ev_notif_unread', String(unreadCount));
          if (notifCount) {
            if (unreadCount > 0) {
              notifCount.textContent = unreadCount > 99 ? '99+' : unreadCount;
              notifCount.style.display = 'inline-block';
            } else {
              notifCount.style.display = 'none';
            }
          }
          if (notifList) {
            if (notifications.length === 0) {
              notifList.innerHTML = '<div style="text-align:center; padding:1rem; color:var(--muted-text); font-size:0.85rem;">No notifications yet</div>';
            } else {
              notifList.innerHTML = notifications.slice(0, 5).map(n => `
                <div class="notif-item ${!n.read ? 'unread' : ''}" onclick="window.location.href='/notifications.html'">
                  <div class="notif-item-title">${String(n.title).replace(/</g,'&lt;')}</div>
                  <div class="notif-item-message">${String(n.message).replace(/</g,'&lt;')}</div>
                  <div class="notif-item-time">${new Date(n.createdAt || n.created_at).toLocaleDateString()}</div>
                </div>
              `).join('');
            }
          }
        } catch (e) {
          if (notifList) notifList.innerHTML = '<div style="text-align:center; padding:1rem; color:var(--error); font-size:0.8rem;">Unable to load notifications</div>';
        }
      };

      // Non-blocking asynchronous notification fetch
      setTimeout(fetchNotifications, 50);

      if (notifBtn && notifDropdown) {
        notifBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          notifDropdown.classList.toggle('show');
        });
        document.addEventListener('click', () => notifDropdown.classList.remove('show'));
      }
    }

    // Bind Desktop Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => Auth.logout());
    }

    // Bind Mobile Drawer Controls
    const mobileToggle = document.getElementById('mobile-nav-toggle');
    const mobileClose = document.getElementById('mobile-nav-close');
    const mobileOverlay = document.getElementById('mobile-nav-overlay');
    const mobileDrawer = document.getElementById('mobile-nav-drawer');

    const openDrawer = () => {
      if (mobileDrawer && mobileOverlay) {
        mobileDrawer.classList.add('open');
        mobileOverlay.classList.add('open');
        document.body.style.overflow = 'hidden';
      }
    };

    const closeDrawer = () => {
      if (mobileDrawer && mobileOverlay) {
        mobileDrawer.classList.remove('open');
        mobileOverlay.classList.remove('open');
        document.body.style.overflow = '';
      }
    };

    if (mobileToggle) mobileToggle.addEventListener('click', openDrawer);
    if (mobileClose) mobileClose.addEventListener('click', closeDrawer);
    if (mobileOverlay) mobileOverlay.addEventListener('click', closeDrawer);

    if (mobileDrawer) {
      mobileDrawer.querySelectorAll('a, button').forEach(el => {
        if (el.id !== 'mobile-nav-close' && el.id !== 'mobile-search-input') {
          el.addEventListener('click', closeDrawer);
        }
      });
    }

    // Mobile Search Input Enter Key
    const mobileSearchInput = document.getElementById('mobile-search-input');
    if (mobileSearchInput) {
      mobileSearchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && mobileSearchInput.value.trim() !== '') {
          closeDrawer();
          window.location.href = `/search.html?q=${encodeURIComponent(mobileSearchInput.value.trim())}`;
        }
      });
    }

    // Mobile Logout Button
    const mobileLogoutBtn = document.getElementById('mobile-logout-btn');
    if (mobileLogoutBtn) {
      mobileLogoutBtn.addEventListener('click', () => {
        closeDrawer();
        Auth.logout();
      });
    }
  }
}

function renderFooter() {
  const html = `
    <footer class="app-footer">
      <div class="container">
        <div class="footer-content">

          <div class="footer-brand">
            <div class="logo">
              <i class="fas fa-book-open text-gradient"></i>
              <span>ELDER'S VEIL</span>
            </div>
            <p>
              The ultimate commercial comic & manga reading platform featuring HD comics, manhwa, and original works.
            </p>
          </div>

          <div class="footer-column">
            <h4>Explore</h4>
            <div class="footer-links">
              <a href="/comics.html">All Comics</a>
              <a href="/categories.html">Browse Genres</a>
              <a href="/popular.html">Trending Releases</a>
              <a href="/latest.html">Latest Chapters</a>
              <a href="/premium-comics.html">Premium Catalog</a>
              <a href="/community.html">Discover Creators</a>
            </div>
          </div>

          <div class="footer-column">
            <h4>User Library</h4>
            <div class="footer-links">
              <a href="/library.html">My Library</a>
              <a href="/connections.html">Following Creators</a>
              <a href="/notifications.html">Notifications</a>
              <a href="/profile.html">Account Settings</a>
            </div>
          </div>

          <div class="footer-column">
            <h4>Platform & Help</h4>
            <div class="footer-links">
              <a href="/admin/index.html">Admin Portal</a>
              <a href="${getUserManualUrl()}" target="_blank" rel="noopener noreferrer"><i class="fas fa-book-open"></i> User Manual</a>
              <a href="/support.html">Support & Help</a>
              <a href="/terms.html">Terms of Service</a>
              <a href="/privacy.html">Privacy Policy</a>
            </div>
          </div>

        </div>

        <div class="footer-bottom">
          <span>
            &copy; ${new Date().getFullYear()} Elder's Veil. All Rights Reserved.
          </span>
          <span>PostgreSQL & Render Compatible</span>
        </div>

      </div>
    </footer>
  `;

  const footerEl = document.getElementById('app-footer');
  if (footerEl) {
    footerEl.innerHTML = html;
  }
}

function renderComicCard(comic) {
  const coverValue = comic.coverImage || comic.cover_image || comic.coverUrl || comic.cover_url;
  const coverUrl = API.assetUrl(coverValue) || API.assetUrl('/assets/icon.png');
  const slug = comic.slug || comic.id;
  const detailUrl = `/comic.html?slug=${encodeURIComponent(slug)}`;
  const rating = comic.rating ? Number(comic.rating).toFixed(1) : '4.5';
  const type = comic.type || 'manga';
  const isPrem = !!(comic.is_premium || comic.isPremium);
  const premBadge = isPrem ? '<span class="badge premium-gold-badge" style="position:absolute; top:8px; right:8px; z-index:2; font-size:0.75rem; padding:0.28rem 0.55rem;"><i class="fas fa-crown"></i> Premium</span>' : '';

  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"]/g, ch => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;'
  }[ch]));

  return `
    <article class="comic-card ${isPrem ? 'premium-comic-card' : ''}">
      <div class="card-thumb" style="position:relative;">
        <span class="badge badge-purple card-badge">${escapeHtml(type)}</span>
        ${premBadge}
        <div class="card-rating"><i class="fas fa-star"></i> ${rating}</div>
        <a href="${detailUrl}" class="card-cover-link" aria-label="Open ${escapeHtml(comic.title)}">
          <img src="${coverUrl}" alt="${escapeHtml(comic.title)}" onerror="this.onerror=null;this.src='/assets/icon.png'" loading="lazy" />
        </a>
      </div>
      <div class="card-content">
        <h3 class="card-title">
          <a href="${detailUrl}">${escapeHtml(comic.title)}</a>
        </h3>
        <div class="card-meta">
          <span class="card-chapters">${comic.chapterCount ?? comic.chapter_count ?? comic.chapters?.length ?? 0} Chapters</span>
          <span><i class="fas fa-eye"></i> ${comic.views ? Number(comic.views).toLocaleString() : '0'}</span>
        </div>
      </div>
    </article>
  `;
}

function renderSkeletonGrid(count = 8) {
  let html = '<div class="comic-grid">';
  for (let i = 0; i < count; i++) {
    html += `
      <div class="comic-card skeleton" style="height: 320px;"></div>
    `;
  }
  html += '</div>';
  return html;
}
