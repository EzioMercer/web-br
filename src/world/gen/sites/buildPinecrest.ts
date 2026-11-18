import { house } from '../buildings/house';
import { shop } from '../buildings/shop';
import { tower } from '../buildings/tower';
import { warehouse } from '../buildings/warehouse';
import { insideFootprint } from '../place/insideFootprint';
import { placeBox } from '../place/placeBox';
import { pick } from '../random/pick';
import { randInt } from '../random/randInt';
import { randRange } from '../random/randRange';
import { site } from './site';

/** Pinecrest. */
export const buildPinecrest = () => {
  const s = site('Pinecrest');
  const Y = s.groundY;

  for (const q of [[-28, -8], [-14, -26], [8, -30], [28, -12], [30, 12], [-30, 14], [-12, 26]]) {
    house(
      s.x + q[0],
      s.z + q[1],
      randInt(9, 11),
      randInt(8, 9),
      Y,
      { roofColor: 0x5a4a3a, color: pick([0xc9a77a, 0xb89a6a, 0xd6c3a0]) },
    );
  }

  warehouse(s.x - 2, s.z + 2, 10, 18, Y, { height: 6, gateWidth: 3, gateHeight: 3.2, color: 0xc9c4b8, tier: 1 });
  tower(s.x + 11, s.z - 6, Y, 14);
  shop(s.x + 14, s.z + 28, 14, 8, Y);

  for (let q = 0; q < 5; q++) {
    const x = s.x + randRange(-34, 34);
    const z = s.z + randRange(-34, 34);

    if (Math.hypot(x - s.x, z - s.z) < 38 && !insideFootprint(x, z, 4.5)) {
      placeBox(x, z, 2.4, 1.2, 1.1, 0x7a5a3a, Y);
    }
  }
};
