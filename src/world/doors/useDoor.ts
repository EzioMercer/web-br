import { bots } from '../../bots/state';
import { playerBody } from '../../player/state';
import { doorSound } from './doorSound';
import { findDoor } from './findDoor';
import type { Body, Door } from '../../types';
import { swingAwayFrom } from './swingAwayFrom';

// a door will not shut on somebody standing in the doorway
const doorBlocked = (d: Door) => {
  const k = d.box;
  const m = 0.45;

  const hit = (a: Body) => Math.abs(a.y - d.y) < 2.8
    && a.x > k.min[0] - m
    && a.x < k.max[0] + m
    && a.z > k.min[2] - m
    && a.z < k.max[2] + m;

  return hit(playerBody) || bots.some(b => b.health > 0 && hit(b));
};

export const useDoor = () => {
  const d = findDoor();

  if (!d) {
    return;
  }

  if (d.target) {
    if (doorBlocked(d)) {
      return;
    }

    d.target = 0;
    d.closedByPlayer = true;
  } else {
    swingAwayFrom(d, playerBody);

    d.target = 1;
    d.closedByPlayer = false;
  }

  doorSound();
};
