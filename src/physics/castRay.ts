import { level } from '../world/level/state';
import { rayTerrain } from '../world/terrain/rayTerrain';
import { rayGrid } from './rayGrid';
import { collision } from './state';
import type { Vec3 } from '../types';

/** Distance along the ray to the first wall or the ground, or Infinity. Sets `lastHit` to the box hit. */
export const castRay = (o: Vec3, d: Vec3, maxTIn?: number, noGlass?: boolean) => {
  const maxT = maxTIn || 1e4;

  return rayGrid(collision.grid, o, d, rayTerrain(level.terrain, o, d, Math.min(maxT, 1500)), maxT, noGlass);
};
