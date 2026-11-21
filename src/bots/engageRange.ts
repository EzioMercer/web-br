import type { Weapon } from '../types';

/** Farthest distance (m) a bot opens fire at with weapon `w`. */
export const engageRange = (w: Weapon) => w.melee ? 2.8 : Math.min(420, w.range * 2.5);
