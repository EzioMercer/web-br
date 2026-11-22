# web-br

Browser battle royale FPS built with [three.js](https://threejs.org/), TypeScript and Vite.

## Development

Requires Node.js `^20.19 || ^22.13 || >=24`.

```sh
npm install      # also installs the git hooks (husky)
npm run dev      # dev server with hot reload
npm run build    # typecheck + production build into dist/
npm run preview  # serve the production build locally
npm run lint     # ESLint (correctness + formatting via @stylistic)
npm run lint:fix # ESLint with autofix, which also formats the code
npm run typecheck
```

A husky `pre-commit` hook runs `eslint --fix` on staged files (lint-staged), then `typecheck` on the whole project. The commit is blocked if either fails.

There is no Prettier. Formatting comes from `@stylistic/eslint-plugin` rules in `eslint.config.js`.

## Deployment

Every push to `master` triggers `.github/workflows/deploy.yml`, which builds the project and publishes `dist/` to GitHub Pages.
In the repo settings, **Pages → Build and deployment → Source** must be set to **GitHub Actions**.

After the first visit the game also starts offline: a service worker (`src/offline/sw.js`) keeps the build's files and
the fonts in the browser's cache. Each build gets its own cache; the old one is deleted when the new version takes over.

## Code layout

Each file exports at most one function, named like the file (`physics/castRay.ts` exports `castRay`).
Shared mutable values live in a `state.ts` per folder, types in `types.ts`, fixed tables in `constants.ts` or `data/`.

```
src/
  main.ts       entry: registers input and menu handlers, starts the render loop, shows the menu
  config.ts     constants (player size, sim step, FOV...)
  types.ts      shared types
  data/         weapons, optics, grenades, bot difficulties, loot tables
  utils/        shared helpers (smoothstep, pad2, label text, three.js box/cylinder meshes...)
  render/       scene, camera, renderer, sun and its shadows, mesh clean-up
  graphics/     graphics quality presets, device detection (Auto) and applying them to the renderer
  loop/         render loop (camera, viewmodel and HUD per frame)
  sim/          fixed-step simulation tick
  match/        match flow: start, countdown, victory or elimination, next match
  input/        keyboard and mouse state, pointer lock, event listeners
  menu/         main menu and settings dialog
  settings/     user settings, saved in localStorage
  offline/      service worker that keeps the game playable offline (vite.config.ts fills in the build's files)
  player/       health, view, spawning, damage
  loadout/      carried weapons, ammo, optics, reload and weapon switching
  combat/       shooting, knife, kills, loot drops
  grenades/     throwing, flight, aim preview, explosions, smoke
  bots/         bot model, labels, spawning and AI
  physics/      collision grid, raycasts, movement
  effects/      tracers, bullet marks, water ripples, screen effects
  audio/        Web Audio sound effects and footsteps
  viewmodel/    first-person weapon models and their animation
  hud/          HUD, compass, kill feed; minimap/ for the minimap and big map
  br/           Battle Royale: zone/ (safe zone schedule) and pickups/ (loot)
  world/
    terrain/    height field, regions, terrain mesh and raycast
    gen/        island generator: buildings/, sites/, wilderness/, parts/, place/, random/
    level/      loading the island into the scene: boxes, trees, glass, doors, water
    doors/      doors and breakable glass
```

Outside `src/`: `tools/bench/` has Playwright scripts that play the game headless and measure frame times, draw calls and memory (see its README). `CLAUDE.md` is the working guide for AI-assisted changes: what to reuse and the performance rules.

## Balance

No single spot or weapon should win on its own. Holding a mountain top with a sniper rifle is strong, but it has a price:

- **Bots shoot back from range.** Each weapon has an effective range (`range` in `data/weapons.ts`). Bots with sniper rifles spot and hit targets out to about 400 m; rifles reach about 130 m; SMGs, pistols and shotguns stay short. Far shots take a bot longer to line up and never exceed about one in three hits on Normal.
- **Being seen.** Bots spot the player farther away when the player has just fired (muzzle flash), moves fast, or stands high above them against the sky. A scoped player is seen by any bot they aim at (lens glint, up to 450 m). A bot sniper aiming at the player shows a glint too.
- **Bots react to being shot.** A bot that is hit or nearly hit and cannot shoot back runs for the nearest spot hidden from the shooter. After a few seconds it moves in on the shooter's last known position. Bots that hear a shot (louder guns carry farther) come looking. Bot snipers often climb to high ground and hold it.
- **Bullets fly.** The player's bullets have a muzzle velocity and drop. At 300 m an AWP shot needs about a metre of lead on a walking target and aims about 0.6 m high. At close range there is no difference.
- **Map.** Mountain flanks have boulder fields, so a climb toward a sniper can go from cover to cover, while the summits stay bare. Sniper rifles are about a quarter of tier 2 loot, and sniper ammo is the scarcest (one magazine per box).

## TODO

- [x] **Battle Royale only.** The prototype's arena maps (Blockout, Mansion, Dust 2), their modes (Casual, Only Sniper, Arms Race), the buy menu and money are removed. A seeded match produced identical state before and after.
- [x] **Split the original monolith into modules** (see *Code layout*). Behavior is unchanged: a seeded simulation of casual, Arms Race and Battle Royale matches produced identical state before and after the split.
- [x] **Type the modules.** Every module type-checks under `strict`, and ESLint runs its full rule set on all of them. A seeded simulation produced identical state before and after.
- [x] **Rename the prototype's short identifiers** (`P`, `wb`, `cg`, `ZN`...) to descriptive names (`playerBody`, `addBox`, `loadout.grenade`, `zone`...). Short names remain only for temporaries inside functions (`x`, `dt`, `wf`...). A seeded simulation produced identical state before and after.
- [x] **Narrow `state`.** The shared `state` object is gone. Each value lives in the module that owns it: `player` (health, view), `loadout` (weapons, ammo), `input`, `screenFx`, `settings`, the zone and pickups. Values with a single writer are exported live bindings (`simTime`, `phase`, `terrain`). A seeded simulation produced identical state before and after.
- [x] **three.js upgraded** to the latest version (0.187), with matching `@types/three`. Upgrade both together. Rendering uses the modern color pipeline: color management on, sRGB output, physical light units. Hex colors and canvas textures are sRGB, and terrain vertex colors are converted to linear. The hemisphere and sun light values were fitted against renders of the original r128 lighting (about 4.7/255 RMSE), so the look stays close to the prototype.
