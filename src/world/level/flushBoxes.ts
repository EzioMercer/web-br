import * as THREE from 'three';
import { mapGroup } from './mapGroup';
import { pendingBoxes } from './state';

export const flushBoxes = () => {
  if (!pendingBoxes.length) {
    return;
  }

  const im = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshLambertMaterial({ color: 0xffffff }),
    pendingBoxes.length,
  );
  const M = new THREE.Matrix4();
  const C = new THREE.Color();

  pendingBoxes.forEach((q, i) => {
    M.makeScale(q[3], q[4], q[5]);
    M.setPosition(q[0], q[1], q[2]);
    im.setMatrixAt(i, M);
    im.setColorAt(i, C.setHex(q[6]));
  });
  im.instanceMatrix.needsUpdate = true;

  if (im.instanceColor) {
    im.instanceColor.needsUpdate = true;
  }

  im.frustumCulled = false;
  mapGroup.add(im);
  pendingBoxes.length = 0;
};
