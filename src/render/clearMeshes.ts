import * as THREE from 'three';
import { scene } from './scene';

/** Removes every item's mesh from the scene and empties the list. */
export const clearMeshes = (list: { mesh: THREE.Object3D }[]) => {
  for (const q of list) {
    scene.remove(q.mesh);
  }

  list.length = 0;
};
