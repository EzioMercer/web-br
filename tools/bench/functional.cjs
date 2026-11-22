// Functional checks on the dev server, through the game's own modules: glass breaks, doors swing, pickups go away.
// usage: node functional.cjs <dev-server url> <outdir>
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const [url, out] = process.argv.slice(2);
const init = fs.readFileSync(path.join(__dirname, 'init.js'), 'utf8');

fs.mkdirSync(out, { recursive: true });

(async () => {
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
  const errors = [];

  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => m.type() === 'error' && errors.push(m.text()));
  await page.addInitScript(init);
  await page.goto(url + '?seed=7&preset=high');
  await page.waitForSelector('#play');
  await page.click('#play');
  await new Promise(r => setTimeout(r, 1500));
  await page.evaluate(() => document.exitPointerLock());
  await new Promise(r => setTimeout(r, 300));

  const res = await page.evaluate(async () => {
    const base = '/web-br/src/';
    const { panes, doors } = await import(base + 'world/doors/state.ts');
    const { breakGlass } = await import(base + 'world/doors/breakGlass.ts');
    const { doorsTick } = await import(base + 'world/doors/doorsTick.ts');
    const { castRay } = await import(base + 'physics/castRay.ts');
    const { pickups } = await import(base + 'br/pickups/state.ts');
    const { removePickup } = await import(base + 'br/pickups/removePickup.ts');
    const B = window.__bench;
    const scene = B.scene;
    const r = B.renderer;
    const cam = scene.children.find(c => c.isCamera);
    const C = new cam.constructor(50, 800 / 600, 0.05, 1500);
    const shots = {};
    const look = (name, p, off) => {
      C.position.set(p[0] + off[0], p[1] + off[1], p[2] + off[2]);
      C.lookAt(p[0], p[1], p[2]);
      C.updateMatrixWorld();
      r.render(scene, C);
      shots[name] = r.domElement.toDataURL('image/png');
    };
    const out = {};

    // glass: a pane, seen square on, before and after breaking; a ray through it hits it only before
    const pane = panes.find(p => p.box.max[1] - p.box.min[1] > 1 && (p.box.max[0] - p.box.min[0]) > 1);
    const pc = [0, 1, 2].map(k => (pane.box.min[k] + pane.box.max[k]) / 2);
    const o = [pc[0], pc[1], pc[2] - 3];

    out.rayBefore = +castRay(o, [0, 0, 1], 10).toFixed(2);
    look('glass-before', pc, [0, 0.3, -2.5]);
    breakGlass(pane.box);
    look('glass-after', pc, [0, 0.3, -2.5]);
    out.rayAfter = castRay(o, [0, 0, 1], 10);
    out.paneDisabled = Boolean(pane.box.disabled);

    // door: open it fully, the panel turns and its collision box is off
    const d = doors[0];
    const dc = [d.x, d.y + 1, d.z];

    look('door-closed', dc, [3, 1.5, 3]);
    d.target = 1;

    for (let i = 0; i < 120; i++) {
      d.target = 1;
      doorsTick(1 / 60);
    }

    out.doorOpen = +d.openAmount.toFixed(2);
    out.doorBoxDisabled = Boolean(d.box.disabled);
    look('door-open', dc, [3, 1.5, 3]);

    // pickups: removing one frees its own GPU memory but not what it shares with the gun in hand
    const g0 = r.info.memory.geometries;
    const n0 = pickups.length;

    for (const p of pickups.slice(0, 40)) {
      removePickup(p);
    }

    r.render(scene, cam);
    out.pickupsRemoved = n0 - pickups.length;
    out.geometriesFreed = g0 - r.info.memory.geometries;
    return { out, shots };
  });

  for (const [k, v] of Object.entries(res.shots)) {
    fs.writeFileSync(path.join(out, k + '.png'), Buffer.from(v.split(',')[1], 'base64'));
  }

  // the gun in hand still draws after those pickups were freed
  await page.evaluate(() => document.getElementById('c').requestPointerLock());
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(out, 'gun-after-pickups-freed.png') });
  console.log(JSON.stringify(res.out), 'errors:', errors.length ? errors : 'none');
  await browser.close();
})();
