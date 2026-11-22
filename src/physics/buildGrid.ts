import { boxes, leaves } from '../world/level/state';
import { cellKey } from './cellKey';
import { CELL, collision } from './state';
import type { Box } from '../types';

/** Grid of `list` by CELL-sized cells: each cell lists the boxes that reach into it. */
const gridOf = (list: Box[]) => {
  const grid = new Map<number, Box[]>();

  for (const b of list) {
    b.rayStamp = 0;

    const i0 = Math.floor(b.min[0] / CELL);
    const i1 = Math.floor(b.max[0] / CELL);
    const j0 = Math.floor(b.min[2] / CELL);
    const j1 = Math.floor(b.max[2] / CELL);

    for (let i = i0; i <= i1; i++) {
      for (let j = j0; j <= j1; j++) {
        const k = cellKey(i, j);
        let a = grid.get(k);

        if (!a) {
          a = [];
          grid.set(k, a);
        }

        a.push(b);
      }
    }
  }

  return grid;
};

export const buildGrid = () => {
  collision.grid = gridOf(boxes);
  collision.leaves = gridOf(leaves);
};
