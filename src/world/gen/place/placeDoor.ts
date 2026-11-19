import { gen } from '../state';
import type { Axis } from '../../../types';

export const placeDoor = (
  ax: Axis,
  c: number,
  m: number,
  w: number,
  y: number,
  h: number,
  col?: number,
) => gen.doors.push({ axis: ax, wallAt: c, center: m, width: w, y, height: h, color: col || 0x6b4a2a });
