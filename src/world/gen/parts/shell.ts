import { wall } from './wall';
import { Axis, Face } from '../../../types';
import { OpeningType } from '../types';
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

  const dd = (m: number): Opening[] => [{ center: m, width: 1.4, type: OpeningType.Door, color: 0x4a4036 }];

  const ww = (m: number): Opening[] => win && h >= 3.2
    ? [{ center: m, width: win.width, type: OpeningType.Window, sill: win.sill, top: win.top }]
    : [];

  const op = (sd: Face, m: number) => face === sd ? dd(m) : ww(m);

  wall(Axis.X, z1, x0 - 0.2, x1 + 0.2, Y, h, col, op(Face.South, cx));
  wall(Axis.X, z0, x0 - 0.2, x1 + 0.2, Y, h, col, op(Face.North, cx));
  wall(Axis.Z, x1, z0, z1, Y, h, col, op(Face.East, cz));
  wall(Axis.Z, x0, z0, z1, Y, h, col, op(Face.West, cz));
};
