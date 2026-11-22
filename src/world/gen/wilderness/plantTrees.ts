import { WATER_LEVEL } from '../../../config';
import { makeNoise } from '../../terrain/makeNoise';
import { insideFootprint } from '../place/insideFootprint';
import { placeBox } from '../place/placeBox';
import { pick } from '../random/pick';
import { rand } from '../random/rand';
import { randRange } from '../random/randRange';
import { gen } from '../state';
import { inSiteCore } from './inSiteCore';
import { nearSite } from './nearSite';
import { roadNear } from './roadNear';

/** Forests on grassland. Returns the number of trees. */
export const plantTrees = () => {
  const { n2 } = makeNoise(31);
  let treeCount = 0;

  for (let x = -345; x < 345; x += 9) {
    for (let z = -345; z < 345; z += 9) {
      const px = x + randRange(-3, 3);
      const pz = z + randRange(-3, 3);
      const k = gen.terrain.kind(px, pz);

      if (k !== 2 && k !== 3 && k !== 9) {
        continue;
      }

      const sl = gen.terrain.slope(px, pz);
      const h = gen.terrain.height(px, pz);

      if (sl > 0.5 || h < WATER_LEVEL + 1.4) {
        continue;
      }

      const fd = n2(px * 0.011 + 9, pz * 0.011 + 4);

      if (fd < (k === 9 ? 0.5 : 0.67)
        || rand() < 0.12
        || inSiteCore(px, pz, 0.95)
        || roadNear(px, pz)
        || insideFootprint(px, pz, 3)
        || nearSite(px, pz, -2)) {
        continue;
      }

      const pine = h > 16 || rand() < 0.35;
      const gc = pick([0x2f6b2f, 0x3a7a38, 0x2a5a2a]);

      placeBox(px, pz, 0.9, 0.9, 5, 0x6b4a2a, h - 0.6);

      if (pine) {
        placeBox(px, pz, 4.6, 4.6, 2.2, gc, h + 2.4, 'leaves');
        placeBox(px, pz, 2.8, 2.8, 2.2, gc, h + 4.4, 'leaves');
        placeBox(px, pz, 1.2, 1.2, 1.4, gc, h + 6.4, 'leaves');
      } else {
        placeBox(px, pz, 5.2, 5.2, 3, gc, h + 3.4, 'leaves');
      }

      treeCount++;

      if (treeCount > 1300) {
        break;
      }
    }
  }

  return treeCount;
};
