import * as THREE from 'three';
import { snd, tone } from './audio';
import { bots } from './bots';
import { killBot } from './combat';
import { fx } from './effects';
import { clear, inB } from './physics';
import { P, hurt } from './player';
import { cam, scene } from './render/renderer';
import { NC } from './weapons';
import { GL, breakGlass } from './world/doors';
import { floorY } from './world/level';
import { state } from './state';
import type { GrenadeId, Sphere, Vec3 } from './types';

/** A grenade in flight. */
interface Nade {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  t: GrenadeId;
  m: THREE.Mesh;
  /** Detonation time. */
  f: number;
}

/** A smoke cloud, gone at time `t`. */
interface Smoke extends Sphere {
  t: number;
  m: THREE.Mesh;
}

/** Points on the grenade aim preview. */
const AIM_N = 70;
const aimPos = new Float32Array(AIM_N * 3);
const aimV = new Float32Array(AIM_N * 6);
const aimGeo = new THREE.BufferGeometry();
const aimVA = new THREE.BufferAttribute(aimV, 3);
const aimIdx: number[] = [];
for (let i = 0; i < AIM_N - 1; i++) {
  const q = i * 2;
  aimIdx.push(q, q + 1, q + 2, q + 1, q + 3, q + 2);
}
aimGeo.setAttribute('position', aimVA);
aimGeo.setIndex(aimIdx);
const aimMesh = new THREE.Mesh(aimGeo, new THREE.MeshBasicMaterial({ color: 0xffe27a, depthTest: false, transparent: true, opacity: 0.92, side: THREE.DoubleSide }));
aimMesh.frustumCulled = false;
aimMesh.renderOrder = 6;
aimMesh.visible = false;
scene.add(aimMesh);
/** Grenades carried. */
export const nade: Record<GrenadeId, number> = { he: 0, fl: 0, sm: 0 };
export const nades: Nade[] = [];
export const smokes: Smoke[] = [];

function nadeFuse(t: GrenadeId) {
  return t === 'sm' ? 1.3 : 1.6;
}

/** Moves a grenade one step, bouncing off walls and the floor. Returns true if it touched something. */
function nadeStep(n: Omit<Nade, 't' | 'm' | 'f'>, dt: number) {
  let fl = false;
  n.vy -= 18 * dt;
  let nx = n.x + n.vx * dt;
  if (inB(nx, n.y, n.z)) {
    n.vx *= -0.45;
    nx = n.x;
    fl = true;
  }
  n.x = nx;
  let nz = n.z + n.vz * dt;
  if (inB(n.x, n.y, nz)) {
    n.vz *= -0.45;
    nz = n.z;
    fl = true;
  }
  n.z = nz;
  let ny = n.y + n.vy * dt;
  if (ny < floorY(n.x, n.z) + 0.07 || inB(n.x, ny, n.z)) {
    n.vy *= -0.4;
    n.vx *= 0.8;
    n.vz *= 0.8;
    ny = Math.max(n.y, floorY(n.x, n.z) + 0.07);
    if (Math.abs(n.vy) < 0.5) {
      n.vy = 0;
    }
    fl = true;
  }
  n.y = ny;
  return fl;
}

// the throw starts at the hand (a little to the right and low, where the grenade is held) and does not depend on how you are moving, so the preview is steady while you strafe
function nadeStart() {
  const sp = state.lob ? 8 : 15;
  const cp = Math.cos(state.pitch);
  const sy = Math.sin(state.yaw);
  const cy = Math.cos(state.yaw);
  const d = [-sy * cp, Math.sin(state.pitch) + 0.2, -cy * cp];
  return { x: P.x - sy * cp * 0.35 + cy * 0.22, y: P.y + state.eye - 0.17 + Math.sin(state.pitch) * 0.3, z: P.z - cy * cp * 0.35 - sy * 0.22, vx: d[0] * sp, vy: d[1] * sp, vz: d[2] * sp };
}

export function throwNade() {
  const t = state.cg;
  if (!t || !nade[t]) {
    return;
  }
  nade[t]--;
  state.cg = null;
  state.mouse = false;
  state.grenHeld = false;
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), new THREE.MeshLambertMaterial({ color: NC[t] }));
  scene.add(m);
  nades.push(Object.assign(nadeStart(), { t, m, f: state.T + nadeFuse(t) }));
  snd(0.15, 0.05, 3000);
  state.kick = -0.05;
}

// the path the grenade will take: a line to where it will be when the fuse runs out, and a ring on the spot
export function aimUpdate() {
  if (!state.cg || state.dead || !nade[state.cg] || !state.grenHeld) {
    aimMesh.visible = false;
    return;
  }
  const n = nadeStart();
  const dt = 1 / 120;
  const steps = Math.round(nadeFuse(state.cg) / dt);
  const every = Math.max(1, Math.ceil(steps / (AIM_N - 2)));
  let k = 1;
  let px: number;
  let py: number;
  let pz: number;
  aimPos[0] = n.x;
  aimPos[1] = n.y;
  aimPos[2] = n.z;
  for (let i = 1; i <= steps; i++) {
    px = n.x;
    py = n.y;
    pz = n.z;
    const hit = nadeStep(n, dt);
    if (hit) {
      if (k < AIM_N && Math.hypot(px - aimPos[k * 3 - 3], py - aimPos[k * 3 - 2], pz - aimPos[k * 3 - 1]) > 0.02) {
        aimPos[k * 3] = px;
        aimPos[k * 3 + 1] = py;
        aimPos[k * 3 + 2] = pz;
        k++;
      }
      break;
    } // the path ends where the grenade first touches something
    if ((i % every === 0 || i === steps) && k < AIM_N) {
      aimPos[k * 3] = n.x;
      aimPos[k * 3 + 1] = n.y;
      aimPos[k * 3 + 2] = n.z;
      k++;
    }
  }
  // a flat ribbon that always faces the camera and keeps the same width on screen
  const cx = cam.position.x;
  const cy = cam.position.y;
  const cz = cam.position.z;
  const wpp = 2 * Math.tan(cam.fov * Math.PI / 360) / Math.max(300, innerHeight) * 3;
  for (let i = 0; i < k; i++) {
    const a0 = aimPos[Math.max(0, i - 1) * 3];
    const a1 = aimPos[Math.max(0, i - 1) * 3 + 1];
    const a2 = aimPos[Math.max(0, i - 1) * 3 + 2];
    const b0 = aimPos[Math.min(k - 1, i + 1) * 3];
    const b1 = aimPos[Math.min(k - 1, i + 1) * 3 + 1];
    const b2 = aimPos[Math.min(k - 1, i + 1) * 3 + 2];
    const tx = b0 - a0;
    const ty = b1 - a1;
    const tz = b2 - a2;
    const vx = aimPos[i * 3] - cx;
    const vy = aimPos[i * 3 + 1] - cy;
    const vz = aimPos[i * 3 + 2] - cz;
    const dist = Math.hypot(vx, vy, vz) || 1;
    let sx = ty * vz - tz * vy;
    let sy = tz * vx - tx * vz;
    let sz = tx * vy - ty * vx;
    const sl = Math.hypot(sx, sy, sz) || 1;
    const hw = Math.max(0.004, dist * wpp) / sl;
    sx *= hw;
    sy *= hw;
    sz *= hw;
    aimV[i * 6] = aimPos[i * 3] + sx;
    aimV[i * 6 + 1] = aimPos[i * 3 + 1] + sy;
    aimV[i * 6 + 2] = aimPos[i * 3 + 2] + sz;
    aimV[i * 6 + 3] = aimPos[i * 3] - sx;
    aimV[i * 6 + 4] = aimPos[i * 3 + 1] - sy;
    aimV[i * 6 + 5] = aimPos[i * 3 + 2] - sz;
  }
  aimVA.needsUpdate = true;
  aimGeo.setDrawRange(0, Math.max(0, (k - 1) * 6));
  aimMesh.visible = k > 1;
}

export function nadesTick(dt: number) {
  for (let i = nades.length - 1; i >= 0; i--) {
    const n = nades[i];
    nadeStep(n, dt);
    n.m.position.set(n.x, n.y, n.z);
    if (state.T >= n.f) {
      scene.remove(n.m);
      nades.splice(i, 1);
      boom(n);
    }
  }
  for (let i = smokes.length - 1; i >= 0; i--) {
    if (state.T >= smokes[i].t) {
      scene.remove(smokes[i].m);
      smokes.splice(i, 1);
    }
  }
}

function boom(n: Nade) {
  const o: Vec3 = [n.x, n.y + 0.2, n.z];
  if (n.t === 'sm') {
    const y = Math.max(n.y, 0.1) + 1.6;
    const m = new THREE.Mesh(new THREE.SphereGeometry(3.6, 16, 12), new THREE.MeshLambertMaterial({ color: 0xb9bec2, transparent: true, opacity: 0.95, side: THREE.DoubleSide }));
    m.position.set(n.x, y, n.z);
    scene.add(m);
    smokes.push({ x: n.x, y, z: n.z, r: 3.6, t: state.T + 15, m });
    snd(0.2, 0.4, 900);
    return;
  }
  const pd = Math.hypot(P.x - o[0], P.y + 1 - o[1], P.z - o[2]);
  if (n.t === 'fl') {
    snd(0.6, 0.25, 6000);
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.6, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true }));
    m.position.set(...o);
    scene.add(m);
    fx.push({ m, t: 0.3, max: 0.3 });
    if (!state.dead && pd < 30 && clear(o, [P.x, P.y + state.eye, P.z])) {
      const cp = Math.cos(state.pitch);
      const f: Vec3 = [-Math.sin(state.yaw) * cp, Math.sin(state.pitch), -Math.cos(state.yaw) * cp];

      const dot = (f[0] * (o[0] - P.x) + f[1] * (o[1] - P.y - state.eye) + f[2] * (o[2] - P.z)) / pd;
      state.fbang = Math.min(1.3, (1 - pd / 30) * (dot > 0 ? 1.4 : 0.5) + 0.2);
    }
    for (const b of bots) {
      if (b.hp > 0 && Math.hypot(b.x - o[0], b.z - o[2]) < 30 && clear(o, [b.x, 1.4, b.z])) {
        b.blind = state.T + 4;
      }
    }
    return;
  }
  snd(1, 0.6, 700);
  tone(60, 25, 0.5, 1, 'sine');
  for (const q of GL) {
    if (!q.b.off && Math.hypot((q.b.min[0] + q.b.max[0]) / 2 - o[0], (q.b.min[2] + q.b.max[2]) / 2 - o[2]) < 11) {
      breakGlass(q.b);
    }
  }
  const m = new THREE.Mesh(new THREE.SphereGeometry(2.2, 14, 10), new THREE.MeshBasicMaterial({ color: 0xff9a3c, transparent: true }));
  m.position.set(...o);
  scene.add(m);
  fx.push({ m, t: 0.45, max: 0.45 });
  for (const b of bots) {
    if (b.hp <= 0) {
      continue;
    }
    const bd = Math.hypot(b.x - o[0], 1 - o[1], b.z - o[2]);
    if (bd < 9 && clear(o, [b.x, b.y + 0.9, b.z])) {
      b.hp -= Math.round(160 * (1 - bd / 9));
      b.alert = 1.5;
      if (b.hp <= 0) {
        killBot(b, false);
      }
    }
  }
  if (!state.dead && pd < 9 && clear(o, [P.x, P.y + 1, P.z])) {
    hurt(Math.round(110 * (1 - pd / 9)));
  }
}
