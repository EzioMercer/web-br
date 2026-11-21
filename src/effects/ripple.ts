import * as THREE from 'three';
import { scene } from '../render/scene';
import { ripples } from './state';

/** One ring geometry for every ripple; each has its own material, which fades on its own. */
const ringGeo = new THREE.RingGeometry(0.15, 0.25, 24);

ringGeo.userData.keep = true;

export const ripple = (x: number, z: number) => {
  if (ripples.length > 30) {
    return;
  }

  const m = new THREE.Mesh(
    ringGeo,
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7, side: THREE.DoubleSide }),
  );

  m.rotation.x = -Math.PI / 2;
  m.position.set(x, -0.03, z);
  scene.add(m);
  ripples.push({ mesh: m, age: 0 });
};
