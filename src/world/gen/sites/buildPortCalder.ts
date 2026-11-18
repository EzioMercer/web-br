import { containers } from '../buildings/containers';
import { shop } from '../buildings/shop';
import { warehouse } from '../buildings/warehouse';
import { placeBox } from '../place/placeBox';
import { placeLoot } from '../place/placeLoot';
import { site } from './site';

/** Port Calder. */
export const buildPortCalder = () => {
  const s = site('Port Calder');
  const Y = s.groundY;

  warehouse(s.x - 24, s.z - 20, 26, 14, Y, { tier: 1 });
  warehouse(s.x - 26, s.z + 14, 22, 12, Y, { tier: 1, gateWidth: 5 });
  shop(s.x + 4, s.z + 30, 13, 9, Y, { tier: 2 });
  containers(s.x - 10, s.z - 38, Y, 3, 2, true);

  for (const pz of [-14, 10]) {
    placeBox(s.x + 52, s.z + pz, 64, 5, 0.5, 0x7a6a58, Y - 0.3);

    for (let k = 24; k <= 84; k += 12) {
      placeBox(s.x + k, s.z + pz - 2.2, 0.6, 0.6, 1, 0x333, Y + 0.2);
    }
  }

  for (const q of [-4, 4]) {
    placeBox(s.x + 34, s.z - 14 + q, 1.4, 1.4, 18, 0xd9822b, Y);
    placeBox(s.x + 34 + 0, s.z - 14, 2.2, 10, 2.2, 0xd9822b, Y + 18);
  }

  placeLoot(s.x + 60, s.z - 14, Y + 0.2, 2);
  placeLoot(s.x + 60, s.z + 10, Y + 0.2, 2);
};
