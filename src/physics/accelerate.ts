import type { Velocity } from '../types';

/** Accelerates `v` toward direction (wx, wz), up to speed `cap` along it. */
export const accelerate = (v: Velocity, wx: number, wz: number, cap: number, rate: number, dt: number) => {
  const add = cap - (v.x * wx + v.z * wz);

  if (add <= 0) {
    return;
  }

  const a = Math.min(rate * dt, add);

  v.x += a * wx;
  v.z += a * wz;
};
