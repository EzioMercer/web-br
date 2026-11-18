import { placeBox } from '../place/placeBox';

export const roof = (cx: number, cz: number, w: number, d: number, Y: number, rc: number) => {
  placeBox(cx, cz, w + 0.8, d + 0.8, 0.3, rc, Y);
  placeBox(cx, cz, w - 1.5, d + 0.8, 0.45, rc, Y + 0.3);
};
