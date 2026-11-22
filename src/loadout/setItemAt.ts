import { isOptic } from './isOptic';
import { loadout } from './state';
import type { BagItem, WeaponId } from '../types';

/** Puts item `it` (or nothing) in inventory slot `key` (see `itemAt`). A gun slot only ever gets an optic. */
export const setItemAt = (key: string, it: BagItem | null) => {
  const [k, v] = key.split(':');

  if (k === 'g') {
    loadout.owned[v as WeaponId].optic = isOptic(it) ? it : undefined;
  } else {
    loadout.bag[Number(v)] = it;
  }
};
