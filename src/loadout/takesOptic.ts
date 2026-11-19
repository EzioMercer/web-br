import { WEAPONS } from '../data/weapons';
import { AmmoType } from '../types';
import type { WeaponId } from '../types';

/** Optics fit SMGs, rifles and shotguns. */
export const takesOptic = (id: WeaponId) => {
  const a = WEAPONS[id].ammoType;

  return a === AmmoType.Smg || a === AmmoType.Rifle || a === AmmoType.Shotgun;
};
