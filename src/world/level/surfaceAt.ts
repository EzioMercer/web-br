import { level } from './state';
import { waterDepth } from './waterDepth';
import { Surface } from '../../audio/types';

/** Footstep surface at a point. */
export const surfaceAt = (x: number, z: number, y: number): Surface => {
  if (waterDepth(x, z, y) > 0) {
    return Surface.Water;
  }

  return level.terrain ? level.terrain.surface(x, z) : Surface.Grass;
};
