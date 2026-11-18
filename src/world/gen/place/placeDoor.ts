import { gen } from '../state';

export const placeDoor = (
  ax: 'x' | 'z',
  c: number,
  m: number,
  w: number,
  y: number,
  h: number,
  col?: number,
) => gen.doors.push({ axis: ax, wallAt: c, center: m, width: w, y, height: h, color: col || 0x6b4a2a });
