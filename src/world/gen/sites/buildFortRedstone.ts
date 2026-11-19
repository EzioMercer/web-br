import { house } from '../buildings/house';
import { stairTower } from '../buildings/stairTower';
import { tower } from '../buildings/tower';
import { wall } from '../parts/wall';
import { insideFootprint } from '../place/insideFootprint';
import { placeBox } from '../place/placeBox';
import { randRange } from '../random/randRange';
import { site } from './site';
import { Axis, Face, FootprintKind } from '../../../types';
import { OpeningType } from '../types';

/** Fort Redstone. */
export const buildFortRedstone = () => {
  const s = site('Fort Redstone');
  const Y = s.groundY;
  const hh = 26;
  const c = 0x8a8f94;
  const th = 1.2;

  wall(
    Axis.X,
    s.z - hh,
    s.x - hh,
    s.x + hh,
    Y,
    5,
    c,
    [{ center: s.x, width: 8, type: OpeningType.Gate, doorHeight: 4.2 }],
    th,
  );
  wall(
    Axis.X,
    s.z + hh,
    s.x - hh,
    s.x + hh,
    Y,
    5,
    c,
    [{ center: s.x, width: 8, type: OpeningType.Gate, doorHeight: 4.2 }],
    th,
  );
  wall(Axis.Z, s.x - hh, s.z - hh, s.z + hh, Y, 5, c, [], th);
  wall(Axis.Z, s.x + hh, s.z - hh, s.z + hh, Y, 5, c, [], th);

  for (const q of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const x = s.x + q[0] * (hh - 4);
    const z = s.z + q[1] * (hh - 4);

    stairTower(
      x,
      z,
      Y,
      {
        size: 6.4,
        height: 13,
        color: 0x7a7f84,
        roofColor: 0x555a60,
        face: q[0] < 0 ? Face.East : Face.West,
        footprintKind: FootprintKind.FortTower,
      },
    );
  }

  house(s.x - 8, s.z - 14, 24, 9, Y, { color: 0x9aa08c, roofColor: 0x555a50, tier: 2 });
  house(s.x - 8, s.z + 14, 24, 9, Y, { color: 0x9aa08c, roofColor: 0x555a50, tier: 2 });
  house(s.x + 15, s.z + 2, 10, 9, Y, { color: 0x7a7f84, roofColor: 0x44484c, tier: 2 });
  tower(s.x + 14, s.z - 16, Y, 14);
  placeBox(s.x + 15, s.z + 19, 12, 12, 0.05, 0x55585a, Y + 0.03, true);

  for (let q = 0; q < 14; q++) {
    const x = s.x + randRange(-22, 22);
    const z = s.z + randRange(-22, 22);

    if (!insideFootprint(x, z, 4.5)) {
      placeBox(x, z, 3, 1, 1.1, 0x9a8a6a, Y);
    }
  }
};
