import { PLAYER_HEIGHT, PLAYER_RADIUS, WATER_LEVEL } from '../config';
import { floorY } from '../world/level/floorY';
import { level } from '../world/level/state';
import { boxesNear } from './boxesNear';
import { overlaps } from './overlaps';

/** Dry, gentle ground with room to stand. */
export const isFreeSpot = (x: number, z: number) => {
  const T = level.terrain!;

  if (T.height(x, z) < WATER_LEVEL + 0.4 || T.slope(x, z) > 0.55) {
    return false;
  }

  const y = floorY(x, z);

  return !boxesNear(x, z, PLAYER_RADIUS + 1).some(q => overlaps({ x, y, z, height: PLAYER_HEIGHT }, q));
};
