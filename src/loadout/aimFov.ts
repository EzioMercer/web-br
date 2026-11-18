import { currentOptic } from './currentOptic';
import { loadout } from './state';

export const aimFov = (): number => loadout.weapon.sniper
  ? loadout.weapon.scopeFov!
  : currentOptic()?.fov ?? (loadout.weapon.slot === 2 ? 66 : 62);
