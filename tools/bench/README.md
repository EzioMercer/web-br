# Benchmarks and browser checks

Playwright scripts that play the game in headless Chromium with software WebGL (SwiftShader), so they run on any
machine, including CI containers without a GPU. Absolute frame rates are far below a real GPU. Compare runs with
each other (before and after a change), not with real hardware.

Playwright is not a project dependency. Use a global install, or `npm i -D playwright` locally and don't commit it.

`init.js` is injected before the game loads. It:
- seeds `Math.random` (`?seed=`), so runs are repeatable
- sets the graphics preset (`?preset=low|medium|high`)
- fakes pointer lock
- counts draw calls, triangles, GPU buffers, textures and shader programs per frame
- splits draws by kind (terrain, boxes, doors, bots, pickups...) through three.js's devtools hook

Results are in `window.__bench`.

| Script | Server | What it does |
| --- | --- | --- |
| `run.cjs <url> <out> [matches] [preset]` | dev or preview | Plays several scripted matches (run, jump, loot, inventory, map, shoot, full turn). Reports FPS, JS time, draws, triangles, layouts and style recalcs per second, heap after GC, and GPU objects, plus screenshots. Use it before and after a change. |
| `longplay.cjs <url> <out> [minutes] [preset]` | dev | One long match that stays inside the zone. Every 20 s it samples what could build up (heap, GPU objects, scene objects, canvas size, zone, pickups, effects). Use it for "it gets worse over time". |
| `firefight.cjs <url> <out> [seconds]` | dev | Every bot around the player, firing. JS time per frame plus a CPU profile (`.cpuprofile`, open it in Chrome DevTools). |
| `closeups.cjs <url> <out>` | dev or preview | Close-up renders of pickups, bots, doors and glass. Pixel-diff them between builds to prove a rendering refactor changed nothing. |
| `functional.cjs <url> <out>` | dev | Glass breaks, doors swing, pickups disappear when taken. |
| `offline.cjs <out>` | runs its own `vite preview` | First visit online, then the server stops: the game must still load and start. Run `npm run build` first. |

The dev server URL is `http://localhost:5173/web-br/` (`npm run dev`). Scripts marked "dev" import game modules
from `/web-br/src/...`, which only the dev server serves. Don't edit `src/` while a script runs on the dev server:
Vite reloads the page.

Example:

```bash
npm run dev &
node tools/bench/run.cjs http://localhost:5173/web-br/ /tmp/bench/before 3 high
```
