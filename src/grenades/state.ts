import type { GrenadeId } from '../types';
import type { Grenade, Smoke } from './types';

/** Throw mode (right-click toggles a short lob instead of a far throw) and whether the throw is being aimed. */
export const grenadeThrow = { lob: false, held: false };

/** Grenades carried. */
export const grenadeCount: Record<GrenadeId, number> = { he: 0, fl: 0, sm: 0 };

export const flyingGrenades: Grenade[] = [];

export const smokes: Smoke[] = [];
