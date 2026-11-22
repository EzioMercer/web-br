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

const aimMesh = new THREE.Mesh(
  aimGeo,
  new THREE.MeshBasicMaterial(
    { color: 0xffe27a, depthTest: false, transparent: true, opacity: 0.92, side: THREE.DoubleSide },
  ),
);

aimMesh.frustumCulled = false;

aimMesh.renderOrder = 6;

aimMesh.visible = false;

scene.add(aimMesh);

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
      if (k < AIM_POINTS && hypot(px - aimPos[k * 3 - 3], py - aimPos[k * 3 - 2], pz - aimPos[k * 3 - 1]) > 0.02) {
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
