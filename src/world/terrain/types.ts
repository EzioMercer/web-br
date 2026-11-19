import type { genTerrain } from './genTerrain';
import type { Axis } from '../../types';

/** Kind of Battle Royale site, which decides what the world generator builds there. */
export enum SiteType {
  Mall = 'mall',
  Downtown = 'downtown',
  Suburb = 'suburb',
  Village = 'village',
  Lodge = 'lodge',
  Fort = 'fort',
  Industrial = 'industrial',
  Port = 'port',
  Farm = 'farm',
  Hamlet = 'hamlet',
  Airfield = 'airfield',
  Lighthouse = 'lighthouse',
}

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
  axis: Axis;
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
