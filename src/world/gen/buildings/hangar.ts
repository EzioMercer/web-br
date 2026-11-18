import { placeBox } from '../place/placeBox';
import { warehouse } from './warehouse';

export const hangar = (cx: number, cz: number, Y: number) => {
  const w = 22;
  const d = 30;
  const h = 9;

  warehouse(cx, cz, w, d, Y, { height: h, gateWidth: 14, gateHeight: 7, color: 0xb7bcc2, tier: 2 });
  placeBox(cx, cz + 2, 3, 12, 3, 0xd9d9d9, Y);
  placeBox(cx, cz - 1, 18, 3, 0.3, 0xd9d9d9, Y + 2);
  placeBox(cx, cz - 6.5, 1, 5, 0.2, 0xd9d9d9, Y + 3.4);
  placeBox(cx, cz - 7, 6, 0.3, 1.8, 0xd9d9d9, Y + 3.4);
};
