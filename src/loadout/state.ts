import { OPTIC_BAG_SLOTS } from '../config';
import { WEAPONS } from '../data/weapons';
import { emptyAmmoBag } from './emptyAmmoBag';
import { WeaponId } from '../types';
import type { GrenadeId, OpticId, OwnedWeapon, Weapon } from '../types';

/** The weapons the player carries and the state of the one in hand. */
export const loadout = {
  weaponId: WeaponId.Usp,
  weapon: WEAPONS[WeaponId.Usp] as Weapon,
  owned: {
    [WeaponId.Usp]: { ammo: 12 },
    [WeaponId.Knife]: { ammo: 1 },
  } as Record<WeaponId, OwnedWeapon>,
  /** Spare rounds per ammo type, shared by every gun that fires them and kept when a gun is dropped. */
  ammoBag: emptyAmmoBag(),
  /** Spare optics, waiting for a gun that takes them. */
  opticBag: new Array<OpticId | null>(OPTIC_BAG_SLOTS).fill(null),
  /** Rounds in the magazine of the weapon in hand. */
  ammo: 12,
  scoped: false,
  reloading: false,
  reloadEnd: 0,
  nextShotAt: 0,
  lastShotAt: -9,
  /** Selected grenade, if any. */
  grenade: null as GrenadeId | null,
  /** End of the bolt-cycle animation. */
  boltCycleEnd: 0,
  /** End of the knife-slash animation. */
  slashEnd: 0,
};
