import { level } from '../world/level/state';
import { rayTerrain } from '../world/terrain/rayTerrain';
import { cellKey } from './cellKey';
import { rayBox } from './rayBox';
import { CELL, collision } from './state';
import type { Vec3 } from '../types';

let lastRay = 0;

/** Distance along the ray to the first wall or the ground, or Infinity. Sets `lastHit` to the box hit. */
export const castRay = (o: Vec3, d: Vec3, maxTIn?: number, noGlass?: boolean) => {
  const maxT = maxTIn || 1e4;
  let t = rayTerrain(level.terrain, o, d, Math.min(maxT, 1500));

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
    const a = collision.grid.get(cellKey(i, j));

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
