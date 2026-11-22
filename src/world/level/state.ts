import * as THREE from 'three';
import type { Box } from '../../types';
import type { Terrain } from '../terrain/types';
import type { TreeTile } from './types';

/** Terrain of the island, null until the first match loads it. */
export const level = { terrain: null as Terrain | null };

/** Water meshes (animated by the render loop). */
export const waterMeshes: THREE.Mesh[] = [];

/** Collision boxes of the current map. */
export const boxes: Box[] = [];

/** Boxes waiting to be drawn as instanced meshes (see flushBoxes): x, y, z, w, h, d, color. */
export const pendingBoxes: number[][] = [];

/** The instanced meshes that draw the map boxes, glass and doors, a few per tile. Freed when the next match loads. */
export const tileMeshes: THREE.InstancedMesh[] = [];

/** Side of a map tile (m): static map meshes are split into tiles this size, so the ones out of view are skipped. */
export const MAP_TILE = 128;

/** The tiles of trees, whose meshes are also in tileMeshes. */
export const treeTiles: TreeTile[] = [];
