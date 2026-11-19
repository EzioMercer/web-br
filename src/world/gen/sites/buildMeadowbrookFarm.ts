import { house } from '../buildings/house';
import { silo } from '../buildings/silo';
import { warehouse } from '../buildings/warehouse';
import { markFootprint } from '../place/markFootprint';
import { placeBox } from '../place/placeBox';
import { placeLoot } from '../place/placeLoot';
import { randRange } from '../random/randRange';
import { site } from './site';
import { Face, FootprintKind } from '../../../types';

/** Meadowbrook Farm. */
export const buildMeadowbrookFarm = () => {
  const s = site('Meadowbrook Farm');
  const Y = s.groundY;

  warehouse(s.x - 18, s.z - 10, 22, 14, Y, { height: 6.5, gateWidth: 6, gateHeight: 4.6, color: 0x8a3a2e, tier: 1 });
  house(s.x + 14, s.z - 18, 12, 9, Y);

  for (const q of [[22, 8], [22, 16], [30, 12]]) {
    silo(s.x + q[0], s.z + q[1], Y, 6, 14, 0xc9ccd0, { roofColor: 0x888888, face: q[0] > 25 ? Face.East : Face.West });
    markFootprint(s.x + q[0], s.z + q[1], 7, 7, FootprintKind.Silo);
  }

  for (let k = 0; k <= 24; k += 2) {
    placeBox(s.x - 30 + k, s.z + 14, 0.3, 0.3, 1.1, 0x6b4a2a, Y);
    placeBox(s.x - 30 + k, s.z + 40, 0.3, 0.3, 1.1, 0x6b4a2a, Y);
  }

  placeBox(s.x - 18, s.z + 14, 24, 0.2, 0.3, 0x6b4a2a, Y + 0.8);
  placeBox(s.x - 18, s.z + 40, 24, 0.2, 0.3, 0x6b4a2a, Y + 0.8);
  markFootprint(s.x - 18, s.z + 27, 26, 28, FootprintKind.Paddock);

  for (let q = 0; q < 8; q++) {
    placeBox(s.x - 30 + randRange(0, 24), s.z + 16 + randRange(0, 22), 1.6, 1.6, 1.4, 0xd6b84a, Y);
  }

  silo(s.x - 34, s.z - 30, Y, 6, 7, 0xe0e0e0, { roofColor: 0xe0e0e0, face: Face.South, tier: 1 });
  placeBox(s.x - 34, s.z - 30, 3.6, 3.6, 8, 0xe0e0e0, Y + 7.5);
  placeBox(s.x - 34, s.z - 27.9, 0.4, 0.3, 10, 0x5a4a3a, Y + 11);
  placeBox(s.x - 34, s.z - 27.9, 10, 0.3, 0.4, 0x5a4a3a, Y + 15.8);
  markFootprint(s.x - 34, s.z - 30, 7, 7, FootprintKind.Mill);
  placeBox(s.x + 4, s.z - 4, 3.6, 2.2, 1.6, 0x2e8a3a, Y);
  placeBox(s.x + 4, s.z - 5, 2, 1.6, 1, 0x3a3a3a, Y + 1.6);
  placeLoot(s.x + 4, s.z + 2, Y, 1);
};
