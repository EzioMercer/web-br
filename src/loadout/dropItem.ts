import { spawnPickup } from '../br/pickups/spawnPickup';
import { feedMessage } from '../hud/feedMessage';
import { player, playerBody } from '../player/state';
import { isOptic } from './isOptic';
import { itemAt } from './itemAt';
import { setItemAt } from './setItemAt';
import { PickupKind, Supply } from '../types';

/** Throws the item in slot `key` (see `itemAt`) on the ground in front of the player. It waits there for E. */
export const dropItem = (key: string) => {
  const it = itemAt(key);

  if (!it) {
    return;
  }

  setItemAt(key, null);

  const k = spawnPickup(
    playerBody.x - Math.sin(player.yaw) * 0.9,
    playerBody.z - Math.cos(player.yaw) * 0.9,
    isOptic(it) ? PickupKind.Optic : it === Supply.Medkit ? PickupKind.Health : PickupKind.Armor,
    isOptic(it) ? it : null,
    undefined,
    playerBody.y,
  );

  k.manual = true;
  feedMessage('Dropped ' + k.name);
};
