import * as THREE from 'three';
import { scene } from './render/renderer';
import type { Vec3 } from './types';

/** Short-lived effects: tracers (fade over `max` seconds) and bullet marks (`max` 0, they don't fade). */
export const fx: { m: THREE.Line<THREE.BufferGeometry, THREE.Material> | THREE.Mesh<THREE.BufferGeometry, THREE.Material>; t: number; max: number }[] = [];

export function tracer(a: Vec3, b: Vec3, col: THREE.ColorRepresentation) {
  const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...a), new THREE.Vector3(...b)]);
  const l = new THREE.Line(g, new THREE.LineBasicMaterial({ color: col, transparent: true }));
  scene.add(l);
  fx.push({ m: l, t: 0.07, max: 0.07 });
}

export function mark(p: Vec3) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), new THREE.MeshBasicMaterial({ color: 0x2b2418 }));
  m.position.set(...p);
  scene.add(m);
  fx.push({ m, t: 4, max: 0 });
  if (fx.length > 120) {
    const o = fx.shift()!;
    scene.remove(o.m);
  }
}

export const ripples: { m: THREE.Mesh<THREE.BufferGeometry, THREE.Material>; t: number }[] = [];

export function ripple(x: number, z: number) {
  if (ripples.length > 30) {
    return;
  }
  const m = new THREE.Mesh(new THREE.RingGeometry(0.15, 0.25, 24), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7, side: THREE.DoubleSide }));
  m.rotation.x = -Math.PI / 2;
  m.position.set(x, -0.03, z);
  scene.add(m);
  ripples.push({ m, t: 0 });
}
