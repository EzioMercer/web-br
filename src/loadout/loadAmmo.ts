import { loadout } from './state';

/** Takes the ammo of owned weapon `id` into hand. */
export const loadAmmo = (id: string) => {
  ({ ammo: loadout.ammo, reserve: loadout.reserve } = loadout.owned[id]);
};
