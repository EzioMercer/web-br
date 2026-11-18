import type { Footprint, MapBox, MapDoor, MapGlass, MapLoot, Stairwell } from '../../types';
import type { Terrain } from '../terrain/types';

/** Island state while it is generated: terrain, random seed and the map data built so far. */
export const gen = {
  terrain: null as unknown as Terrain,
  seed: 4242,
  boxes: [] as MapBox[],
  glass: [] as MapGlass[],
  doors: [] as MapDoor[],
  loot: [] as MapLoot[],
  footprints: [] as Footprint[],
  stairwells: [] as Stairwell[],
};
