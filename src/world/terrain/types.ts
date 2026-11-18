import type { genTerrain } from './genTerrain';

/** Kind of Battle Royale site, which decides what the world generator builds there. */
type SiteType =
  | 'mall'
  | 'downtown'
  | 'suburb'
  | 'village'
  | 'lodge'
  | 'fort'
  | 'industrial'
  | 'port'
  | 'farm'
  | 'hamlet'
  | 'airfield'
  | 'lighthouse';

export interface Site {
  name: string;
  x: number;
  z: number;
  radius: number;
  type: SiteType;
  /** Ground height, set by `genTerrain`. */
  groundY?: number;
}

export interface Bridge {
  x: number;
  z: number;
  axis: 'x' | 'z';
  length: number;
  /** Deck height, set by `genTerrain`. */
  deckY?: number;
}

/** Named map region (for labels): sites, mountains, lakes and extra areas. */
export interface Region {
  name: string;
  x: number;
  z: number;
  /** Weight: larger regions claim more of the map. */
  weight: number;
}

export type Terrain = ReturnType<typeof genTerrain>;
