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
  // INSTALL PROMPT
  // =========================
  let deferredPrompt = null;

  window.addEventListener(
    'beforeinstallprompt',
    (event) => {

      console.log('🔥 beforeinstallprompt fired');

      event.preventDefault();

      deferredPrompt = event;

      const button =
        document.getElementById('install-app-btn');

      if (button) {
        button.style.display = 'inline-flex';
        button.disabled = false;

        console.log('✅ Install button ready');
      }
    }
  );


  // =========================
  // INSTALL BUTTON
  // =========================
  document.addEventListener(
    'click',
    async (event) => {

      const button =
        event.target.closest('#install-app-btn');

      if (!button) return;

      console.log('📱 Install button clicked');

      // If Chrome has not provided the prompt
      if (!deferredPrompt) {

        console.log(
          '⚠️ Install prompt is not available'
        );

        alert(
          'Install option is not available yet. ' +
          'Open this website in Chrome and check PWA installation.'
        );

        return;
      }

      try {

        deferredPrompt.prompt();

        const result =
          await deferredPrompt.userChoice;

        console.log(
          'Install result:',
          result.outcome
        );

        deferredPrompt = null;

        button.style.display = 'none';

      } catch (error) {

        console.error(
          '❌ Install error:',
          error
        );

      }

    }
  );


  // =========================
  // APP INSTALLED
  // =========================
  window.addEventListener(
    'appinstalled',
    () => {

      console.log(
        '🎉 Elders Veil installed!'
      );

      deferredPrompt = null;

      const button =
        document.getElementById('install-app-btn');

      if (button) {
        button.style.display = 'none';
      }
    }
  );


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