import { genWorld } from '../gen/genWorld';
import type { GeneratedWorld } from '../gen/types';

let islandCache: GeneratedWorld | null = null;

/** The island, generated on first use. */
export const getIsland = () => {
  islandCache ??= genWorld();
  return islandCache;
};
