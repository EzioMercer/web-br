import { WATER_LEVEL } from '../../../config';
import { TreeKind } from '../../../types';
import { makeNoise } from '../../terrain/makeNoise';
import { insideFootprint } from '../place/insideFootprint';
import { placeTree } from '../place/placeTree';
import { hashRand } from '../random/hashRand';
import { pick } from '../random/pick';
import { rand } from '../random/rand';
import { randRange } from '../random/randRange';
import { gen } from '../state';
import { inSiteCore } from './inSiteCore';
import { nearSite } from './nearSite';
import { roadNear } from './roadNear';

/** Foliage colours: a row per kind, a column per shade `pick` chooses; a second row per kind adds variety. */
const FOLIAGE = {
  [TreeKind.Pine]: [[0x2c5e33, 0x356b3a, 0x27512d], [0x30603a, 0x3b7040, 0x2a5732]],
  [TreeKind.Broadleaf]: [[0x447a2f, 0x528a37, 0x3a6a2a], [0x4d7a2c, 0x5c8f3a, 0x40702e]],
};

/** Closest two trunks may stand (m). */
const MIN_GAP = 3;

/** How far a tree may move off its grid spot (m) on top of the grid's own jitter, so forests show no rows. */
const SCATTER = 3;

/** Forests on grassland. Returns the number of trees. */
export const plantTrees = () => {
  const { n2 } = makeNoise(31);
  const placed: number[] = [];
  let treeCount = 0;

  // Ground a tree may grow on, and room for it. Neither uses `rand`, so checking a spot does not change the island.
  const ground = (x: number, z: number) => {
    const k = gen.terrain.kind(x, z);

    return (k === 2 || k === 3 || k === 9)
      && gen.terrain.slope(x, z) <= 0.5
      && gen.terrain.height(x, z) >= WATER_LEVEL + 1.4
      && n2(x * 0.011 + 9, z * 0.011 + 4) >= (k === 9 ? 0.5 : 0.67);
  };

  const clear = (x: number, z: number) => !inSiteCore(x, z, 0.95)
    && !roadNear(x, z)
    && !insideFootprint(x, z, 3)
    && !nearSite(x, z, -2);

  const spaced = (x: number, z: number) => {
    for (let i = 0; i < placed.length; i += 2) {
      if (Math.abs(placed[i] - x) < MIN_GAP && Math.abs(placed[i + 1] - z) < MIN_GAP) {
        return false;
      }
    }

    return true;
  };

  for (let x = -345; x < 345; x += 9) {
    for (let z = -345; z < 345; z += 9) {
      let px = x + randRange(-3, 3);
      let pz = z + randRange(-3, 3);

      if (!ground(px, pz) || rand() < 0.12 || !clear(px, pz)) {
        continue;
      }

      const h0 = gen.terrain.height(px, pz);
      const kind = h0 > 16 || rand() < 0.35 ? TreeKind.Pine : TreeKind.Broadleaf;
      const shade = pick([0, 1, 2]);

      // this tree's own details, fixed by its grid cell
      const r = (salt: number) => hashRand(x, z, salt);

      const sx = px + (r(1) - 0.5) * 2 * SCATTER;
      const sz = pz + (r(2) - 0.5) * 2 * SCATTER;

      if (ground(sx, sz) && clear(sx, sz) && spaced(sx, sz)) {
        px = sx;
        pz = sz;
      } else if (!spaced(px, pz)) {
        continue;
      }

      const h = gen.terrain.height(px, pz);

      placed.push(px, pz);
      placeTree(
        px,
        pz,
        h,
        kind,
        0.85 + 0.35 * r(3),
        0.9 + 0.25 * r(4),
        r(5) * Math.PI * 2,
        (r(6) - 0.5) * 0.1,
        (r(7) - 0.5) * 0.1,
        FOLIAGE[kind][r(8) < 0.5 ? 0 : 1][shade],
      );
      treeCount++;

      if (treeCount > 1300) {
        break;
      }
    }
  }

  return treeCount;
};
