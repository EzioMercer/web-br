import { house } from '../buildings/house';
import { stairTower } from '../buildings/stairTower';
import { placeBox } from '../place/placeBox';
import { site } from './site';
import { FootprintKind } from '../../../types';

/** Cape Light. */
export const buildCapeLight = () => {
  const s = site('Cape Light');
  const Y = s.groundY;

  stairTower(
    s.x,
    s.z,
    Y,
    { size: 7.2, height: 17, color: 0xf0f0f0, roofColor: 0xc9342b, footprintKind: FootprintKind.Lighthouse },
  );

  for (const q of [5, 10]) {
    placeBox(s.x, s.z, 7.9, 7.9, 1.3, 0xc9342b, Y + q, true);
  }

  house(s.x - 13, s.z + 6, 10, 8, Y, { color: 0xf0f0f0, roofColor: 0xc9342b, tier: 1 });
};
