import { car } from '../parts/car';
import { table } from '../parts/table';
import { wall } from '../parts/wall';
import { markFootprint } from '../place/markFootprint';
import { placeBox } from '../place/placeBox';
import { placeLoot } from '../place/placeLoot';
import { rand } from '../random/rand';
import { Axis, FootprintKind } from '../../../types';
import { OpeningType } from '../types';
import type { Opening } from '../types';

/* ----- mall (landmark) ----- */
export const mall = (cx: number, cz: number, Y: number) => {
  const w = 56;
  const d = 34;
  const h = 5.5;
  const x0 = cx - 28;
  const x1 = cx + 28;
  const z0 = cz - 17;
  const z1 = cz + 17;
  const col = 0xd8d2c4;
  const az0 = cz - 5;
  const az1 = cz + 5;
  const fr: Opening[] = [];

  for (const xx of [-24, -17, -3.5, 3.5, 17, 24]) {
    fr.push({ center: cx + xx, width: 4, type: OpeningType.Window, sill: 0.5, top: 4.4 });
  }

  for (const xx of [-10, 10]) {
    fr.push({ center: cx + xx - 0.9, width: 1.7, type: OpeningType.Door, doorHeight: 3.4, color: 0x4a5a6a });
    fr.push({ center: cx + xx + 0.9, width: 1.7, type: OpeningType.Door, doorHeight: 3.4, color: 0x4a5a6a });
  }

  wall(Axis.X, z1, x0, x1, Y, h, col, fr);
  wall(
    Axis.X,
    z0,
    x0,
    x1,
    Y,
    h,
    col,
    [
      { center: cx + 20, width: 1.8, type: OpeningType.Door, doorHeight: 3 },
      { center: cx - 15, width: 3, type: OpeningType.Window, sill: 3.6, top: 4.8 },
      { center: cx + 3, width: 3, type: OpeningType.Window, sill: 3.6, top: 4.8 },
      { center: cx + 12, width: 3, type: OpeningType.Window, sill: 3.6, top: 4.8 },
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
      { center: cz, width: 1.8, type: OpeningType.Door, doorHeight: 3 },
      { center: cz - 9, width: 3, type: OpeningType.Window, sill: 1.2, top: 3.6 },
      { center: cz + 9, width: 3, type: OpeningType.Window, sill: 1.2, top: 3.6 },
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
      { center: cz, width: 1.8, type: OpeningType.Door, doorHeight: 3 },
      { center: cz - 9, width: 3, type: OpeningType.Window, sill: 1.2, top: 3.6 },
      { center: cz + 9, width: 3, type: OpeningType.Window, sill: 1.2, top: 3.6 },
    ],
  );
  placeBox(cx, cz, w + 1, d + 1, 0.4, 0x77787a, Y + h);
  placeBox(cx, z1 + 0.4, w, 0.5, 0.9, 0xc9342b, Y + h + 0.2);

  // north row: six shops (8.67 m wide, 12 deep) facing the atrium
  for (let i = 0; i < 6; i++) {
    const sx0 = x0 + 2 + i * (w - 4) / 6;
    const sx1 = sx0 + (w - 4) / 6;
    const sm = (sx0 + sx1) / 2;

    wall(Axis.Z, sx0, z0, az0, Y, h, col, []);
    wall(
      Axis.X,
      az0,
      sx0,
      sx1,
      Y,
      h,
      col,
      [
        { center: sm - 1.5, width: 1.6, type: OpeningType.Door, color: 0x3a3a3a },
        { center: sm + 1.7, width: 3, type: OpeningType.Window, sill: 0.4, top: 3 },
      ],
    );
    placeBox(sm, z0 + 2, sx1 - sx0 - 2, 0.8, 1.1, 0x7a5a3a, Y);
    placeBox(sm, z0 + 6, sx1 - sx0 - 3, 0.5, 2, 0x8a7a6a, Y);
    placeLoot(sm - 2.5, z0 + 4, Y, 2);
  }

  wall(Axis.Z, x1 - 2, z0, az0, Y, h, col, []);

  // south row: shops either side of the two entrance bays
  for (const [a, b] of [[-26, -13.5], [-6.5, 6.5], [13.5, 26]]) {
    const sx0 = cx + a;
    const sx1 = cx + b;
    const sm = (sx0 + sx1) / 2;

    wall(
      Axis.X,
      az1,
      sx0,
      sx1,
      Y,
      h,
      col,
      [
        { center: sm - 1.2, width: 1.6, type: OpeningType.Door, color: 0x3a3a3a },
        { center: sm + Math.min(2.6, (b - a) / 2 - 1.8), width: 3, type: OpeningType.Window, sill: 0.4, top: 3 },
      ],
    );
    placeBox(sm, z1 - 2, sx1 - sx0 - 2, 0.8, 1.1, 0x7a5a3a, Y);
    placeBox(sm, z1 - 6, sx1 - sx0 - 3, 0.5, 2, 0x8a7a6a, Y);
    placeLoot(sm - 2.5, z1 - 4, Y, 2);
  }

  for (const xx of [-26, -13.5, -6.5, 6.5, 13.5, 26]) {
    wall(Axis.Z, cx + xx, az1, z1, Y, h, col, []);
  }

  for (const xx of [-18, -6, 6, 18]) {
    placeBox(cx + xx, cz, 1, 1, h - 0.2, 0xbfb8a8, Y);
    placeBox(cx + xx + 3, cz + 2.5, 2.2, 1.4, 0.5, 0x4a7a3a, Y);
    table(cx + xx - 3, cz - 2.5, Y, 1.4, 1.4);
  }

  placeLoot(cx, cz - 2.5, Y, 2);
  placeLoot(cx - 12, cz + 2.5, Y, 2);
  placeLoot(cx + 12, cz - 2.5, Y, 2);
  markFootprint(cx, cz, w + 2, d + 2, FootprintKind.Mall);
  // car park south of the mall
  placeBox(cx, z1 + 17, w + 6, 26, 0.02, 0x55585a, Y + 0.03, true);

  for (let r = 0; r < 3; r++) {
    for (let c = -4; c <= 4; c++) {
      if (rand() < 0.55) {
        car(cx + c * 6, z1 + 10 + r * 8, Y, Axis.Z);
      }
    }
  }

  for (const xx of [-24, 0, 24]) {
    placeBox(cx + xx, z1 + 22, 0.5, 0.5, 7, 0x666, Y);
  }

  markFootprint(cx, z1 + 17, w + 6, 26, FootprintKind.CarPark);
};
