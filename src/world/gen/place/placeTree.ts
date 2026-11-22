import { BROADLEAF_BLOBS, PINE_TIERS } from '../../../data/trees';
import { TreeKind } from '../../../types';
import type { MapTree } from '../../../types';
import { gen } from '../state';
import { placeBox } from './placeBox';

/**
 * Adds a tree model (see MapTree), with hidden boxes for what the model draws: the trunk collides, and the crown is
 * leaf boxes that bots can't see through. The leaf boxes sit inside the crown's shape (scaled and turned like the
 * tree, though not leaned), so a bot does not see through foliage, nor is it blocked by thin air.
 */
export const placeTree = (...t: MapTree) => {
  const [x, z, y, kind, size, height, turn] = t;
  const sy = size * height;

  gen.trees.push(t);
  // the same trunk box for every tree, as before the trees had models
  placeBox(x, z, 0.9, 0.9, 5, 0, y - 0.6, false, true);

  if (kind === TreeKind.Pine) {
    // the lower half of each tier but the small top one, at the width of a cone's middle there
    for (const [r, base, h] of PINE_TIERS.slice(0, 3)) {
      const w = 1.25 * r * size;

      placeBox(x, z, w, w, 0.55 * h * sy, 0, y + base * sy, 'leaves', true);
    }

    return;
  }

  // one box around the blobs' cores, turned with the tree
  const c = Math.cos(turn);
  const s = Math.sin(turn);
  let x0 = Infinity;
  let x1 = -Infinity;
  let y0 = Infinity;
  let y1 = -Infinity;
  let z0 = Infinity;
  let z1 = -Infinity;

  for (const [bx, by, bz, r] of BROADLEAF_BLOBS) {
    const rx = bx * c + bz * s;
    const rz = bz * c - bx * s;
    const k = 0.8 * r;

    x0 = Math.min(x0, rx - k);
    x1 = Math.max(x1, rx + k);
    z0 = Math.min(z0, rz - k);
    z1 = Math.max(z1, rz + k);
    y0 = Math.min(y0, by - k);
    y1 = Math.max(y1, by + k);
  }

  placeBox(
    x + (x0 + x1) / 2 * size,
    z + (z0 + z1) / 2 * size,
    (x1 - x0) * size,
    (z1 - z0) * size,
    (y1 - y0) * sy,
    0,
    y + y0 * sy,
    'leaves',
    true,
  );
};
