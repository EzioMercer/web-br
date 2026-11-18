import { WATER_LEVEL } from '../../config';

/** How deep in water a point is, 0 (dry) to 1. */
export const waterDepth = (_x: number, _z: number, y: number) => {
  const e = WATER_LEVEL - y;

  return e > 0 ? Math.min(1, e / 0.6) : 0;
};
