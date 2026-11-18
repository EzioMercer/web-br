import * as THREE from 'three';
import { buildMinimap } from '../../hud/minimap/buildMinimap';
import { buildGrid } from '../../physics/buildGrid';
import { doors, panes, shards } from '../doors/state';
import { ISLAND_HALF } from '../terrain/constants';
import { addDoor } from './addDoor';
import { addGlass } from './addGlass';
import { flushBoxes } from './flushBoxes';
import { getIsland } from './getIsland';
import { mapGroup } from './mapGroup';
import { queueBox } from './queueBox';
import { boxes, level, waterMeshes } from './state';
import { clearMeshes } from '../../render/clearMeshes';

/** Builds the island's meshes, collision boxes, doors and glass (fresh for every match). */
export const loadMap = () => {
  const m = getIsland();

  while (mapGroup.children.length) {
    mapGroup.remove(mapGroup.children[0]);
  }

  clearMeshes(shards);
  boxes.length = 0;
  waterMeshes.length = 0;
  doors.length = 0;
  panes.length = 0;
  level.terrain = m.terrain;
  mapGroup.add(m.mesh);

  const wm = new THREE.Mesh(
    new THREE.PlaneGeometry(2 * ISLAND_HALF + 1200, 2 * ISLAND_HALF + 1200),
    new THREE.MeshPhongMaterial(
      { color: 0x3f88c8, transparent: true, opacity: 0.74, shininess: 90, specular: 0x99ccff },
    ),
  );

  wm.rotation.x = -Math.PI / 2;
  wm.position.y = -0.05;
  mapGroup.add(wm);
  waterMeshes.push(wm);

  for (const a of m.boxes) {
    queueBox(...a);
  }

  for (const g of m.glass) {
    addGlass(g);
  }

  for (const d of m.doors) {
    addDoor(d);
  }

  flushBoxes();
  buildGrid();
  buildMinimap(m);
};
