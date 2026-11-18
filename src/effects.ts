import * as THREE from 'three';
import { scene } from './render/renderer';
import type { Vec3 } from './types';

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
export const transientFx: { mesh: THREE.Line<THREE.BufferGeometry, THREE.Material> | THREE.Mesh<THREE.BufferGeometry, THREE.Material>; life: number; max: number }[] = [];

export function tracer(a: Vec3, b: Vec3, col: THREE.ColorRepresentation) {
  const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...a), new THREE.Vector3(...b)]);
  const l = new THREE.Line(g, new THREE.LineBasicMaterial({ color: col, transparent: true }));
  scene.add(l);
  transientFx.push({ mesh: l, life: 0.07, max: 0.07 });
}

export function bulletMark(p: Vec3) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), new THREE.MeshBasicMaterial({ color: 0x2b2418 }));
  m.position.set(...p);
  scene.add(m);
  transientFx.push({ mesh: m, life: 4, max: 0 });
  if (transientFx.length > 120) {
    const o = transientFx.shift()!;
    scene.remove(o.mesh);
  }
}

export const ripples: { mesh: THREE.Mesh<THREE.BufferGeometry, THREE.Material>; age: number }[] = [];

export function ripple(x: number, z: number) {
  if (ripples.length > 30) {
    return;
  }
  const m = new THREE.Mesh(new THREE.RingGeometry(0.15, 0.25, 24), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7, side: THREE.DoubleSide }));
  m.rotation.x = -Math.PI / 2;
  m.position.set(x, -0.03, z);
  scene.add(m);
  ripples.push({ mesh: m, age: 0 });
}
