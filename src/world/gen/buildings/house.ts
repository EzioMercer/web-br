import { dropWindowsAtDoors } from '../parts/dropWindowsAtDoors';
import { roof } from '../parts/roof';
import { table } from '../parts/table';
import { wall } from '../parts/wall';
import { markFootprint } from '../place/markFootprint';
import { placeBox } from '../place/placeBox';
import { placeLoot } from '../place/placeLoot';
import { pick } from '../random/pick';
import { rand } from '../random/rand';
import { randRange } from '../random/randRange';
import type { BuildOpts, Opening } from '../types';

/* ----- house (1 floor) ----- */
export const house = (cx: number, cz: number, w: number, d: number, Y: number, o: BuildOpts = {}) => {
  const h = 3.2;
  const col = o.color || pick([0xe4dac3, 0xd9c8a8, 0xcfd6c2, 0xe8c8a0, 0xc9d3d9]);
  const rc = o.roofColor || pick([0x8a4a3a, 0x6b6358, 0x4a5a6a, 0x7a5a3a]);
  const x0 = cx - w / 2;
  const x1 = cx + w / 2;
  const z0 = cz - d / 2;
  const z1 = cz + d / 2;
  const dm = cx + randRange(-w / 6, w / 6);
  const pz = cz - d / 6;

  wall(
    'x',
    z1,
    x0,
    x1,
    Y,
    h,
    col,
    dropWindowsAtDoors(
      [
        { center: dm, width: 1.4, type: 'door' },
        { center: cx - w / 2 + 1.6, width: 1.6, type: 'window' },
        { center: cx + w / 2 - 1.6, width: 1.6, type: 'window' },
      ],
    ),
  );
  wall(
    'x',
    z0,
    x0,
    x1,
    Y,
    h,
    col,
    dropWindowsAtDoors(
      [
        ...(rand() < 0.5 ? [{ center: cx, width: 1.3, type: 'door' } as Opening] : []),
        { center: cx - w / 3, width: 1.6, type: 'window' },
        { center: cx + w / 3, width: 1.6, type: 'window' },
      ],
    ),
  );
  wall('z', x0, z0, z1, Y, h, col, [{ center: cz, width: 1.6, type: 'window' }]);
  wall('z', x1, z0, z1, Y, h, col, [{ center: cz, width: 1.6, type: 'window' }]);
  wall('x', pz, x0, x1, Y, h, col, [{ center: cx + randRange(-w / 4, w / 4), width: 1.2, type: 'door' }]);
  roof(cx, cz, w, d, Y + h, rc);
  placeBox(x1 - 1.4, cz + 1, 1, 1, 1.6, 0x7a5a4a, Y + h + 0.4);
  table(cx + randRange(-1.5, 1.5), (pz + z1) / 2 + 0.4, Y);
  placeBox(x0 + 1.2, (pz + z1) / 2 + 1, 0.9, 2.4, 0.9, pick([0x8a4a3a, 0x4a5a6a]), Y);
  placeBox(cx + w / 4, (z0 + pz) / 2 - 0.8, 2, 1, 0.6, 0xd8d2c4, Y);
  placeBox(x1 - 0.8, (z0 + pz) / 2, 0.5, 2.6, 1.8, 0x6e4a2a, Y);
  placeLoot(x0 + 1.5, z1 - 1.6, Y, 1);
  placeLoot(x1 - 1.6, z0 + 1.6, Y, o.tier || 1);
  markFootprint(cx, cz, w + 1, d + 1, 'house');
  return { x0, x1, z0, z1 };
};
