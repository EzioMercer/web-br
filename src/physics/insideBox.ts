import { boxesNear } from './boxesNear';

/** Point inside (or touching) a box. */
export const insideBox = (x: number, y: number, z: number) => {
  return boxesNear(x, z, 1).some(
    b => !b.disabled
      && x > b.min[0] - 0.06
      && x < b.max[0] + 0.06
      && y > b.min[1] - 0.06
      && y < b.max[1] + 0.06
      && z > b.min[2] - 0.06
      && z < b.max[2] + 0.06,
  );
};
