import type * as THREE from 'three';
import type { Weapon } from '../types';

/** A bullet in flight from the player's gun: it takes time to arrive and drops over distance. */
export interface Bullet {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  weapon: Weapon;
  /** Metres flown so far. */
  flown: number;
  /** Tracer streak behind it, starting at the gun's muzzle. */
  streak: THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial>;
  muzzle: [number, number, number];
}
