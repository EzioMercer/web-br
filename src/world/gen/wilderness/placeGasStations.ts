import { WATER_LEVEL } from '../../../config';
import { shop } from '../buildings/shop';
import { insideFootprint } from '../place/insideFootprint';
import { markFootprint } from '../place/markFootprint';
import { placeBox } from '../place/placeBox';
import { rand } from '../random/rand';
import { randRange } from '../random/randRange';
import { gen } from '../state';
import { groundRange } from './groundRange';
import { nearSite } from './nearSite';
import { roadNear } from './roadNear';

/** Gas stations next to the roads. Returns how many. */
export const placeGasStations = () => {
  let gasStations = 0;

  for (const rd of gen.terrain.roads) {
    if (gasStations >= 4) {
      break;
    }

    for (let tries = 0; tries < 12; tries++) {
      const p = rd[Math.floor(randRange(0.2, 0.8) * rd.length)];
      const x = p[0] + randRange(10, 16) * (rand() < 0.5 ? -1 : 1);
      const z = p[1] + randRange(10, 16) * (rand() < 0.5 ? -1 : 1);
      const [mn, mx] = groundRange(x, z, 16, 22);

      if (mn < WATER_LEVEL + 1.6
        || mx - mn > 0.5
        || nearSite(x, z, 24)
        || insideFootprint(x, z, 12)
        || roadNear(x, z)) {
        continue;
      }

      placeBox(x, z, 18, 24, mx - mn + 0.8, 0x6a6e72, mn - 0.8);
      shop(x, z, 12, 8, mx, { tier: 1, color: 0xe0e0e0 });
      placeBox(x, z + 12, 10, 6, 0.4, 0xc9342b, mx + 4.2);

      for (const q of [-4, 4]) {
        placeBox(x + q, z + 9.5, 0.6, 0.6, 4.2, 0x666, mx);
      }

      for (const q of [-2.5, 2.5]) {
        placeBox(x + q, z + 12, 1, 0.8, 1.6, 0x2a2a2a, mx);
      }

      markFootprint(x, z + 6, 14, 22, 'gas');
      gasStations++;
      break;
    }
  }

  return gasStations;
};
