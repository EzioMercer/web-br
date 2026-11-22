import { isOptic } from './isOptic';
import { takesOptic } from './takesOptic';
import { loadout } from './state';
import type { BagItem, WeaponId } from '../types';

/** Inventory slot `key` can take item `it`: a bag slot takes anything, a carried rifle, SMG or shotgun an optic. */
export const canHold = (key: string, it: BagItem) => {
  const [k, v] = key.split(':');

  return k === 'b' || (isOptic(it) && Boolean(loadout.owned[v as WeaponId]) && takesOptic(v as WeaponId));
};
