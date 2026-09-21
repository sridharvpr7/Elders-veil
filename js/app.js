/* ==========================================================================
   ComicVerse - Global App Initialization & Event Listeners (js/app.js)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Initialize Theme from LocalStorage or system preference
  const savedTheme = Storage.getTheme();
  Storage.setTheme(savedTheme);

  const themeToggleBtns = document.querySelectorAll('.theme-toggle-btn');
  themeToggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const currentTheme = Storage.getTheme();
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      Storage.setTheme(newTheme);
      UI.showToast(`Switched to ${newTheme} mode`, 'info');
      // Update icons
      updateThemeIcons(newTheme);
    });
  });
  updateThemeIcons(savedTheme);

  // 2. Mobile Menu Hamburger Drawer Toggle
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  const navLinks = document.querySelector('.nav-links');
  if (mobileMenuBtn && navLinks) {
    mobileMenuBtn.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      const icon = mobileMenuBtn.querySelector('i');
      if (icon) {
        icon.className = navLinks.classList.contains('active') ? 'ri-close-line' : 'ri-menu-line';
      }
    });
  }

  // 3. Highlight Active Navigation Link
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // 4. Global Delegate for Floating Favorite Buttons
  document.body.addEventListener('click', (e) => {
    const favBtn = e.target.closest('[data-fav-id]');
    if (favBtn) {
      e.preventDefault();
      e.stopPropagation();
      const comicId = favBtn.getAttribute('data-fav-id');
      const isAdded = Storage.toggleFavorite(comicId);
      
      favBtn.classList.toggle('active', isAdded);
      const icon = favBtn.querySelector('i');
      if (icon) {
        icon.className = isAdded ? 'ri-heart-fill' : 'ri-heart-line';
      }
      
      UI.showToast(isAdded ? 'Added to Favorites' : 'Removed from Favorites', isAdded ? 'success' : 'info');

      // Dispatch custom event for pages that need to re-render (e.g. favorites page)
      window.dispatchEvent(new CustomEvent('favorites-updated', { detail: { comicId, isAdded } }));
    }
  });
});

function updateThemeIcons(theme) {
  document.querySelectorAll('.theme-toggle-btn i').forEach(icon => {
    icon.className = theme === 'dark' ? 'ri-sun-line' : 'ri-moon-line';
  });
}
