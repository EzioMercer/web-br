import * as THREE from 'three';
import { scene } from '../render/scene';
import { PUFF_STRIDE, SMOKE_POUR, SMOKE_PUFFS } from './constants';
import { smokeMaterial } from './smokeMaterial';

/**
 * A smoke cloud on the ground at (x, y, z): one mesh of camera-facing puffs, moved by `updateSmokes`. Returns the
 * mesh and the puffs' data (`PUFF_STRIDE` numbers each). The puffs leave the canister one after another and spread
 * into a wide, low dome; the cloud is denser at the bottom, like smoke that pours out and settles.
 */
export const makeSmokeCloud = (x: number, y: number, z: number) => {
  const puffs = new Float32Array(SMOKE_PUFFS * PUFF_STRIDE);

  for (let i = 0; i < SMOKE_PUFFS; i++) {
    const o = i * PUFF_STRIDE;
    const a = Math.random() * Math.PI * 2;
    const r = 3.1 * Math.sqrt(Math.random());
    const h = Math.random();

    puffs[o] = Math.cos(a) * r;
    puffs[o + 1] = 0.5 + 2.9 * h * (1 - 0.4 * r / 3.1);
    puffs[o + 2] = Math.sin(a) * r;
    puffs[o + 3] = 1.3 + Math.random();
    puffs[o + 4] = Math.random() * Math.PI * 2;
    puffs[o + 5] = (Math.random() - 0.5) * 0.25;
    puffs[o + 6] = i / SMOKE_PUFFS * SMOKE_POUR;
    puffs[o + 7] = 0.4 + Math.random() * 0.16;
  }

  const geo = new THREE.BufferGeometry();
  const uv = new Float32Array(SMOKE_PUFFS * 8);
  const index: number[] = [];

  for (let i = 0; i < SMOKE_PUFFS; i++) {
    uv.set([0, 0, 1, 0, 1, 1, 0, 1], i * 8);
    index.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3);
  }

  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(SMOKE_PUFFS * 12), 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(SMOKE_PUFFS * 16), 4));
  geo.setIndex(index);
  // the puffs move every frame; this sphere holds the whole cloud, for frustum culling and sorting between clouds
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 2, 0), 8);

  const mesh = new THREE.Mesh<THREE.BufferGeometry, THREE.Material>(geo, smokeMaterial);

  mesh.position.set(x, y, z);
  mesh.renderOrder = 1;
  scene.add(mesh);
  return { mesh, puffs };
};
