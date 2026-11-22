import { AMMO_PER_PICKUP } from '../../data/ammo';
import { WEAPONS } from '../../data/weapons';
import { grenadeCount } from '../../grenades/state';
import { feedMessage } from '../../hud/feedMessage';
import { giveWeapon } from '../../loadout/giveWeapon';
import { opticTarget } from '../../loadout/opticTarget';
import { loadout } from '../../loadout/state';
import { PickupKind, Supply } from '../../types';
import type { AmmoType, GrenadeId, OpticId, Pickup } from '../../types';
import type { WeaponId } from '../../types';

export const takePickup = (k: Pickup) => {
  if (k.kind === PickupKind.Weapon) {
    giveWeapon(k.itemId as WeaponId, k.weaponState);
  } else if (k.kind === PickupKind.Armor) {
    // into the bag for later: 8 (or a click in the inventory) puts it on
    loadout.bag[loadout.bag.indexOf(null)] = Supply.Vest;
  } else if (k.kind === PickupKind.Grenade) {
    grenadeCount[k.itemId as GrenadeId]++;
  } else if (k.kind === PickupKind.Optic) {
    const tg = opticTarget();
    const free = loadout.bag.indexOf(null);

    if (tg && !loadout.owned[tg].optic) {
      loadout.owned[tg].optic = k.itemId as OpticId;
      feedMessage('Attached ' + k.name + ' to ' + WEAPONS[tg].name);
    } else if (free >= 0) {
      // no gun free for it: keep it in the bag until one turns up
      loadout.bag[free] = k.itemId as OpticId;
      feedMessage('Stored ' + k.name);
    }

    return;
  } else if (k.kind === PickupKind.Ammo) {
    const add = AMMO_PER_PICKUP[k.itemId as AmmoType] ?? 0;

    loadout.ammoBag[k.itemId as AmmoType] += add;
    feedMessage('Picked up ' + k.name + ' (+' + add + ' rounds)');
    return;
  } else {
    // into the bag for later: 7 (or a click in the inventory) uses it
    loadout.bag[loadout.bag.indexOf(null)] = Supply.Medkit;
  }

  feedMessage('Picked up ' + k.name);
};
