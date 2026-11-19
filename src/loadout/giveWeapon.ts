import { WEAPONS } from '../data/weapons';
import { carriedGuns } from './carriedGuns';
import { loadout } from './state';
import type { OwnedWeapon } from '../types';
import { loadAmmo } from './loadAmmo';
import { stashAmmo } from './stashAmmo';
import { WeaponId } from '../types';

/**
 * Gives weapon `id` (with ammo and optic `st` if dropped by someone) and switches to it, dropping `drop` if both
 * slots are full.
 */
export const giveWeapon = (id: WeaponId, st?: OwnedWeapon, drop?: WeaponId) => {
  const w = WEAPONS[id];

  stashAmmo();

  if (loadout.owned[id]) {
    loadout.owned[id].reserve += w.magSize;

    if (st && st.optic && !loadout.owned[id].optic) {
      loadout.owned[id].optic = st.optic;
    }
  } else {
    if (carriedGuns().length >= 2) {
      delete loadout.owned[drop || (loadout.weaponId !== WeaponId.Knife ? loadout.weaponId : carriedGuns()[1])];
    }

    loadout.owned[id] = st
      ? { ammo: st.ammo, reserve: st.reserve, optic: st.optic }
      : { ammo: w.magSize, reserve: w.magSize };
  }

  loadout.weaponId = id;
  loadout.weapon = w;
  loadAmmo(id);
  loadout.reloading = false;
  loadout.scoped = false;
  loadout.grenade = null;
};
