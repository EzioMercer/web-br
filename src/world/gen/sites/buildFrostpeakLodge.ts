import { house } from '../buildings/house';
import { stairTower } from '../buildings/stairTower';
import { villa } from '../buildings/villa';
import { site } from './site';
import { Face, FootprintKind } from '../../../types';

/** Frostpeak Lodge. */
export const buildFrostpeakLodge = () => {
  const s = site('Frostpeak Lodge');
  const Y = s.groundY;

  villa(s.x, s.z - 2, 20, 13, Y, { color: 0x9a7448, roofColor: 0xe8eef2, tier: 2 });
  house(s.x - 14, s.z + 9, 9, 8, Y, { color: 0x9a7448, roofColor: 0xe8eef2 });
  house(s.x + 14, s.z + 9, 9, 8, Y, { color: 0x9a7448, roofColor: 0xe8eef2 });
  stairTower(
    s.x - 15,
    s.z - 12,
    Y,
    {
      size: 6.4,
      height: 9,
      color: 0x7a6a50,
      roofColor: 0x6b3a2a,
      face: Face.East,
      footprintKind: FootprintKind.Lookout,
    },
  );
};
