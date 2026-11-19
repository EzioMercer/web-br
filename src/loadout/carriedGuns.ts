import { loadout } from './state';
import { WeaponId } from '../types';

/** Weapons carried, except the knife. */
export const carriedGuns = (): WeaponId[] => (Object.keys(loadout.owned) as WeaponId[]).filter(
  k => k !== WeaponId.Knife,
);
