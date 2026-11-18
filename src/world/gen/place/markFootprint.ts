import { gen } from '../state';

export const markFootprint = (
  x: number,
  z: number,
  w: number,
  d: number,
  n?: string,
) => gen.footprints.push([x, z, w, d, n || '']);
