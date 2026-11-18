import * as THREE from 'three';
import { scene } from '../render/scene';
import { transientFx } from './state';
import type { Vec3 } from '../types';

export const tracer = (a: Vec3, b: Vec3, col: THREE.ColorRepresentation) => {
  const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...a), new THREE.Vector3(...b)]);
  const l = new THREE.Line(g, new THREE.LineBasicMaterial({ color: col, transparent: true }));

  scene.add(l);
  transientFx.push({ mesh: l, life: 0.07, max: 0.07 });
};
