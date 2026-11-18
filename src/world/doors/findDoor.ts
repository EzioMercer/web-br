import { player, playerBody } from '../../player/state';
import { doors } from './state';
import type { Door } from '../../types';
import { viewDir } from '../../player/viewDir';

// the door you are facing (or standing right next to), for the E key and the on-screen prompt
export const findDoor = () => {
  if (player.dead) {
    return null;
  }

  let best: Door | null = null;
  let bs = 0;
  const [fx, , fz] = viewDir();
  const fl = Math.hypot(fx, fz) || 1;

  for (const d of doors) {
    const dx = d.x - playerBody.x;
    const dz = d.z - playerBody.z;
    const dist = Math.hypot(dx, dz);

    if (dist > 2.6 || Math.abs(playerBody.y - d.y) > 2.4) {
      continue;
    }

    const dot = dist > 0.01 ? (dx * fx + dz * fz) / (dist * fl) : 1;

    if (dist > 1.3 && dot < 0.3) {
      continue;
    }

    const sc = dist - dot;

    if (!best || sc < bs) {
      best = d;
      bs = sc;
    }
  }

  return best;
};
