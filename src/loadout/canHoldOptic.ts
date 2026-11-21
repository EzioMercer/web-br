import { takesOptic } from './takesOptic';
import { loadout } from './state';
import type { WeaponId } from '../types';

/** Inventory slot `key` can take an optic: any bag slot, or a carried rifle, SMG or shotgun. */
export const canHoldOptic = (key: string) => {
  const [k, v] = key.split(':');

  return k === 'b' || (Boolean(loadout.owned[v as WeaponId]) && takesOptic(v as WeaponId));
};
