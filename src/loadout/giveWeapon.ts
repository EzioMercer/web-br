import { WEAPONS } from '../data/weapons';
import { carriedGuns } from './carriedGuns';
import { loadout } from './state';
import type { OwnedWeapon } from '../types';
import { loadAmmo } from './loadAmmo';
import { stashAmmo } from './stashAmmo';
import { AmmoType, WeaponId } from '../types';

/**
 * Gives weapon `id` (with the magazine and optic `st` if dropped by someone) and switches to it. With both slots full,
 * it takes the slot of `drop` (default: the gun in hand), so the slot numbers of the other guns do not change.
 */
export const giveWeapon = (id: WeaponId, st?: OwnedWeapon, drop?: WeaponId) => {
  const w = WEAPONS[id];
  const got: OwnedWeapon = { ammo: st ? st.ammo : w.magSize, optic: st?.optic };

  stashAmmo();

  if (loadout.owned[id]) {
    // a second copy: its rounds go in the bag, and its optic if ours has none
    loadout.ammoBag[w.ammoType ?? AmmoType.None] += got.ammo;

    if (got.optic && !loadout.owned[id].optic) {
      loadout.owned[id].optic = got.optic;
    }
  } else if (carriedGuns().length >= 2) {
    const out = drop || (loadout.weaponId !== WeaponId.Knife ? loadout.weaponId : carriedGuns()[1]);
    const owned = {} as Record<WeaponId, OwnedWeapon>;

    for (const k of Object.keys(loadout.owned) as WeaponId[]) {
      if (k === out) {
        owned[id] = got;
      } else {
        owned[k] = loadout.owned[k];
      }
    }

    loadout.owned = owned;
  } else {
    loadout.owned[id] = got;
  }

  loadout.weaponId = id;
  loadout.weapon = w;
  loadAmmo(id);
  loadout.reloading = false;
  loadout.scoped = false;
  loadout.grenade = null;
};
