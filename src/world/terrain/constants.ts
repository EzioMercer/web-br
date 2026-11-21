import { Axis } from '../../types';
import { Surface } from '../../audio/types';
import { SiteType } from './types';
import type { Vec2, Vec3 } from '../../types';
import type { Bridge, Region, Site } from './types';

export const ISLAND_HALF = 450;

export const GRID_STEP = 4;

export const GRID_N = Math.round(2 * ISLAND_HALF / GRID_STEP) + 1;

/** Terrain tile size in grid cells (see terrainMesh): 32 cells of 4 m make 128 m tiles. */
export const TERRAIN_TILE_CELLS = 32;

/** Mountains: centre, radius and peak height (m). */
export const MOUNTAINS = [
  { x: -170, z: -200, radius: 170, height: 84, name: 'Mount Karst' },
  { x: 235, z: -135, radius: 130, height: 60, name: 'Redback Ridge' },
  { x: -265, z: 165, radius: 120, height: 46, name: 'Grey Teeth' },
  { x: 135, z: 245, radius: 85, height: 28, name: 'Hogback' },
];

export const LAKES = [
  { x: -135, z: 30, radius: 44, name: 'Mirror Lake' },
  { x: 62, z: -200, radius: 28, name: 'Eagle Pond' },
];

export const RIVERS: Vec2[][] = [
  [
    [-70, -125],
    [-10, -150],
    [50, -152],
    [110, -118],
    [150, -70],
    [165, -10],
    [185, 50],
    [235, 105],
    [275, 170],
    [290, 240],
    [300, 330],
  ],
];

export const SITES: Site[] = [
  { name: 'Central Mall', x: 40, z: 75, radius: 56, type: SiteType.Mall },
  { name: 'Aurora', x: -25, z: -55, radius: 50, type: SiteType.Downtown },
  { name: 'Maple Heights', x: 138, z: 152, radius: 44, type: SiteType.Suburb },
  { name: 'Pinecrest', x: -55, z: -245, radius: 44, type: SiteType.Village },
  { name: 'Frostpeak Lodge', x: -118, z: -152, radius: 24, type: SiteType.Lodge },
  { name: 'Fort Redstone', x: 150, z: -225, radius: 48, type: SiteType.Fort },
  { name: 'Ironworks', x: 300, z: 30, radius: 46, type: SiteType.Industrial },
  { name: 'Port Calder', x: 240, z: 245, radius: 48, type: SiteType.Port },
  { name: 'Meadowbrook Farm', x: -105, z: 220, radius: 52, type: SiteType.Farm },
  { name: 'Dusty Gulch', x: -225, z: 80, radius: 36, type: SiteType.Hamlet },
  { name: 'Skyfield Airstrip', x: -300, z: -30, radius: 28, type: SiteType.Airfield },
  { name: 'Cape Light', x: 330, z: -95, radius: 22, type: SiteType.Lighthouse },
];

export const BRIDGES: Bridge[] = [
  { x: 20, z: -151, axis: Axis.Z, length: 44 },
  { x: 158, z: -40, axis: Axis.X, length: 44 },
];

export const ROADS: Vec2[][] = [
  [[-55, -245], [0, -200], [20, -172], [20, -130], [-25, -55]],
  [[-25, -55], [20, 0], [40, 75]],
  [[40, 75], [85, 115], [138, 152]],
  [[138, 152], [215, 110], [300, 30]],
  [[138, 152], [195, 205], [240, 245]],
  [[40, 75], [-30, 150], [-105, 220]],
  [[-25, -55], [-110, -40], [-200, -30], [-300, -30]],
  [[-300, -30], [-250, 40], [-225, 80]],
  [[40, 75], [100, 20], [158, -40], [150, -130], [150, -225]],
  [[-25, -55], [-80, -100], [-118, -152]],
  [[300, 30], [320, -30], [330, -95]],
];

export const EXTRA_REGIONS: Region[] = [
  { name: 'Whispering Pines', x: 60, z: -120, weight: 1.3 },
  { name: 'Golden Plains', x: 200, z: 20, weight: 1.2 },
  { name: 'Sunset Beach', x: -330, z: -170, weight: 1.2 },
  { name: 'Driftwood Cove', x: 0, z: 350, weight: 1.2 },
  { name: 'Salt Flats', x: -20, z: 200, weight: 1.1 },
];

/** Footstep surface per terrain kind. */
export const KIND_SURFACE: Surface[] = [
  Surface.Water,
  Surface.Dust,
  Surface.Grass,
  Surface.Grass,
  Surface.Dust,
  Surface.Snow,
  Surface.Dust,
  Surface.Grass,
  Surface.Grass,
  Surface.Grass,
];

/**
 * Color per terrain kind: 0 water, 1 sand, 2 grass, 3 dry grass, 4 rock, 5 snow, 6 road, 7-8 crop fields, 9 dark grass.
 */
export const KIND_COLORS: Vec3[] = [
  [0.52, 0.58, 0.55],
  [0.86, 0.79, 0.58],
  [0.40, 0.62, 0.31],
  [0.64, 0.63, 0.36],
  [0.52, 0.50, 0.47],
  [0.95, 0.96, 0.98],
  [0.47, 0.46, 0.44],
  [0.74, 0.64, 0.30],
  [0.33, 0.52, 0.24],
  [0.28, 0.42, 0.22],
];
