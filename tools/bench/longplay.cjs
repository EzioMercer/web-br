// One long match on the dev server: the player runs, turns and shoots, can't die; every SAMPLE seconds records
// what can build up over time (heap, GPU objects, scene objects, draw calls, frame times, canvas size, zone).
// usage: node longplay.cjs <url> <out> [minutes] [preset]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const [url, out, mins = '7', preset = 'low'] = process.argv.slice(2);
const init = fs.readFileSync(path.join(__dirname, 'init.js'), 'utf8');
const SAMPLE = 20;

fs.mkdirSync(out, { recursive: true });

const sleep = ms => new Promise(r => setTimeout(r, ms));
const q = (a, p) => {
  const s = [...a].sort((x, y) => x - y);

  return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : 0;
};

(async () => {
  const browser = await chromium.launch({
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--enable-precise-memory-info'],
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];

  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => m.type() === 'error' && errors.push(m.text()));
  await page.addInitScript(init);
  await page.goto(url + '?seed=7&preset=' + preset);
  await page.waitForSelector('#play');
  await sleep(500);
  await page.click('#play');
  await sleep(1500);

  await page.evaluate(async () => {
    const base = '/web-br/src/';
    const m = async n => import(base + n);
    const { player, playerBody } = await m('player/state.ts');
    const { isFreeSpot } = await m('physics/isFreeSpot.ts');
    const { floorY } = await m('world/level/floorY.ts');
    const { zone } = await m('br/zone/state.ts');

    // keep inside the zone, as a real player would: back to a free spot near its centre when outside
    setInterval(() => {
      if (Math.hypot(playerBody.x - zone.cx, playerBody.z - zone.cz) < zone.radius * 0.7) return;
      for (let k = 0; k < 200; k++) {
        const a = k * 2.4;
        const r = 5 + k * 0.6;
        const x = zone.cx + Math.cos(a) * r;
        const z = zone.cz + Math.sin(a) * r;

        if (isFreeSpot(x, z)) { playerBody.x = x; playerBody.z = z; playerBody.y = floorY(x, z) + 0.1; break; }
      }
    }, 3000);

    window.__m = {
      player,
      bots: (await m('bots/state.ts')).bots,
      pickups: (await m('br/pickups/state.ts')).pickups,
      fx: await m('effects/state.ts'),
      gr: await m('grenades/state.ts'),
      doors: await m('world/doors/state.ts'),
      zone: await m('br/zone/state.ts'),
      clock: (await m('sim/state.ts')).clock,
      graphics: (await m('graphics/state.ts')).graphics,
      scene: (await m('render/scene.ts')).scene,
    };
    setInterval(() => { player.health = 100; player.armor = 100; }, 100);

    // canvas resizes, which can flash the screen
    window.__resizes = 0;
    const c = document.querySelector('canvas');

    new ResizeObserver(() => window.__resizes++).observe(c);
    const ow = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, 'width');

    window.__canvasSets = 0;
    Object.defineProperty(c, 'width', {
      get() { return ow.get.call(this); },
      set(v) { if (v !== ow.get.call(this)) window.__canvasSets++; ow.set.call(this, v); },
    });
  });

  const sample = () => page.evaluate(() => {
    const M = window.__m;
    const r = __bench.renderer;
    let objects = 0;
    let visible = 0;
    let transparent = 0;
    let lights = 0;

    M.scene.traverse((o) => {
      objects++;
      if (o.visible) visible++;
      if (o.isLight) lights++;
      if (o.material && !Array.isArray(o.material) && o.material.transparent && o.visible) transparent++;
    });

    const fr = __bench.frames;

    __bench.frames = [];
    return {
      t: Math.round(M.clock.time),
      heapMB: +(performance.memory.usedJSHeapSize / 1048576).toFixed(1),
      glBuffers: __bench.buffers,
      glBufferMB: +(__bench.bufferBytes / 1048576).toFixed(1),
      glTextures: __bench.textures,
      glPrograms: __bench.programs,
      threeGeo: r.info.memory.geometries,
      threeTex: r.info.memory.textures,
      objects, visible, transparent, lights,
      dom: document.getElementsByTagName('*').length,
      kf: document.querySelectorAll('#kf > *').length,
      canvas: r.domElement.width + 'x' + r.domElement.height + '@' + r.getPixelRatio(),
      canvasSets: window.__canvasSets,
      resizes: window.__resizes,
      tier: M.graphics.autoTier,
      zoneR: Math.round(M.zone.zone.radius),
      alive: M.bots.filter(b => b.health > 0).length,
      corpses: M.bots.filter(b => b.corpse).length,
      pickups: M.pickups.length,
      fx: M.fx.transientFx.length, ripples: M.fx.ripples.length, shards: M.doors.shards.length,
      smokes: M.gr.smokes.length, grenades: M.gr.flyingGrenades.length,
      frames: fr.length,
      jsP50: fr.length ? +[...fr].map(f => f[0]).sort((a, b) => a - b)[fr.length >> 1].toFixed(1) : 0,
      jsMax: fr.length ? +Math.max(...fr.map(f => f[0])).toFixed(1) : 0,
      drawsAvg: fr.length ? Math.round(fr.reduce((s, f) => s + f[2], 0) / fr.length) : 0,
      trisK: fr.length ? Math.round(fr.reduce((s, f) => s + f[3], 0) / fr.length / 1000) : 0,
    };
  });

  await page.evaluate(() => { __bench.frames = []; __bench.recording = true; });

  const rows = [];
  const t0 = Date.now();
  let next = t0;
  let step = 0;

  await page.keyboard.down('KeyW');

  while (Date.now() - t0 < Number(mins) * 60000) {
    if (Date.now() >= next) {
      const s = await sample();

      s.real = Math.round((Date.now() - t0) / 1000);
      rows.push(s);
      console.log(JSON.stringify(s));
      await page.screenshot({ path: path.join(out, `s${String(rows.length).padStart(2, '0')}.png`) });
      next += SAMPLE * 1000;
    }

    // run, turn, jump, shoot; go back toward the zone centre now and then
    step++;
    await page.evaluate(([x, y]) => dispatchEvent(new MouseEvent('mousemove', { movementX: x, movementY: y })),
      [((step * 37) % 11 - 5) * 30, ((step * 13) % 7 - 3) * 4]);
    if (step % 5 === 0) await page.keyboard.press('Space');
    if (step % 3 === 0) { await page.mouse.down(); await sleep(150); await page.mouse.up(); }
    await sleep(350);
  }

  await page.keyboard.up('KeyW');
  fs.writeFileSync(path.join(out, 'rows.json'), JSON.stringify(rows, null, 1));
  console.log('errors:', errors.length ? errors.slice(0, 5) : 'none');
  await browser.close();
})();
