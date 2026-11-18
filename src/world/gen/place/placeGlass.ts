import { gen } from '../state';

export const placeGlass = (
  ax: 'x' | 'z',
  c: number,
  m: number,
  w: number,
  y: number,
  h: number,
) => gen.glass.push(ax === 'x' ? [m, c, w, 0.1, h, y] : [c, m, 0.1, w, h, y]);
