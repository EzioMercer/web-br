import * as THREE from 'three';
import { noiseBurst, tone } from './audio';
import { bots } from './bots';
import { killBot } from './combat';
import { transientFx, screenFx } from './effects';
import { lineOfSight, insideBox } from './physics';
import { damagePlayer, playerBody, player } from './player';
import { camera, scene } from './render/renderer';
import { GRENADE_COLORS } from './weapons';
import { panes, breakGlass } from './world/doors';
import { floorY } from './world/level';
import { loadout } from './loadout';
import { input } from './input';
import { simTime } from './sim';
import type { GrenadeId, Sphere, Vec3 } from './types';

/** A grenade in flight. */
interface Grenade {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  type: GrenadeId;
  mesh: THREE.Mesh;
  /** Detonation time. */
  fuseAt: number;
}

/** A smoke cloud, gone at time `until`. */
interface Smoke extends Sphere {
  until: number;
  mesh: THREE.Mesh;
}

/** Points on the grenade aim preview. */
const AIM_POINTS = 70;
const aimPos = new Float32Array(AIM_POINTS * 3);
const aimVerts = new Float32Array(AIM_POINTS * 6);
const aimGeo = new THREE.BufferGeometry();
const aimAttr = new THREE.BufferAttribute(aimVerts, 3);
const aimIndex: number[] = [];
for (let i = 0; i < AIM_POINTS - 1; i++) {
  const q = i * 2;
  aimIndex.push(q, q + 1, q + 2, q + 1, q + 3, q + 2);
}
aimGeo.setAttribute('position', aimAttr);
aimGeo.setIndex(aimIndex);
const aimMesh = new THREE.Mesh(aimGeo, new THREE.MeshBasicMaterial({ color: 0xffe27a, depthTest: false, transparent: true, opacity: 0.92, side: THREE.DoubleSide }));
aimMesh.frustumCulled = false;
aimMesh.renderOrder = 6;
aimMesh.visible = false;
scene.add(aimMesh);
/** Throw mode (right-click toggles a short lob instead of a far throw) and whether the throw is being aimed. */
export const grenadeThrow = { lob: false, held: false };
/** Grenades carried. */
export const grenadeCount: Record<GrenadeId, number> = { he: 0, fl: 0, sm: 0 };
export const flyingGrenades: Grenade[] = [];
export const smokes: Smoke[] = [];

const fuseTime = (t: GrenadeId) => {
  return t === 'sm' ? 1.3 : 1.6;
};

/** Moves a grenade one step, bouncing off walls and the floor. Returns true if it touched something. */
const stepGrenade = (n: Omit<Grenade, 'type' | 'mesh' | 'fuseAt'>, dt: number) => {
  let fl = false;
  n.vy -= 18 * dt;
  let nx = n.x + n.vx * dt;
  if (insideBox(nx, n.y, n.z)) {
    n.vx *= -0.45;
    nx = n.x;
    fl = true;
  }
  n.x = nx;
  let nz = n.z + n.vz * dt;
  if (insideBox(n.x, n.y, nz)) {
    n.vz *= -0.45;
    nz = n.z;
    fl = true;
  }
  n.z = nz;
  let ny = n.y + n.vy * dt;
  if (ny < floorY(n.x, n.z) + 0.07 || insideBox(n.x, ny, n.z)) {
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
};

// the throw starts at the hand (a little to the right and low, where the grenade is held) and does not depend on how you are moving, so the preview is steady while you strafe
const throwStart = () => {
  const sp = grenadeThrow.lob ? 8 : 15;
  const cp = Math.cos(player.pitch);
  const sy = Math.sin(player.yaw);
  const cy = Math.cos(player.yaw);
  const d = [-sy * cp, Math.sin(player.pitch) + 0.2, -cy * cp];
  return { x: playerBody.x - sy * cp * 0.35 + cy * 0.22, y: playerBody.y + player.eyeHeight - 0.17 + Math.sin(player.pitch) * 0.3, z: playerBody.z - cy * cp * 0.35 - sy * 0.22, vx: d[0] * sp, vy: d[1] * sp, vz: d[2] * sp };
};

export const throwGrenade = () => {
  const t = loadout.grenade;
  if (!t || !grenadeCount[t]) {
    return;
  }
  grenadeCount[t]--;
  loadout.grenade = null;
  input.fireHeld = false;
  grenadeThrow.held = false;
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), new THREE.MeshLambertMaterial({ color: GRENADE_COLORS[t] }));
  scene.add(m);
  flyingGrenades.push({ ...throwStart(), type: t, mesh: m, fuseAt: simTime + fuseTime(t) });
  noiseBurst(0.15, 0.05, 3000);
  screenFx.gunKick = -0.05;
};

// the path the grenade will take: a line to where it will be when the fuse runs out, and a ring on the spot
export const updateAimPath = () => {
  if (!loadout.grenade || player.dead || !grenadeCount[loadout.grenade] || !grenadeThrow.held) {
    aimMesh.visible = false;
    return;
  }
  const n = throwStart();
  const dt = 1 / 120;
  const steps = Math.round(fuseTime(loadout.grenade) / dt);
  const every = Math.max(1, Math.ceil(steps / (AIM_POINTS - 2)));
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
    const hit = stepGrenade(n, dt);
    if (hit) {
      if (k < AIM_POINTS && Math.hypot(px - aimPos[k * 3 - 3], py - aimPos[k * 3 - 2], pz - aimPos[k * 3 - 1]) > 0.02) {
        aimPos[k * 3] = px;
        aimPos[k * 3 + 1] = py;
        aimPos[k * 3 + 2] = pz;
        k++;
      }
      break;
    } // the path ends where the grenade first touches something
    if ((i % every === 0 || i === steps) && k < AIM_POINTS) {
      aimPos[k * 3] = n.x;
      aimPos[k * 3 + 1] = n.y;
      aimPos[k * 3 + 2] = n.z;
      k++;
    }
  }
  // a flat ribbon that always faces the camera and keeps the same width on screen
  const cx = camera.position.x;
  const cy = camera.position.y;
  const cz = camera.position.z;
  const wpp = 2 * Math.tan(camera.fov * Math.PI / 360) / Math.max(300, innerHeight) * 3;
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
    aimVerts[i * 6] = aimPos[i * 3] + sx;
    aimVerts[i * 6 + 1] = aimPos[i * 3 + 1] + sy;
    aimVerts[i * 6 + 2] = aimPos[i * 3 + 2] + sz;
    aimVerts[i * 6 + 3] = aimPos[i * 3] - sx;
    aimVerts[i * 6 + 4] = aimPos[i * 3 + 1] - sy;
    aimVerts[i * 6 + 5] = aimPos[i * 3 + 2] - sz;
  }
  aimAttr.needsUpdate = true;
  aimGeo.setDrawRange(0, Math.max(0, (k - 1) * 6));
  aimMesh.visible = k > 1;
};

export const grenadesTick = (dt: number) => {
  for (let i = flyingGrenades.length - 1; i >= 0; i--) {
    const n = flyingGrenades[i];
    stepGrenade(n, dt);
    n.mesh.position.set(n.x, n.y, n.z);
    if (simTime >= n.fuseAt) {
      scene.remove(n.mesh);
      flyingGrenades.splice(i, 1);
      detonate(n);
    }
  }
  for (let i = smokes.length - 1; i >= 0; i--) {
    if (simTime >= smokes[i].until) {
      scene.remove(smokes[i].mesh);
      smokes.splice(i, 1);
    }
  }
};

const detonate = (n: Grenade) => {
  const o: Vec3 = [n.x, n.y + 0.2, n.z];
  if (n.type === 'sm') {
    const y = Math.max(n.y, 0.1) + 1.6;
    const m = new THREE.Mesh(new THREE.SphereGeometry(3.6, 16, 12), new THREE.MeshLambertMaterial({ color: 0xb9bec2, transparent: true, opacity: 0.95, side: THREE.DoubleSide }));
    m.position.set(n.x, y, n.z);
    scene.add(m);
    smokes.push({ x: n.x, y, z: n.z, radius: 3.6, until: simTime + 15, mesh: m });
    noiseBurst(0.2, 0.4, 900);
    return;
  }
  const pd = Math.hypot(playerBody.x - o[0], playerBody.y + 1 - o[1], playerBody.z - o[2]);
  if (n.type === 'fl') {
    noiseBurst(0.6, 0.25, 6000);
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.6, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true }));
    m.position.set(...o);
    scene.add(m);
    transientFx.push({ mesh: m, life: 0.3, max: 0.3 });
    if (!player.dead && pd < 30 && lineOfSight(o, [playerBody.x, playerBody.y + player.eyeHeight, playerBody.z])) {
      const cp = Math.cos(player.pitch);
      const f: Vec3 = [-Math.sin(player.yaw) * cp, Math.sin(player.pitch), -Math.cos(player.yaw) * cp];

      const dot = (f[0] * (o[0] - playerBody.x) + f[1] * (o[1] - playerBody.y - player.eyeHeight) + f[2] * (o[2] - playerBody.z)) / pd;
      screenFx.flashbang = Math.min(1.3, (1 - pd / 30) * (dot > 0 ? 1.4 : 0.5) + 0.2);
    }
    for (const b of bots) {
      if (b.health > 0 && Math.hypot(b.x - o[0], b.z - o[2]) < 30 && lineOfSight(o, [b.x, 1.4, b.z])) {
        b.blindUntil = simTime + 4;
      }
    }
    return;
  }
  noiseBurst(1, 0.6, 700);
  tone(60, 25, 0.5, 1, 'sine');
  for (const q of panes) {
    if (!q.box.disabled && Math.hypot((q.box.min[0] + q.box.max[0]) / 2 - o[0], (q.box.min[2] + q.box.max[2]) / 2 - o[2]) < 11) {
      breakGlass(q.box);
    }
  }
  const m = new THREE.Mesh(new THREE.SphereGeometry(2.2, 14, 10), new THREE.MeshBasicMaterial({ color: 0xff9a3c, transparent: true }));
  m.position.set(...o);
  scene.add(m);
  transientFx.push({ mesh: m, life: 0.45, max: 0.45 });
  for (const b of bots) {
    if (b.health <= 0) {
      continue;
    }
    const bd = Math.hypot(b.x - o[0], 1 - o[1], b.z - o[2]);
    if (bd < 9 && lineOfSight(o, [b.x, b.y + 0.9, b.z])) {
      b.health -= Math.round(160 * (1 - bd / 9));
      b.alert = 1.5;
      if (b.health <= 0) {
        killBot(b, false);
      }
    }
  }
  if (!player.dead && pd < 9 && lineOfSight(o, [playerBody.x, playerBody.y + 1, playerBody.z])) {
    damagePlayer(Math.round(110 * (1 - pd / 9)));
  }
};
