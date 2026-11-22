import { cellKey } from './cellKey';
import { CELL, collision, EMPTY } from './state';
import type { Box } from '../types';

/**
 * Boxes in the grid cells around (x, z). Pass `out` to have them collected into that array (emptied first) instead of
 * a new one: hot code reuses its arrays. Either way the result is only for reading.
 */
export const boxesNear = (x: number, z: number, r: number, out: Box[] = []) => {
  const i0 = Math.floor((x - r) / CELL);
  const i1 = Math.floor((x + r) / CELL);
  const j0 = Math.floor((z - r) / CELL);
  const j1 = Math.floor((z + r) / CELL);

  if (i0 === i1 && j0 === j1) {
    return collision.grid.get(cellKey(i0, j0)) || EMPTY;
  }

  out.length = 0;

  for (let i = i0; i <= i1; i++) {
    for (let j = j0; j <= j1; j++) {
      const a = collision.grid.get(cellKey(i, j));

      if (a) {
        for (const b of a) {
          out.push(b);
        }
      }
    }
  }

  return out;
};
