import * as THREE from 'three';
import { bots } from '../bots/state';
import { mapGroup } from '../world/level/mapGroup';

/** Lets the island and the bots cast and receive sun shadows. See-through things (water, glass) do neither. */
export const markShadows = () => {
  const mark = (o: THREE.Object3D) => {
    if (!(o instanceof THREE.Mesh)) {
      return;
    }

    const solid = !(o.material as THREE.Material).transparent;

    o.castShadow = solid;
    o.receiveShadow = solid;
  };

  mapGroup.traverse(mark);

  for (const b of bots) {
    b.mesh.traverse(mark);
  }
};
