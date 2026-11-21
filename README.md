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
    level/      loading the island into the scene: boxes, glass, doors, water
    doors/      doors and breakable glass
```

## TODO

- [x] **Battle Royale only.** The prototype's arena maps (Blockout, Mansion, Dust 2), their modes (Casual, Only Sniper, Arms Race), the buy menu and money are removed. A seeded match produced identical state before and after.
- [x] **Split the original monolith into modules** (see *Code layout*). Behavior is unchanged: a seeded simulation of casual, Arms Race and Battle Royale matches produced identical state before and after the split.
- [x] **Type the modules.** Every module type-checks under `strict`, and ESLint runs its full rule set on all of them. A seeded simulation produced identical state before and after.
- [x] **Rename the prototype's short identifiers** (`P`, `wb`, `cg`, `ZN`...) to descriptive names (`playerBody`, `addBox`, `loadout.grenade`, `zone`...). Short names remain only for temporaries inside functions (`x`, `dt`, `wf`...). A seeded simulation produced identical state before and after.
- [x] **Narrow `state`.** The shared `state` object is gone. Each value lives in the module that owns it: `player` (health, view), `loadout` (weapons, ammo), `input`, `screenFx`, `settings`, the zone and pickups. Values with a single writer are exported live bindings (`simTime`, `phase`, `terrain`). A seeded simulation produced identical state before and after.
- [x] **three.js upgraded** to the latest version (0.187), with matching `@types/three`. Upgrade both together. Rendering uses the modern color pipeline: color management on, sRGB output, physical light units. Hex colors and canvas textures are sRGB, and terrain vertex colors are converted to linear. The hemisphere and sun light values were fitted against renders of the original r128 lighting (about 4.7/255 RMSE), so the look stays close to the prototype.
