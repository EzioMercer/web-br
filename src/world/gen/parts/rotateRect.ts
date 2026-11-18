import { rotateLocal } from './rotateLocal';
import type { Face } from '../../../types';

export const rotateRect = (f: Face, lx: number, lz: number, sx: number, sz: number) => {
  const [a, b] = rotateLocal(f, lx, lz);

  return f === 'e' || f === 'w' ? [a, b, sz, sx] : [a, b, sx, sz];
};
