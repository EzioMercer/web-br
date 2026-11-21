import type * as THREE from 'three';

/** Marks geometries and materials (and their textures) under `o` as shared, so `disposeObject` leaves them alone. */
export const keep = (o: THREE.Object3D) => {
  o.traverse((c) => {
    const m = c as THREE.Mesh;

    if (m.geometry) {
      m.geometry.userData.keep = true;
    }

    for (const mt of [m.material].flat()) {
      if (mt) {
        mt.userData.keep = true;
      }
    }
  });

  return o;
};
