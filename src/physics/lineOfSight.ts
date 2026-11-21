import { smokes } from '../grenades/state';
import { doorBlocks } from '../world/doors/doorBlocks';
import { castRay } from './castRay';
import { segmentHitsSphere } from './segmentHitsSphere';
import type { Vec3 } from '../types';

/** Line of sight from `o` to `p`: no walls or door panels (glass is see-through) and no smoke. */
export const lineOfSight = (o: Vec3, p: Vec3) => {
  const dx = p[0] - o[0];
  const dy = p[1] - o[1];
  const dz = p[2] - o[2];
  const l = Math.hypot(dx, dy, dz);

  return castRay(o, [dx / l, dy / l, dz / l], l, true) > l
    && !doorBlocks(o, p)
    && !smokes.some(s => segmentHitsSphere(o, p, s));
};
