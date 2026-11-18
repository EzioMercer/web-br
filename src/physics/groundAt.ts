import { floorY } from '../world/level/floorY';
import { boxesNear } from './boxesNear';

// the surface under a point: the terrain, or the top of a floor, roof or crate no higher than y0
export const groundAt = (x: number, z: number, y0: number) => {
  let g = floorY(x, z);

  for (const q of boxesNear(x, z, 0.5)) {
    if (!q.disabled
      && !q.glass
      && !q.door
      && x + 0.3 > q.min[0]
      && x - 0.3 < q.max[0]
      && z + 0.3 > q.min[2]
      && z - 0.3 < q.max[2]
      && q.max[1] <= y0
      && q.max[1] > g) {
      g = q.max[1];
    }
  }

  return g;
};
