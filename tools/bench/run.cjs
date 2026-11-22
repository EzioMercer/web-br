// Plays scripted matches in headless Chromium and records frame, draw-call, DOM and memory stats.
// usage: node run.cjs <url> <outdir> [matches] [preset]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const [url, out, nMatches = '3', preset = 'high'] = process.argv.slice(2);
const init = fs.readFileSync(path.join(__dirname, 'init.js'), 'utf8');

fs.mkdirSync(out, { recursive: true });

const sleep = ms => new Promise(r => setTimeout(r, ms));
const q = (a, p) => {
  const s = [...a].sort((x, y) => x - y);

  return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : 0;
};

(async () => {
  const browser = await chromium.launch({
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--enable-precise-memory-info', '--js-flags=--expose-gc'],
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];

  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => m.type() === 'error' && errors.push(m.text()));
  await page.addInitScript(init);

  const cdp = await page.context().newCDPSession(page);

  await cdp.send('Performance.enable');

  const metrics = async () => {
    const { metrics: m } = await cdp.send('Performance.getMetrics');

    return Object.fromEntries(m.map(x => [x.name, x.value]));
  };
  const gcHeap = async () => {
    await cdp.send('HeapProfiler.collectGarbage');
    await sleep(300);
    return (await metrics()).JSHeapUsedSize;
  };
  const look = (dx, dy = 0) => page.evaluate(([x, y]) => {
    dispatchEvent(new MouseEvent('mousemove', { movementX: x, movementY: y }));
  }, [dx, dy]);

  await page.goto(url + '?seed=7&preset=' + preset);
  await page.waitForSelector('#play');
  await sleep(500);

  const report = { url, preset, matches: [], errors };
  const heapStart = await gcHeap();

  for (let mi = 0; mi < Number(nMatches); mi++) {
    const t0 = Date.now();

    await page.click('#play');
    await sleep(800);

    const gen = Date.now() - t0;

    // fixed views at the spawn, before moving: the same in every build
    for (let k = 0; k < 4; k++) {
      await sleep(250);
      await page.screenshot({ path: path.join(out, `m${mi}-view${k}.png`) });
      await look(748); // 748 px * 0.0021 = ~90 degrees
    }

    const m0 = await metrics();

    await page.evaluate(() => { __bench.frames = []; __bench.cat = {}; __bench.recording = true; });

    const tPlay = Date.now();

    // countdown (bots move), then play: run around, turn, jump, loot, inventory, map, aim and shoot
    if (process.env.PROFILE) { await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 200 }); await cdp.send('Profiler.start'); }
    await page.keyboard.down('KeyW');
    await page.keyboard.down('ShiftLeft');

    for (let step = 0; step < 60; step++) {
      await look(((step * 37) % 11 - 5) * 25, ((step * 13) % 7 - 3) * 6);

      if (step % 6 === 0) {
        await page.keyboard.press('Space');
      }

      if (step % 4 === 0) {
        await page.keyboard.press('KeyE');
      }

      if (step === 15) {
        await page.keyboard.press('Tab');
      }

      if (step === 20) {
        await page.keyboard.press('Tab');
      }

      if (step === 25) {
        await page.keyboard.press('KeyM');
      }

      if (step === 30) {
        await page.keyboard.press('KeyM');
      }

      if (step === 35) {
        await page.keyboard.up('ShiftLeft');
        await page.mouse.down({ button: 'right' });
        await page.mouse.up({ button: 'right' });

        for (let f = 0; f < 6; f++) {
          await page.mouse.down();
          await sleep(60);
          await page.mouse.up();
        }

        await page.mouse.down({ button: 'right' });
        await page.mouse.up({ button: 'right' });
        await page.keyboard.down('ShiftLeft');
      }

      if (step === 45) {
        // full slow turn: look at the whole map from here
        for (let k = 0; k < 12; k++) {
          await look(250);
          await sleep(80);
        }
      }

      await sleep(400);
    }

    await page.keyboard.up('KeyW');
    await page.keyboard.up('ShiftLeft');

    if (process.env.PROFILE) { const { profile } = await cdp.send('Profiler.stop'); fs.writeFileSync(path.join(out, `m${mi}.cpuprofile`), JSON.stringify(profile)); }
    const secs = (Date.now() - tPlay) / 1000;
    const m1 = await metrics();
    const fr = await page.evaluate(() => { __bench.recording = false; return __bench.frames; });
    const gl = await page.evaluate(() => ({
      buffers: __bench.buffers, bufferMB: +(__bench.bufferBytes / 1048576).toFixed(2),
      textures: __bench.textures, programs: __bench.programs,
      threeGeometries: __bench.renderer ? __bench.renderer.info.memory.geometries : null,
      threeTextures: __bench.renderer ? __bench.renderer.info.memory.textures : null,
    }));
    const drawsPerFrameByKind = await page.evaluate((n) => {
      const o = {};

      for (const [k, v] of Object.entries(__bench.cat)) o[k] = +(v / n).toFixed(1);
      __bench.cat = {};
      return o;
    }, fr.length);
    const state = await page.evaluate(() => document.getElementById('pcount').textContent);

    await page.screenshot({ path: path.join(out, `m${mi}-end.png`) });

    // back to the menu
    await page.evaluate(() => document.exitPointerLock());
    await sleep(200);
    await page.click('#tomenu');
    await sleep(300);

    const heap = await gcHeap();
    const nodesAfterGc = (await metrics()).Nodes;
    const cpu = fr.map(f => f[0]);
    const iv = fr.slice(1).map(f => f[1]);
    const mean = a => a.reduce((x, y) => x + y, 0) / (a.length || 1);

    report.matches.push({
      match: mi,
      startMs: gen,
      seconds: +secs.toFixed(1),
      frames: fr.length,
      fps: +(1000 / q(iv, 0.5)).toFixed(1),
      frameMsP50: +q(iv, 0.5).toFixed(1),
      frameMsP95: +q(iv, 0.95).toFixed(1),
      jsMsP50: +q(cpu, 0.5).toFixed(2),
      jsMsP95: +q(cpu, 0.95).toFixed(2),
      drawsAvg: Math.round(mean(fr.map(f => f[2]))),
      drawsMax: Math.max(...fr.map(f => f[2])),
      trisAvgK: Math.round(mean(fr.map(f => f[3])) / 1000),
      trisMaxK: Math.round(Math.max(...fr.map(f => f[3])) / 1000),
      layoutsPerSec: +((m1.LayoutCount - m0.LayoutCount) / secs).toFixed(1),
      styleRecalcsPerSec: +((m1.RecalcStyleCount - m0.RecalcStyleCount) / secs).toFixed(1),
      layoutMsPerSec: +((m1.LayoutDuration - m0.LayoutDuration) * 1000 / secs).toFixed(1),
      styleMsPerSec: +((m1.RecalcStyleDuration - m0.RecalcStyleDuration) * 1000 / secs).toFixed(1),
      scriptMsPerSec: +((m1.ScriptDuration - m0.ScriptDuration) * 1000 / secs).toFixed(1),
      domNodes: m1.Nodes,
      domNodesAfterGc: nodesAfterGc,
      heapAfterGcMB: +(heap / 1048576).toFixed(1),
      heapGrowthMB: +((heap - heapStart) / 1048576).toFixed(1),
      gl,
      drawsPerFrameByKind,
      hud: state,
    });
    console.log(JSON.stringify(report.matches.at(-1)));
  }

  fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2));
  console.log('errors:', errors.length ? errors : 'none');
  await browser.close();
})();
