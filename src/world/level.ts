import * as THREE from 'three';
import { WLV } from '../config';
import { buildMini } from '../hud/minimap';
import { gridBuild } from '../physics';
import { scene } from '../render/renderer';
import { DR, GL, shards } from './doors';
import { BRH } from './terrain';
import { genWorld } from './worldgen';
import { state } from '../state';
import type { Surface } from '../audio';
import type { GeneratedWorld } from './worldgen';
import type { Box, MapDoor, MapGlass } from '../types';

let world: GeneratedWorld | null = null;

/** The island, generated on first use. */
export function brWorld() {
  world ??= genWorld();
  return world;
}

/** Water meshes (animated by the render loop). */
export const waterMs: THREE.Mesh[] = [];
/** Collision boxes of the current map. */
export const boxes: Box[] = [];
const mapG = new THREE.Group();
scene.add(mapG);
/** Boxes waiting to be drawn as one instanced mesh: x, y, z, w, h, d, color. */
const pend: number[][] = [];

function box(x: number, z: number, w: number, d: number, h: number, col: number, y = 0, nc?: boolean) {
  if (!nc) {
    boxes.push({ min: [x - w / 2, y, z - d / 2], max: [x + w / 2, y + h, z + d / 2] });
  }
  pend.push([x, y + h / 2, z, w, h, d, col]);
}

function flushBoxes() {
  if (!pend.length) {
    return;
  }
  const im = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({ color: 0xffffff }), pend.length);
  const M = new THREE.Matrix4();
  const C = new THREE.Color();
  pend.forEach((q, i) => {
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
  mapG.add(im);
  pend.length = 0;
}

/** Floor height: the terrain (0 before the island is loaded). */
export function floorY(x: number, z: number) {
  return state.TERR ? state.TERR.h(x, z) : 0;
}

/** How deep in water a point is, 0 (dry) to 1. */
export function waterF(_x: number, _z: number, y: number) {
  const e = WLV - y;
  return e > 0 ? Math.min(1, e / 0.6) : 0;
}

export const glassMat = new THREE.MeshPhongMaterial({ color: 0x9fd8ff, transparent: true, opacity: 0.3, shininess: 100, specular: 0xffffff, depthWrite: false });
const doorMats: Record<string, THREE.MeshLambertMaterial> = {};
export const unitGeo = new THREE.BoxGeometry(1, 1, 1);

function addGlass(g: MapGlass) {
  const [x, z, w, d, h, y] = g;
  const b: Box = { min: [x - w / 2, y, z - d / 2], max: [x + w / 2, y + h, z + d / 2], glass: true, gi: GL.length };
  boxes.push(b);
  const m = new THREE.Mesh(unitGeo, glassMat);
  m.scale.set(w, h, d);
  m.position.set(x, y + h / 2, z);
  mapG.add(m);
  GL.push({ b, m });
}

function addDoor(o: MapDoor) {
  const { ax, c, m, w, y, h } = o;
  const x = ax === 'x' ? m : c;
  const z = ax === 'x' ? c : m;
  const b: Box = { min: ax === 'x' ? [m - w / 2, y, c - 0.07] : [c - 0.07, y, m - w / 2], max: ax === 'x' ? [m + w / 2, y + h, c + 0.07] : [c + 0.07, y + h, m + w / 2], door: true };
  boxes.push(b);
  const grp = new THREE.Group();
  grp.position.set(ax === 'x' ? m - w / 2 : c, y, ax === 'x' ? c : m - w / 2);
  const th0 = ax === 'x' ? 0 : -Math.PI / 2;
  grp.rotation.y = th0;
  const mat = doorMats[o.col] || (doorMats[o.col] = new THREE.MeshLambertMaterial({ color: o.col }));
  const mesh = new THREE.Mesh(unitGeo, mat);
  mesh.scale.set(w, h, 0.12);
  mesh.position.set(w / 2, h / 2, 0);
  grp.add(mesh);
  const kn = new THREE.Mesh(unitGeo, doorMats.k || (doorMats.k = new THREE.MeshLambertMaterial({ color: 0xc9a227 })));
  kn.scale.set(0.1, 0.1, 0.2);
  kn.position.set(w - 0.2, h * 0.45, 0);
  grp.add(kn);
  mapG.add(grp);
  DR.push({ b, g: grp, th0, ax, sgn: 1, a: 0, tgt: 0, t: 0, x, z, y, r2: (w / 2 + 1.5) * (w / 2 + 1.5) });
}

/** Builds the island's meshes, collision boxes, doors and glass (fresh for every match). */
export function loadMap() {
  const m = brWorld();
  while (mapG.children.length) {
    mapG.remove(mapG.children[0]);
  }
  for (const q of shards) {
    scene.remove(q.m);
  }
  shards.length = 0;
  boxes.length = 0;
  waterMs.length = 0;
  DR.length = 0;
  GL.length = 0;
  state.TERR = m.terrain;
  mapG.add(m.mesh);
  const wm = new THREE.Mesh(new THREE.PlaneGeometry(2 * BRH + 1200, 2 * BRH + 1200), new THREE.MeshPhongMaterial({ color: 0x3f88c8, transparent: true, opacity: 0.74, shininess: 90, specular: 0x99ccff }));
  wm.rotation.x = -Math.PI / 2;
  wm.position.y = -0.05;
  mapG.add(wm);
  waterMs.push(wm);
  for (const a of m.b) {
    box(...a);
  }
  for (const g of m.glass) {
    addGlass(g);
  }
  for (const d of m.doors) {
    addDoor(d);
  }
  flushBoxes();
  gridBuild();
  state.MM = buildMini(m);
}

/** Footstep surface at a point. */
export function surfAt(x: number, z: number, y: number): Surface {
  if (waterF(x, z, y) > 0) {
    return 'water';
  }
  return state.TERR ? state.TERR.surf(x, z) : 'grass';
}
