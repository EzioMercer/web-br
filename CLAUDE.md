# web-br: notes for working on this project

A browser Battle Royale: TypeScript, three.js r187 and Vite, with no UI framework. Deployed to GitHub Pages under
`/web-br/` and playable offline through a service worker. `README.md` has the player-facing side (controls,
balance, TODO) and the folder map under *Code layout*. This file is the working guide: where things are, what to
reuse, and the rules that keep the game fast.

## Commands

- `npm run dev`: dev server at http://localhost:5173/web-br/. Editing a file under `src/` reloads the page, which
  also breaks a browser test running against it, so don't edit `src/` while a measurement runs.
- `npm run build`: typecheck, then the production build in `dist/` (with `sw.js`).
- `npm run lint` and `npm run typecheck`. The pre-commit hook runs lint-staged (eslint --fix) and the typecheck.

## Conventions

- **One exported function per file**, named like the file: `physics/castRay.ts` exports `castRay`. Shared mutable
  values live in a `state.ts` per folder, types in `types.ts`, and fixed tables in `constants.ts` or `src/data/`.
- Folders are by feature (`bots/`, `combat/`, `world/`...). Code used by several features goes in `utils/`:
  `utils/dom/` for the DOM, `utils/three/` for three.js.
- Doc comments explain *why*. Lines are at most 120 characters; ESLint enforces blank lines around blocks.
- **Before writing a helper, check `utils/` and the kits listed below.** When the same code shows up a second time,
  move it into `utils/` rather than copying it.
- Refactors must not change behaviour. Check them with a seeded run (`tools/bench`) or a pixel comparison.
- Keep the README's *Code layout* in sync when adding a folder.

## Where things are

**Per frame:** `loop/frame.ts` runs the frame rate limit, then the fixed-step simulation (`sim/tick.ts` at
`SIM_STEP` = 1/120 s), then the camera, viewmodel, effects and HUD, then `render/renderView.ts` (world, then the
gun in its own pass). The match flow is in `match/`, with zone timing in `br/zone/constants.ts`.

**UI:** all markup is in `index.html` (HUD, menu, settings dialog), with styles in `src/style.css`.
- Look elements up with `utils/byId`.
- Anything written every frame goes through `utils/dom/writeDom`, which writes only on change.
- Rows of option buttons (`.seg` with `.dbtn`): `utils/dom/optionButtons` fills a row, and `utils/dom/markOption`
  marks the selected button.
- A new setting touches five places:
  - the default in `settings/state.ts`
  - a key in `settings/loadSettings.ts` and `settings/saveSettings.ts`
  - a row in `index.html`
  - its wiring in `menu/setupGraphicsTab.ts` (or `menu/setup.ts`)
  - its display in `menu/showGraphicsOptions.ts`

**three.js helpers** (`utils/three/`):
- `boxMesh`, `cylinderMesh` and `lambert` make simple parts.
- `mergeMeshes(root, deep)` turns a model of many parts into a few draw calls.
- `labelSprite` makes a text label above an object; draw on it with `utils/drawOutlinedText`.
- `keep` marks resources as shared, and `disposeObject` frees the rest.
- `render/srgbTex` sets the colour space of canvas textures.

**Pooled effects:** `effects/tracer` and `effects/bulletMark`. Use or extend a pool rather than making a mesh per
shot.

**Graphics settings:** `graphics/`.
- Presets and tiers are in `tiers.ts`, applied by `applyGraphics`.
- `detectTier` chooses the Auto tier, and `autoTune` only ever steps it down during a match.
- Switching antialiasing makes a new renderer and canvas (`render/glCanvas`), so always read the canvas when you
  use it.

**Offline:** `src/offline/sw.js` is a template. The `offline()` plugin in `vite.config.ts` fills in the file list and
a content-hash version, so nothing needs a manual version bump.

## Building the world (new locations)

Generation is data only, with no three.js. `world/gen/genWorld.ts` fills `gen.boxes`, `gen.glass`, `gen.doors`,
`gen.loot` and `gen.footprints`. `world/level/loadMap.ts` then turns that data into the scene.

- **The island:** `world/terrain/constants.ts` holds `ISLAND_HALF` (450 m), `MOUNTAINS`, `LAKES`, `RIVERS`,
  `SITES`, `BRIDGES`, `ROADS` and `EXTRA_REGIONS` (map labels). `genTerrain` flattens the ground around each site
  and sets its `groundY`.
  - Watch out: `genTerrain` refers to some sites by index (`SITES[8]` is the farm, `SITES[10]` the airfield). Add
    new sites at the end of the list, or fix those references.
- **A new site:**
  1. Add an entry to `SITES`, with a `SiteType` in `terrain/types.ts`.
  2. Add `world/gen/sites/build<Name>.ts`, which starts with `const s = site('<Name>')` and builds around
     `s.x`, `s.z` and `s.groundY`.
  3. Call it from `genWorld`.
  4. Join it to the network with a road in `ROADS`.
- **Kits to build with, instead of placing raw boxes:**
  - `gen/buildings/`:
    - `house`, `shop` and `villa` (cx, cz, w, d, Y, opts)
    - `warehouse`, `hangar` and `mall`
    - `silo`, `stairTower` and `tower`
    - `containers` and `bridge`
  - `gen/parts/`:
    - `wall(axis, at, from, to, Y, h, colour, openings)`, which cuts doors, windows and gates out of a wall
    - `shell`, a square room with a door on one face
    - `roof`, `table` and `car`
    - `rotateLocal` and `rotateRect`, which turn a layout to face north, south, east or west
  - `gen/place/`:
    - `placeBox(x, z, w, d, h, colour, y?, noCollision?)`, `placeDoor` and `placeGlass`
    - `placeLoot(x, z, y, tier)`
    - `markFootprint` and `insideFootprint`, which keep trees, rocks and cabins off what you built
  - `gen/random/`: `rand`, `pick`, `randInt` and `randRange`. **Always use these, never `Math.random`.** They are
    seeded (`gen.seed`), so the island is the same every time.
  - `gen/wilderness/`: what fills the land between sites (trees, rocks, boulders, cabins, gas stations, loose loot).
- **Drawing:** `loadMap` passes the data to `queueBox`, `addGlass` and `addDoor`. Then `flushBoxes`, `flushGlass`
  and `flushDoors` draw everything as **one InstancedMesh per 128 m map tile** (`MAP_TILE` in
  `world/level/state.ts`), so frustum and shadow culling skip whole tiles. The terrain is drawn in 128 m tiles too
  (`terrainMesh`). The map group's matrices are static: `matrixWorldAutoUpdate` is off, and they are updated once
  after loading.
- **Collision:** `physics/` uses a grid of boxes (`buildGrid`, `boxesNear`). Rays use `castRay` and `lineOfSight`.

## Performance rules (measured; keep them)

- Static map geometry always goes through `placeBox`, `placeGlass` and `placeDoor`, so it is instanced per tile.
  Never add a separate mesh for map geometry.
- Merge models of many parts with `mergeMeshes`. The bot and pickup models do this already.
- No allocation in code that runs per frame or per simulation step. Use `utils/hypot`, not `Math.hypot`, which
  allocates in V8. Reuse scratch vectors and arrays, as `physics/moveBody.ts` does.
- Free the GPU memory of anything you remove (`disposeObject`). Mark shared geometries and materials with `keep`
  (or `userData.keep = true`) so they aren't freed.
- DOM: per-frame writes go through `writeDom`. Canvases (minimap, compass) redraw only when what they show changes.
- Measured baseline (High preset, software GPU in CI):
  - about 150 draw calls and 120k triangles per frame
  - GPU buffers, textures, three.js geometries and scene objects stay flat over a 7-minute match
  - the heap stays at 35-50 MB

## Measuring: `tools/bench`

Playwright scripts that play the game in headless Chromium (software WebGL) and record frame times, draw calls,
memory, DOM work and screenshots. See `tools/bench/README.md`. Use them before and after any performance or
rendering change, and for "it gets worse over time" reports (`longplay.cjs`).
