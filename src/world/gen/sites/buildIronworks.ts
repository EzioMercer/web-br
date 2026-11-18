import { containers } from '../buildings/containers';
import { silo } from '../buildings/silo';
import { warehouse } from '../buildings/warehouse';
import { markFootprint } from '../place/markFootprint';
import { placeBox } from '../place/placeBox';
import { site } from './site';

/** Ironworks. */
export const buildIronworks = () => {
  const s = site('Ironworks');
  const Y = s.groundY;

  warehouse(s.x - 20, s.z - 18, 30, 18, Y, { tier: 1 });
  warehouse(s.x + 14, s.z - 20, 24, 16, Y, { tier: 1 });
  warehouse(s.x + 8, s.z + 16, 28, 14, Y, { height: 8, gateWidth: 6, gateHeight: 5.5, color: 0x8a8f94, tier: 2 });
  placeBox(s.x + 26, s.z + 16, 4, 4, 34, 0x7a7468, Y);
  markFootprint(s.x + 26, s.z + 16, 5, 5, 'stack');

  for (const q of [[-30, 10], [-30, 24], [-18, 32]]) {
    silo(s.x + q[0], s.z + q[1], Y, 8, 7, 0x8a9098, { face: q[0] < -20 ? 'e' : 'n' });
    markFootprint(s.x + q[0], s.z + q[1], 9, 9, 'tank');
  }

  containers(s.x + 4, s.z + 38, Y, 2, 1, false);

  for (let q = 0; q < 5; q++) {
    placeBox(s.x - 12 + q * 7, s.z - 2, 1, 1, 3, 0x666b70, Y);
  }
};
