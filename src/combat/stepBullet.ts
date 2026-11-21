import type * as THREE from 'three';
import { alarmBot } from '../bots/alarmBot';
import { Alarm } from '../bots/types';
import { bots } from '../bots/state';
import { bulletMark } from '../effects/bulletMark';
import { screenFx, transientFx } from '../effects/state';
import { castRay } from '../physics/castRay';
import { rayBox } from '../physics/rayBox';
import { segmentHitsSphere } from '../physics/segmentHitsSphere';
import { collision } from '../physics/state';
import { clock } from '../sim/state';
import { breakGlass } from '../world/doors/breakGlass';
import { killBot } from './killBot';
import type { Bot } from '../bots/types';
import type { Vec3 } from '../types';
import type { Bullet } from './types';

/** Gravity on bullets (m/s²). */
const BULLET_GRAVITY = 9.8;

/** Bullets vanish after this many metres. */
const MAX_FLIGHT = 1100;

/** Length of the tracer streak behind a bullet (m). */
const STREAK = 14;

/** Moves bullet `bl` by one step of `dt`; returns true once it has hit something or flown its course. */
export const stepBullet = (bl: Bullet, dt: number) => {
  const o: Vec3 = [bl.x, bl.y, bl.z];
  const s: Vec3 = [bl.vx * dt, bl.vy * dt - 0.5 * BULLET_GRAVITY * dt * dt, bl.vz * dt];
  const len = Math.hypot(...s);
  const d: Vec3 = [s[0] / len, s[1] / len, s[2] / len];
  let best = castRay(o, d, len);
  let tgt: Bot | null = null;
  let mult = 1;
  let gb = 0;

  for (let gi = 0; gi < 4 && collision.lastHit && collision.lastHit.glass && best <= len; gi++) {
    breakGlass(collision.lastHit);
    gb += best + 0.06;
    best = gb + castRay([o[0] + d[0] * gb, o[1] + d[1] * gb, o[2] + d[2] * gb], d, Math.max(0.01, len - gb));
  }

  for (const b of bots) {
    if (b.health <= 0) {
      continue;
    }

    const yo = b.y - 0.5 * b.crouchAmount;
    const tb = rayBox(o, d, [b.x - 0.3, b.y, b.z - 0.3], [b.x + 0.3, yo + 1.45, b.z + 0.3]);
    const th = rayBox(o, d, [b.x - 0.17, yo + 1.45, b.z - 0.17], [b.x + 0.17, yo + 1.85, b.z + 0.17]);
    const t = Math.min(tb, th);

    if (t < best && t <= len) {
      best = t;
      tgt = b;

      const y = o[1] + d[1] * t;

      mult = th < tb ? 4 : (y < b.y + 0.7 ? 0.75 : 1);
    }
  }

  const done = best <= len;
  const reach = Math.min(best, len);
  const e: Vec3 = [o[0] + d[0] * reach, o[1] + d[1] * reach, o[2] + d[2] * reach];

  for (const b of bots) {
    if (b !== tgt && b.health > 0 && clock.time - b.underFireAt > 0.3 && segmentHitsSphere(o, e, {
      x: b.x,
      y: b.y + 1.1,
      z: b.z,
      radius: 2.5,
    })) {
      alarmBot(b, Alarm.NearMiss);
    }
  }

  bl.flown += reach;
  bl.x = e[0];
  bl.y = e[1];
  bl.z = e[2];
  bl.vy -= BULLET_GRAVITY * dt;

  // the streak trails the bullet, from the muzzle until the bullet is a streak's length away from it
  const p = bl.streak.geometry.attributes.position as THREE.BufferAttribute;
  const k = Math.min(1, STREAK / Math.max(bl.flown, 1e-6));

  p.setXYZ(0, e[0] + (bl.muzzle[0] - e[0]) * k, e[1] + (bl.muzzle[1] - e[1]) * k, e[2] + (bl.muzzle[2] - e[2]) * k);
  p.setXYZ(1, ...e);
  p.needsUpdate = true;
  bl.streak.geometry.computeBoundingSphere();

  if (tgt) {
    tgt.health -= bl.weapon.damage * mult;
    alarmBot(tgt, Alarm.Hit);
    screenFx.hitMarker = 1;

    if (tgt.health <= 0) {
      killBot(tgt, mult >= 4);
    }
  } else if (done && best < 1e8) {
    bulletMark([e[0] - d[0] * 0.03, e[1] - d[1] * 0.03, e[2] - d[2] * 0.03]);
  }

  if (done || bl.flown > MAX_FLIGHT || bl.y < -30) {
    transientFx.push({ mesh: bl.streak, life: 0.07, max: 0.07 });
    return true;
  }

  return false;
};
