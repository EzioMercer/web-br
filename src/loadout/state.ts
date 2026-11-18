import { WEAPONS } from '../data/weapons';
import type { GrenadeId, OwnedWeapon, Weapon } from '../types';

/** The weapons the player carries and the state of the one in hand. */
export const loadout = {
  weaponId: 'pistol',
  weapon: WEAPONS.pistol as Weapon,
  owned: { pistol: { ammo: 12, reserve: 36 }, knife: { ammo: 1, reserve: 0 } } as Record<string, OwnedWeapon>,
  /** Rounds in the magazine and in reserve for the weapon in hand. */
  ammo: 12,
  reserve: 36,
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
