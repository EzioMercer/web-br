// @ts-nocheck -- split from the original monolith, not typed yet
import * as THREE from 'three';
import { scene } from './render/renderer';

export const fx = [];

export function tracer(a, b, col) {
  const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...a), new THREE.Vector3(...b)]);
  const l = new THREE.Line(g, new THREE.LineBasicMaterial({ color: col, transparent: true }));
  scene.add(l);
  fx.push({ m: l, t: 0.07, max: 0.07 });
}

export function mark(p) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), new THREE.MeshBasicMaterial({ color: 0x2b2418 }));
  m.position.set(...p);
  scene.add(m);
  fx.push({ m, t: 4, max: 0 });
  if (fx.length > 120) {
    const o = fx.shift();
    scene.remove(o.m);
  }
}

export const ripples = [];

export function ripple(x, z) {
  if (ripples.length > 30) {
    return;
  }
  const m = new THREE.Mesh(new THREE.RingGeometry(0.15, 0.25, 24), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7, side: THREE.DoubleSide }));
  m.rotation.x = -Math.PI / 2;
  m.position.set(x, -0.03, z);
  scene.add(m);
  ripples.push({ m, t: 0 });
}
