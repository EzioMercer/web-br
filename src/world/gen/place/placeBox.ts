import { gen } from '../state';

export const placeBox = (
  x: number,
  z: number,
  w: number,
  d: number,
  h: number,
  c: number,
  y?: number,
  nc?: boolean | 'leaves',
) => gen.boxes.push([x, z, w, d, h, c, y, nc]);
