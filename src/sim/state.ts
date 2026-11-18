import type { Vec2 } from '../types';

/** Simulation time (s). */
export const clock = { time: 0 };

/** The player's slide: end, start, cooldown end, direction and start speed. */
export const slide = { end: 0, start: 0, readyAt: 0, dir: [0, 1] as Vec2, speed: 8 };
