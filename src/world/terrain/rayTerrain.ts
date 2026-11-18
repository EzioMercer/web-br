import type { Vec3 } from '../../types';
import type { Terrain } from './types';

/** Distance along the ray from `o` in direction `d` to the terrain, or Infinity. */
export const rayTerrain = (T: Terrain | null, o: Vec3, d: Vec3, maxT: number) => {
  if (!T) {
    return Infinity;
  }

  const lim = Math.min(maxT, 1500);

  if (d[1] >= 0 && o[1] > T.maxHeight + 2) {
    return Infinity;
  }

  let t = 0;
  let step = 1.2;

  if (o[1] - T.height(o[0], o[2]) < -0.6) {
    return 0;
  }

  while (t < lim) {
    t += step;

    const x = o[0] + d[0] * t;
    const z = o[2] + d[2] * t;

    if ((Math.abs(x) > T.half || Math.abs(z) > T.half) && d[1] >= 0) {
      return Infinity;
    }

    if (o[1] + d[1] * t - T.height(x, z) < 0) {
      let a = t - step;
      let b = t;

      for (let k = 0; k < 7; k++) {
        const m = (a + b) / 2;

        if (o[1] + d[1] * m - T.height(o[0] + d[0] * m, o[2] + d[2] * m) < 0) {
          b = m;
        } else {
          a = m;
        }
      }

      return b;
    }

    if (d[1] >= 0 && o[1] + d[1] * t > T.maxHeight + 2) {
      return Infinity;
    }

    step = Math.min(6, step * 1.05 + 0.03);
  }

  return Infinity;
};
