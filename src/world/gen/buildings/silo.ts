import { rotateLocal } from '../parts/rotateLocal';
import { shell } from '../parts/shell';
import { placeBox } from '../place/placeBox';
import { placeLoot } from '../place/placeLoot';
import { Face } from '../../../types';
import type { BuildOpts } from '../types';

export const silo = (cx: number, cz: number, Y: number, out: number, h: number, col: number, o: BuildOpts = {}) => {
  const f = o.face || Face.South;
  const h1 = Math.min(h, 4.4);

  shell(cx, cz, Y, out, h1, col, f, { width: 1, sill: 1, top: 2.4 });

  if (h > h1 + 0.05) {
    shell(cx, cz, Y + h1, out, h - h1, col, Face.None, h - h1 >= 3.2 ? { width: 0.9, sill: 1.2, top: 2.8 } : null);
  }

  placeBox(cx, cz, out + 0.8, out + 0.8, 0.5, o.roofColor || 0x666b70, Y + h);
  placeBox(cx + out / 4, cz - out / 4, 1.3, 1.3, 1.1, 0x9a7448, Y);

  const [a, b] = rotateLocal(f, -out / 4, out / 2 - 1.6);

  placeLoot(cx + a, cz + b, Y, o.tier || 1);
};
