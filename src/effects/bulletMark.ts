import * as THREE from 'three';
import { scene } from '../render/scene';
import { transientFx } from './state';
import type { Vec3 } from '../types';

export const bulletMark = (p: Vec3) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), new THREE.MeshBasicMaterial({ color: 0x2b2418 }));

  m.position.set(...p);
  scene.add(m);
  transientFx.push({ mesh: m, life: 4, max: 0 });

  if (transientFx.length > 120) {
    const o = transientFx.shift()!;

    scene.remove(o.mesh);
  }
};
