import * as THREE from 'three';
import { mapGroup } from './mapGroup';
import { byTile } from './byTile';
import { pendingBoxes, tileMeshes } from './state';

/** One cube and one material for every map box; the instances scale and colour it. Never freed. */
const boxGeo = new THREE.BoxGeometry(1, 1, 1);

const boxMat = new THREE.MeshLambertMaterial({ color: 0xffffff });

boxGeo.userData.keep = true;
boxMat.userData.keep = true;

/**
 * Draws the queued boxes as one instanced mesh per map tile (MAP_TILE metres square, by the box's centre). The
 * renderer then skips the tiles out of view, and the shadow pass draws only the tiles near the player.
 */
export const flushBoxes = () => {
  const M = new THREE.Matrix4();
  const C = new THREE.Color();

  for (const list of byTile(pendingBoxes, q => [q[0], q[2]])) {
    const im = new THREE.InstancedMesh(boxGeo, boxMat, list.length);

    list.forEach((q, i) => {
      M.makeScale(q[3], q[4], q[5]);
      M.setPosition(q[0], q[1], q[2]);
      im.setMatrixAt(i, M);
      im.setColorAt(i, C.setHex(q[6]));
    });
    im.instanceMatrix.needsUpdate = true;

    if (im.instanceColor) {
      im.instanceColor.needsUpdate = true;
    }

    im.computeBoundingSphere();
    mapGroup.add(im);
    tileMeshes.push(im);
  }

  pendingBoxes.length = 0;
};
