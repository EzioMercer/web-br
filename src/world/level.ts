// @ts-nocheck -- split from the original monolith, not typed yet
import * as THREE from 'three';
import { WLV } from '../config';
import { buildMini } from '../hud/minimap';
import { newRound } from '../modes';
import { gridBuild } from '../physics';
import { cam, scene } from '../render/renderer';
import { DR, GL, shards } from './doors';
import { MAPS, SURFC } from './maps';
import { BRH } from './terrain';
import { state } from '../state';

let WATERS = [];
let SURF = [];
let DSURF = 'dust';
export const waterMs = [];
export const boxes = [];
const mapG = new THREE.Group();
scene.add(mapG);
const pend = [];
let useInst = false;

function box(x, z, w, d, h, col, y = 0, nc) {
  if (!nc) {
    boxes.push({ min: [x - w / 2, y, z - d / 2], max: [x + w / 2, y + h, z + d / 2] });
  }
  if (useInst) {
    pend.push([x, y + h / 2, z, w, h, d, col]);
    return;
  }
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color: col }));
  m.position.set(x, y + h / 2, z);
  mapG.add(m);
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

export function floorY(x, z) {
  if (state.TERR) {
    return state.TERR.h(x, z);
  }
  for (const l of WATERS) {
    const e = Math.min(l.w / 2 - Math.abs(x - l.x), l.d / 2 - Math.abs(z - l.z));
    if (e > 0) {
      return e < 4 ? -0.25 : e < 8 ? -0.5 : -0.8;
    }
  }
  return 0;
}

export function waterF(x, z, y) {
  if (state.TERR) {
    const e = WLV - y;
    return e > 0 ? Math.min(1, e / 0.6) : 0;
  }
  for (const l of WATERS) {
    if (Math.min(l.w / 2 - Math.abs(x - l.x), l.d / 2 - Math.abs(z - l.z)) > 0) {
      return Math.max(0, Math.min(1, (-0.12 - y) / 0.6));
    }
  }
  return 0;
}

function floorGeo(m) {
  const w = m.fw || m.size || 62;
  const d = m.fd || m.size || 62;
  if (!m.lakes || !m.lakes.length) {
    return new THREE.PlaneGeometry(w, d);
  }
  const sh = new THREE.Shape();
  sh.moveTo(-w / 2, -d / 2);
  sh.lineTo(w / 2, -d / 2);
  sh.lineTo(w / 2, d / 2);
  sh.lineTo(-w / 2, d / 2);
  sh.lineTo(-w / 2, -d / 2);
  for (const l of m.lakes) {
    const q = new THREE.Path();
    const x0 = l.x - (m.cx || 0) - l.w / 2;
    const x1 = x0 + l.w;
    const y0 = -l.z - l.d / 2;
    const y1 = y0 + l.d;
    q.moveTo(x0, y0);
    q.lineTo(x1, y0);
    q.lineTo(x1, y1);
    q.lineTo(x0, y1);
    q.lineTo(x0, y0);
    sh.holes.push(q);
  }
  return new THREE.ShapeGeometry(sh);
}

function lakeBox(l) {
  const { x, z, w, d } = l;
  const cols = [0xb9a77a, 0x9c8a62, 0x7d6f50];
  const tops = [-0.25, -0.5, -0.8];
  for (let k = 0; k < 3; k++) {
    const a = w - k * 8;
    const b = d - k * 8;
    const y = -0.9;
    const h = tops[k] - y;
    if (k < 2) {
      box(x, z - (b / 2 - 2), a, 4, h, cols[k], y, true);
      box(x, z + (b / 2 - 2), a, 4, h, cols[k], y, true);
      box(x - (a / 2 - 2), z, 4, b - 8, h, cols[k], y, true);
      box(x + (a / 2 - 2), z, 4, b - 8, h, cols[k], y, true);
    } else {
      box(x, z, a, b, h, cols[k], y, true);
    }
  }
  const wm = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshPhongMaterial({ color: 0x3f88c8, transparent: true, opacity: 0.72, shininess: 90, specular: 0x99ccff }));
  wm.rotation.x = -Math.PI / 2;
  wm.position.set(x, -0.12, z);
  mapG.add(wm);
  waterMs.push(wm);
}

export const glassMat = new THREE.MeshPhongMaterial({ color: 0x9fd8ff, transparent: true, opacity: 0.3, shininess: 100, specular: 0xffffff, depthWrite: false });
const doorMats = {};
export const unitGeo = new THREE.BoxGeometry(1, 1, 1);

function addGlass(g) {
  const [x, z, w, d, h, y] = g;
  const b = { min: [x - w / 2, y, z - d / 2], max: [x + w / 2, y + h, z + d / 2], glass: true, gi: GL.length };
  boxes.push(b);
  const m = new THREE.Mesh(unitGeo, glassMat);
  m.scale.set(w, h, d);
  m.position.set(x, y + h / 2, z);
  mapG.add(m);
  GL.push({ b, m });
}

function addDoor(o) {
  const { ax, c, m, w, y, h } = o;
  const x = ax === 'x' ? m : c;
  const z = ax === 'x' ? c : m;
  const b = { min: ax === 'x' ? [m - w / 2, y, c - 0.07] : [c - 0.07, y, m - w / 2], max: ax === 'x' ? [m + w / 2, y + h, c + 0.07] : [c + 0.07, y + h, m + w / 2], door: true };
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

export function loadMap(n, reset) {
  const m = MAPS[n];
  if (m.gen && !m.b) {
    Object.assign(m, m.gen());
  }
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
  state.TERR = m.terrain || null;
  WATERS = m.lakes || [];
  DSURF = m.surf || 'dust';
  SURF = m.b.filter(a => a[7] && a[4] <= 0.02 && SURFC[a[5]]).map(a => ({ x0: a[0] - a[2] / 2, x1: a[0] + a[2] / 2, z0: a[1] - a[3] / 2, z1: a[1] + a[3] / 2, y: a[6], s: SURFC[a[5]] })).sort((u, v) => v.y - u.y);
  scene.background.set(m.sky);
  scene.fog.color.set(m.sky);
  scene.fog.near = m.fogN || 25;
  scene.fog.far = m.fogF || 95;
  cam.far = m.far || 200;
  cam.updateProjectionMatrix();
  if (state.TERR) {
    mapG.add(m.mesh);
    const wm = new THREE.Mesh(new THREE.PlaneGeometry(2 * BRH + 1200, 2 * BRH + 1200), new THREE.MeshPhongMaterial({ color: 0x3f88c8, transparent: true, opacity: 0.74, shininess: 90, specular: 0x99ccff }));
    wm.rotation.x = -Math.PI / 2;
    wm.position.y = -0.05;
    wm.userData.y0 = -0.05;
    mapG.add(wm);
    waterMs.push(wm);
  } else {
    const f = new THREE.Mesh(floorGeo(m), new THREE.MeshLambertMaterial({ color: m.floor }));
    f.rotation.x = -Math.PI / 2;
    f.position.x = m.cx || 0;
    mapG.add(f);
    const g = new THREE.GridHelper(m.fw || m.size || 62, (m.fw || m.size || 62) / 2, 0x8f8a70, 0xa9a487);
    g.position.y = 0.01;
    g.position.x = m.cx || 0;
    g.scale.z = (m.fd || m.size || 62) / (m.fw || m.size || 62);
    mapG.add(g);
  }
  useInst = !!m.inst && !!(THREE.InstancedMesh && THREE.InstancedMesh.prototype.setColorAt);
  for (const a of m.b) {
    box(...a);
  }
  if (m.glass) {
    for (const g of m.glass) {
      addGlass(g);
    }
  }
  if (m.doors) {
    for (const d of m.doors) {
      addDoor(d);
    }
  }
  if (m.lakes) {
    for (const l of m.lakes) {
      lakeBox(l);
    }
  }
  flushBoxes();
  useInst = false;
  gridBuild();
  state.MM = m.terrain ? buildMini(m) : null;
  state.WPTS = m.wp;
  state.SPAWN = m.spawn;
  state.TSP = m.ts;
  if (reset) {
    state.round = 0;
    state.rw = state.rl = state.kills = state.deaths = 0;
    state.money = 800;
    state.dead = true;
    newRound();
  }
}

export function surfAt(x, z, y) {
  if (state.TERR) {
    if (waterF(x, z, y) > 0) {
      return 'water';
    }
    return state.TERR.surf(x, z);
  }
  if (y > 10.5) {
    return 'snow';
  }
  if (waterF(x, z, y) > 0) {
    return 'water';
  }
  for (const r of SURF) {
    if (x > r.x0 && x < r.x1 && z > r.z0 && z < r.z1) {
      return r.s;
    }
  }
  return DSURF;
}
