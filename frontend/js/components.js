function renderNavbar(activePage = 'home') {
  const user = Auth.getUser();
  const premiumActive = !!(user && user.is_premium && (!user.premium_expires_at || new Date(user.premium_expires_at).getTime() > Date.now()));
  const premiumBadge = premiumActive ? '<span class="premium-badge"><i class="fas fa-crown"></i> Premium</span>' : '';
  const isLoggedIn = Auth.isLoggedIn();
  const isAdmin = Auth.isAdmin();
  const canCreate=!!user&&user.role==='creator';
  const canAdminUpload=!!user&&user.role==='admin';

  const userAvatar = (user && user.avatar) 
    ? user.avatar 
    : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';

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
            <a href="/categories.html" class="nav-link ${activePage === 'categories' ? 'active' : ''}">Genres</a>
            <a href="/popular.html" class="nav-link ${activePage === 'popular' ? 'active' : ''}">Popular</a>
            <a href="/latest.html" class="nav-link ${activePage === 'latest' ? 'active' : ''}">Latest</a>
          </div>
        </div>

        <div class="nav-right">
          ${premiumBadge}
          <div class="nav-search">
            <i class="fas fa-search"></i>
            <input type="text" id="global-search-input" placeholder="Search title, author, genre..." />
          </div>

          ${isLoggedIn ? `
            <div class="user-menu">
              <button class="user-avatar-btn" id="user-menu-btn" aria-label="Account Menu">
                <img src="${userAvatar}" class="avatar-img" alt="User" />
                <span class="user-username-label" style="font-weight:600; font-size:0.9rem;">${user ? user.username : 'Account'}</span>
                <i class="fas fa-chevron-down" style="font-size:0.75rem; color:var(--text-muted);"></i>
              </button>
              <div class="dropdown-menu" id="user-dropdown-menu">
                <a href="/dashboard.html" class="dropdown-item"><i class="fas fa-th-large"></i> Dashboard</a>
                <a href="/bookmarks.html" class="dropdown-item"><i class="fas fa-bookmark"></i> Bookmarks</a>
                <a href="/favorites.html" class="dropdown-item"><i class="fas fa-heart"></i> Favorites</a>
                <a href="/history.html" class="dropdown-item"><i class="fas fa-history"></i> Reading History</a>
                <a href="/profile.html" class="dropdown-item"><i class="fas fa-user-cog"></i> Profile Settings</a>
                ${canCreate ? `<a href="/creator/dashboard.html" class="dropdown-item"><i class="fas fa-pen-nib"></i> Creator Studio</a>` : ''}
                ${canAdminUpload ? `<a href="/admin/upload.html" class="dropdown-item"><i class="fas fa-cloud-upload-alt"></i> Upload Comic</a>` : ''}
                ${isAdmin ? `
                  <a href="/admin/index.html" class="dropdown-item" style="color:var(--accent-purple-light);"><i class="fas fa-user-shield"></i> Admin Portal</a>
                ` : ''}
                <hr style="border-color:var(--glass-border); margin:0.25rem 0;" />
                <button class="dropdown-item danger" id="logout-btn"><i class="fas fa-sign-out-alt"></i> Logout</button>
              </div>
            </div>
          ` : `
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
          <input type="text" id="mobile-search-input" placeholder="Search title, author, genre..." />
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
          <a href="/categories.html" class="mobile-nav-link ${activePage === 'categories' ? 'active' : ''}"><i class="fas fa-tags"></i> Genres</a>
          <a href="/popular.html" class="mobile-nav-link ${activePage === 'popular' ? 'active' : ''}"><i class="fas fa-fire"></i> Popular</a>
          <a href="/latest.html" class="mobile-nav-link ${activePage === 'latest' ? 'active' : ''}"><i class="fas fa-clock"></i> Latest</a>

          ${isLoggedIn ? `
            <div class="mobile-nav-section-title">My Account</div>
            <a href="/dashboard.html" class="mobile-nav-link"><i class="fas fa-th-large"></i> Dashboard</a>
            <a href="/bookmarks.html" class="mobile-nav-link"><i class="fas fa-bookmark"></i> Bookmarks</a>
            <a href="/favorites.html" class="mobile-nav-link"><i class="fas fa-heart"></i> Favorites</a>
            <a href="/history.html" class="mobile-nav-link"><i class="fas fa-history"></i> Reading History</a>
            <a href="/profile.html" class="mobile-nav-link"><i class="fas fa-user-cog"></i> Profile Settings</a>
            ${canCreate ? `<a href="/creator/dashboard.html" class="mobile-nav-link"><i class="fas fa-pen-nib"></i> Creator Studio</a>` : ''}
            ${canAdminUpload ? `<a href="/admin/upload.html" class="mobile-nav-link"><i class="fas fa-cloud-upload-alt"></i> Upload Comic</a>` : ''}
            ${isAdmin ? `
              <a href="/admin/index.html" class="mobile-nav-link admin-highlight"><i class="fas fa-user-shield"></i> Admin Portal</a>
            ` : ''}
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

    // Close drawer when clicking any link inside drawer
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
            <p>The ultimate dark-themed commercial reading destination for HD Manga, Manhwa, and Manhua comics.</p>
          </div>
          <div class="footer-column">
            <h4>Discovery</h4>
            <div class="footer-links">
              <a href="/comics.html">All Comics</a>
              <a href="/categories.html">Browse Genres</a>
              <a href="/popular.html">Most Popular</a>
              <a href="/latest.html">Latest Releases</a>
            </div>
          </div>
          <div class="footer-column">
            <h4>User Account</h4>
            <div class="footer-links">
              <a href="/login.html">Sign In</a>
              <a href="/register.html">Create Account</a>
              <a href="/bookmarks.html">My Bookmarks</a>
              <a href="/history.html">Reading Progress</a>
            </div>
          </div>
          <div class="footer-column">
            <h4>Platform</h4>
            <div class="footer-links">
              <a href="/admin/index.html">Admin Portal</a>
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
              <a href="#">API Documentation</a>
            </div>
          </div>
        </div>
        <div class="footer-bottom">
          <span>&copy; ${new Date().getFullYear()} Elder's Veil. Production Commercial Build.</span>
          <span>PostgreSQL & Render Ready</span>
        </div>
      </div>
    </footer>
  `;
  const footerEl = document.getElementById('app-footer');
  if (footerEl) footerEl.innerHTML = html;
}

function renderComicCard(comic) {
  const coverUrl = comic.coverImage || '/uploads/covers/default.jpg';
  const slug = comic.slug || comic.id;
  const rating = comic.rating ? Number(comic.rating).toFixed(1) : '4.5';
  const type = comic.type || 'manga';
  const isPrem = !!(comic.is_premium || comic.isPremium);
  const premBadge = isPrem ? '<span class="badge" style="position:absolute; top:8px; right:8px; background:linear-gradient(135deg,#7c3aed,#a855f7); color:#fff; z-index:2; font-size:0.75rem; padding:0.25rem 0.5rem;"><i class="fas fa-crown"></i> Premium</span>' : '';

  return `
    <div class="comic-card">
      <div class="card-thumb" style="position:relative;">
        <span class="badge badge-purple card-badge">${type}</span>
        ${premBadge}
        <div class="card-rating"><i class="fas fa-star"></i> ${rating}</div>
        <a href="/comic.html?slug=${slug}">
          <img src="${coverUrl}" alt="${comic.title}" loading="lazy" />
        </a>
      </div>
      <div class="card-content">
        <h3 class="card-title">
          <a href="/comic.html?slug=${slug}">${comic.title}</a>
        </h3>
        <div class="card-meta">
          <span class="card-chapters">${comic.chapterCount || '3'} Chapters</span>
          <span><i class="fas fa-eye"></i> ${comic.views ? Number(comic.views).toLocaleString() : '0'}</span>
        </div>
      </div>
    </div>
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
