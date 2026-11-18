import { placeBox } from '../place/placeBox';
import { pick } from '../random/pick';

export const car = (x: number, z: number, Y: number, al: 'x' | 'z') => {
  const c = pick([0xb03a2e, 0x2e6db0, 0xd9d9d9, 0x2e2e2e, 0xc9a227, 0x3a8a4a]);
  const w = al === 'x' ? 4.4 : 1.9;
  const d = al === 'x' ? 1.9 : 4.4;

  placeBox(x, z, w, d, 0.9, c, Y + 0.35);
  placeBox(x, z, al === 'x' ? 2.4 : 1.7, al === 'x' ? 1.7 : 2.4, 0.7, 0x9fb7c8, Y + 1.25);
};
