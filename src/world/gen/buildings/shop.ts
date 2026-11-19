import { gap } from '../parts/gap';
import { roof } from '../parts/roof';
import { wall } from '../parts/wall';
import { markFootprint } from '../place/markFootprint';
import { placeBox } from '../place/placeBox';
import { placeLoot } from '../place/placeLoot';
import { pick } from '../random/pick';
import { Axis, FootprintKind } from '../../../types';
import { OpeningType } from '../types';
import type { BuildOpts, Opening } from '../types';

/* ----- shop ----- */
export const shop = (cx: number, cz: number, w: number, d: number, Y: number, o: BuildOpts = {}) => {
  const h = 3.8;
  const col = o.color || pick([0xd8c9ad, 0xc9a77a, 0xb9c9d3, 0xe0b9a4]);
  const sign = pick([0xd9342b, 0x2b7bd9, 0xe0b02b, 0x2bb36b, 0x9b3ad9]);
  const x0 = cx - w / 2;
  const x1 = cx + w / 2;
  const z0 = cz - d / 2;
  const z1 = cz + d / 2;
  const ops: Opening[] = [{ center: cx, width: 1.8, type: OpeningType.Door, color: 0x3a3a3a }];

  for (let x = x0 + 2.4; x < x1 - 2; x += 4.2) {
    if (gap(x, cx) > 2.9) {
      ops.push({ center: x, width: 3.2, type: OpeningType.Window, sill: 0.35, top: 2.9 });
    }
  }

  wall(Axis.X, z1, x0, x1, Y, h, col, ops);
  wall(
    Axis.X,
    z0,
    x0,
    x1,
    Y,
    h,
    col,
    [
      { center: x1 - 3, width: 1.3, type: OpeningType.Door },
      { center: x0 + 3, width: 1.6, type: OpeningType.Window, sill: 1.6, top: 2.7 },
    ],
  );
  wall(Axis.Z, x0, z0, z1, Y, h, col, [{ center: cz + 1, width: 1.6, type: OpeningType.Window }]);
  wall(Axis.Z, x1, z0, z1, Y, h, col, []);
  wall(Axis.X, z0 + 3.4, x0, x1, Y, h, col, [{ center: x1 - 3, width: 1.2, type: OpeningType.Door }]);
  roof(cx, cz, w, d, Y + h, 0x5a5a60);
  placeBox(cx, z1 + 0.35, 5, 0.3, 0.8, sign, Y + 3.95);
  placeBox(cx, z0 + 5.4, w * 0.55, 0.8, 1.1, 0x7a5a3a, Y);
  placeBox(cx - w / 4, cz + 1, w * 0.28, 0.5, 2, 0x8a7a6a, Y);
  placeBox(cx + w / 4, cz + 1, w * 0.28, 0.5, 2, 0x8a7a6a, Y);
  placeLoot(x0 + 1.6, z0 + 1.8, Y, o.tier || 1);
  placeLoot(cx + w / 4, z0 + 5, Y, o.tier || 1);
  markFootprint(cx, cz, w + 1, d + 1.4, FootprintKind.Shop);
};
