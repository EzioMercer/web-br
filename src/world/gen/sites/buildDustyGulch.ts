import { house } from '../buildings/house';
import { shop } from '../buildings/shop';
import { markFootprint } from '../place/markFootprint';
import { placeBox } from '../place/placeBox';
import { pick } from '../random/pick';
import { randInt } from '../random/randInt';
import { site } from './site';

/** Dusty Gulch. */
export const buildDustyGulch = () => {
  const s = site('Dusty Gulch');
  const Y = s.groundY;

  for (const q of [[-22, -14], [-4, -24], [16, -14], [22, 8], [-20, 12]]) {
    house(
      s.x + q[0],
      s.z + q[1],
      randInt(9, 11),
      randInt(8, 9),
      Y,
      { color: pick([0xd8b98a, 0xcaa878, 0xe0c8a0]), roofColor: 0xb08a5a },
    );
  }

  shop(s.x, s.z + 22, 16, 9, Y, { color: 0xc9a77a });

  for (const q of [[-3, -3], [3, -3], [-3, 3], [3, 3]]) {
    placeBox(s.x + q[0], s.z + q[1], 0.6, 0.6, 6, 0x6b4a2a, Y);
  }

  placeBox(s.x, s.z, 6, 6, 2.2, 0x8a6a4a, Y + 6);
  markFootprint(s.x, s.z, 7, 7, 'wtower');
  placeBox(s.x + 8, s.z + 8, 2, 2, 1, 0x888, Y);
  markFootprint(s.x + 8, s.z + 8, 3, 3, 'well');
};
