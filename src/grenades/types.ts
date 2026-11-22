import * as THREE from 'three';
import type { GrenadeId, Sphere } from '../types';

/** Position and velocity of a thrown grenade. */
export interface GrenadeBody {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
}

/** A grenade in flight. */
export interface Grenade extends GrenadeBody {
  type: GrenadeId;
  /** Has touched the ground or a wall. */
  landed: boolean;
  mesh: THREE.Mesh;
  /** Detonation time. */
  fuseAt: number;
}

/**
 * A smoke cloud, out at time `born` and gone at `until`. As a sphere it is what blocks sight; it grows as the smoke
 * spreads and shrinks as it clears. `mesh` sits on the ground under it and holds the puffs (`puffs`: their data).
 */
export interface Smoke extends Sphere {
  born: number;
  until: number;
  mesh: THREE.Mesh<THREE.BufferGeometry, THREE.Material>;
  puffs: Float32Array;
}
