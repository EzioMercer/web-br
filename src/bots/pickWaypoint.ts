import { zone } from '../br/zone/state';
import { playerBody } from '../player/state';
import { level } from '../world/level/state';
import type { Bot } from './types';

/** A new walk target: somewhere dry in the (next) zone, sometimes near the player. */
export const pickWaypoint = (b: Bot) => {
  const zt = zone.next || zone;

  for (let k = 0; k < 14; k++) {
    const a = Math.random() * 6.283;
    const r = Math.sqrt(Math.random()) * zt.radius * 0.8;

    b.targetX = zt.cx + Math.cos(a) * r;
    b.targetZ = zt.cz + Math.sin(a) * r;

    if (level.terrain!.height(b.targetX, b.targetZ) > 1.5) {
      break;
    }
  }

  if (!b.running && Math.random() < 0.35 && Math.hypot(playerBody.x - b.x, playerBody.z - b.z) < 120) {
    b.targetX = playerBody.x + (Math.random() - 0.5) * 12;
    b.targetZ = playerBody.z + (Math.random() - 0.5) * 12;
  }
};
