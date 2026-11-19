import { Face } from '../../../types';
import type { Vec2 } from '../../../types';

/* ----- enterable structures: hollow shells with a door, stair towers with a glazed lookout, silos ----- */
/** Local offset rotated so the local +z side faces `f`. */
export const rotateLocal = (
  f: Face,
  lx: number,
  lz: number,
): Vec2 => f === Face.South ? [lx, lz] : f === Face.North ? [-lx, -lz] : f === Face.East ? [lz, -lx] : [-lz, lx];
