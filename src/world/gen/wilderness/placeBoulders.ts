import { WATER_LEVEL } from '../../../config';
import { MOUNTAINS } from '../../terrain/constants';
import { insideFootprint } from '../place/insideFootprint';
import { placeBox } from '../place/placeBox';
import { pick } from '../random/pick';
import { rand } from '../random/rand';
import { randInt } from '../random/randInt';
import { randRange } from '../random/randRange';
import { gen } from '../state';
import { inSiteCore } from './inSiteCore';
import { roadNear } from './roadNear';

/**
 * Boulder fields on the mountain flanks, so a climb toward a sniper on the top has cover from one boulder to the
 * next. The summits stay bare: whoever holds them is in the open. Returns how many clusters.
 */
export const placeBoulders = () => {
  let clusters = 0;

  for (const m of MOUNTAINS) {
    for (let x = m.x - m.radius; x < m.x + m.radius; x += 10) {
      for (let z = m.z - m.radius; z < m.z + m.radius; z += 10) {
        const px = x + randRange(-4, 4);
        const pz = z + randRange(-4, 4);
        const d = Math.hypot(px - m.x, pz - m.z) / m.radius;

        // a bare summit, then denser cover partway down the slopes
        if (d > 0.95 || d < 0.16 || rand() > 0.42 - 0.2 * Math.abs(d - 0.5)) {
          continue;
        }

        const h = gen.terrain.height(px, pz);

        if (h < WATER_LEVEL + 1.5
          || gen.terrain.slope(px, pz) > 1.1
          || inSiteCore(px, pz, 1.1)
          || roadNear(px, pz)
          || insideFootprint(px, pz, 4)) {
          continue;
        }

        const n = randInt(1, 3);

        for (let q = 0; q < n; q++) {
          const rx = px + randRange(-2.5, 2.5);
          const rz = pz + randRange(-2.5, 2.5);
          const sz = randRange(1.8, 4.2);

          placeBox(
            rx,
            rz,
            sz,
            sz * randRange(0.7, 1.3),
            randRange(1.5, 3.2),
            pick([0x8a867c, 0x77736a, 0x9a968c, 0x6f6b62]),
            gen.terrain.height(rx, rz) - 1,
          );
        }

        clusters++;
      }
    }
  }

  return clusters;
};
