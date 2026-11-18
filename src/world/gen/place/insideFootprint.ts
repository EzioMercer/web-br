import { gen } from '../state';

export const insideFootprint = (
  x: number,
  z: number,
  m: number,
) => gen.footprints.some(f => Math.abs(x - f[0]) < f[2] / 2 + m && Math.abs(z - f[1]) < f[3] / 2 + m);
