(function () {
  const STORAGE_KEY = 'elder-veil-theme';

  function getPreferredTheme() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches
      ? 'light'
      : 'dark';
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const user = (() => { try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch(e) { return null; } })();
    const premiumActive=!!(user&&user.is_premium&&(!user.premium_expires_at||new Date(user.premium_expires_at).getTime()>Date.now()));
    const premiumExpired=!!(user&&user.premium_expires_at&&new Date(user.premium_expires_at).getTime()<=Date.now());
    document.documentElement.classList.toggle('premium-theme',premiumActive);
    document.documentElement.classList.toggle('premium-expired',premiumExpired);
    localStorage.setItem(STORAGE_KEY, theme);
  }

  // Apply before the page paints to avoid a theme flash.
  applyTheme(getPreferredTheme());
  // Re-check expiry while a tab remains open so the red expired state appears automatically.
  setInterval(() => applyTheme(document.documentElement.getAttribute('data-theme') || getPreferredTheme()), 60 * 1000);

  function addToggle() {
    if (document.getElementById('theme-toggle')) return;

    const button = document.createElement('button');
    button.id = 'theme-toggle';
    button.className = 'theme-toggle';
    button.type = 'button';
    button.setAttribute('aria-label', 'Switch theme');
    button.setAttribute('title', 'Switch theme');

    function updateIcon() {
      const light = document.documentElement.getAttribute('data-theme') === 'light';
      button.innerHTML = light
        ? '<i class="fas fa-moon"></i>'
        : '<i class="fas fa-sun"></i>';
      button.setAttribute('aria-label', light ? 'Switch to dark theme' : 'Switch to light theme');
      button.setAttribute('title', light ? 'Switch to dark theme' : 'Switch to light theme');
    }

    button.addEventListener('click', () => {
      const next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      applyTheme(next);
      updateIcon();
    });

    document.body.appendChild(button);
    updateIcon();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addToggle);
  } else {
    addToggle();
  }
})();
