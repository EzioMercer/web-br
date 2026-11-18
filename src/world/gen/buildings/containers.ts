import { markFootprint } from '../place/markFootprint';
import { placeBox } from '../place/placeBox';
import { pick } from '../random/pick';
import { rand } from '../random/rand';

export const containers = (x: number, z: number, Y: number, nx: number, nz: number, hi: boolean) => {
  const cols = [0xb03a2e, 0x2e6db0, 0x3a8a4a, 0xd9822b, 0x7a7f85, 0xc9a227];

  for (let i = 0; i < nx; i++) {
    for (let j = 0; j < nz; j++) {
      if (rand() < 0.2) {
        continue;
      }

      const c = pick(cols);
      const cx = x + i * 14.5;
      const cz = z + j * 6;

      placeBox(cx, cz, 12, 2.6, 2.6, c, Y);

      if (hi && rand() < 0.4) {
        placeBox(cx, cz, 12, 2.6, 2.6, pick(cols), Y + 2.6);
      }
    }
  }

  markFootprint(x + (nx - 1) * 7.25, z + (nz - 1) * 3, nx * 14.5, nz * 6 + 2.6, 'containers');
};
