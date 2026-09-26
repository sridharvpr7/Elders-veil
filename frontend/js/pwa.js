(function () {

  const sp = window.sitePath || ((p) => {
    const parts = location.pathname.split('/').filter(Boolean);

    const base =
      location.hostname.endsWith('github.io') && parts.length
        ? `/${parts[0]}/`
        : '/';

    return base + String(p).replace(/^\/+/, '');
  });

  // =========================
  // SERVICE WORKER
  // =========================
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const registration =
          await navigator.serviceWorker.register(
            sp('service-worker.js')
          );

        console.log(
          '✅ PWA Service Worker:',
          registration.scope
        );

      } catch (error) {
        console.error(
          '❌ Service Worker Error:',
          error
        );
      }
    });
  }


  // =========================
  // INSTALL UI: BROWSER ONLY
  // =========================
  const installButton = () =>
    document.getElementById('install-app-btn');

  const isRunningAsApp = () => {
    // Android / desktop installed PWA
    const standalone = window.matchMedia &&
      window.matchMedia('(display-mode: standalone)').matches;

    // iOS Safari installed PWA
    const iosStandalone = window.navigator.standalone === true;

    return standalone || iosStandalone;
  };

  const hideInstallButton = () => {
    const button = installButton();
    if (button) {
      button.style.display = 'none';
      button.disabled = true;
    }
  };

  // Never show an install button inside the installed app.
  if (isRunningAsApp()) {
    hideInstallButton();
  }

  // =========================
  // INSTALL PROMPT
  // =========================
  let deferredPrompt = null;

  window.addEventListener('beforeinstallprompt', (event) => {
    console.log('🔥 beforeinstallprompt fired');

    // If already running as an installed app, do not show install UI.
    if (isRunningAsApp()) {
      hideInstallButton();
      return;
    }

    event.preventDefault();
    deferredPrompt = event;

    const button = installButton();

    if (button) {
      button.style.display = 'inline-flex';
      button.disabled = false;
      console.log('✅ Install button ready (browser)');
    }
  });

  // =========================
  // INSTALL BUTTON
  // =========================
  document.addEventListener('click', async (event) => {
    const button = event.target.closest('#install-app-btn');

    if (!button) return;

    // Extra protection: never allow install UI inside the app.
    if (isRunningAsApp()) {
      hideInstallButton();
      return;
    }

    console.log('📱 Install button clicked');

    if (!deferredPrompt) {
      console.log('⚠️ Install prompt is not available');
      return;
    }

    try {
      deferredPrompt.prompt();

      const result = await deferredPrompt.userChoice;
      console.log('Install result:', result.outcome);

      deferredPrompt = null;
      hideInstallButton();
    } catch (error) {
      console.error('❌ Install error:', error);
    }
  });

  // =========================
  // APP INSTALLED
  // =========================
  window.addEventListener('appinstalled', () => {
    console.log('🎉 Elders Veil installed!');
    deferredPrompt = null;
    hideInstallButton();
  });

  // =========================
  // ANALYTICS
  // =========================
  window.EVTrack = async function (
    eventType,
    data = {}
  ) {

    try {

      const base =
        window.API?.baseUrl
          ? window.API.baseUrl()
          : (
              document.querySelector(
                'meta[name="api-base-url"]'
              )?.content || '/api'
            );

      await fetch(
        base + '/features/analytics',
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json'
          },

          body: JSON.stringify({
            eventType,
            path: location.pathname,
            comicId: data.comicId,
            chapterId: data.chapterId,
            metadata: data.metadata || {}
          })
        }
      );

    } catch (error) {
      console.log('Analytics skipped');
    }

  };

})();