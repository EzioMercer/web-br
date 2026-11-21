import { MAP_TILE } from './state';

/** Groups `items` by the map tile (MAP_TILE metres square) that their point (x, z) falls in. */
export const byTile = <T>(items: T[], at: (t: T) => [number, number]) => {
  const tiles = new Map<string, T[]>();

  for (const t of items) {
    const [x, z] = at(t);
    const k = Math.floor(x / MAP_TILE) + ',' + Math.floor(z / MAP_TILE);
    let list = tiles.get(k);

    if (!list) {
      list = [];
      tiles.set(k, list);
    }

    list.push(t);
  }

  return tiles.values();
};
