import type { Vec3 } from '../types';

/** Distance along the ray to the box (0 if `o` is inside), or Infinity. */
export const rayBox = (o: Vec3, d: Vec3, mn: Vec3, mx: Vec3) => {
  let t0 = 0;
  let t1 = 1e9;

  for (let i = 0; i < 3; i++) {
    const inv = 1 / (d[i] || 1e-9);
    let a = (mn[i] - o[i]) * inv;
    let b = (mx[i] - o[i]) * inv;

    if (a > b) {
      const t = a;

      a = b;
      b = t;
    }

    if (a > t0) {
      t0 = a;
    }

    if (b < t1) {
      t1 = b;
    }

    if (t0 > t1) {
      return Infinity;
    }
  }

  return t0;
};
