import { placeBox } from '../place/placeBox';

export const table = (x: number, z: number, Y: number, w?: number, d?: number) => {
  placeBox(x, z, w || 1.6, d || 1, 0.8, 0x6e4a2a, Y);
};
