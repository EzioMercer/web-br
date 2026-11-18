import * as THREE from 'three';
import { WATER_LEVEL } from '../config';
import { buildMinimap } from '../hud/minimap';
import { buildGrid } from '../physics';
import { scene } from '../render/renderer';
import { doors, panes, shards } from './doors';
import { ISLAND_HALF } from './terrain';
import { genWorld } from './worldgen';
import type { Surface } from '../audio';
import type { GeneratedWorld } from './worldgen';
import type { Terrain } from './terrain';
import type { Box, MapDoor, MapGlass } from '../types';

let islandCache: GeneratedWorld | null = null;

/** Terrain of the island, null until the first match loads it. */
export let terrain: Terrain | null = null;

/** The island, generated on first use. */
export const getIsland = () => {
  islandCache ??= genWorld();
  return islandCache;
};

/** Water meshes (animated by the render loop). */
export const waterMeshes: THREE.Mesh[] = [];
/** Collision boxes of the current map. */
export const boxes: Box[] = [];

const mapGroup = new THREE.Group();

scene.add(mapGroup);

/** Boxes waiting to be drawn as one instanced mesh: x, y, z, w, h, d, color. */
const pendingBoxes: number[][] = [];

const queueBox = (x: number, z: number, w: number, d: number, h: number, col: number, y = 0, nc?: boolean) => {
  if (!nc) {
    boxes.push({ min: [x - w / 2, y, z - d / 2], max: [x + w / 2, y + h, z + d / 2] });
  }

  pendingBoxes.push([x, y + h / 2, z, w, h, d, col]);
};

const flushBoxes = () => {
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

/** Floor height: the terrain (0 before the island is loaded). */
export const floorY = (x: number, z: number) => {
  return terrain ? terrain.height(x, z) : 0;
};

/** How deep in water a point is, 0 (dry) to 1. */
export const waterDepth = (_x: number, _z: number, y: number) => {
  const e = WATER_LEVEL - y;

  return e > 0 ? Math.min(1, e / 0.6) : 0;
};

export const glassMat = new THREE.MeshPhongMaterial(
  { color: 0x9fd8ff, transparent: true, opacity: 0.3, shininess: 100, specular: 0xffffff, depthWrite: false },
);

const doorMats: Record<string, THREE.MeshLambertMaterial> = {};

export const unitGeo = new THREE.BoxGeometry(1, 1, 1);

const addGlass = (g: MapGlass) => {
  const [x, z, w, d, h, y] = g;
  const b: Box = {
    min: [x - w / 2, y, z - d / 2],
    max: [x + w / 2, y + h, z + d / 2],
    glass: true,
    glassIndex: panes.length,
  };

  boxes.push(b);

  const m = new THREE.Mesh(unitGeo, glassMat);

  m.scale.set(w, h, d);
  m.position.set(x, y + h / 2, z);
  mapGroup.add(m);
  panes.push({ box: b, mesh: m });
};

const addDoor = (o: MapDoor) => {
  const { axis: ax, wallAt: c, center: m, width: w, y, height: h } = o;
  const x = ax === 'x' ? m : c;
  const z = ax === 'x' ? c : m;
  const b: Box = {
    min: ax === 'x' ? [m - w / 2, y, c - 0.07] : [c - 0.07, y, m - w / 2],
    max: ax === 'x' ? [m + w / 2, y + h, c + 0.07] : [c + 0.07, y + h, m + w / 2],
    door: true,
  };

  boxes.push(b);

  const grp = new THREE.Group();

  grp.position.set(ax === 'x' ? m - w / 2 : c, y, ax === 'x' ? c : m - w / 2);

  const th0 = ax === 'x' ? 0 : -Math.PI / 2;

  grp.rotation.y = th0;

  const mat = doorMats[o.color] || (doorMats[o.color] = new THREE.MeshLambertMaterial({ color: o.color }));
  const mesh = new THREE.Mesh(unitGeo, mat);

  mesh.scale.set(w, h, 0.12);
  mesh.position.set(w / 2, h / 2, 0);
  grp.add(mesh);

  const kn = new THREE.Mesh(unitGeo, doorMats.k || (doorMats.k = new THREE.MeshLambertMaterial({ color: 0xc9a227 })));

  kn.scale.set(0.1, 0.1, 0.2);
  kn.position.set(w - 0.2, h * 0.45, 0);
  grp.add(kn);
  mapGroup.add(grp);
  doors.push(
    {
      box: b,
      pivot: grp,
      baseAngle: th0,
      axis: ax,
      swingDir: 1,
      openAmount: 0,
      target: 0,
      x,
      z,
      y,
      reachSq: (w / 2 + 1.5) * (w / 2 + 1.5),
    },
  );
};

/** Builds the island's meshes, collision boxes, doors and glass (fresh for every match). */
export const loadMap = () => {
  const m = getIsland();

  while (mapGroup.children.length) {
    mapGroup.remove(mapGroup.children[0]);
  }

  for (const q of shards) {
    scene.remove(q.mesh);
  }

  shards.length = 0;
  boxes.length = 0;
  waterMeshes.length = 0;
  doors.length = 0;
  panes.length = 0;
  terrain = m.terrain;
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

/** Footstep surface at a point. */
export const surfaceAt = (x: number, z: number, y: number): Surface => {
  if (waterDepth(x, z, y) > 0) {
    return 'water';
  }

  return terrain ? terrain.surface(x, z) : 'grass';
};
