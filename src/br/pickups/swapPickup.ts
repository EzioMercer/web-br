import { carriedGuns } from '../../loadout/carriedGuns';
import { giveWeapon } from '../../loadout/giveWeapon';
import { loadout } from '../../loadout/state';
import { swapOptic } from '../../loadout/swapOptic';
import { spawnPickup } from './spawnPickup';
import { looting } from './state';
import type { OwnedWeapon, Pickup } from '../../types';
import { removePickup } from './removePickup';
import { PickupKind, WeaponId } from '../../types';

/** Swaps the held weapon (or optic) for pickup `k`, dropping the old one. */
export const swapPickup = (k: Pickup) => {
  if (k.kind === PickupKind.Optic) {
    swapOptic(k);
    return;
  }

  if (carriedGuns().length < 2 || loadout.owned[k.itemId as WeaponId]) {
    return;
  }

  const drop = loadout.weaponId !== WeaponId.Knife ? loadout.weaponId : carriedGuns()[1];
  // the dropped gun keeps its magazine and optic; spare rounds stay in the ammo bag
  const st: OwnedWeapon = {
    ammo: drop === loadout.weaponId ? loadout.ammo : loadout.owned[drop].ammo,
    optic: loadout.owned[drop].optic,
  };

  spawnPickup(k.x, k.z, PickupKind.Weapon, drop, st, k.y);
  giveWeapon(k.itemId as WeaponId, k.weaponState, drop);
  removePickup(k);
  looting.swapTarget = null;
};
