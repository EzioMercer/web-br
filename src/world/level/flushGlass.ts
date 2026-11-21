import * as THREE from 'three';
import { panes } from '../doors/state';
import { byTile } from './byTile';
import { mapGroup } from './mapGroup';
import { glassMat, unitGeo } from './materials';
import { tileMeshes } from './state';

/** Draws the panes as one instanced mesh per map tile instead of a mesh each. */
export const flushGlass = () => {
  for (const list of byTile(panes, p => [p.matrix.elements[12], p.matrix.elements[14]])) {
    const im = new THREE.InstancedMesh(unitGeo, glassMat, list.length);

    list.forEach((p, i) => {
      im.setMatrixAt(i, p.matrix);
      p.mesh = im;
      p.index = i;
    });
    im.instanceMatrix.needsUpdate = true;
    im.computeBoundingSphere();
    mapGroup.add(im);
    tileMeshes.push(im);
  }
};
