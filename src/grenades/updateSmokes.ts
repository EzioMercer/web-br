import * as THREE from 'three';
import { camera } from '../render/camera';
import { clock } from '../sim/state';
import { hypot } from '../utils/hypot';
import { smoothstep } from '../utils/smoothstep';
import { PUFF_STRIDE, SMOKE_FADE, SMOKE_POUR, SMOKE_PUFFS, SMOKE_SPREAD } from './constants';
import { smokes } from './state';

const right = new THREE.Vector3();

const up = new THREE.Vector3();

const fwd = new THREE.Vector3();

/** Per puff this frame: centre x, y, z, half-size, turn, alpha, shade, and its depth in front of the camera. */
const cur = new Float32Array(SMOKE_PUFFS * 7);

const depth = new Float32Array(SMOKE_PUFFS);

/** Puffs in drawing order, far to near. */
const order = new Uint8Array(SMOKE_PUFFS);

/**
 * Grey veil over the view while the camera is inside a cloud. It hangs just in front of the camera in the world pass,
 * so it covers the world but not the gun (drawn in its own pass after), and the grenade aim path draws over it.
 */
const veil = new THREE.Mesh(
  new THREE.PlaneGeometry(2, 2),
  new THREE.MeshBasicMaterial({
    color: 0xb9bdc0,
    transparent: true,
    opacity: 0,
    depthTest: false,
    depthWrite: false,
    fog: false,
  }),
);

veil.position.z = -0.1;

veil.renderOrder = 5;

veil.frustumCulled = false;

veil.visible = false;

camera.add(veil);

/**
 * Moves the puffs of every smoke cloud and turns them to face the camera; greys the screen over when the camera is
 * inside a cloud. Each puff rises from the canister after its delay, drifts out to its place in the dome, then sways
 * and slowly swells; the cloud thins out and swells a little more over its last `SMOKE_FADE` seconds.
 */
export const updateSmokes = () => {
  let vo = 0;

  if (smokes.length) {
    right.set(1, 0, 0).applyQuaternion(camera.quaternion);
    up.set(0, 1, 0).applyQuaternion(camera.quaternion);
    fwd.set(0, 0, -1).applyQuaternion(camera.quaternion);
  }

  for (const s of smokes) {
    const g = s.mesh.geometry;
    const pos = g.attributes.position.array as Float32Array;
    const col = g.attributes.color.array as Float32Array;
    const p = s.puffs;
    const age = clock.time - s.born;
    const fade = Math.min(1, Math.max(0, (s.until - clock.time) / SMOKE_FADE));
    const thin = 1 - fade;
    const cx = camera.position.x - s.mesh.position.x;
    const cy = camera.position.y - s.mesh.position.y;
    const cz = camera.position.z - s.mesh.position.z;

    for (let i = 0; i < SMOKE_PUFFS; i++) {
      const o = i * PUFF_STRIDE;
      const c = i * 7;
      const a = age - p[o + 6];

      order[i] = i;

      if (a <= 0) {
        cur[c + 3] = 0;
        cur[c + 5] = 0;
        depth[i] = -1e9;
        continue;
      }

      const k = Math.min(1, a / SMOKE_SPREAD);
      const e = 1 - (1 - k) * (1 - k) * (1 - k);
      const x = p[o] * e * (1 + 0.15 * thin) + Math.sin(age * 0.31 + i * 2.1) * 0.18;
      const y = 0.15 + (p[o + 1] - 0.15) * e + 0.025 * a + 0.4 * thin;
      const z = p[o + 2] * e * (1 + 0.15 * thin) + Math.cos(age * 0.27 + i * 1.3) * 0.18;
      const d = (x - cx) * fwd.x + (y - cy) * fwd.y + (z - cz) * fwd.z;

      cur[c] = x;
      cur[c + 1] = y;
      cur[c + 2] = z;
      cur[c + 3] = p[o + 3] * (0.3 + 0.7 * e) * (1 + 0.01 * a + 0.3 * thin);
      cur[c + 4] = p[o + 4] + p[o + 5] * a;
      // puffs right at the camera fade before the near plane cuts them; the grey veil stands in for them
      cur[c + 5] = 0.75 * Math.min(1, a / 0.4) * fade * smoothstep(0.15, 1.3, d);
      cur[c + 6] = p[o + 7] + 0.08 * Math.min(1, y / 3.2);
      depth[i] = d;
    }

    // far to near, so near puffs blend over far ones. Nearly sorted from the last frame's order: insertion sort.
    for (let i = 1; i < SMOKE_PUFFS; i++) {
      const v = order[i];
      let j = i - 1;

      while (j >= 0 && depth[order[j]] < depth[v]) {
        order[j + 1] = order[j];
        j--;
      }

      order[j + 1] = v;
    }

    for (let n = 0; n < SMOKE_PUFFS; n++) {
      const c = order[n] * 7;
      const h = cur[c + 3];
      const ca = Math.cos(cur[c + 4]) * h;
      const sa = Math.sin(cur[c + 4]) * h;
      // the quad's two half-axes: the camera's right and up vectors, turned by the puff's angle
      const ax = right.x * ca + up.x * sa;
      const ay = right.y * ca + up.y * sa;
      const az = right.z * ca + up.z * sa;
      const bx = up.x * ca - right.x * sa;
      const by = up.y * ca - right.y * sa;
      const bz = up.z * ca - right.z * sa;
      const q = n * 12;

      pos[q] = cur[c] - ax - bx;
      pos[q + 1] = cur[c + 1] - ay - by;
      pos[q + 2] = cur[c + 2] - az - bz;
      pos[q + 3] = cur[c] + ax - bx;
      pos[q + 4] = cur[c + 1] + ay - by;
      pos[q + 5] = cur[c + 2] + az - bz;
      pos[q + 6] = cur[c] + ax + bx;
      pos[q + 7] = cur[c + 1] + ay + by;
      pos[q + 8] = cur[c + 2] + az + bz;
      pos[q + 9] = cur[c] - ax + bx;
      pos[q + 10] = cur[c + 1] - ay + by;
      pos[q + 11] = cur[c + 2] - az + bz;

      for (let v = 0; v < 4; v++) {
        col[n * 16 + v * 4] = col[n * 16 + v * 4 + 1] = col[n * 16 + v * 4 + 2] = cur[c + 6];
        col[n * 16 + v * 4 + 3] = cur[c + 5];
      }
    }

    g.attributes.position.needsUpdate = true;
    g.attributes.color.needsUpdate = true;

    // how deep the camera is in the cloud's dome (0 at its edge, 1 at its heart), once the smoke has spread
    const inside = 1 - hypot(cx / 3.8, (cy - 1.6) / 2.4, cz / 3.8);
    const grown = smoothstep(0, SMOKE_POUR + SMOKE_SPREAD * 0.5, age);

    vo = Math.max(vo, smoothstep(0, 0.45, inside) * grown * fade * 0.9);
  }

  veil.material.opacity = vo;
  veil.visible = vo > 0.005;
};
