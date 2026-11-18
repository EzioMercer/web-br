import * as THREE from 'three';
import { srgbTex } from '../render/srgbTex';
import type { Bot } from './types';
import { boxMesh } from '../utils/three/boxMesh';
import { lambert } from '../utils/three/lambert';

const PALETTE = [0x6b5a3a, 0x3b3f45, 0x5a3a32, 0x39503f, 0x4a4a2e];

/** Builds the bot model into `g` and returns its animated parts and name label. */
export const buildBotModel = (
  id: number,
  g: THREE.Group,
  legs: THREE.Group[],
  knees: THREE.Group[],
): Pick<Bot, 'upperBody' | 'gunGroup' | 'labelCanvas' | 'labelTexture' | 'labelSprite'> => {
  const c = PALETTE[id % 5];
  const skin = 0xd9a77d;
  const dk = 0x24262a;
  const vest = 0x2e3a33;
  const U = new THREE.Group();

  g.add(U);

  const add = (p: THREE.Object3D, w: number, h: number, d: number, x: number, y: number, z: number, col: number) => (
    boxMesh(p, w, h, d, x, y, z, lambert(col))
  );

  add(U, 0.5, 0.2, 0.28, 0, 0.92, 0, dk);
  add(U, 0.5, 0.5, 0.3, 0, 1.2, 0, c);
  add(U, 0.52, 0.38, 0.12, 0, 1.22, 0.13, vest);
  add(U, 0.52, 0.3, 0.1, 0, 1.25, -0.13, vest);
  add(U, 0.1, 0.1, 0.08, -0.15, 1.08, 0.2, dk);
  add(U, 0.1, 0.1, 0.08, 0.15, 1.08, 0.2, dk);
  add(U, 0.12, 0.08, 0.12, 0, 1.47, 0, skin);
  add(U, 0.24, 0.26, 0.24, 0, 1.62, 0, dk);
  add(U, 0.2, 0.06, 0.02, 0, 1.64, 0.125, skin);
  add(U, 0.27, 0.07, 0.27, 0, 1.77, 0, c);
  add(U, 0.27, 0.04, 0.1, 0, 1.74, 0.17, c);

  for (const s of [-1, 1]) {
    const L = new THREE.Group();

    L.position.set(s * 0.13, 0.88, 0);
    g.add(L);
    add(L, 0.18, 0.44, 0.21, 0, -0.22, 0, c);

    const K = new THREE.Group();

    K.position.y = -0.44;
    L.add(K);
    add(K, 0.15, 0.4, 0.18, 0, -0.2, 0, c);
    add(K, 0.17, 0.1, 0.27, 0, -0.42, 0.04, dk);
    add(K, 0.19, 0.06, 0.2, 0, -0.12, 0.02, vest);
    legs.push(L);
    knees.push(K);

    const A = new THREE.Group();

    A.position.set(s * 0.32, 1.4, 0);
    A.rotation.set(-1.15, 0, -s * 0.25);
    U.add(A);
    add(A, 0.13, 0.3, 0.15, 0, -0.15, 0, c);

    const F = new THREE.Group();

    F.position.y = -0.3;
    F.rotation.x = -0.3;
    A.add(F);
    add(F, 0.11, 0.28, 0.13, 0, -0.14, 0, c);
    add(F, 0.11, 0.09, 0.11, 0, -0.31, 0, dk);
  }

  const gunG = new THREE.Group();

  gunG.position.set(0, 1.18, 0.3);
  U.add(gunG);

  const cv = document.createElement('canvas');

  cv.width = 256;
  cv.height = 64;

  const tex = srgbTex(new THREE.CanvasTexture(cv));
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));

  sp.scale.set(1.6, 0.4, 1);
  sp.position.set(0, 2.15, 0);
  sp.visible = false;
  U.add(sp);
  return { upperBody: U, gunGroup: gunG, labelCanvas: cv, labelTexture: tex, labelSprite: sp };
};
