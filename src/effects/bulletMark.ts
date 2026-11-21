import * as THREE from 'three';
import { scene } from '../render/scene';
import type { Vec3 } from '../types';

/** Marks shown at once, at most (the oldest goes first). */
const MAX = 120;

/** How long a mark stays (s). */
const LIFE = 4;

const marks = new THREE.InstancedMesh(
  new THREE.BoxGeometry(0.12, 0.12, 0.12),
  new THREE.MeshBasicMaterial({ color: 0x2b2418 }),
  MAX,
);

const HIDDEN = new THREE.Matrix4().makeScale(0, 0, 0);

const M = new THREE.Matrix4();

const life = new Float32Array(MAX);

let next = 0;

for (let i = 0; i < MAX; i++) {
  marks.setMatrixAt(i, HIDDEN);
}

// they are all over the map: one draw call for all of them, never culled
marks.frustumCulled = false;
scene.add(marks);

/** A bullet mark at `p` for LIFE seconds. */
export const bulletMark = (p: Vec3) => {
  const i = next;

  next = (next + 1) % MAX;
  marks.setMatrixAt(i, M.makeTranslation(p[0], p[1], p[2]));
  marks.instanceMatrix.needsUpdate = true;
  life[i] = LIFE;
};

/** Removes the marks whose time is up (render loop). */
export const bulletMarksTick = (dt: number) => {
  for (let i = 0; i < MAX; i++) {
    if (life[i] > 0) {
      life[i] -= dt;

      if (life[i] <= 0) {
        marks.setMatrixAt(i, HIDDEN);
        marks.instanceMatrix.needsUpdate = true;
      }
    }
  }
};
