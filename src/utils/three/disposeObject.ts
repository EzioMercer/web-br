import type * as THREE from 'three';

/**
 * Frees the GPU memory of the geometries, materials and textures under `o` that it owns. Removing an object from the
 * scene does not do that by itself. Resources marked with `keep` are shared and stay.
 */
export const disposeObject = (o: THREE.Object3D) => {
  o.traverse((c) => {
    const m = c as THREE.Mesh;

    if (m.geometry && !m.geometry.userData.keep) {
      m.geometry.dispose();
    }

    for (const mt of [m.material].flat()) {
      if (!mt || mt.userData.keep) {
        continue;
      }

      const map = (mt as THREE.MeshBasicMaterial).map;

      if (map && !map.userData.keep) {
        map.dispose();
      }

      mt.dispose();
    }
  });
};
