import { GrenadeId } from '../types';
import type { Grenade, Smoke } from './types';

/**
 * The throw being aimed: `held` while the button is down, `power` (share of full speed) as set with the mouse wheel,
 * and `strength`, which eases towards `power` so the preview arc glides instead of jumping. The throw uses `strength`,
 * so it always matches the arc on screen.
 */
export const grenadeThrow = { held: false, power: 1, strength: 1 };

/** Grenades carried. */
export const grenadeCount: Record<GrenadeId, number> = {
  [GrenadeId.HighExplosive]: 0,
  [GrenadeId.Flashbang]: 0,
  [GrenadeId.Smoke]: 0,
};

export const flyingGrenades: Grenade[] = [];

export const smokes: Smoke[] = [];
