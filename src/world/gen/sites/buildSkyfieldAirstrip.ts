import { hangar } from '../buildings/hangar';
import { shop } from '../buildings/shop';
import { silo } from '../buildings/silo';
import { tower } from '../buildings/tower';
import { markFootprint } from '../place/markFootprint';
import { placeBox } from '../place/placeBox';
import { site } from './site';
import { Face, FootprintKind } from '../../../types';

/** Skyfield Airstrip. */
export const buildSkyfieldAirstrip = () => {
  const s = site('Skyfield Airstrip');
  const Y = s.groundY;
  const rx = -312;

  placeBox(rx, -30, 16, 190, 0.02, 0x4a4d50, Y + 0.03, true);

  for (let z = -115; z <= 55; z += 14) {
    placeBox(rx, z, 0.5, 6, 0.02, 0xeeeeee, Y + 0.06, true);
  }

  markFootprint(rx, -30, 18, 192, FootprintKind.Runway);
  hangar(-285, -70, Y);
  hangar(-285, -25, Y);
  tower(-285, 20, Y, 16);
  shop(-285, 45, 22, 10, Y, { color: 0xbfc4c8, tier: 2 });
  silo(-285, 66, Y, 6, 5, 0x8a9098, { face: Face.North });
  markFootprint(-285, 66, 7, 7, FootprintKind.Tank);
  placeBox(rx + 10, -60, 0.3, 0.3, 5, 0xcc3322, Y);
};
