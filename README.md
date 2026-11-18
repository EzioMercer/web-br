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

```
src/
  main.ts          entry: starts the render loop and shows the menu
  match.ts         match flow: start, countdown, victory or elimination, next match
  settings.ts      user settings (difficulty, sensitivity, volume), saved in localStorage
  types.ts         shared types
  config.ts        constants (player size, sim step, FOV...)
  dom.ts           HUD element lookup
  render/          renderer, scene, camera, lights
  world/           terrain, island generator, level loading, doors and glass
  br/              safe zone and pickups
  hud/             HUD, compass, minimap and big map
  physics.ts       collision grid, raycasts, movement
  sim.ts           fixed-step simulation tick
  loop.ts          render loop (camera, viewmodel and HUD per frame)
  player.ts  bots.ts  combat.ts  grenades.ts  weapons.ts  loadout.ts
  viewmodel.ts  effects.ts  audio.ts  input.ts  menu.ts
```

## TODO

- [x] **Battle Royale only.** The prototype's arena maps (Blockout, Mansion, Dust 2), their modes (Casual, Only Sniper, Arms Race), the buy menu and money are removed. A seeded match produced identical state before and after.
- [x] **Split the original monolith into modules** (see *Code layout*). Behavior is unchanged: a seeded simulation of casual, Arms Race and Battle Royale matches produced identical state before and after the split.
- [x] **Type the modules.** Every module type-checks under `strict`, and ESLint runs its full rule set on all of them. A seeded simulation produced identical state before and after.
- [x] **Rename the prototype's short identifiers** (`P`, `wb`, `cg`, `ZN`...) to descriptive names (`playerBody`, `addBox`, `loadout.grenade`, `zone`...). Short names remain only for temporaries inside functions (`x`, `dt`, `wf`...). A seeded simulation produced identical state before and after.
- [x] **Narrow `state`.** The shared `state` object is gone. Each value lives in the module that owns it: `player` (health, view), `loadout` (weapons, ammo), `input`, `screenFx`, `settings`, the zone and pickups. Values with a single writer are exported live bindings (`simTime`, `phase`, `terrain`). A seeded simulation produced identical state before and after.
- [x] **three.js upgraded** to the latest version (0.187), with matching `@types/three`. Upgrade both together. Rendering uses the modern color pipeline: color management on, sRGB output, physical light units. Hex colors and canvas textures are sRGB, and terrain vertex colors are converted to linear. The hemisphere and sun light values were fitted against renders of the original r128 lighting (about 4.7/255 RMSE), so the look stays close to the prototype.
