// Firefight stress test on the dev server: all bots around the player, firing; the player can't die.
// Records JS time per frame, draw calls and a CPU profile.  usage: node firefight.cjs <url> <out> [seconds]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const [url, out, secs = '20'] = process.argv.slice(2);
const init = fs.readFileSync(path.join(__dirname, 'init.js'), 'utf8');

fs.mkdirSync(out, { recursive: true });
(async () => {
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];

  page.on('pageerror', e => errors.push(String(e)));
  await page.addInitScript(init);
  await page.goto(url + '?seed=7&preset=low');
  await page.click('#play');
  await new Promise(r => setTimeout(r, 6500));
  const setup = await page.evaluate(async () => {
    const base = '/web-br/src/';
    const { bots } = await import(base + 'bots/state.ts');
    const { player, playerBody } = await import(base + 'player/state.ts');
    const { floorY } = await import(base + 'world/level/floorY.ts');
    const { isFreeSpot } = await import(base + 'physics/isFreeSpot.ts');
    let placed = 0;

    bots.forEach((b, i) => {
      for (let k = 0; k < 40; k++) {
        const a = i / bots.length * 6.283 + k * 0.3;
        const r = 10 + (i % 4) * 4 + k * 0.5;
        const x = playerBody.x + Math.cos(a) * r;
        const z = playerBody.z + Math.sin(a) * r;

        if (isFreeSpot(x, z)) {
          b.x = x; b.z = z; b.y = floorY(x, z); b.alert = 5; placed++;
          break;
        }
      }
    });
    window.__keepAlive = setInterval(() => { player.health = 100; player.armor = 100; }, 100);
    return placed;
  });
  const cdp = await page.context().newCDPSession(page);

  await cdp.send('Profiler.enable');
  await cdp.send('Profiler.setSamplingInterval', { interval: 200 });
  await page.evaluate(() => { __bench.frames = []; __bench.cat = {}; __bench.recording = true; });
  await cdp.send('Profiler.start');
  await new Promise(r => setTimeout(r, Number(secs) * 1000));
  const { profile } = await cdp.send('Profiler.stop');
  const fr = await page.evaluate(() => { __bench.recording = false; return __bench.frames; });
  const shots = await page.evaluate(() => document.querySelectorAll('#kf div').length);

  fs.writeFileSync(path.join(out, 'firefight.cpuprofile'), JSON.stringify(profile));
  await page.screenshot({ path: path.join(out, 'firefight.png') });
  const q = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
  const cpu = fr.map(f => f[0]);
  console.log(JSON.stringify({
    placed: setup, frames: fr.length,
    jsMsP50: +q(cpu, 0.5).toFixed(2), jsMsP95: +q(cpu, 0.95).toFixed(2), jsMsMax: +Math.max(...cpu).toFixed(1),
    drawsAvg: Math.round(fr.reduce((s, f) => s + f[2], 0) / fr.length), errors,
  }));
  await browser.close();
})();
