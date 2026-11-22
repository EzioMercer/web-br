import { cellKey } from './cellKey';
import { rayBox } from './rayBox';
import { CELL, collision } from './state';
import type { Box, Vec3 } from '../types';

let lastRay = 0;

/**
 * Walks the ray from `o` along unit `d` through the cells of `grid` and returns the distance to the first box in it,
 * or `t` when none is nearer (`t` is what already stops the ray, such as the ground). Stops looking past `maxT`.
 * Sets `collision.lastHit` to the box hit.
 */
export const rayGrid = (grid: Map<number, Box[]>, o: Vec3, d: Vec3, t: number, maxT: number, noGlass?: boolean) => {
  collision.lastHit = null;

  const qi = ++lastRay;
  const dx = d[0];
  const dz = d[2];
  const ax = Math.abs(dx) < 1e-9;
  const az = Math.abs(dz) < 1e-9;
  let i = Math.floor(o[0] / CELL);
  let j = Math.floor(o[2] / CELL);
  const sx = dx > 0 ? 1 : -1;
  const sz = dz > 0 ? 1 : -1;
  const tdx = ax ? 1e9 : CELL / Math.abs(dx);
  const tdz = az ? 1e9 : CELL / Math.abs(dz);
  let tx = ax ? 1e9 : (dx > 0 ? ((i + 1) * CELL - o[0]) : (i * CELL - o[0])) / dx;
  let tz = az ? 1e9 : (dz > 0 ? ((j + 1) * CELL - o[2]) : (j * CELL - o[2])) / dz;

  for (let n = 0; n < 4000; n++) {
    const a = grid.get(cellKey(i, j));

    if (a) {
      for (const b of a) {
        if (b.rayStamp === qi) {
          continue;
        }

        b.rayStamp = qi;

        if (b.disabled || (noGlass && b.glass)) {
          continue;
        }

        const r = rayBox(o, d, b.min, b.max);

        if (r < t) {
          t = r;
          collision.lastHit = b;
        }
      }
    }

    const nx = tx < tz ? tx : tz;

    if (t <= nx || nx > maxT) {
      break;
    }

    if (tx < tz) {
      i += sx;
      tx += tdx;
    } else {
      j += sz;
      tz += tdz;
    }
  }

  return t;
};
