import * as THREE from 'three';
import { loadout } from '../loadout/state';
import { player } from '../player/state';
import { camera } from '../render/camera';
import { scene } from '../render/scene';
import { fuseTime } from './fuseTime';
import { grenadeCount, grenadeThrow } from './state';
import { stepGrenade } from './stepGrenade';
import { throwStart } from './throwStart';
import { hypot } from '../utils/hypot';
import type { GrenadeBody } from './types';

/** Points on the grenade aim preview. */
const AIM_POINTS = 80;

/** Simulation step of the preview: the same as the game's, so the preview lands where the grenade will. */
const STEP = 1 / 120;

/** Longest flight the preview follows (s): the longest fuse. */
const MAX_FLIGHT = 6;

const simPos = new Float32Array((Math.ceil(MAX_FLIGHT / STEP) + 1) * 3);

const sim: GrenadeBody = { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0 };

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

const aimMat = new THREE.MeshBasicMaterial(
  { color: 0xffe27a, depthTest: false, transparent: true, opacity: 0.92, side: THREE.DoubleSide },
);

const aimMesh = new THREE.Mesh(aimGeo, aimMat);

aimMesh.frustumCulled = false;

aimMesh.renderOrder = 6;

aimMesh.visible = false;

scene.add(aimMesh);

// the path the grenade will take, up to where it first lands or the fuse runs out
export const updateAimPath = (dt: number) => {
  grenadeThrow.strength += (grenadeThrow.power - grenadeThrow.strength) * Math.min(1, dt * 14);

  if (!loadout.grenade || player.dead || !grenadeCount[loadout.grenade] || !grenadeThrow.held) {
    aimMesh.visible = false;
    return;
  }

  const n = throwStart(sim);
  const steps = Math.round(Math.min(MAX_FLIGHT, fuseTime(loadout.grenade)) / STEP);
  let last = 0;

  simPos[0] = n.x;
  simPos[1] = n.y;
  simPos[2] = n.z;

  for (let i = 1; i <= steps; i++) {
    const hit = stepGrenade(n, STEP);

    simPos[i * 3] = n.x;
    simPos[i * 3 + 1] = n.y;
    simPos[i * 3 + 2] = n.z;
    last = i;

    if (hit) {
      break;
    }
  }

  // spread the points evenly over the flight, so a short toss and a long throw are both smooth
  const k = Math.min(AIM_POINTS, last + 1);

  for (let i = 0; i < k; i++) {
    const j = Math.round(i * last / Math.max(1, k - 1)) * 3;

    aimPos[i * 3] = simPos[j];
    aimPos[i * 3 + 1] = simPos[j + 1];
    aimPos[i * 3 + 2] = simPos[j + 2];
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
    const dist = hypot(vx, vy, vz) || 1;
    let sx = ty * vz - tz * vy;
    let sy = tz * vx - tx * vz;
    let sz = tx * vy - ty * vx;
    const sl = hypot(sx, sy, sz) || 1;
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
