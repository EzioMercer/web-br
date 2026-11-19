import { loadout } from './state';
import type { WeaponId } from '../types';

/** Takes the ammo of owned weapon `id` into hand. */
export const loadAmmo = (id: WeaponId) => {
  ({ ammo: loadout.ammo, reserve: loadout.reserve } = loadout.owned[id]);
};
