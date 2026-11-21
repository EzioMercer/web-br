import { spawnPickup } from '../br/pickups/spawnPickup';
import { OPTICS } from '../data/optics';
import { feedMessage } from '../hud/feedMessage';
import { player, playerBody } from '../player/state';
import { opticAt } from './opticAt';
import { setOpticAt } from './setOpticAt';
import { PickupKind } from '../types';

/** Throws the optic in slot `key` (see `opticAt`) on the ground in front of the player. It waits there for E. */
export const dropOptic = (key: string) => {
  const o = opticAt(key);

  if (!o) {
    return;
  }

  setOpticAt(key, null);

  const k = spawnPickup(
    playerBody.x - Math.sin(player.yaw) * 0.9,
    playerBody.z - Math.cos(player.yaw) * 0.9,
    PickupKind.Optic,
    o,
    undefined,
    playerBody.y,
  );

  k.manual = true;
  feedMessage('Dropped ' + OPTICS[o].name);
};
