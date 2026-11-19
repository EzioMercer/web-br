import { gen } from '../state';
import { Axis } from '../../../types';

export const placeGlass = (
  ax: Axis,
  c: number,
  m: number,
  w: number,
  y: number,
  h: number,
) => gen.glass.push(ax === Axis.X ? [m, c, w, 0.1, h, y] : [c, m, 0.1, w, h, y]);
