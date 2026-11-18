import { gen } from '../state';

/** Lowest and highest ground under a rectangle. */
export const groundRange = (x: number, z: number, w: number, d: number) => {
  let mn = 1e9;
  let mx = -1e9;

  for (let a = -1; a <= 1; a++) {
    for (let b = -1; b <= 1; b++) {
      const h = gen.terrain.height(x + a * w / 2, z + b * d / 2);

      mn = Math.min(mn, h);
      mx = Math.max(mx, h);
    }
  }

  return [mn, mx];
};
