import { GrenadeId } from '../types';
import type { Grenade, Smoke } from './types';

/** Throw mode (right-click toggles a short lob instead of a far throw) and whether the throw is being aimed. */
export const grenadeThrow = { lob: false, held: false };

/** Grenades carried. */
export const grenadeCount: Record<GrenadeId, number> = {
  [GrenadeId.HighExplosive]: 0,
  [GrenadeId.Flashbang]: 0,
  [GrenadeId.Smoke]: 0,
};

export const flyingGrenades: Grenade[] = [];

export const smokes: Smoke[] = [];
