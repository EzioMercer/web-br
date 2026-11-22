import type { MapTree } from '../../../types';
import { gen } from '../state';

/** Adds a tree model (see MapTree). Its trunk's collision box is placed separately, with placeBox. */
export const placeTree = (...t: MapTree) => gen.trees.push(t);
