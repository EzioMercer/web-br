import { house } from '../buildings/house';
import { shop } from '../buildings/shop';
import { villa } from '../buildings/villa';
import { warehouse } from '../buildings/warehouse';
import { car } from '../parts/car';
import { insideFootprint } from '../place/insideFootprint';
import { markFootprint } from '../place/markFootprint';
import { placeBox } from '../place/placeBox';
import { placeLoot } from '../place/placeLoot';
import { rand } from '../random/rand';
import { randRange } from '../random/randRange';
import { site } from './site';

/** Aurora. */
export const buildAurora = () => {
  const s = site('Aurora');
  const Y = s.groundY;
  const types = ['villa', 'shop', 'house', 'villa', 'warehouse', 'house', 'shop', 'villa'];
  let k = 0;

  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      const x = s.x + i * 30;
      const z = s.z + j * 28;

      if (!i && !j) {
        placeBox(x, z, 3, 3, 4, 0x9a9a9a, Y);
        placeBox(x, z, 10, 10, 0.5, 0x8a8a8a, Y);

        for (const q of [[-5, 0], [5, 0], [0, 5], [0, -5]]) {
          placeBox(x + q[0], z + q[1], q[0] ? 0.8 : 2, q[0] ? 2 : 0.8, 0.6, 0x6e4a2a, Y);
        }

        markFootprint(x, z, 12, 12, 'plaza');
        placeLoot(x + 3, z + 3, Y, 1);
        continue;
      }

      const t = types[k++ % types.length];

      if (t === 'villa') {
        villa(x, z, 14, 11, Y);
      } else if (t === 'shop') {
        shop(x, z, 16, 9, Y);
      } else if (t === 'house') {
        house(x, z, 10, 9, Y);
      } else {
        warehouse(x, z, 18, 12, Y, { height: 5, gateWidth: 4, gateHeight: 3.6 });
      }
    }
  }

  for (let q = 0; q < 10; q++) {
    const x = s.x + (rand() < 0.5 ? -15 : 15) + randRange(-2, 2);
    const z = s.z + randRange(-40, 40);

    if (!insideFootprint(x, z, 5)) {
      car(x, z, Y, 'z');
    }
  }
};
