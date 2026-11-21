import { AmmoType } from '../types';

/** The ammo types guns use, in inventory order. */
export const AMMO_TYPES: AmmoType[] = [
  AmmoType.Pistol,
  AmmoType.Smg,
  AmmoType.Rifle,
  AmmoType.Shotgun,
  AmmoType.Sniper,
];

/** Pickup names. */
export const AMMO_NAMES: Partial<Record<AmmoType, string>> = {
  [AmmoType.Pistol]: 'Pistol ammo',
  [AmmoType.Smg]: 'SMG ammo',
  [AmmoType.Rifle]: 'Rifle ammo',
  [AmmoType.Shotgun]: 'Shotgun shells',
  [AmmoType.Sniper]: 'Sniper ammo',
};

/** Short names for the inventory. */
export const AMMO_SHORT: Partial<Record<AmmoType, string>> = {
  [AmmoType.Pistol]: 'Pistol',
  [AmmoType.Smg]: 'SMG',
  [AmmoType.Rifle]: 'Rifle',
  [AmmoType.Shotgun]: 'Shotgun',
  [AmmoType.Sniper]: 'Sniper',
};

/** Rounds in one ammo pickup: sniper rounds are the scarcest. */
export const AMMO_PER_PICKUP: Partial<Record<AmmoType, number>> = {
  [AmmoType.Pistol]: 24,
  [AmmoType.Smg]: 60,
  [AmmoType.Rifle]: 60,
  [AmmoType.Shotgun]: 16,
  [AmmoType.Sniper]: 10,
};
