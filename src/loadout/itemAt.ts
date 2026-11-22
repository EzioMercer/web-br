import { loadout } from './state';
import type { BagItem, WeaponId } from '../types';

/**
 * The item in inventory slot `key`: `g:<weapon id>` is the optic on a carried gun, `b:<n>` the n-th bag slot (an
 * optic, medkit or vest).
 */
export const itemAt = (key: string): BagItem | null => {
  const [k, v] = key.split(':');

  return (k === 'g' ? loadout.owned[v as WeaponId]?.optic : loadout.bag[Number(v)]) ?? null;
};
