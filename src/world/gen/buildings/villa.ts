import { dropWindowsAtDoors } from '../parts/dropWindowsAtDoors';
import { roof } from '../parts/roof';
import { wall } from '../parts/wall';
import { markFootprint } from '../place/markFootprint';
import { placeBox } from '../place/placeBox';
import { placeLoot } from '../place/placeLoot';
import { pick } from '../random/pick';
import { randRange } from '../random/randRange';
import { Axis, FootprintKind } from '../../../types';
import { OpeningType } from '../types';
import type { BuildOpts } from '../types';

/* ----- villa / apartment block (2 floors, stairs) ----- */
export const villa = (cx: number, cz: number, w: number, d: number, Y: number, o: BuildOpts = {}) => {
  const h = 3.2;
  const col = o.color || pick([0xe8dcc0, 0xd8c9ad, 0xc9d3d9, 0xd7b9a4]);
  const rc = o.roofColor || 0x6b6358;
  const x0 = cx - w / 2;
  const x1 = cx + w / 2;
  const z0 = cz - d / 2;
  const z1 = cz + d / 2;
  const Y2 = Y + 3.5;
  const dm = cx + randRange(1, w / 5);
  const pz = cz + d / 6;

  wall(
    Axis.X,
    z1,
    x0,
    x1,
    Y,
    h,
    col,
    dropWindowsAtDoors(
      [
        { center: dm, width: 1.6, type: OpeningType.Door, color: 0x4a3a2a },
        { center: cx - w / 3, width: 1.8, type: OpeningType.Window },
        { center: cx + w / 2 - 2, width: 1.8, type: OpeningType.Window },
        { center: cx - w / 2 + 1.8, width: 1.4, type: OpeningType.Window },
      ],
    ),
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
      { center: cx + w / 4, width: 1.4, type: OpeningType.Door },
      { center: cx, width: 1.8, type: OpeningType.Window },
      { center: cx - w / 3, width: 1.8, type: OpeningType.Window },
    ],
  );
  wall(Axis.Z, x0, z0, z1, Y, h, col, [{ center: cz + 1, width: 1.8, type: OpeningType.Window }]);
  wall(Axis.Z, x1, z0, z1, Y, h, col, [{ center: cz - 1, width: 1.8, type: OpeningType.Window }]);
  wall(Axis.X, pz, x0 + 9, x1, Y, h, col, [{ center: cx + randRange(2, w / 4), width: 1.3, type: OpeningType.Door }]);

  for (let i = 1; i <= 8; i++) {
    placeBox(x0 + 1.4 + (i - 0.5), z0 + 1.5, 1, 2.3, 0.4375 * i, 0x8a6a4a, Y);
  }

  // upper slab: everything except the stairwell hole (x0..x0+9.4, z0..z0+3)
  placeBox((x0 + 9.4 + x1) / 2, (z0 + z1) / 2, x1 - x0 - 9.4, d, 0.3, 0xa89b84, Y + 3.2);
  placeBox(x0 + 4.7, (z0 + 3 + z1) / 2, 9.4, z1 - z0 - 3, 0.3, 0xa89b84, Y + 3.2);
  wall(
    Axis.X,
    z1,
    x0,
    x1,
    Y2,
    h,
    col,
    [
      { center: cx - w / 3, width: 1.8, type: OpeningType.Window },
      { center: cx, width: 1.8, type: OpeningType.Window },
      { center: cx + w / 4, width: 1.8, type: OpeningType.Window },
    ],
  );
  wall(
    Axis.X,
    z0,
    x0,
    x1,
    Y2,
    h,
    col,
    [
      { center: cx - w / 4, width: 1.8, type: OpeningType.Window },
      { center: cx + w / 4, width: 1.8, type: OpeningType.Window },
    ],
  );
  wall(Axis.Z, x0, z0, z1, Y2, h, col, [{ center: cz, width: 1.8, type: OpeningType.Window }]);
  wall(Axis.Z, x1, z0, z1, Y2, h, col, [{ center: cz, width: 1.8, type: OpeningType.Window }]);
  wall(Axis.Z, cx + w / 6, z0 + 3, z1, Y2, h, col, [{ center: cz + d / 6, width: 1.2, type: OpeningType.Door }]);
  roof(cx, cz, w, d, Y2 + h, rc);
  placeBox(cx + w / 4, pz + 2, 2.2, 1, 0.8, 0x6e4a2a, Y);
  placeBox(cx - w / 3, cz + d / 4, 2, 1, 0.6, 0xd8d2c4, Y2);
  placeLoot(x1 - 1.6, z0 + 2, Y, o.tier || 1);
  placeLoot(x0 + 1.6, z1 - 1.6, Y, 1);
  placeLoot(x1 - 1.6, z1 - 1.6, Y2, o.tier || 1);
  placeLoot(x0 + 1.8, z0 + 4.2, Y2, 1);
  markFootprint(cx, cz, w + 1, d + 1, FootprintKind.Villa);
};
