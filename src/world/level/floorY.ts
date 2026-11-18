import { level } from './state';

/** Floor height: the terrain (0 before the island is loaded). */
export const floorY = (x: number, z: number) => {
  return level.terrain ? level.terrain.height(x, z) : 0;
};
