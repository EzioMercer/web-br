import { WeaponClass, WeaponId } from '../types';

/** Weapon class icons (SVG paths). */
export const CLASS_ICONS: Record<WeaponClass, string> = {
  [WeaponClass.Pistol]: 'M10 12h62v9H60l-3 14H46l3-14H34l-3 5H10z',
  [WeaponClass.Smg]: 'M6 14h74v8H66l-2 14h-9l2-14H44l-2 12h-8l2-12H6z M80 16h30v4H80z',
  [WeaponClass.Rifle]: 'M4 16h40l6-4h30l4 3h30v5H84l-4 3H58l-2 12h-9l1-12H20l-6 7H4z',
  [WeaponClass.Shotgun]: 'M4 18h100v5H60v4H40v-4H4z M50 23h14v8H50z',
  [WeaponClass.Sniper]: 'M2 20h104v4H70l-6 4H44l-4 10h-8l3-10H18l-4 3H2z M40 12h30v4H40z',
  [WeaponClass.Knife]: 'M18 29L76 13l8 2-6 7-58 9z M12 29h10v6H12z',
};

export const WEAPON_CLASS: Record<WeaponId, WeaponClass> = {
  [WeaponId.Usp]: WeaponClass.Pistol,
  [WeaponId.Glock18]: WeaponClass.Pistol,
  [WeaponId.DesertEagle]: WeaponClass.Pistol,
  [WeaponId.Mp5]: WeaponClass.Smg,
  [WeaponId.P90]: WeaponClass.Smg,
  [WeaponId.Ak47]: WeaponClass.Rifle,
  [WeaponId.M4a1]: WeaponClass.Rifle,
  [WeaponId.M3]: WeaponClass.Shotgun,
  [WeaponId.Awp]: WeaponClass.Sniper,
  [WeaponId.Scout]: WeaponClass.Sniper,
  [WeaponId.Svd]: WeaponClass.Sniper,
  [WeaponId.G3sg1]: WeaponClass.Sniper,
  [WeaponId.Kar98k]: WeaponClass.Sniper,
  [WeaponId.BarrettM82]: WeaponClass.Sniper,
  [WeaponId.Knife]: WeaponClass.Knife,
};

/** Weapon class names. */
export const CLASS_NAMES: Record<WeaponClass, string> = {
  [WeaponClass.Pistol]: 'Pistol',
  [WeaponClass.Smg]: 'SMG',
  [WeaponClass.Rifle]: 'Rifle',
  [WeaponClass.Shotgun]: 'Shotgun',
  [WeaponClass.Sniper]: 'Sniper',
  [WeaponClass.Knife]: 'Melee',
};
