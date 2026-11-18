import { PLAYER_HEIGHT, PLAYER_RADIUS } from '../config';
import type { Body, Box } from '../types';

export const overlaps = (p: Body, b: Box) => {
  return !b.disabled
    && p.x + PLAYER_RADIUS > b.min[0]
    && p.x - PLAYER_RADIUS < b.max[0]
    && p.y + (p.height || PLAYER_HEIGHT) > b.min[1]
    && p.y < b.max[1]
    && p.z + PLAYER_RADIUS > b.min[2]
    && p.z - PLAYER_RADIUS < b.max[2];
};
