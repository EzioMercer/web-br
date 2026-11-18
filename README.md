# web-br

Browser battle royale FPS prototype built with [three.js](https://threejs.org/), TypeScript and Vite.

## Development

Requires Node.js `^20.19 || ^22.13 || >=24`.

```sh
npm install      # also installs the git hooks (husky)
npm run dev      # dev server with hot reload
npm run build    # typecheck + production build into dist/
npm run preview  # serve the production build locally
npm run lint     # ESLint
npm run typecheck
```

A husky `pre-push` hook runs `lint` and `typecheck`.

## Deployment

Every push to `master` triggers `.github/workflows/deploy.yml`, which builds the project and publishes `dist/` to GitHub Pages.
In the repo settings, **Pages → Build and deployment → Source** must be set to **GitHub Actions**.

## TODO

- [ ] **Split `src/game.ts` into typed modules.** It's still the original single script, wrapped in `@ts-nocheck` / `eslint-disable`.
- [ ] **Upgrade three.js.** It's pinned to `0.128.0` (r128, 2021), with matching `@types/three@0.128.0`. Newer versions change color management (`outputColorSpace`, sRGB textures) and light intensity units (physically correct lights became the default in r155), so lighting and colors need re-tuning after the upgrade. Upgrade `three` and `@types/three` together.
- [ ] **State management.** Decide whether to use Zustand or a plain typed state module (see notes below).
- [ ] **Keep dependency versions mutually compatible.** Use the newest versions whose peer ranges agree. For example, `typescript` is held at `~6.0` because `typescript-eslint` supports `typescript <6.1`, even though TypeScript 7 is out. Re-check peer ranges (`npm view <pkg> peerDependencies`) before bumping.

### State management notes

Most game state (player position, bots, bullets, timers) changes every frame. A plain mutable typed object fits it best. Redux's immutable updates and dispatching would add allocation and overhead on every frame for no benefit. Zustand is a reasonable option only for low-frequency UI state (menus, settings, match results), using `zustand/vanilla` since there's no React. It's worth adding only if the UI grows enough to need subscriptions.
