import { input } from '../input/state';
import { offline } from './state';

/** Installs the service worker that keeps the game playable offline (production builds only). */
export const registerOffline = () => {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) {
    return;
  }

  // a page already run by an older service worker: when a new one takes over, this page is the old version
  const hadWorker = Boolean(navigator.serviceWorker.controller);

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadWorker) {
      return;
    }

    offline.updateReady = true;

    // in the menu nothing is lost; during a match, showMenu reloads once the player is back in the menu
    if (input.inMenu) {
      location.reload();
    }
  });

  addEventListener('load', () => {
    navigator.serviceWorker.register(import.meta.env.BASE_URL + 'sw.js').catch((e: unknown) => {
      console.warn('Offline mode unavailable:', e);
    });
  });
};
