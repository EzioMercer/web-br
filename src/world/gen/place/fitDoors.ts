import { gen } from '../state';
import { Axis } from '../../../types';
import type { MapDoor } from '../../../types';

/** Solid box as min and max corners. */
type Aabb = [x0: number, y0: number, z0: number, x1: number, y1: number, z1: number];

/** Half the thickness of a door panel (m). */
const HALF_PANEL = 0.07;

/** Swing angle step while testing (radians). */
const STEP = Math.PI / 60;

/**
 * How far door `d`, hinged at end `hinge` (-1 the low end of the opening, +1 the high end), can swing to side `side`
 * (-1 or +1 along the wall normal) before it runs into one of `near`: 1 is fully open (90 degrees).
 */
const clearance = (d: MapDoor, near: Aabb[], hinge: number, side: number) => {
  const ux = d.axis === Axis.X ? 1 : 0;
  const uz = d.axis === Axis.X ? 0 : 1;
  const hx = (d.axis === Axis.X ? d.center : d.wallAt) + ux * hinge * d.width / 2;
  const hz = (d.axis === Axis.X ? d.wallAt : d.center) + uz * hinge * d.width / 2;
  const y0 = d.y + 0.15;
  const y1 = d.y + d.height - 0.05;
  const solid = near.filter(b => b[1] < y1 && b[4] > y0);

  for (let a = STEP; a <= Math.PI / 2 + 1e-6; a += STEP) {
    // the panel runs from the hinge into the opening (-hinge along the wall), turning toward `side`
    const along = -hinge * Math.cos(a);
    const out = side * Math.sin(a);
    const dx = ux * along + uz * out;
    const dz = uz * along + ux * out;

    for (let r = 0.1; r <= d.width + 1e-6; r += 0.1) {
      const px = hx + dx * r;
      const pz = hz + dz * r;

      for (const b of solid) {
        if (px + HALF_PANEL > b[0] && px - HALF_PANEL < b[3] && pz + HALF_PANEL > b[2] && pz - HALF_PANEL < b[5]) {
          return Math.max(0, (a - STEP) / (Math.PI / 2));
        }
      }
    }
  }

  return 1;
};

/**
 * Picks the hinge side of every door and how far it may open to each side, so that no door swings into a wall,
 * furniture, stairs or another building part. Run after everything is placed.
 */
export const fitDoors = () => {
  const solids: Aabb[] = [
    ...gen.boxes.map(([x, z, w, d, h, , y = 0]): Aabb => [x - w / 2, y, z - d / 2, x + w / 2, y + h, z + d / 2]),
    ...gen.glass.map(([x, z, w, d, h, y]): Aabb => [x - w / 2, y, z - d / 2, x + w / 2, y + h, z + d / 2]),
  ];

  for (const d of gen.doors) {
    const cx = d.axis === Axis.X ? d.center : d.wallAt;
    const cz = d.axis === Axis.X ? d.wallAt : d.center;
    const reach = d.width + 0.3;
    const midY = d.y + d.height / 2;
    const near = solids.filter(b => b[0] < cx + reach
      && b[3] > cx - reach
      && b[2] < cz + reach
      && b[5] > cz - reach
      && b[1] < d.y + d.height
      && b[4] > d.y + 0.15);

    // the wall the door sits in touches both ends of the opening: the panel turns inside it, so leave it out
    const jamb = (k: number) => (b: Aabb) => {
      const x = cx + (d.axis === Axis.X ? k * d.width / 2 : 0);
      const z = cz + (d.axis === Axis.X ? 0 : k * d.width / 2);

      return x >= b[0] - 0.02 && x <= b[3] + 0.02 && z >= b[2] - 0.02 && z <= b[5] + 0.02 && midY > b[1] && midY < b[4];
    };

    const others = near.filter(b => !jamb(-1)(b) && !jamb(1)(b));
    let best = { hinge: -1, open: [0, 0] as [number, number], score: -1 };

    for (const hinge of [-1, 1]) {
      const open: [number, number] = [clearance(d, others, hinge, -1), clearance(d, others, hinge, 1)];
      // best: a full swing to at least one side, then to both, then the widest partial swing
      const score = Math.max(...open) * 10 + Math.min(...open) + (hinge < 0 ? 0.01 : 0);

      if (score > best.score) {
        best = { hinge, open, score };
      }
    }

    d.hinge = best.hinge;
    d.open = best.open;
  }
};
