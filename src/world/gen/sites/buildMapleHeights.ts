import { house } from '../buildings/house';
import { shop } from '../buildings/shop';
import { villa } from '../buildings/villa';
import { car } from '../parts/car';
import { rand } from '../random/rand';
import { site } from './site';

/** Maple Heights. */
export const buildMapleHeights = () => {
  const s = site('Maple Heights');
  const Y = s.groundY;

  for (const rz of [-16, 16]) {
    for (const rx of [-30, -10, 10, 30]) {
      house(s.x + rx, s.z + rz, 10, 9, Y);

      if (rand() < 0.6) {
        car(s.x + rx + 7.5, s.z + rz + 8, Y, 'z');
      }
    }
  }

  villa(s.x, s.z - 36, 14, 11, Y);
  shop(s.x + 14, s.z + 29, 14, 8, Y);
};
