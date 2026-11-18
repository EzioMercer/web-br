import type { Box } from '../types';

/** Collision grid cell size (m). */
export const CELL = 16;

export const EMPTY: Box[] = [];

/** Collision grid of the map boxes, and the box hit by the last `castRay`. */
export const collision = { grid: new Map<number, Box[]>(), lastHit: null as Box | null };
