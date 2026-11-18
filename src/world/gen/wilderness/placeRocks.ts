import { placeBox } from '../place/placeBox';
import { pick } from '../random/pick';
import { rand } from '../random/rand';
import { randInt } from '../random/randInt';
import { randRange } from '../random/randRange';
import { gen } from '../state';
import { inSiteCore } from './inSiteCore';

/** Rock clusters on steep rocky and snowy ground. Returns how many. */
export const placeRocks = () => {
  let rockCount = 0;

  for (let x = -345; x < 345; x += 13) {
    for (let z = -345; z < 345; z += 13) {
      const px = x + randRange(-5, 5);
      const pz = z + randRange(-5, 5);
      const k = gen.terrain.kind(px, pz);

      if (k !== 4 && k !== 5) {
        continue;
      }

      if (gen.terrain.slope(px, pz) < 0.3 || rand() < 0.7 || inSiteCore(px, pz, 0.95)) {
        continue;
      }

      const h = gen.terrain.height(px, pz);
      const n = randInt(1, 3);

      for (let q = 0; q < n; q++) {
        const sz = randRange(2.2, 6);
        const hh = randRange(1.6, 4.5);
        const rx = px + randRange(-3, 3);
        const rz = pz + randRange(-3, 3);

        placeBox(
          rx,
          rz,
          sz,
          sz * randRange(0.7, 1.3),
          hh,
          pick([0x8a867c, 0x77736a, 0x9a968c]),
          gen.terrain.height(rx, rz) - 1.4,
        );

        if (h > 38) {
          placeBox(rx, rz, sz * 0.8, sz * 0.8, 0.5, 0xf1f4f6, gen.terrain.height(rx, rz) - 1.4 + hh);
        }
      }

      rockCount++;
    }
  }

  return rockCount;
};
