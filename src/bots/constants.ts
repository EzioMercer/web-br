import { WeaponId } from '../types';

/** Farthest a bot can spot the player at, whatever the view cone (m). */
export const SPOT_LIMIT = 450;

/** What bots land with: pistols mostly, now and then a light gun. Better guns are looted. */
export const BOT_START_WEAPONS: WeaponId[] = [
  WeaponId.Usp,
  WeaponId.Usp,
  WeaponId.Glock18,
  WeaponId.Glock18,
  WeaponId.Glock18,
  WeaponId.DesertEagle,
  WeaponId.Mp5,
  WeaponId.M3,
];

/** Guns a bot may turn up with after looting somewhere out of sight (snipers about one in five). */
export const BOT_FOUND_WEAPONS: WeaponId[] = [
  WeaponId.Mp5,
  WeaponId.Mp5,
  WeaponId.P90,
  WeaponId.M3,
  WeaponId.Ak47,
  WeaponId.Ak47,
  WeaponId.Ak47,
  WeaponId.M4a1,
  WeaponId.M4a1,
  WeaponId.M4a1,
  WeaponId.Scout,
  WeaponId.Svd,
  WeaponId.Kar98k,
];

/** Seconds into a match before a bot may get a sniper rifle, so nobody is picked off from afar right after landing. */
export const SNIPER_DELAY = 90;

/** How far a bot goes out of its way for a better gun it can see (m). */
export const LOOT_REACH = 35;
