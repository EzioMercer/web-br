import { OPTICS } from '../data/optics';
import type { BagItem, OpticId } from '../types';

/** Bag item `it` is an optic (not a medkit or vest). */
export const isOptic = (it: BagItem | null): it is OpticId => Boolean(it) && it! in OPTICS;
