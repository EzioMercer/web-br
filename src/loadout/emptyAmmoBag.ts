import { AmmoType } from '../types';

/** An ammo bag with no rounds of any type. */
export const emptyAmmoBag = (): Record<AmmoType, number> => ({
  [AmmoType.Pistol]: 0,
  [AmmoType.Smg]: 0,
  [AmmoType.Rifle]: 0,
  [AmmoType.Shotgun]: 0,
  [AmmoType.Sniper]: 0,
  [AmmoType.None]: 0,
});
