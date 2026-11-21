import { boxesNear } from '../../physics/boxesNear';
import { groundAt } from '../../physics/groundAt';
import type { Vec3 } from '../../types';

/** Farthest a pickup is moved to get clear of walls and furniture (m). */
const MAX_SHIFT = 2.5;

/** Nothing solid (wall, furniture, closed door, glass) within `r` of (x, z) from just above `y` to head height. */
const fits = (x: number, z: number, y: number, r: number) => !boxesNear(x, z, r + 0.5).some(
  b => !b.disabled
    && b.max[1] > y + 0.08
    && b.min[1] < y + 1.6
    && b.min[0] < x + r
    && b.max[0] > x - r
    && b.min[2] < z + r
    && b.max[2] > z - r,
);

/**
 * A spot near (x, z) on the floor at height `y` where a pickup that spins within radius `r` touches nothing solid,
 * so it never shows half inside a wall. Tries a smaller radius in cramped rooms; gives back the spot unchanged if
 * nothing nearby is clear.
 */
export const clearSpot = (x: number, z: number, y: number, r: number): Vec3 => {
  for (const rr of [r, r * 0.7, Math.min(r, 0.35)]) {
    for (let d = 0; d <= MAX_SHIFT; d += 0.2) {
      const n = d ? Math.max(8, Math.round(d * 10)) : 1;
      const a0 = (x * 7.1 + z * 3.3) % 6.283;

      for (let k = 0; k < n; k++) {
        const a = a0 + k / n * 6.283;
        const px = x + Math.cos(a) * d;
        const pz = z + Math.sin(a) * d;
        // the same floor: no stepping off a ledge or up onto a crate
        const g = groundAt(px, pz, y + 0.5);

        if (Math.abs(g - y) < 0.4 && fits(px, pz, g, rr)) {
          return [px, g, pz];
        }
      }
    }
  }

  return [x, y, z];
};
