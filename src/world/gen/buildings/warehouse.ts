import { wall } from '../parts/wall';
import { markFootprint } from '../place/markFootprint';
import { placeBox } from '../place/placeBox';
import { placeLoot } from '../place/placeLoot';
import { rand } from '../random/rand';
import { Axis, FootprintKind } from '../../../types';
import { OpeningType } from '../types';
import type { BuildOpts } from '../types';

/* ----- warehouse / hangar ----- */
export const warehouse = (cx: number, cz: number, w: number, d: number, Y: number, o: BuildOpts = {}) => {
  const h = o.height || 6.5;
  const col = o.color || 0x9aa4ab;
  const x0 = cx - w / 2;
  const x1 = cx + w / 2;
  const z0 = cz - d / 2;
  const z1 = cz + d / 2;
  const gw = o.gateWidth || 6;

  wall(
    Axis.X,
    z1,
    x0,
    x1,
    Y,
    h,
    col,
    [
      { center: cx, width: gw, type: OpeningType.Gate, doorHeight: o.gateHeight || 4.5 },
      { center: x1 - 3, width: 1.4, type: OpeningType.Door },
    ],
  );
  wall(
    Axis.X,
    z0,
    x0,
    x1,
    Y,
    h,
    col,
    [
      { center: cx - w / 3, width: 2, type: OpeningType.Window, sill: 3.8, top: 5.4 },
      { center: cx + w / 3, width: 2, type: OpeningType.Window, sill: 3.8, top: 5.4 },
      { center: cx, width: 1.4, type: OpeningType.Door },
    ],
  );
  wall(
    Axis.Z,
    x0,
    z0,
    z1,
    Y,
    h,
    col,
    [
      { center: cz, width: 1.4, type: OpeningType.Door },
      { center: cz - d / 4, width: 2, type: OpeningType.Window, sill: 3.8, top: 5.4 },
      { center: cz + d / 4, width: 2, type: OpeningType.Window, sill: 3.8, top: 5.4 },
    ],
  );
  wall(
    Axis.Z,
    x1,
    z0,
    z1,
    Y,
    h,
    col,
    [
      { center: cz - d / 4, width: 2, type: OpeningType.Window, sill: 3.8, top: 5.4 },
      { center: cz + d / 4, width: 2, type: OpeningType.Window, sill: 3.8, top: 5.4 },
    ],
  );
  placeBox(cx, cz, w + 0.8, d + 0.8, 0.4, 0x6a7077, Y + h);

  // corner office in the back-left corner: 7 wide, as deep as fits in front of the door in the west wall
  const od = Math.min(7, d / 2 - 1.2);
  const rows = Math.max(2, Math.floor((w - 10) / 6));

  for (let i = 0; i < rows; i++) {
    const sx = x0 + 5 + i * ((w - 10) / Math.max(1, rows - 1));
    // a shelf beside the corner office starts past its front wall, leaving a walkway
    const s0 = sx < x0 + 8 ? Math.max(cz - 0.39 * d, z0 + od + 1.4) : cz - 0.39 * d;
    const s1 = cz + 0.06 * d;

    if (s1 - s0 > 1.5) {
      placeBox(sx, (s0 + s1) / 2, 1.2, s1 - s0, 2.8, 0x7a6a5a, Y);
    }
  }

  for (let i = 0; i < 4; i++) {
    placeBox(x0 + 3 + rand() * (w - 6), z1 - 3 - rand() * 3, 1.4, 1.4, 1.3, 0x9a7448, Y);
  }

  // office: front wall at z0 + od, side wall (with the door) at x0 + 7
  placeBox(x0 + 3.6, z0 + od, 7, 0.4, 3, col, Y);
  wall(Axis.Z, x0 + 7, z0, z0 + od, Y, 3, col, [{ center: z0 + od * 0.55, width: 1.2, type: OpeningType.Door }]);
  placeBox(x0 + 3.5, z0 + od / 2, 6.6, od - 0.2, 0.3, 0x6a7077, Y + 3, true);
  placeLoot(x0 + 2.5, z0 + Math.min(2.5, od / 2), Y, o.tier || 1);
  placeLoot(cx + w / 4, cz, Y, o.tier || 1);
  placeLoot(x1 - 2, z1 - 3, Y, 1);
  markFootprint(cx, cz, w + 1, d + 1, FootprintKind.Warehouse);
};
