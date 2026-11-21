import { loadout } from './state';
import type { WeaponId } from '../types';

/** Takes the magazine of owned weapon `id` into hand. */
export const loadAmmo = (id: WeaponId) => {
  loadout.ammo = loadout.owned[id].ammo;
};
