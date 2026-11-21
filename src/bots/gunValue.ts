import { WEAPONS } from '../data/weapons';
import { AmmoType } from '../types';
import type { WeaponId } from '../types';

/** How much a bot wants gun `id`: knife 0, pistol 1, SMG or shotgun 2, rifle or sniper rifle 3. */
export const gunValue = (id: WeaponId) => {
  const w = WEAPONS[id];

  return w.melee ? 0 : w.slot === 2 ? 1 : w.ammoType === AmmoType.Smg || w.ammoType === AmmoType.Shotgun ? 2 : 3;
};
