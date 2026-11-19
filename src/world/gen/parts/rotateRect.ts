import { rotateLocal } from './rotateLocal';
import { Face } from '../../../types';

export const rotateRect = (f: Face, lx: number, lz: number, sx: number, sz: number) => {
  const [a, b] = rotateLocal(f, lx, lz);

  return f === Face.East || f === Face.West ? [a, b, sz, sx] : [a, b, sx, sz];
};
