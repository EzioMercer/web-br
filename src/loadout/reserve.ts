import { WEAPONS } from '../data/weapons';
import { AmmoType } from '../types';
import type { WeaponId } from '../types';
import { loadout } from './state';

/** Spare rounds in the ammo bag for gun `id` (the one in hand by default). */
export const reserve = (id: WeaponId = loadout.weaponId) => loadout.ammoBag[WEAPONS[id].ammoType ?? AmmoType.None];
