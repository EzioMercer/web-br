import { WATER_LEVEL } from '../../../config';
import { house } from '../buildings/house';
import { placeBox } from '../place/placeBox';
import { pick } from '../random/pick';
import { randRange } from '../random/randRange';
import { gen } from '../state';
import { groundRange } from './groundRange';
import { inSiteCore } from './inSiteCore';
import { nearSite } from './nearSite';
import { roadNear } from './roadNear';
import type { Vec2 } from '../../../types';

/** Cabins on flat, quiet ground away from the sites. Returns how many. */
export const placeCabins = () => {
  const cabins: Vec2[] = [];

  for (let n = 0; n < 1500 && cabins.length < 16; n++) {
    const x = randRange(-330, 330);
    const z = randRange(-330, 330);

    if (Math.hypot(x, z) > 340) {
      continue;
    }

    const [mn, mx] = groundRange(x, z, 12, 11);
    const k = gen.terrain.kind(x, z);

    if (mn < WATER_LEVEL + 1.6
      || mx - mn > 0.5
      || nearSite(x, z, 26)
      || inSiteCore(x, z, 1)
      || k === 6
      || k === 0
      || k === 4
      || k === 5
      || roadNear(x, z)
      || cabins.some(c => Math.hypot(c[0] - x, c[1] - z) < 70)) {
      continue;
    }

    cabins.push([x, z]);
    placeBox(x, z, 12, 11, mx - mn + 0.8, 0x7a7468, mn - 0.8);
    house(x, z, 9 + 2 * (n % 2), 8, mx, { tier: 1, color: pick([0x9a7448, 0xb89a6a, 0xc9c4b8]) });
  }

  return cabins.length;
};
