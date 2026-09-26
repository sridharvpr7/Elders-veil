(function () {

  const sp = window.sitePath || ((p) => {
    const parts = location.pathname.split('/').filter(Boolean);

    const base =
      location.hostname.endsWith('github.io') && parts.length
        ? `/${parts[0]}/`
        : '/';

    return base + String(p).replace(/^\/+/, '');
  });

  // ================================
  // SERVICE WORKER
  // ================================
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {

      navigator.serviceWorker
        .register(sp('service-worker.js'))
        .then((registration) => {
          console.log(
            'Elders Veil PWA ready:',
            registration.scope
          );
        })
        .catch((error) => {
          console.error(
            'PWA registration failed:',
            error
          );
        });

    });
  }


  // ================================
  // INSTALL APP
  // ================================
  let deferredPrompt = null;

  window.addEventListener(
    'beforeinstallprompt',
    (event) => {

      // Prevent Chrome from showing its automatic prompt
      event.preventDefault();

      // Save event for later
      deferredPrompt = event;

      const installButton =
        document.getElementById('install-app-btn');

      if (installButton) {
        installButton.style.display = 'inline-flex';

        console.log(
          'Elders Veil install button available'
        );
      }
    }
  );


  // ================================
  // INSTALL BUTTON CLICK
  // ================================
  document.addEventListener(
    'click',
    async (event) => {

      const button =
        event.target.closest('#install-app-btn');

      if (!button || !deferredPrompt) {
        return;
      }

      // Show browser install popup
      deferredPrompt.prompt();

      // Wait for user choice
      const { outcome } =
        await deferredPrompt.userChoice;

      console.log(
        'PWA install result:',
        outcome
      );

      // Prompt can only be used once
      deferredPrompt = null;

      // Hide button after prompt
      button.style.display = 'none';
    }
  );


  // ================================
  // APP INSTALLED
  // ================================
  window.addEventListener(
    'appinstalled',
    () => {

      console.log(
        'Elders Veil installed successfully!'
      );

      deferredPrompt = null;

      const installButton =
        document.getElementById('install-app-btn');

      if (installButton) {
        installButton.style.display = 'none';
      }
    }
  );


  // ================================
  // ANALYTICS
  // ================================
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

    } catch (_e) {
      // Analytics failure should never break the app
    }

  };

})();