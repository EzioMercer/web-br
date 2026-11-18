import { BRIDGES, SITES } from '../../terrain/constants';

/* ===== wilderness: cabins, gas stations, forests, rocks ===== */
export const nearSite = (
  x: number,
  z: number,
  m: number,
) => SITES.some(s => Math.hypot(x - s.x, z - s.z) < s.radius + m)
  || BRIDGES.some(b => Math.hypot(x - b.x, z - b.z) < b.length / 2 + 16);
