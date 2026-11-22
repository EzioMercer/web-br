import type { MapBox } from '../../../types';
import { gen } from '../state';

export const placeBox = (
  x: number,
  z: number,
  w: number,
  d: number,
  h: number,
  c: number,
  y?: number,
  nc?: MapBox[7],
  hidden?: boolean,
) => gen.boxes.push(hidden ? [x, z, w, d, h, c, y, nc, hidden] : [x, z, w, d, h, c, y, nc]);
