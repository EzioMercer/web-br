import { SITES } from '../../terrain/constants';

export const inSiteCore = (
  x: number,
  z: number,
  k: number,
) => SITES.some(s => Math.hypot(x - s.x, z - s.z) < s.radius * k) || (x < -270 && Math.abs(z + 30) < 110);
