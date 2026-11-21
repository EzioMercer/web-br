import { zone } from '../br/zone/state';
import { isFreeSpot } from '../physics/isFreeSpot';
import { lineOfSight } from '../physics/lineOfSight';
import { floorY } from '../world/level/floorY';
import type { Vec2, Vec3 } from '../types';
import type { Bot } from './types';

/** Golden angle, to spread the candidate spots around the bot. */
const GOLDEN = 2.39996;

/**
 * The nearest spot (within about 24 m) where bot `b`, crouching, is hidden from a shooter at `from`: behind a rock,
 * a tree, a wall or a ridge. Prefers not to run toward the shooter. Null if there is none.
 */
export const findCover = (b: Bot, from: Vec3): Vec2 | null => {
  const zt = zone.next || zone;
  const d0 = Math.hypot(b.x - from[0], b.z - from[2]);
  const a0 = Math.random() * 6.283;
  let best: Vec2 | null = null;
  let bestScore = Infinity;

  for (let k = 0; k < 30; k++) {
    const r = 3 + (k % 8) * 3 * (0.8 + Math.random() * 0.4);
    const a = a0 + k * GOLDEN;
    const x = b.x + Math.cos(a) * r;
    const z = b.z + Math.sin(a) * r;
    const closer = Math.max(0, d0 - Math.hypot(x - from[0], z - from[2]));
    const score = r + closer * 2;

    if (score >= bestScore
      || Math.hypot(x - zone.cx, z - zone.cz) > zone.radius - 3
      || Math.hypot(x - zt.cx, z - zt.cz) > zt.radius + 10
      || !isFreeSpot(x, z)) {
      continue;
    }

    const y = floorY(x, z);

    if (!lineOfSight(from, [x, y + 1.15, z]) && !lineOfSight(from, [x, y + 0.7, z])) {
      best = [x, z];
      bestScore = score;
    }
  }

  return best;
};
