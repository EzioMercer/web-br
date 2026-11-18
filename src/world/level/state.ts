import * as THREE from 'three';
import type { Box } from '../../types';
import type { Terrain } from '../terrain/types';

/** Terrain of the island, null until the first match loads it. */
export const level = { terrain: null as Terrain | null };

/** Water meshes (animated by the render loop). */
export const waterMeshes: THREE.Mesh[] = [];

/** Collision boxes of the current map. */
export const boxes: Box[] = [];

/** Boxes waiting to be drawn as one instanced mesh: x, y, z, w, h, d, color. */
export const pendingBoxes: number[][] = [];
