import * as THREE from 'three';
import { scene } from './scene';
import { disposeObject } from '../utils/three/disposeObject';

/** Removes every item's mesh from the scene, frees its GPU memory and empties the list. */
export const clearMeshes = (list: { mesh: THREE.Object3D }[]) => {
  for (const q of list) {
    scene.remove(q.mesh);
    disposeObject(q.mesh);
  }

  list.length = 0;
};
