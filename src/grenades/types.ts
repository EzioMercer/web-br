import * as THREE from 'three';
import type { GrenadeId, Sphere } from '../types';

/** A grenade in flight. */
export interface Grenade {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  type: GrenadeId;
  mesh: THREE.Mesh;
  /** Detonation time. */
  fuseAt: number;
}

/** A smoke cloud, gone at time `until`. */
export interface Smoke extends Sphere {
  until: number;
  mesh: THREE.Mesh;
}
