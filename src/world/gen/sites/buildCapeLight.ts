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

  // red bands round the outside: four strips sunk into the walls (faces 3.4 to 3.8 m out), not a slab through the
  // inside of the tower that would show as a ceiling over the stairs
  for (const q of [5, 10]) {
    for (const k of [-1, 1]) {
      placeBox(s.x, s.z + k * 3.75, 7.9, 0.4, 1.3, 0xc9342b, Y + q, true);
      placeBox(s.x + k * 3.75, s.z, 0.4, 7.9, 1.3, 0xc9342b, Y + q, true);
    }
  }

  house(s.x - 13, s.z + 6, 10, 8, Y, { color: 0xf0f0f0, roofColor: 0xc9342b, tier: 1 });
};
