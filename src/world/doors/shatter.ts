import { castRay } from '../../physics/castRay';
import { collision } from '../../physics/state';
import { breakGlass } from './breakGlass';
import type { Vec3 } from '../../types';

/** Breaks up to four panes of glass along a shot. */
export const shatter = (o: Vec3, d: Vec3, len: number) => {
  let gb = 0;

  for (let i = 0; i < 4; i++) {
    const q: Vec3 = [o[0] + d[0] * gb, o[1] + d[1] * gb, o[2] + d[2] * gb];
    const t = castRay(q, d, len - gb);

    if (collision.lastHit && collision.lastHit.glass && t < len - gb) {
      breakGlass(collision.lastHit);
      gb += t + 0.06;
    } else {
      break;
    }
  }
};
