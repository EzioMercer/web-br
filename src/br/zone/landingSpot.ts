import { isFreeSpot } from '../../physics/isFreeSpot';
import { playerBody } from '../../player/state';
import { level } from '../../world/level/state';
import type { Vec2 } from '../../types';

/** A random clear, dry, flat spot on the island, at least `minD` from the player if `fromP`. */
export const landingSpot = (minD: number, fromP: boolean): Vec2 => {
  const T = level.terrain!;

  for (let i = 0; i < 300; i++) {
    const a = Math.random() * 6.283;
    const r = Math.sqrt(Math.random()) * 330;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;

    if (T.height(x, z) > 2
      && T.slope(x, z) < 0.35
      && [[0, 0], [3, 0], [-3, 0], [0, 3], [0, -3]].every(([p, q]) => isFreeSpot(x + p, z + q))
      && (!fromP || Math.hypot(x - playerBody.x, z - playerBody.z) > minD)) {
      return [x, z];
    }
  }

  return [0, 0];
};
