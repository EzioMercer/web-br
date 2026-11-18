# web-br

Browser battle royale FPS prototype built with [three.js](https://threejs.org/), TypeScript and Vite.

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

There is no Prettier. Formatting comes from `@stylistic/eslint-plugin` rules in `eslint.config.js`. The untyped modules listed there only get the formatting rules.

## Deployment

Every push to `master` triggers `.github/workflows/deploy.yml`, which builds the project and publishes `dist/` to GitHub Pages.
In the repo settings, **Pages → Build and deployment → Source** must be set to **GitHub Actions**.

## Code layout

```
src/
  main.ts          entry: loads the first map, spawns bots, starts the render loop, shows the menu
  state.ts         shared mutable game state (typed)
  types.ts         shared types
  config.ts        constants (player size, sim step, FOV...)
  dom.ts           HUD element lookup
  render/          renderer, scene, camera, lights
  world/           maps data, terrain, Battle Royale world generator, level loading, doors and glass
  br/              Battle Royale zone and pickups
  hud/             HUD, compass, minimap and big map
  physics.ts       collision grid, raycasts, movement
  sim.ts           fixed-step simulation tick
  loop.ts          render loop (camera, viewmodel and HUD per frame)
  player.ts  bots.ts  combat.ts  grenades.ts  weapons.ts  loadout.ts  shop.ts  modes.ts
  viewmodel.ts  effects.ts  audio.ts  input.ts  menu.ts
```

## TODO

- [x] **Split the original monolith into modules** (see *Code layout*). Behavior is unchanged: a seeded simulation of casual, Arms Race and Battle Royale matches produced identical state before and after the split.
- [ ] **Type the modules.** `dom`, `config`, `state` and `types` are fully typed. The rest still start with `@ts-nocheck`, and ESLint checks only their formatting (see the `untyped` list in `eslint.config.js`). Type them one at a time: remove `@ts-nocheck`, remove the file from that list, and rename the prototype's short identifiers (`P`, `wb`, `cg`...) while you're there.
- [ ] **Narrow `state`.** Shared mutable values now live in `src/state.ts`. Many could move to the module that owns them (for example the player or the Battle Royale zone) once those modules are typed.
- [x] **three.js upgraded** to the latest version (0.187), with matching `@types/three`. Upgrade both together. Rendering uses the modern color pipeline: color management on, sRGB output, physical light units. Hex colors and canvas textures are sRGB, and terrain vertex colors are converted to linear. The hemisphere and sun light values were fitted against renders of the original r128 lighting (about 4.7/255 RMSE), so the look stays close to the prototype.
- [ ] **State management.** Decide whether to use Zustand or a plain typed state module (see notes below).
- [ ] **Keep dependency versions mutually compatible.** Use the newest versions whose peer ranges agree. For example, `typescript` is held at `~6.0` because `typescript-eslint` supports `typescript <6.1`, even though TypeScript 7 is out. Re-check peer ranges (`npm view <pkg> peerDependencies`) before bumping.

### State management notes

Most game state (player position, bots, bullets, timers) changes every frame. A plain mutable typed object fits it best. Redux's immutable updates and dispatching would add allocation and overhead on every frame for no benefit. Zustand is a reasonable option only for low-frequency UI state (menus, settings, match results), using `zustand/vanilla` since there's no React. It's worth adding only if the UI grows enough to need subscriptions.
