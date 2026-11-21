import { Axis } from '../../types';
import type { Vec3 } from '../../types';
import { doors } from './state';

/**
 * Whether the panel of a door that is open (or swinging) lies across the segment from `o` to `p`. A closed door is a
 * collision box, but an open one is not, so without this anybody hiding behind an open door would be seen through it.
 */
export const doorBlocks = (o: Vec3, p: Vec3) => {
  const ex = p[0] - o[0];
  const ez = p[2] - o[2];
  const x0 = Math.min(o[0], p[0]);
  const x1 = Math.max(o[0], p[0]);
  const z0 = Math.min(o[2], p[2]);
  const z1 = Math.max(o[2], p[2]);

  for (const d of doors) {
    if (!d.box.disabled) {
      continue; // closed: its box already blocks rays
    }

    const k = d.box;
    const w = d.axis === Axis.X ? k.max[0] - k.min[0] : k.max[2] - k.min[2];

    if (d.x + w < x0 || d.x - w > x1 || d.z + w < z0 || d.z - w > z1) {
      continue;
    }

    // panel: from the hinge, `w` long along the pivot's local +x
    const hx = d.pivot.position.x;
    const hz = d.pivot.position.z;
    const fx = Math.cos(d.pivot.rotation.y) * w;
    const fz = -Math.sin(d.pivot.rotation.y) * w;
    const den = ex * fz - ez * fx;

    if (Math.abs(den) < 1e-9) {
      continue;
    }

    // segment o + t e against panel h + s f
    const qx = hx - o[0];
    const qz = hz - o[2];
    const t = (qx * fz - qz * fx) / den;
    const s = (qx * ez - qz * ex) / den;

    if (t > 0 && t < 1 && s > -0.02 && s < 1.02) {
      const y = o[1] + (p[1] - o[1]) * t;

      if (y > k.min[1] && y < k.max[1]) {
        return true;
      }
    }
  }

  return false;
};
