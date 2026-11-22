import * as THREE from 'three';
import { buildMinimap } from '../../hud/minimap/buildMinimap';
import { buildGrid } from '../../physics/buildGrid';
import { doors, panes, shards } from '../doors/state';
import { ISLAND_HALF } from '../terrain/constants';
import { addDoor } from './addDoor';
import { addGlass } from './addGlass';
import { flushBoxes } from './flushBoxes';
import { flushDoors } from './flushDoors';
import { flushGlass } from './flushGlass';
import { getIsland } from './getIsland';
import { mapGroup } from './mapGroup';
import { queueBox } from './queueBox';
import { boxes, leaves, level, tileMeshes, waterMeshes } from './state';
import { clearMeshes } from '../../render/clearMeshes';

/** The sea: one plane, made once and reused by every match. */
const water = new THREE.Mesh(
  new THREE.PlaneGeometry(2 * ISLAND_HALF + 1200, 2 * ISLAND_HALF + 1200),
  new THREE.MeshPhongMaterial(
    { color: 0x3f88c8, transparent: true, opacity: 0.74, shininess: 90, specular: 0x99ccff },
  ),
);

water.rotation.x = -Math.PI / 2;
water.position.y = -0.05;

/** Builds the island's meshes, collision boxes, doors and glass (fresh for every match). */
export const loadMap = () => {
  const m = getIsland();

  while (mapGroup.children.length) {
    mapGroup.remove(mapGroup.children[0]);
  }

  // the instance buffers of the last match's boxes, glass and doors (their geometry and materials are shared and stay)
  for (const im of tileMeshes) {
    im.dispose();
  }

  tileMeshes.length = 0;
  clearMeshes(shards);
  boxes.length = 0;
  leaves.length = 0;
  waterMeshes.length = 0;
  doors.length = 0;
  panes.length = 0;
  level.terrain = m.terrain;
  mapGroup.add(m.mesh);

  mapGroup.add(water);
  waterMeshes.push(water);

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
  flushGlass();
  flushDoors();

  // the map does not move: its matrices are worked out once here, not every frame (the sea bobs and updates its own)
  mapGroup.matrixWorldAutoUpdate = false;
  mapGroup.updateMatrixWorld(true);
  buildGrid();
  buildMinimap(m);
};
