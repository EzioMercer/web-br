import { rotateLocal } from '../parts/rotateLocal';
import { rotateRect } from '../parts/rotateRect';
import { shell } from '../parts/shell';
import { markFootprint } from '../place/markFootprint';
import { placeBox } from '../place/placeBox';
import { placeLoot } from '../place/placeLoot';
import { gen } from '../state';
import type { Stairwell } from '../../../types';
import type { BuildOpts } from '../types';

export const stairTower = (cx: number, cz: number, Y: number, o: BuildOpts = {}) => {
  const out = o.size || 6.4;
  const f = o.face || 's';
  const col = o.color || 0xbfc4c8;
  const RISE = 0.45;
  const sw = 1.2;
  const inn = out - 0.4;
  const hi = inn / 2;
  const TD = 0.8;
  // one loop of stair cells around the inside of the shaft (local frame, door on +z): up the west wall, across the
  // north wall, down the east wall, back along the south wall
  const n1 = Math.floor((inn - 1 - sw) / TD);
  const n2 = Math.floor((inn - 2 * sw) / TD);
  const t1 = (inn - 1 - sw) / n1;
  const t2 = (inn - 2 * sw) / n2;
  /** Stair cells: local centre x and z, size x and z. */
  const C: [number, number, number, number][] = [];

  for (let j = 0; j < n1; j++) {
    C.push([-hi + sw / 2, hi - 1 - t1 * (j + 0.5), sw, t1]);
  }

  C.push([-hi + sw / 2, -hi + sw / 2, sw, sw]);

  for (let j = 0; j < n2; j++) {
    C.push([-hi + sw + t2 * (j + 0.5), -hi + sw / 2, t2, sw]);
  }

  C.push([hi - sw / 2, -hi + sw / 2, sw, sw]);

  for (let j = 0; j < n2; j++) {
    C.push([hi - sw / 2, -hi + sw + t2 * (j + 0.5), sw, t2]);
  }

  C.push([hi - sw / 2, hi - sw / 2, sw, sw]);

  for (let j = 0; j < n2; j++) {
    C.push([hi - sw - t2 * (j + 0.5), hi - sw / 2, t2, sw]);
  }

  const N = Math.max(C.length, Math.round((o.height || 14) / RISE) - 1);
  const hf = (N + 1) * RISE;
  const rec: Stairwell = { cx, cz, baseY: Y, floorHeight: hf, face: f, treads: [] };
  const last: (typeof C)[number][] = [];

  for (let k = 1; k <= N; k++) {
    const c = C[(k - 1) % C.length];
    const [a, b, w, d] = rotateRect(f, c[0], c[1], c[2], c[3]);

    placeBox(cx + a, cz + b, w, d, 0.45, 0x8a6a4a, Y + k * RISE - 0.45);
    rec.treads.push([cx + a, cz + b, Y + k * RISE]);

    if (k * RISE > hf - 2.3) {
      last.push(c);
    }
  }

  for (let y = 0; y < hf - 0.01; y += 4) {
    const hh = Math.min(4, hf - y);

    shell(
      cx,
      cz,
      Y + y,
      out,
      hh,
      col,
      y === 0 ? f : '-',
      y === 0 ? { width: 1.2, sill: 1, top: 2.4 } : { width: 0.9, sill: 1, top: 2.6 },
    );
  }

  // lookout floor: a grid of cells, minus the ones above the last few treads (headroom)
  {
    const G = Math.round(inn / 0.4);
    const cs = inn / G;

    for (let r = 0; r < G; r++) {
      let run = -1;

      for (let q = 0; q <= G; q++) {
        const x0 = -hi + q * cs;
        const z0 = -hi + r * cs;
        let free = q < G;

        if (free) {
          for (const c of last) {
            if (x0 < c[0] + c[2] / 2 + 0.05
              && x0 + cs > c[0] - c[2] / 2 - 0.05
              && z0 < c[1] + c[3] / 2 + 0.05
              && z0 + cs > c[1] - c[3] / 2 - 0.05) {
              free = false;
              break;
            }
          }
        }

        if (free && run < 0) {
          run = q;
        }

        if (!free && run >= 0) {
          const xa = -hi + run * cs;
          const xb = -hi + q * cs;
          const [a, b, w, d] = rotateRect(f, (xa + xb) / 2, -hi + (r + 0.5) * cs, xb - xa, cs);

          placeBox(cx + a, cz + b, w + 0.02, d + 0.02, 0.3, 0xa89b84, Y + hf - 0.3);
          run = -1;
        }
      }
    }
  }
  shell(cx, cz, Y + hf, out, 3.2, col, '-', { width: 3.2, sill: 0.9, top: 2.5 });
  placeBox(cx, cz, out + 0.9, out + 0.9, 0.4, o.roofColor || 0x444a50, Y + hf + 3.2);
  {
    const [a, b] = rotateLocal(f, 0.2, -1.4);

    placeLoot(cx + a, cz + b, Y + hf, 2);
  } {
    const [a, b] = rotateLocal(f, -0.6, hi - 1.5);

    placeLoot(cx + a, cz + b, Y, 1);
  }
  rec.door = rotateLocal(f, 0, out / 2).map((v, i) => (i ? cz : cx) + v);
  gen.stairwells.push(rec);
  markFootprint(cx, cz, out + 1, out + 1, o.footprintKind || 'tower');
  return rec;
};
