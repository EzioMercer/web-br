import { WEAPONS } from '../../data/weapons';
import { grenadeCount } from '../../grenades/state';
import { feedMessage } from '../../hud/feedMessage';
import { giveWeapon } from '../../loadout/giveWeapon';
import { opticTarget } from '../../loadout/opticTarget';
import { loadout } from '../../loadout/state';
import { player } from '../../player/state';
import { PickupKind } from '../../types';
import type { GrenadeId, OpticId, Pickup } from '../../types';
import type { WeaponId } from '../../types';

export const takePickup = (k: Pickup) => {
  if (k.kind === PickupKind.Weapon) {
    giveWeapon(k.itemId as WeaponId, k.weaponState);
  } else if (k.kind === PickupKind.Armor) {
    player.armor = 100;
  } else if (k.kind === PickupKind.Grenade) {
    grenadeCount[k.itemId as GrenadeId]++;
  } else if (k.kind === PickupKind.Optic) {
    const tg = opticTarget();

    if (tg) {
      loadout.owned[tg].optic = k.itemId as OpticId;

      feedMessage('Attached ' + k.name + ' to ' + WEAPONS[tg].name);
    }

    return;
  } else if (k.kind === PickupKind.Ammo) {
    let add = 0;

    for (const q of Object.keys(loadout.owned) as WeaponId[]) {
      if (WEAPONS[q].ammoType === k.itemId) {
        add = WEAPONS[q].magSize * 2;

        if (q === loadout.weaponId) {
          loadout.reserve += add;
        } else {
          loadout.owned[q].reserve += add;
        }
      }
    }

    feedMessage('Picked up ' + k.name + ' (+' + add + ' rounds)');
    return;
  } else {
    player.health = Math.min(100, player.health + 50);
  }

  feedMessage('Picked up ' + k.name);
};
