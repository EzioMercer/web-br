import { gap } from './gap';
import { OpeningType } from '../types';
import type { Opening } from '../types';

/** Drops windows that would overlap a door. */
export const dropWindowsAtDoors = (
  ops: Opening[],
  keep?: boolean,
) => ops.filter(
  q => q.type === OpeningType.Door
    || keep
    || ops.every(
      o => o === q || o.type !== OpeningType.Door || gap(o.center, q.center) > (o.width + q.width) / 2 + 0.15,
    ),
);
