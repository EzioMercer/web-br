import { bots } from '../../bots/state';
import { player, playerBody } from '../../player/state';
import { doorSound } from './doorSound';
import { findDoor } from './findDoor';
import { doorFocus, doors } from './state';
import type { Body, Door } from '../../types';
import { swingAwayFrom } from './swingAwayFrom';
import { doorAngle } from './doorAngle';
import { drawDoor } from './drawDoor';

let doorTimer = 0;

/** Opens doors for anyone walking up to them and animates them (every 50 ms). */
export const doorsTick = (dt: number) => {
  if (!doors.length) {
    doorFocus.door = null;
    return;
  }

  doorTimer += dt;

  if (doorTimer < 0.05) {
    return;
  }

  const st = doorTimer;

  doorTimer = 0;

  const acts: Body[] = bots.filter(b => b.health > 0);

  if (!player.dead) {
    acts.push(playerBody);
  }

  doorFocus.door = findDoor();

  for (const d of doors) {
    if (d.closedByPlayer && Math.hypot(playerBody.x - d.x, playerBody.z - d.z) > Math.sqrt(d.reachSq) + 0.8) {
      d.closedByPlayer = false;
    }

    if (d.target === 0) {
      let who: Body | null = null;
      let bd = d.reachSq;

      for (const a of acts) {
        if (a === playerBody && d.closedByPlayer) {
          continue;
        }

        const dx = a.x - d.x;
        const dz = a.z - d.z;
        const q = dx * dx + dz * dz;

        if (q < bd && Math.abs(a.y - d.y) < 2.8) {
          bd = q;
          who = a;
        }
      }

      if (who) {
        swingAwayFrom(d, who);

        d.target = 1;

        if (inEarshot(d)) {
          doorSound();
        }
      }
    }

    if (d.openAmount !== d.target) {
      d.openAmount += Math.sign(d.target - d.openAmount) * Math.min(Math.abs(d.target - d.openAmount), st * 3.2);
      d.pivot.rotation.y = doorAngle(d);
      drawDoor(d);
      d.box.disabled = d.openAmount > 0.5;
    }
  }
};

/** Close enough to the player to hear. */
const inEarshot = (d: Door) => {
  return Math.hypot(d.x - playerBody.x, d.z - playerBody.z) < 30;
};
