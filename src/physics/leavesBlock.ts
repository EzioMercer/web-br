import { rayGrid } from './rayGrid';
import { collision } from './state';
import type { Vec3 } from '../types';
import { hypot } from '../utils/hypot';

const dir: Vec3 = [0, 0, 0];

/**
 * Whether a tree crown lies across the segment from `o` to `p`. Kept out of `lineOfSight` on purpose: leaves hide
 * the player from bots, but they stop neither bullets nor grenade blasts.
 */
export const leavesBlock = (o: Vec3, p: Vec3) => {
  const l = hypot(p[0] - o[0], p[1] - o[1], p[2] - o[2]) || 1;
  const hit = collision.lastHit;

  dir[0] = (p[0] - o[0]) / l;
  dir[1] = (p[1] - o[1]) / l;
  dir[2] = (p[2] - o[2]) / l;

  const t = rayGrid(collision.leaves, o, dir, l, l);

  // a crown is never what a bullet or blade hit: leave castRay's answer as it was
  collision.lastHit = hit;
  return t < l;
};
