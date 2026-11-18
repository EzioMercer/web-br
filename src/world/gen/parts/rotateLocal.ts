import type { Face, Vec2 } from '../../../types';

/* ----- enterable structures: hollow shells with a door, stair towers with a glazed lookout, silos ----- */
/** Local offset rotated so the local +z side faces `f`. */
export const rotateLocal = (
  f: Face,
  lx: number,
  lz: number,
): Vec2 => f === 's' ? [lx, lz] : f === 'n' ? [-lx, -lz] : f === 'e' ? [lz, -lx] : [-lz, lx];
