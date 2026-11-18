import type { MapBg } from '../../types';

/** Minimap size (CSS pixels). */
export const MINIMAP_SIZE = 190;

/** Minimap and big map backgrounds, and whether the big map is open. */
export const maps = { mini: null as MapBg | null, big: null as MapBg | null, bigOpen: false };
