import * as THREE from 'three';
import { doors } from '../doors/state';
import { drawDoor } from '../doors/drawDoor';
import { byTile } from './byTile';
import { mapGroup } from './mapGroup';
import { doorMat, knobMat, unitGeo } from './materials';
import { tileMeshes } from './state';

/** Draws the doors as instances, a mesh of panels and one of knobs per map tile, instead of two meshes each. */
export const flushDoors = () => {
  const C = new THREE.Color();

  for (const list of byTile(doors, d => [d.x, d.z])) {
    const panels = new THREE.InstancedMesh(unitGeo, doorMat, list.length);
    const knobs = new THREE.InstancedMesh(unitGeo, knobMat, list.length);
    let widest = 0;

    list.forEach((d, i) => {
      d.drawn = { panels, knobs, index: i };
      panels.setColorAt(i, C.setHex(d.color));
      drawDoor(d);
      widest = Math.max(widest, d.width);
    });

    for (const im of [panels, knobs]) {
      im.computeBoundingSphere();
      // room for the doors to swing open
      im.boundingSphere!.radius += widest;
      mapGroup.add(im);
      tileMeshes.push(im);
    }
  }
};
