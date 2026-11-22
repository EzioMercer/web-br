// Offline test: first visit online, then the server is stopped and the page reloaded; the game must still start.
// Serves dist/ with `vite preview`, so run `npm run build` first.  usage: node offline.cjs <outdir>
const { chromium } = require('playwright');
const { spawn, execSync } = require('child_process');
const path = require('path');
const out = process.argv[2];

require('fs').mkdirSync(out, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const serve = () => spawn('npx', ['vite', 'preview', '--port', '4190', '--strictPort'], { cwd: path.resolve(__dirname, '../..'), stdio: 'ignore', detached: true });

(async () => {
  let srv = serve();

  await sleep(2500);
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await ctx.newPage();
  const errors = [];

  page.on('pageerror', e => errors.push(String(e)));
  await page.addInitScript(() => {
    let locked = null;

    Object.defineProperty(Document.prototype, 'pointerLockElement', { get: () => locked, configurable: true });
    Element.prototype.requestPointerLock = function () { locked = this; setTimeout(() => document.dispatchEvent(new Event('pointerlockchange'))); return Promise.resolve(); };
  });
  await page.goto('http://localhost:4190/web-br/');
  const first = await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.ready;
    const keys = await caches.keys();
    const counts = {};

    for (const k of keys) counts[k] = (await (await caches.open(k)).keys()).length;
    return { scope: reg.scope, caches: counts };
  });

  process.kill(-srv.pid);
  await sleep(1000);
  let reachable = true;

  try { execSync('curl -s -m 2 http://localhost:4190/web-br/ >/dev/null'); } catch { reachable = false; }

  // with the server down
  await page.reload();
  await page.waitForSelector('#play', { timeout: 10000 });
  const fontOk = await page.evaluate(async () => { await document.fonts.ready; return document.fonts.check('700 20px Rajdhani'); });
  await page.click('#play');
  await sleep(4000);
  await page.screenshot({ path: path.join(out, 'offline-game.png') });
  const hud = await page.textContent('#pcount');

  // a fresh tab, still offline
  const p2 = await ctx.newPage();

  await p2.goto('http://localhost:4190/web-br/');
  const p2ok = await p2.isVisible('#play');

  console.log(JSON.stringify({ first, serverReachable: reachable, offlineHud: hud, fontOk, newTabOffline: p2ok, errors }));
  await browser.close();
})();
