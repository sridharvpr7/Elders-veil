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

  const userAvatar = (user && user.avatar) ? API.assetUrl(user.avatar) : '';
  const avatarFallback = '<span class="avatar-placeholder" aria-hidden="true"><i class="fas fa-user"></i></span>';
  const avatarMarkup = userAvatar
    ? `<img src="${userAvatar}" class="avatar-img" alt="${user?.username || 'Profile'} avatar" onerror="this.replaceWith(this.nextElementSibling)" />${avatarFallback}`
    : avatarFallback;

  const html = `
    <nav class="app-navbar" aria-label="Primary navigation">
      <div class="container navbar-container">
        <div class="nav-left">
          <a href="/index.html" class="navbar-logo" aria-label="Elder's Veil home">
            <i class="fas fa-book-open" aria-hidden="true"></i>
            <span>ELDER'S <span class="text-gradient">VEIL</span></span>
          </a>

          <div class="nav-links">
            <a href="/index.html" class="nav-link ${activePage === 'home' ? 'active' : ''}">Home</a>
            <a href="/comics.html" class="nav-link ${activePage === 'comics' ? 'active' : ''}">Comics</a>
            <a href="/latest.html" class="nav-link ${activePage === 'latest' ? 'active' : ''}">Latest</a>
            <a href="/popular.html" class="nav-link ${activePage === 'popular' ? 'active' : ''}">Trending</a>
            <a href="/premium-comics.html" class="nav-link ${activePage === 'premium' ? 'active' : ''}">
              <i class="fas fa-crown" aria-hidden="true"></i> Premium
            </a>
            <a href="/community.html" class="nav-link ${activePage === 'creators' ? 'active' : ''}">Creators</a>
          </div>
        </div>

        <div class="nav-right">
          ${premiumBadge}

          <div class="nav-search">
            <i class="fas fa-search" aria-hidden="true"></i>
            <input type="search" id="global-search-input" autocomplete="off"
              placeholder="Search title, creator, genre..." aria-label="Search comics" />
          </div>

          ${!isLoggedIn ? `
            <div class="nav-auth-buttons" aria-label="Account actions">
              <a href="/login.html" class="btn btn-secondary btn-sm nav-auth-btn"><i class="fas fa-sign-in-alt"></i> Sign In</a>
              <a href="/register.html" class="btn btn-primary btn-sm nav-auth-btn"><i class="fas fa-user-plus"></i> Register</a>
            </div>
          ` : ''}

          ${isLoggedIn ? `
            <div class="notification-menu" id="notification-menu">
              <button class="notification-btn" id="notification-btn" type="button" aria-label="Notifications" aria-expanded="false" aria-controls="notification-dropdown">
                <i class="fas fa-bell" aria-hidden="true"></i>
                <span class="notification-count" id="notification-count" hidden>0</span>
              </button>
              <div class="notification-dropdown" id="notification-dropdown" role="dialog" aria-label="Notifications">
                <div class="notification-header">
                  <div><strong>Notifications</strong><span id="notification-unread" class="notification-unread"></span></div>
                  <button type="button" class="notification-action" id="mark-all-notifications">Mark all read</button>
                </div>
                <div class="notification-list" id="notification-list">
                  <div class="notification-loading">Loading notifications…</div>
                </div>
                <div class="notification-footer">
                  <a href="/notifications.html">View all notifications</a>
                  <button type="button" class="notification-clear-all" id="clear-all-notifications">Clear all</button>
                </div>
              </div>
            </div>
            <a href="/library.html" class="nav-link nav-library ${activePage === 'library' ? 'active' : ''}">
              <i class="fas fa-bookmark" aria-hidden="true"></i> <span>Library</span>
            </a>

            <div class="user-menu">
              <button class="user-avatar-btn" id="user-menu-btn" type="button" aria-label="Account menu"
                aria-expanded="false" aria-controls="user-dropdown-menu">
                ${avatarMarkup}
                <span class="user-username-label">${user ? user.username : 'Account'}</span>
                <i class="fas fa-chevron-down user-menu-chevron" aria-hidden="true"></i>
              </button>

              <div class="dropdown-menu" id="user-dropdown-menu">
                <a href="/profile.html" class="dropdown-item"><i class="fas fa-user-cog"></i> Profile & Settings</a>
                <a href="/library.html" class="dropdown-item"><i class="fas fa-bookmark"></i> My Library</a>
                <a href="/connections.html" class="dropdown-item"><i class="fas fa-users"></i> Following & Followers</a>
                <a href="${getUserManualUrl()}" class="dropdown-item" target="_blank" rel="noopener noreferrer">
                  <i class="fas fa-book-open"></i> User Manual
                </a>
                <a href="/platform.html" class="dropdown-item"><i class="fas fa-layer-group"></i> Platform Features</a>
                ${isCreator
                  ? `<a href="/creator/dashboard.html" class="dropdown-item"><i class="fas fa-pen-nib"></i> Creator Studio</a>`
                  : `<a href="/profile.html?tab=settings" class="dropdown-item"><i class="fas fa-feather"></i> Become Creator</a>`}
                ${canAdminUpload ? `<a href="/admin/upload.html" class="dropdown-item"><i class="fas fa-cloud-upload-alt"></i> Upload Comic</a>` : ''}
                ${isAdmin ? `<a href="/admin/index.html" class="dropdown-item admin-item"><i class="fas fa-user-shield"></i> Admin Portal</a>` : ''}
                <div class="dropdown-divider"></div>
                <button class="dropdown-item danger" id="logout-btn" type="button">
                  <i class="fas fa-sign-out-alt"></i> Logout
                </button>
              </div>
            </div>
          ` : ''}

          <button class="mobile-toggle" id="mobile-nav-toggle" type="button"
            aria-label="Open navigation" aria-expanded="false" aria-controls="mobile-nav-drawer">
            <i class="fas fa-bars" aria-hidden="true"></i>
          </button>
        </div>
      </div>
    </nav>

    <div class="mobile-nav-overlay" id="mobile-nav-overlay" aria-hidden="true"></div>

    <aside class="mobile-nav-drawer" id="mobile-nav-drawer" aria-label="Mobile navigation" aria-hidden="true">
      <div class="mobile-drawer-header">
        <a href="/index.html" class="navbar-logo">
          <i class="fas fa-book-open" aria-hidden="true"></i>
          <span>ELDER'S <span class="text-gradient">VEIL</span></span>
        </a>
        <button class="mobile-close-btn" id="mobile-nav-close" type="button" aria-label="Close navigation">
          <i class="fas fa-times" aria-hidden="true"></i>
        </button>
      </div>

      <div class="mobile-drawer-body">
        <div class="mobile-search">
          <i class="fas fa-search" aria-hidden="true"></i>
          <input type="search" id="mobile-search-input" autocomplete="off"
            placeholder="Search comics..." aria-label="Search comics" />
        </div>

        <nav class="mobile-drawer-nav">
          <div class="mobile-nav-section-title">Navigation</div>
          <a href="/index.html" class="mobile-nav-link ${activePage === 'home' ? 'active' : ''}"><i class="fas fa-home"></i> Home</a>
          <a href="/comics.html" class="mobile-nav-link ${activePage === 'comics' ? 'active' : ''}"><i class="fas fa-book"></i> Comics</a>
          <a href="/latest.html" class="mobile-nav-link ${activePage === 'latest' ? 'active' : ''}"><i class="fas fa-clock"></i> Latest</a>
          <a href="/popular.html" class="mobile-nav-link ${activePage === 'popular' ? 'active' : ''}"><i class="fas fa-fire"></i> Trending</a>
          <a href="/premium-comics.html" class="mobile-nav-link ${activePage === 'premium' ? 'active' : ''}"><i class="fas fa-crown"></i> Premium Comics</a>
          <a href="/community.html" class="mobile-nav-link ${activePage === 'creators' ? 'active' : ''}"><i class="fas fa-users"></i> Creators</a>
          <a href="${getUserManualUrl()}" class="mobile-nav-link" target="_blank" rel="noopener noreferrer"><i class="fas fa-book-open"></i> User Manual</a>

          ${isLoggedIn ? `
            <div class="mobile-nav-section-title">My Account</div>
            <a href="/library.html" class="mobile-nav-link ${activePage === 'library' ? 'active' : ''}"><i class="fas fa-bookmark"></i> My Library</a>
            <a href="/profile.html" class="mobile-nav-link"><i class="fas fa-user-cog"></i> Profile Settings</a>
            <a href="/connections.html" class="mobile-nav-link"><i class="fas fa-users"></i> Following & Followers</a>
            <a href="/platform.html" class="mobile-nav-link"><i class="fas fa-layer-group"></i> Platform Features</a>
            ${isCreator ? `<a href="/creator/dashboard.html" class="mobile-nav-link"><i class="fas fa-pen-nib"></i> Creator Studio</a>` : ''}
            ${canAdminUpload ? `<a href="/admin/upload.html" class="mobile-nav-link"><i class="fas fa-cloud-upload-alt"></i> Upload Comic</a>` : ''}
            ${isAdmin ? `<a href="/admin/index.html" class="mobile-nav-link admin-highlight"><i class="fas fa-user-shield"></i> Admin Portal</a>` : ''}
            <button class="mobile-nav-link danger" id="mobile-logout-btn" type="button"><i class="fas fa-sign-out-alt"></i> Logout</button>
          ` : `
            <div class="mobile-auth-actions">
              <a href="/login.html" class="btn btn-secondary"><i class="fas fa-sign-in-alt"></i> Sign In</a>
              <a href="/register.html" class="btn btn-primary"><i class="fas fa-user-plus"></i> Register</a>
            </div>
          `}
        </nav>
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

    // Bind Notifications
    if (isLoggedIn) initNotificationMenu();

    // Bind User Dropdown Toggle (Desktop)
    const menuBtn = document.getElementById('user-menu-btn');
    const dropdownMenu = document.getElementById('user-dropdown-menu');
    if (menuBtn && dropdownMenu) {
      menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = dropdownMenu.classList.toggle('show');
        menuBtn.setAttribute('aria-expanded', String(isOpen));
      });
      document.addEventListener('click', () => { dropdownMenu.classList.remove('show'); menuBtn.setAttribute('aria-expanded', 'false'); });
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
        mobileDrawer.setAttribute('aria-hidden', 'false');
        mobileOverlay.setAttribute('aria-hidden', 'false');
        if (mobileToggle) mobileToggle.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
      }
    };

    const closeDrawer = () => {
      if (mobileDrawer && mobileOverlay) {
        mobileDrawer.classList.remove('open');
        mobileOverlay.classList.remove('open');
        mobileDrawer.setAttribute('aria-hidden', 'true');
        mobileOverlay.setAttribute('aria-hidden', 'true');
        if (mobileToggle) mobileToggle.setAttribute('aria-expanded', 'false');
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

async function fetchNotifications(limit = 20) {
  const res = await API.get(`/notifications/?limit=${limit}`);
  return Array.isArray(res.notifications) ? res.notifications : [];
}

function notificationTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const diff = Math.max(0, Date.now() - date.getTime());
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function notificationIcon(type) {
  const map = {
    welcome: 'fa-hand-sparkles', new_comic: 'fa-book-open', new_chapter: 'fa-book',
    comic_approved: 'fa-circle-check', chapter_approved: 'fa-circle-check',
    changes_requested: 'fa-pen', admin_promoted: 'fa-user-shield', admin_removed: 'fa-user-shield',
    new_follower: 'fa-user-plus', comment: 'fa-comment', achievement: 'fa-trophy'
  };
  return map[type] || 'fa-bell';
}

function renderNotificationItems(items, compact = true) {
  if (!items.length) return `<div class="notification-empty"><i class="far fa-bell-slash"></i><strong>You're all caught up</strong><span>No new notifications.</span></div>`;
  return items.map(n => `
    <article class="notification-item ${n.read ? '' : 'unread'}" data-notification-id="${n.id}">
      <button type="button" class="notification-remove" data-notification-delete="${n.id}" aria-label="Remove notification" title="Remove notification"><i class="fas fa-times"></i></button>
      <div class="notification-icon"><i class="fas ${notificationIcon(n.type)}"></i></div>
      <div class="notification-content">
        <div class="notification-title-row"><strong>${escapeHtml(n.title || 'Notification')}</strong>${n.read ? '' : '<span class="notification-dot" aria-label="Unread"></span>'}</div>
        <p>${escapeHtml(n.message || '')}</p>
        <time>${notificationTime(n.createdAt || n.created_at)}</time>
      </div>
    </article>`).join('');
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[ch]));
}

async function initNotificationMenu() {
  const btn = document.getElementById('notification-btn');
  const dropdown = document.getElementById('notification-dropdown');
  const list = document.getElementById('notification-list');
  const count = document.getElementById('notification-count');
  const unread = document.getElementById('notification-unread');
  if (!btn || !dropdown || !list) return;

  let items = [];
  const paint = () => {
    const unreadCount = items.filter(n => !n.read).length;
    count.textContent = unreadCount > 99 ? '99+' : String(unreadCount);
    count.hidden = unreadCount === 0;
    unread.textContent = unreadCount ? `${unreadCount} unread` : 'All caught up';
    list.innerHTML = renderNotificationItems(items.slice(0, 8));
  };
  const load = async () => {
    try { items = await fetchNotifications(50); paint(); }
    catch { list.innerHTML = `<div class="notification-empty"><i class="fas fa-circle-exclamation"></i><strong>Couldn't load notifications</strong><span>Please try again.</span></div>`; }
  };
  await load();

  btn.addEventListener('click', async e => {
    e.stopPropagation();
    const open = dropdown.classList.toggle('show');
    btn.setAttribute('aria-expanded', String(open));
    if (open) await load();
  });
  dropdown.addEventListener('click', e => e.stopPropagation());
  document.addEventListener('click', () => { dropdown.classList.remove('show'); btn.setAttribute('aria-expanded','false'); });

  list.addEventListener('click', async e => {
    const del = e.target.closest('[data-notification-delete]');
    if (!del) return;
    const id = del.dataset.notificationDelete;
    del.disabled = true;
    try { await API.delete(`/notifications/${encodeURIComponent(id)}`); items = items.filter(n => n.id !== id); paint(); showToast('Notification removed.', 'success', 2200); }
    catch { del.disabled = false; showToast('Could not remove notification.', 'error'); }
  });

  document.getElementById('mark-all-notifications')?.addEventListener('click', async () => {
    try { await API.put('/notifications/read-all', {}); items = items.map(n => ({...n, read:true})); paint(); showToast('All notifications marked as read.', 'success', 2200); }
    catch { showToast('Could not update notifications.', 'error'); }
  });
  document.getElementById('clear-all-notifications')?.addEventListener('click', async () => {
    if (!items.length) return;
    try { await API.delete('/notifications/'); items = []; paint(); showToast('All notifications removed.', 'success', 2200); }
    catch { showToast('Could not clear notifications.', 'error'); }
  });
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

/**
 * Authentication gate used when a visitor tries to open a comic before signing in.
 * Browsing the catalog stays public; opening/reading a comic requires an account.
 */
function openRegistrationPrompt(targetUrl = '') {
  let modal = document.getElementById('registration-gate-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'registration-gate-modal';
    modal.className = 'auth-gate-modal';
    modal.innerHTML = `
      <div class="auth-gate-backdrop" data-auth-gate-close></div>
      <section class="auth-gate-card" role="dialog" aria-modal="true" aria-labelledby="auth-gate-title">
        <button type="button" class="auth-gate-close" aria-label="Close" data-auth-gate-close><i class="fas fa-times"></i></button>
        <div class="auth-gate-icon"><i class="fas fa-book-open"></i></div>
        <span class="badge badge-purple">MEMBERS ONLY</span>
        <h2 id="auth-gate-title">Create your Elder's Veil account</h2>
        <p>Register for free to open comics and start reading. Your library, favorites and reading progress will stay synced to your account.</p>
        <div class="auth-gate-actions">
          <a id="auth-gate-register" href="/register.html" class="btn btn-primary"><i class="fas fa-user-plus"></i> Create Free Account</a>
          <a id="auth-gate-login" href="/login.html" class="btn btn-secondary"><i class="fas fa-sign-in-alt"></i> Already have an account?</a>
        </div>
        <small>New here? Registration takes less than a minute.</small>
      </section>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', (event) => {
      if (event.target.closest('[data-auth-gate-close]')) closeRegistrationPrompt();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeRegistrationPrompt();
    });
  }

  const target = targetUrl || window.location.href;
  const register = document.getElementById('auth-gate-register');
  const login = document.getElementById('auth-gate-login');
  if (register) register.href = `/register.html?next=${encodeURIComponent(target)}`;
  if (login) login.href = `/login.html?next=${encodeURIComponent(target)}`;

  modal.classList.add('show');
  document.body.classList.add('auth-gate-open');
  setTimeout(() => modal.querySelector('.auth-gate-close')?.focus(), 0);
}

function closeRegistrationPrompt() {
  const modal = document.getElementById('registration-gate-modal');
  if (modal) modal.classList.remove('show');
  document.body.classList.remove('auth-gate-open');
}

function requireRegistration(event, targetUrl) {
  if (Auth.isLoggedIn()) return true;
  if (event) event.preventDefault();
  openRegistrationPrompt(targetUrl || event?.currentTarget?.href || '');
  return false;
}

window.openRegistrationPrompt = openRegistrationPrompt;
window.closeRegistrationPrompt = closeRegistrationPrompt;
window.requireRegistration = requireRegistration;

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
        <a href="${detailUrl}" class="card-cover-link" aria-label="Open ${escapeHtml(comic.title)}" ${Auth.isLoggedIn() ? '' : 'onclick="return requireRegistration(event, this.href)"'}>
          <img src="${coverUrl}" alt="${escapeHtml(comic.title)}" onerror="this.onerror=null;this.src='/assets/icon.png'" loading="lazy" />
        </a>
      </div>
      <div class="card-content">
        <h3 class="card-title">
          <a href="${detailUrl}" ${Auth.isLoggedIn() ? '' : 'onclick="return requireRegistration(event, this.href)"'}>${escapeHtml(comic.title)}</a>
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
