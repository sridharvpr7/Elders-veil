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
          <a href="${sitePath('index.html')}" class="navbar-logo">
            <i class="fas fa-book-open"></i>
            <span>ELDER'S <span class="text-gradient">VEIL</span></span>
          </a>
          <div class="nav-links">
            <a href="${sitePath('index.html')}" class="nav-link ${activePage === 'home' ? 'active' : ''}" data-i18n="home">Home</a>
            <a href="${sitePath('comics.html')}" class="nav-link ${activePage === 'comics' ? 'active' : ''}" data-i18n="comics">Comics</a>
            <a href="${sitePath('categories.html')}" class="nav-link ${activePage === 'categories' ? 'active' : ''}" data-i18n="genres">Genres</a>
            <a href="${sitePath('popular.html')}" class="nav-link ${activePage === 'popular' ? 'active' : ''}" data-i18n="popular">Popular</a>
            <a href="${sitePath('latest.html')}" class="nav-link ${activePage === 'latest' ? 'active' : ''}" data-i18n="latest">Latest</a>
          </div>
        </div>

        <div class="nav-right">
          <select id="language-select" class="form-select" style="width:auto;min-width:88px;padding:.45rem .65rem" aria-label="Language" title="Language"><option value="en">English</option><option value="ta">தமிழ்</option></select>
          ${premiumBadge}
          <div class="nav-search">
            <i class="fas fa-search"></i>
            <input type="text" id="global-search-input" data-i18n-placeholder="searchPlaceholder" placeholder="Search title, author, genre..." />
          </div>

          ${isLoggedIn ? `
            <div class="user-menu">
              <button class="user-avatar-btn" id="user-menu-btn">
                <img src="${userAvatar}" class="avatar-img" alt="User" />
                <span style="font-weight:600; font-size:0.9rem;">${user ? user.username : 'Account'}</span>
                <i class="fas fa-chevron-down" style="font-size:0.75rem; color:var(--text-muted);"></i>
              </button>
              <div class="dropdown-menu" id="user-dropdown-menu">
                <a href="${sitePath('dashboard.html')}" class="dropdown-item"><i class="fas fa-th-large"></i> <span data-i18n="dashboard">Dashboard</span></a>
                <a href="${sitePath('bookmarks.html')}" class="dropdown-item"><i class="fas fa-bookmark"></i> <span data-i18n="bookmarks">Bookmarks</span></a>
                <a href="${sitePath('favorites.html')}" class="dropdown-item"><i class="fas fa-heart"></i> <span data-i18n="favorites">Favorites</span></a>
                <a href="${sitePath('history.html')}" class="dropdown-item"><i class="fas fa-history"></i> <span data-i18n="history">Reading History</span></a>
                <a href="${sitePath('notifications.html')}" class="dropdown-item"><i class="fas fa-bell"></i> <span data-i18n="notifications">Notifications</span> <span id="nav-unread-count" class="badge badge-pink" style="margin-left:auto">0</span></a>
                <a href="${sitePath('profile.html')}" class="dropdown-item"><i class="fas fa-user-cog"></i> <span data-i18n="profile">Profile Settings</span></a>
                <a href="${sitePath('premium.html')}" class="dropdown-item"><i class="fas fa-crown"></i> <span data-i18n="premium">Premium</span></a>
                ${canCreate ? `<a href="${sitePath('creator/dashboard.html')}" class="dropdown-item"><i class="fas fa-pen-nib"></i> <span data-i18n="creatorStudio">Creator Studio</span></a>` : ''}
                ${canAdminUpload ? `<a href="${sitePath('admin/upload.html')}" class="dropdown-item"><i class="fas fa-cloud-upload-alt"></i> <span data-i18n="uploadComic">Upload Comic</span></a>` : ''}
                ${isAdmin ? `
                  <a href="${sitePath('admin/index.html')}" class="dropdown-item" style="color:var(--accent-purple-light);"><i class="fas fa-user-shield"></i> <span data-i18n="adminPortal">Admin Portal</span></a>
                ` : ''}
                <hr style="border-color:var(--glass-border); margin:0.25rem 0;" />
                <button class="dropdown-item danger" id="logout-btn"><i class="fas fa-sign-out-alt"></i> <span data-i18n="logout">Logout</span></button>
              </div>
            </div>
          ` : `
            <div style="display:flex; gap:0.75rem;">
              <a href="${sitePath('login.html')}" class="btn btn-secondary btn-sm"><span data-i18n="signIn">Sign In</span></a>
              <a href="${sitePath('register.html')}" class="btn btn-primary btn-sm"><span data-i18n="register">Register</span></a>
            </div>
          `}
        </div>
      </div>
    </nav>
  `;

  const headerEl = document.getElementById('app-header');
  if (headerEl) {
    headerEl.innerHTML = html;
    window.I18N?.apply(headerEl);
    const langSelect=document.getElementById('language-select');
    if(langSelect){langSelect.value=window.I18N?.get?.()||'en';langSelect.addEventListener('change',e=>window.I18N?.set?.(e.target.value));}
    
    // Bind search input Enter key
    const searchInput = document.getElementById('global-search-input');
    if (searchInput) {
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && searchInput.value.trim() !== '') {
          window.location.href = `${sitePath('search.html')}?q=${encodeURIComponent(searchInput.value.trim())}`;
        }
      });
      let box=document.getElementById('global-search-suggestions'); if(!box){box=document.createElement('div');box.id='global-search-suggestions';box.className='search-suggestions';searchInput.parentElement?.appendChild(box);}
      searchInput.addEventListener('input',()=>{clearTimeout(window.evSuggestTimer);const q=searchInput.value.trim();if(q.length<2){box.innerHTML='';box.style.display='none';return;}window.evSuggestTimer=setTimeout(async()=>{try{const r=await API.get('/comics/suggestions?q='+encodeURIComponent(q));box.innerHTML=(r.suggestions||[]).map(x=>`<a href="${sitePath('comic.html')}?slug=${encodeURIComponent(x.slug)}"><img src="${x.coverImage||''}"><span>${String(x.title).replace(/[<>]/g,'')}</span></a>`).join('');box.style.display=box.innerHTML?'block':'none';}catch(_e){box.style.display='none'}},220)});document.addEventListener('click',e=>{if(!searchInput.contains(e.target)&&!box.contains(e.target))box.style.display='none'});
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
            <p>The ultimate reading destination for Manga, Manhwa, and Manhua comics.</p>
          </div>
          <div class="footer-column">
            <h4 data-i18n="discovery">Discovery</h4>
            <div class="footer-links">
              <a href="${sitePath('comics.html')}" data-i18n="allComics">All Comics</a>
              <a href="${sitePath('categories.html')}" data-i18n="browseGenres">Browse Genres</a>
              <a href="${sitePath('popular.html')}" data-i18n="mostPopular">Most Popular</a>
              <a href="${sitePath('latest.html')}" data-i18n="latestReleases">Latest Releases</a>
            </div>
          </div>
          <div class="footer-column">
            <h4 data-i18n="account">User Account</h4>
            <div class="footer-links">
              <a href="${sitePath('login.html')}"><span data-i18n="signIn">Sign In</span></a>
              <a href="${sitePath('register.html')}" data-i18n="register">Create Account</a>
              <a href="${sitePath('bookmarks.html')}">My <span data-i18n="bookmarks">Bookmarks</span></a>
              <a href="${sitePath('history.html')}" data-i18n="readingProgress">Reading Progress</a>
            </div>
          </div>
          <div class="footer-column">
            <h4 data-i18n="platform">Platform</h4>
            <div class="footer-links">
              <a href="${sitePath('admin/index.html')}"><span data-i18n="adminPortal">Admin Portal</span></a>
              <a href="${sitePath('support.html')}" data-i18n="support">Support</a><a href="${sitePath('privacy.html')}" data-i18n="privacy">Privacy Policy</a>
              <a href="${sitePath('terms.html')}" data-i18n="terms">Terms of Service</a>
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
  if (footerEl) { footerEl.innerHTML = html; window.I18N?.apply(footerEl); }
}

function renderComicCard(comic) {
  const esc=v=>String(v??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
  const coverUrl = comic.coverImage || sitePath('uploads/covers/default.jpg');
  const slug = comic.slug || comic.id;
  const rating = comic.rating ? Number(comic.rating).toFixed(1) : '4.5';
  const type = comic.type || 'manga';

  return `
    <div class="comic-card">
      <div class="card-thumb">
        <span class="badge badge-purple card-badge">${esc(type)}</span>
        <div class="card-rating"><i class="fas fa-star"></i> ${rating}</div>
        <a href="${sitePath('comic.html')}?slug=${slug}">
          <img src="${coverUrl}" alt="${esc(comic.title)}" loading="lazy" />
        </a>
      </div>
      <div class="card-content">
        <h3 class="card-title">
          <a href="${sitePath('comic.html')}?slug=${slug}">${esc(comic.title)}</a>
        </h3>
        <div class="card-meta">
          <span class="card-chapters">${comic.chapterCount || '0'} Chapters</span>
          <span><i class="fas fa-eye"></i> ${comic.views ? Number(comic.views).toLocaleString() : '0'}</span>
        </div>
        <div style="display:flex;gap:.35rem;flex-wrap:wrap;margin-top:.45rem">
          <span class="status-chip status-${esc(comic.status||'ongoing')}">${esc(comic.status||'ongoing')}</span>
          ${comic.language?`<span class="badge badge-cyan">${esc(comic.language)}</span>`:''}
        </div>
        <div style="margin-top:.5rem;font-size:.8rem"><a href="${sitePath('creator.html')}?id=${encodeURIComponent(comic.creatorId||'')}">✍️ <span data-i18n="creator">Creator</span></a></div>
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


document.addEventListener('DOMContentLoaded',()=>{if(!Auth.isLoggedIn())return;const refresh=async()=>{try{const r=await API.get('/notifications');const n=(r.notifications||[]).filter(x=>!x.read).length;document.querySelectorAll('#nav-unread-count').forEach(el=>{el.textContent=n;el.style.display=n?'inline-flex':'none';});}catch(_e){}};refresh();setInterval(refresh,20000);});
