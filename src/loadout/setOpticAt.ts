import { loadout } from './state';
import type { OpticId, WeaponId } from '../types';

/** Puts optic `o` (or nothing) in inventory slot `key` (see `opticAt`). */
export const setOpticAt = (key: string, o: OpticId | null) => {
  const [k, v] = key.split(':');

  if (k === 'g') {
    loadout.owned[v as WeaponId].optic = o ?? undefined;
  } else {
    loadout.opticBag[Number(v)] = o;
  }
};
