import { spawnPickup } from '../br/pickups/spawnPickup';
import { looting } from '../br/pickups/state';
import { OPTICS } from '../data/optics';
import { WEAPONS } from '../data/weapons';
import { feedMessage } from '../hud/feedMessage';
import { opticTarget } from './opticTarget';
import { loadout } from './state';
import type { OpticId, Pickup } from '../types';
import { removePickup } from '../br/pickups/removePickup';
import { PickupKind } from '../types';

export const swapOptic = (k: Pickup) => {
  const tg = opticTarget();

  if (!tg) {
    return;
  }

  const old = loadout.owned[tg].optic;

  loadout.owned[tg].optic = k.itemId as OpticId;

  if (old) {
    // left on the ground: E picks it up again, walking over it does not
    spawnPickup(k.x, k.z, PickupKind.Optic, old, undefined, k.y).manual = true;
  }

  removePickup(k);
  looting.swapTarget = null;
  feedMessage('Attached ' + OPTICS[k.itemId as OpticId].name + ' to ' + WEAPONS[tg].name);
};
