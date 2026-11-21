/** Installs the service worker that keeps the game playable offline (production builds only). */
export const registerOffline = () => {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) {
    return;
  }

  addEventListener('load', () => {
    navigator.serviceWorker.register(import.meta.env.BASE_URL + 'sw.js').catch((e: unknown) => {
      console.warn('Offline mode unavailable:', e);
    });
  });
};
