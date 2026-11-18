import { wall } from './wall';
import type { Face } from '../../../types';
import type { Opening, ShellWindow } from '../types';

export const shell = (
  cx: number,
  cz: number,
  Y: number,
  out: number,
  h: number,
  col: number,
  face: Face,
  win: ShellWindow | null,
) => {
  const x0 = cx - out / 2;
  const x1 = cx + out / 2;
  const z0 = cz - out / 2;
  const z1 = cz + out / 2;

  const dd = (m: number): Opening[] => [{ center: m, width: 1.4, type: 'door', color: 0x4a4036 }];

  const ww = (m: number): Opening[] => win && h >= 3.2
    ? [{ center: m, width: win.width, type: 'window', sill: win.sill, top: win.top }]
    : [];

  const op = (sd: Face, m: number) => face === sd ? dd(m) : ww(m);

  wall('x', z1, x0 - 0.2, x1 + 0.2, Y, h, col, op('s', cx));
  wall('x', z0, x0 - 0.2, x1 + 0.2, Y, h, col, op('n', cx));
  wall('z', x1, z0, z1, Y, h, col, op('e', cz));
  wall('z', x0, z0, z1, Y, h, col, op('w', cz));
};
