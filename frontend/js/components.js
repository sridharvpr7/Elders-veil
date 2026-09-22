function renderNavbar(activePage = 'home') {
  const user = Auth.getUser();
  const premiumBadge = user && user.is_premium ? '<span class="premium-badge"><i class="fas fa-crown"></i> Premium</span>' : '';
  const isLoggedIn = Auth.isLoggedIn();
  const isAdmin = Auth.isAdmin();
  const canUpload = !!user;

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
              <button class="user-avatar-btn" id="user-menu-btn">
                <img src="${userAvatar}" class="avatar-img" alt="User" />
                <span style="font-weight:600; font-size:0.9rem;">${user ? user.username : 'Account'}</span>
                <i class="fas fa-chevron-down" style="font-size:0.75rem; color:var(--text-muted);"></i>
              </button>
              <div class="dropdown-menu" id="user-dropdown-menu">
                <a href="/dashboard.html" class="dropdown-item"><i class="fas fa-th-large"></i> Dashboard</a>
                <a href="/bookmarks.html" class="dropdown-item"><i class="fas fa-bookmark"></i> Bookmarks</a>
                <a href="/favorites.html" class="dropdown-item"><i class="fas fa-heart"></i> Favorites</a>
                <a href="/history.html" class="dropdown-item"><i class="fas fa-history"></i> Reading History</a>
                <a href="/profile.html" class="dropdown-item"><i class="fas fa-user-cog"></i> Profile Settings</a>
                ${canUpload ? `<a href="/creator/dashboard.html" class="dropdown-item"><i class="fas fa-pen-nib"></i> Creator Studio</a>` : ''}
                ${isAdmin ? `
                  <a href="/admin/index.html" class="dropdown-item" style="color:var(--accent-purple-light);"><i class="fas fa-user-shield"></i> Admin Portal</a>
                ` : ''}
                <hr style="border-color:var(--glass-border); margin:0.25rem 0;" />
                <button class="dropdown-item danger" id="logout-btn"><i class="fas fa-sign-out-alt"></i> Logout</button>
              </div>
            </div>
          ` : `
            <div style="display:flex; gap:0.75rem;">
              <a href="/login.html" class="btn btn-secondary btn-sm">Sign In</a>
              <a href="/register.html" class="btn btn-primary btn-sm">Register</a>
            </div>
          `}
        </div>
      </div>
    </nav>
  `;

  const headerEl = document.getElementById('app-header');
  if (headerEl) {
    headerEl.innerHTML = html;
    
    // Bind search input Enter key
    const searchInput = document.getElementById('global-search-input');
    if (searchInput) {
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && searchInput.value.trim() !== '') {
          window.location.href = `/search.html?q=${encodeURIComponent(searchInput.value.trim())}`;
        }
      });
    }

    // Bind User Dropdown Toggle
    const menuBtn = document.getElementById('user-menu-btn');
    const dropdownMenu = document.getElementById('user-dropdown-menu');
    if (menuBtn && dropdownMenu) {
      menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownMenu.classList.toggle('show');
      });
      document.addEventListener('click', () => dropdownMenu.classList.remove('show'));
    }

    // Bind Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => Auth.logout());
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

  return `
    <div class="comic-card">
      <div class="card-thumb">
        <span class="badge badge-purple card-badge">${type}</span>
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
