import { stairTower } from './stairTower';

export const tower = (
  cx: number,
  cz: number,
  Y: number,
  h: number,
) => stairTower(cx, cz, Y, { size: h > 14 ? 7.2 : 6.4, height: h });
