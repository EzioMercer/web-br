import { gap } from './gap';
import type { Opening } from '../types';

/** Drops windows that would overlap a door. */
export const dropWindowsAtDoors = (
  ops: Opening[],
  keep?: boolean,
) => ops.filter(
  q => q.type === 'door'
    || keep
    || ops.every(o => o === q || o.type !== 'door' || gap(o.center, q.center) > (o.width + q.width) / 2 + 0.15),
);
