import { gen } from '../state';
import type { FootprintKind } from '../../../types';

export const markFootprint = (
  x: number,
  z: number,
  w: number,
  d: number,
  n: FootprintKind,
) => gen.footprints.push([x, z, w, d, n]);
