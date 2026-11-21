import { loadout } from './state';
import type { OpticId, WeaponId } from '../types';

/**
 * The optic in inventory slot `key`: `g:<weapon id>` is the optic on a carried gun, `b:<n>` the n-th spare optic in
 * the bag.
 */
export const opticAt = (key: string): OpticId | null => {
  const [k, v] = key.split(':');

  return (k === 'g' ? loadout.owned[v as WeaponId]?.optic : loadout.opticBag[Number(v)]) ?? null;
};
