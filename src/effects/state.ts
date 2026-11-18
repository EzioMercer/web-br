import * as THREE from 'three';

/** Screen and gun effects, decaying to 0 in the render loop. */
export const screenFx = {
  /** Gun kick-back after a shot. */
  gunKick: 0,
  muzzleFlash: 0,
  damageFlash: 0,
  hitMarker: 0,
  /** Damage direction indicator. */
  damageDir: 0,
  /** Flashbang whiteout. */
  flashbang: 0,
};

/** Short-lived effects: tracers (fade over `max` seconds) and bullet marks (`max` 0, they don't fade). */
export const transientFx: {
  mesh: THREE.Line<THREE.BufferGeometry, THREE.Material> | THREE.Mesh<THREE.BufferGeometry, THREE.Material>;
  life: number;
  max: number;
}[] = [];

export const ripples: { mesh: THREE.Mesh<THREE.BufferGeometry, THREE.Material>; age: number }[] = [];
