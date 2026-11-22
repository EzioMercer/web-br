// Renders close-ups of pickups, bots, doors and glass with an extra camera, right after a match starts (paused).
// usage: node closeups.cjs <url> <outdir>
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const [url, out] = process.argv.slice(2);
const init = fs.readFileSync(path.join(__dirname, 'init.js'), 'utf8');

fs.mkdirSync(out, { recursive: true });

(async () => {
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 800, height: 600 } });

  page.on('pageerror', e => console.log('pageerror', String(e)));
  await page.addInitScript(init);
  await page.goto(url + '?seed=7&preset=high');
  await page.waitForSelector('#play');
  await page.click('#play');
  await new Promise(r => setTimeout(r, 300));
  // pause: the simulation stops, so the bots hold still
  await page.evaluate(() => document.exitPointerLock());
  await new Promise(r => setTimeout(r, 500));

  const shots = await page.evaluate(() => {
    const B = window.__bench;
    const scene = B.scene;
    const r = B.renderer;
    const THREE = { };
    const cam = scene.children.find(c => c.isCamera);
    const C = new cam.constructor(50, 800 / 600, 0.05, 1500);
    const res = {};
    const tops = scene.children;
    const pickups = [];
    const bots = [];

    for (const t of tops) {
      let beam = false;
      let sprite = false;

      t.traverse((x) => {
        if (x.geometry && x.geometry.type === 'CylinderGeometry' && x.geometry.parameters.height === 12) beam = true;
        if (x.isSprite) sprite = true;
      });

      if (beam) pickups.push(t);
      else if (sprite && t.isGroup && t.children.length < 10) bots.push(t);
    }

    const shoot = (name, target, off) => {
      const p = target.getWorldPosition(new cam.position.constructor());

      C.position.set(p.x + off[0], p.y + off[1], p.z + off[2]);
      C.lookAt(p.x, p.y + off[3], p.z);
      C.updateMatrixWorld();
      r.render(scene, C);
      res[name] = r.domElement.toDataURL('image/png');
    };

    // pickups sorted by position so both builds pick the same ones
    pickups.sort((a, b) => a.position.x - b.position.x || a.position.z - b.position.z);
    bots.sort((a, b) => a.position.x - b.position.x);

    for (let i = 0; i < pickups.length; i += Math.max(1, Math.floor(pickups.length / 10))) {
      shoot('pickup' + i, pickups[i], [1.6, 1.3, 1.6, 0.6]);
    }

    // each bot alone, in the scene's lights, standing in a neutral pose (they walk in real time, so poses differ)
    const lights = scene.children.filter(c => c.isLight || (c.isObject3D && c.children.some(x => x.isLight) && !c.isCamera));
    const solo = new scene.constructor();

    solo.background = scene.background;

    for (let i = 0; i < Math.min(bots.length, 6); i++) {
      const b = bots[i];
      const saved = { p: b.position.clone(), r: b.rotation.clone(), parent: b.parent };

      b.position.set(0, 0, 0);
      b.rotation.set(0, 0, 0);
      b.traverse((g) => {
        if (g.isGroup && g !== b && Math.abs(g.rotation.z) < 1e-6 && Math.abs(g.rotation.x + 0.3) > 1e-6) {
          g.rotation.x = 0;
        }

        if (g.isGroup && g.parent === b && Math.abs(g.position.x) < 1e-6) g.position.y = 0;
        if (g.isGroup && g.parent === b && Math.abs(Math.abs(g.position.x) - 0.13) < 1e-6) g.position.y = 0.88;
      });

      const ls = lights.map(l => [l, l.parent]);

      for (const [l] of ls) solo.add(l);
      solo.add(b);
      C.position.set(2.2, 1.6, 2.2);
      C.lookAt(0, 1, 0);
      C.updateMatrixWorld();
      r.render(solo, C);
      res['bot' + i] = r.domElement.toDataURL('image/png');

      for (const [l, p] of ls) p.add(l);
      saved.parent.add(b);
      b.position.copy(saved.p);
      b.rotation.copy(saved.r);
    }

    // doors and glass: the map's instanced tiles and meshes, seen from a few town spots
    const spots = [[40, 75], [-25, -55], [138, 152], [240, 245], [300, 30]];

    spots.forEach(([x, z], i) => {
      const y = 0;
      const h = { getWorldPosition: v => v.set(x, 8, z) };

      shoot('town' + i, h, [30, 25, 30, -6]);
    });
    return { res, nP: pickups.length, nB: bots.length };
  });

  for (const [k, v] of Object.entries(shots.res)) {
    fs.writeFileSync(path.join(out, k + '.png'), Buffer.from(v.split(',')[1], 'base64'));
  }

  console.log('pickups', shots.nP, 'bots', shots.nB, 'images', Object.keys(shots.res).length);
  await browser.close();
})();
