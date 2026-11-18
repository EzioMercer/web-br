import { WATER_LEVEL } from '../../../config';
import { insideFootprint } from '../place/insideFootprint';
import { randRange } from '../random/randRange';
import { gen } from '../state';

/** Loose loot spots in the open. */
export const scatterLoot = () => {
  for (let n = 0; n < 600 && gen.loot.length < gen.loot.length + 1; n++) {
    if (n >= 40) {
      break;
    }

    const x = randRange(-330, 330);
    const z = randRange(-330, 330);
    const h = gen.terrain.height(x, z);

    if (h < WATER_LEVEL + 2
      || gen.terrain.slope(x, z) > 0.3
      || insideFootprint(x, z, 2)
      || gen.terrain.kind(x, z) === 0) {
      continue;
    }

    gen.loot.push([x, z, h, 1]);
  }
};
