import { clock } from '../sim/state';
import type { Bot } from './types';
import { hypot } from '../utils/hypot';

/**
 * Walks bot `b` toward (tx, tz) at `speed`, sidestepping and jumping when it gets stuck. Returns the distance left,
 * or -1 when it is stuck and should pick another target.
 */
export const steer = (b: Bot, tx: number, tz: number, speed: number) => {
  const wx = tx - b.x;
  const wz = tz - b.z;
  const wd = hypot(wx, wz);

  if (b.stuck > 0.45) {
    b.detourUntil = clock.time + 1.5;
    b.detourDir = Math.random() < 0.5 ? -1 : 1;
    b.stuck = 0;

    if (Math.random() < 0.3) {
      return -1;
    }
  }

  if (b.stuck > 0.12 && b.onGround) {
    b.vel.y = 7;
  }

  let ux = wx / (wd || 1);
  let uz = wz / (wd || 1);

  if (clock.time < b.detourUntil) {
    const a = b.detourDir * 1.1;
    const c = Math.cos(a);
    const s = Math.sin(a);
    const t = ux * c - uz * s;

    uz = ux * s + uz * c;
    ux = t;
  }

  b.vel.x = ux * speed;
  b.vel.z = uz * speed;
  b.faceYaw = Math.atan2(ux, uz);
  return wd;
};
