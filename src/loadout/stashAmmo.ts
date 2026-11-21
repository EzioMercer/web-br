import { loadout } from './state';
import type { OwnedWeapon } from '../types';

/** Saves the magazine of the weapon in hand back to its owned entry. */
export const stashAmmo = () => {
  loadout.owned[loadout.weaponId] = Object.assign(
    loadout.owned[loadout.weaponId] || {},
    { ammo: loadout.ammo } satisfies Partial<OwnedWeapon>,
  );
};
