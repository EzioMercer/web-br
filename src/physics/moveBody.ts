import { PLAYER_HEIGHT, PLAYER_RADIUS, WATER_LEVEL } from '../config';
import { floorY } from '../world/level/floorY';
import { level } from '../world/level/state';
import { boxesNear } from './boxesNear';
import { overlaps } from './overlaps';
import type { Body, Velocity } from '../types';

export const moveBody = (p: Body, v: Velocity, dt: number) => {
  const g0 = p.onGround;
  const half = level.terrain ? level.terrain.half - 3 : 1e9;
  const ox = p.x;

  p.x += v.x * dt;

  for (const b of boxesNear(p.x, p.z, PLAYER_RADIUS + 0.6)) {
    if (overlaps(p, b)) {
      if (p.onGround && b.max[1] - p.y <= 0.55) {
        const y0 = p.y;

        p.y = b.max[1] + 1e-4;

        if (!boxesNear(p.x, p.z, PLAYER_RADIUS + 0.6).some(q => overlaps(p, q))) {
          continue;
        }

        p.y = y0;
      }

      p.x = v.x > 0 ? b.min[0] - PLAYER_RADIUS - 1e-4 : b.max[0] + PLAYER_RADIUS + 1e-4;
      v.x = 0;
    }
  }

  if (level.terrain) {
    if (Math.abs(p.x) > half) {
      p.x = Math.max(-half, Math.min(half, p.x));
    }

    const nf = level.terrain.height(p.x, p.z);

    if (nf - p.y > Math.abs(p.x - ox) * 1.2 + 0.12 || (nf < WATER_LEVEL - 1.4 && nf < level.terrain.height(ox, p.z))) {
      p.x = ox;
      v.x = 0;
    }
  }

  const oz = p.z;

  p.z += v.z * dt;

  for (const b of boxesNear(p.x, p.z, PLAYER_RADIUS + 0.6)) {
    if (overlaps(p, b)) {
      if (p.onGround && b.max[1] - p.y <= 0.55) {
        const y0 = p.y;

        p.y = b.max[1] + 1e-4;

        if (!boxesNear(p.x, p.z, PLAYER_RADIUS + 0.6).some(q => overlaps(p, q))) {
          continue;
        }

        p.y = y0;
      }

      p.z = v.z > 0 ? b.min[2] - PLAYER_RADIUS - 1e-4 : b.max[2] + PLAYER_RADIUS + 1e-4;
      v.z = 0;
    }
  }

  if (level.terrain) {
    if (Math.abs(p.z) > half) {
      p.z = Math.max(-half, Math.min(half, p.z));
    }

    const nf = level.terrain.height(p.x, p.z);

    if (nf - p.y > Math.abs(p.z - oz) * 1.2 + 0.12 || (nf < WATER_LEVEL - 1.4 && nf < level.terrain.height(p.x, oz))) {
      p.z = oz;
      v.z = 0;
    }
  }

  p.onGround = false;
  p.y += v.y * dt;

  for (const b of boxesNear(p.x, p.z, PLAYER_RADIUS + 0.6)) {
    if (overlaps(p, b)) {
      if (v.y <= 0) {
        p.y = b.max[1] + 1e-4;
        p.onGround = true;
      } else {
        p.y = b.min[1] - (p.height || PLAYER_HEIGHT) - 1e-4;
      }

      v.y = 0;
    }
  }

  const fy = floorY(p.x, p.z);

  if (p.y <= fy) {
    p.y = fy;

    if (v.y < 0) {
      v.y = 0;
    }

    p.onGround = true;
  } else if (g0 && !p.onGround && v.y <= 0 && p.y - fy < 0.45) {
    p.y = fy;
    v.y = 0;
    p.onGround = true;
  }
};
