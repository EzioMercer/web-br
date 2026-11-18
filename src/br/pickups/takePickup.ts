import { WEAPONS } from '../../data/weapons';
import { grenadeCount } from '../../grenades/state';
import { feedMessage } from '../../hud/feedMessage';
import { giveWeapon } from '../../loadout/giveWeapon';
import { opticTarget } from '../../loadout/opticTarget';
import { loadout } from '../../loadout/state';
import { player } from '../../player/state';
import type { GrenadeId, OpticId, Pickup } from '../../types';

export const takePickup = (k: Pickup) => {
  if (k.kind === 'weapon') {
    giveWeapon(k.itemId!, k.weaponState);
  } else if (k.kind === 'armor') {
    player.armor = 100;
  } else if (k.kind === 'grenade') {
    grenadeCount[k.itemId as GrenadeId]++;
  } else if (k.kind === 'optic') {
    const tg = opticTarget();

    if (tg) {
      loadout.owned[tg].optic = k.itemId as OpticId;

      feedMessage('Attached ' + k.name + ' to ' + WEAPONS[tg].name);
    }

    return;
  } else if (k.kind === 'ammo') {
    let add = 0;

    for (const q in loadout.owned) {
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
