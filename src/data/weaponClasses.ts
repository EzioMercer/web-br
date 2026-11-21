import { WeaponClass, WeaponId } from '../types';

/** Weapon class silhouettes in a 120 x 40 box, muzzle to the right (SVG paths; counter-clockwise parts are holes). */
export const CLASS_ICONS: Record<WeaponClass, string> = {
  [WeaponClass.Pistol]: [
    'M28 8h62v10h-62z M30 18h58v3h-58z M33 21 49 21 45 37 29 37z M49 21 63 21 61 29 49 29z',
    'M51 26 59 26 60 21 51 21z M86 6h3v2h-3z M30 6h4v2h-4z',
  ].join(' '),
  [WeaponClass.Smg]: [
    'M30 11h52v10h-52z M80 12h18v10h-18z M98 14h10v4h-10z M106 13h4v6h-4z M42 21 52 21 49 34 39 34z',
    'M60 21 68 21 73 35 65 37z M10 12h20v2h-20z M10 18h20v2h-20z M6 10h5v12h-5z M34 8h6v3h-6z',
    'M76 8h3v3h-3z',
  ].join(' '),
  [WeaponClass.Rifle]: [
    'M36 12h40v9h-40z M76 13h20v7h-20z M76 10h22v3h-22z M96 14h18v3h-18z M108 10h3v4h-3z',
    'M6 14 36 12 36 21 12 27 6 27z M46 21 55 21 52 33 43 33z M60 21 70 21 75 30 72 38 64 37 66 30z',
    'M70 9h3v3h-3z',
  ].join(' '),
  [WeaponClass.Shotgun]: [
    'M4 15 32 13 32 22 8 28 4 28z M32 13h26v9h-26z M40 22 52 22 51 28 41 28z M43 26 49 26 50 22 42 22z',
    'M58 13h56v4h-56z M58 18h44v3h-44z M70 16h22v7h-22z M110 11h2v2h-2z',
  ].join(' '),
  [WeaponClass.Sniper]: [
    'M2 14 34 14 34 22 24 23 12 28 2 28z M34 15h32v7h-32z M38 22 46 22 43 31 35 31z M66 16h20v6h-20z',
    'M86 17h32v3h-32z M42 6h26v5h-26z M36 5h7v7h-7z M67 4h9v9h-9z M48 11h3v4h-3z M60 11h3v4h-3z',
    'M58 22h2v3h-2z M57 24h5v3h-5z',
  ].join(' '),
  [WeaponClass.Knife]: [
    'M46 13 100 13 117 15 104 22 46 23z M40 9h6v18h-6z M10 15 40 14 40 23 10 22z M5 13h6v11h-6z',
  ].join(' '),
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
