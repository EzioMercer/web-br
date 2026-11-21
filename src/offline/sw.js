// Service worker: keeps the game's files in the browser's cache, so it starts even with no connection.
// The build fills MANIFEST with the files of that build (see the offline plugin in vite.config.ts).

const MANIFEST = { version: 'dev', files: [] };

/** This build's files. A new build gets a new cache, and the old one is deleted once it takes over. */
const CACHE = 'web-br-' + MANIFEST.version;

/** Fonts from Google Fonts: kept across builds. */
const FONTS = 'web-br-fonts';

const FONT_CSS = 'https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&display=swap';

const scoped = f => new URL(f, self.registration.scope).href;

/** Caches the font stylesheet and the font files it points to; offline without them, the game uses a system font. */
const cacheFonts = async () => {
  const cache = await caches.open(FONTS);
  const css = await fetch(FONT_CSS);

  if (!css.ok) {
    return;
  }

  await cache.put(FONT_CSS, css.clone());

  const urls = [...(await css.text()).matchAll(/url\((https:[^)]+)\)/g)].map(m => m[1]);

  await Promise.all(urls.map(async (u) => {
    const r = await fetch(u);

    if (r.ok) {
      await cache.put(u, r);
    }
  }));
};

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);

    // fresh from the network, not from the browser's HTTP cache
    await cache.addAll(MANIFEST.files.map(f => new Request(scoped(f), { cache: 'reload' })));
    await cacheFonts().catch(() => {});
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) {
      if (k.startsWith('web-br-') && k !== CACHE && k !== FONTS) {
        await caches.delete(k);
      }
    }

    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;

  if (req.method !== 'GET') {
    return;
  }

  const url = new URL(req.url);

  // the page: from the server when online, so a new version arrives; from the cache when offline. 'no-cache' asks the
  // server every time: the host lets browsers reuse the page for 10 minutes, which would bring back the old version
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      try {
        const r = await fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' });

        // a navigation can't be answered with a followed redirect: send the browser there instead
        return r.redirected ? Response.redirect(r.url, 302) : r;
      } catch {
        return (await caches.match(scoped('index.html'), { ignoreVary: true })) || Response.error();
      }
    })());
    return;
  }

  // fonts: from the cache, refreshed in the background
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith((async () => {
      const cache = await caches.open(FONTS);
      const hit = await cache.match(req, { ignoreVary: true });
      const fresh = fetch(req).then((r) => {
        if (r.ok) {
          cache.put(req, r.clone());
        }

        return r;
      });

      return hit || fresh;
    })());
    return;
  }

  // the game's files (their names change with every build): from the cache, else from the network
  if (url.origin === self.location.origin) {
    // (ignoring Vary: the page asks for scripts with headers the cached copies were not fetched with)
    e.respondWith((async () => (await caches.match(req, { ignoreVary: true })) || fetch(req))());
  }
});
