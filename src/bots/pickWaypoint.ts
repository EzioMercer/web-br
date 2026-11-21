import { zone } from '../br/zone/state';
import { WEAPONS } from '../data/weapons';
import { isFreeSpot } from '../physics/isFreeSpot';
import { playerBody } from '../player/state';
import { level } from '../world/level/state';
import type { Bot } from './types';

/**
 * A new walk target: somewhere dry in the (next) zone, sometimes near the player. Bots with sniper rifles often head
 * for the highest ground they can find instead, to hold it.
 */
export const pickWaypoint = (b: Bot) => {
  const zt = zone.next || zone;
  const T = level.terrain!;

  b.toOverwatch = false;

  if (WEAPONS[b.weaponId].sniper && !b.running && Math.random() < 0.45) {
    let bestY = -Infinity;

    for (let k = 0; k < 24; k++) {
      const a = Math.random() * 6.283;
      const r = Math.sqrt(Math.random()) * zt.radius * 0.8;
      const x = zt.cx + Math.cos(a) * r;
      const z = zt.cz + Math.sin(a) * r;
      const y = T.height(x, z);

      if (y > bestY && y > 1.5 && isFreeSpot(x, z)) {
        bestY = y;
        b.targetX = x;
        b.targetZ = z;
        b.toOverwatch = true;
      }
    }

    if (b.toOverwatch) {
      return;
    }
  }

  for (let k = 0; k < 14; k++) {
    const a = Math.random() * 6.283;
    const r = Math.sqrt(Math.random()) * zt.radius * 0.8;

    b.targetX = zt.cx + Math.cos(a) * r;
    b.targetZ = zt.cz + Math.sin(a) * r;

    if (T.height(b.targetX, b.targetZ) > 1.5) {
      break;
    }
  }

  if (!b.running && Math.random() < 0.35 && Math.hypot(playerBody.x - b.x, playerBody.z - b.z) < 120) {
    b.targetX = playerBody.x + (Math.random() - 0.5) * 12;
    b.targetZ = playerBody.z + (Math.random() - 0.5) * 12;
  }
};
