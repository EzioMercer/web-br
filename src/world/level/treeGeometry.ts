import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { BROADLEAF_BLOBS, BROADLEAF_FAR_BLOBS, PINE_TIERS } from '../../data/trees';
import { TreeKind } from '../../types';

const BARK = new THREE.Color(0x5e4430);

/**
 * The foliage colour the bark is worked out against, a middle one of each kind's (see plantTrees). Each tree's
 * foliage colour is its instance colour, which three.js multiplies into every vertex colour, the trunk's too. So the
 * trunk's vertex colour is BARK / FOLIAGE_REF: a tree with this foliage gets exactly BARK, and a darker or lighter
 * tree a slightly darker or lighter trunk.
 */
const FOLIAGE_REF = { [TreeKind.Pine]: new THREE.Color(0x30613a), [TreeKind.Broadleaf]: new THREE.Color(0x4b7f32) };

/** A part of the model: its geometry in place, how far its corners are pushed about (m), and whether it is bark. */
type Part = [geometry: THREE.BufferGeometry, jitter: number, bark: boolean];

/** Pine: tiers of cones. Far away, fewer sides and no undersides. */
const pine = (far: boolean): Part[] => [
  [new THREE.CylinderGeometry(0.17, 0.36, 3.2, far ? 4 : 6, 1, true).translate(0, 1, 0), 0, true],
  ...PINE_TIERS.map(([r, y, h], i): Part => [
    new THREE.ConeGeometry(r, h, far ? 6 : 8, 1, far).rotateY(i * 0.37).translate(0, y + h / 2, 0),
    0.1 + 0.04 * r,
    false,
  ]),
];

/** Broadleaf: a crown of rough blobs. */
const broadleaf = (far: boolean): Part[] => [
  [new THREE.CylinderGeometry(0.22, 0.38, 4.4, far ? 4 : 6, 1, true).translate(0, 1.6, 0), 0, true],
  ...(far ? BROADLEAF_FAR_BLOBS : BROADLEAF_BLOBS).map(([x, y, z, r], i): Part => [
    new THREE.IcosahedronGeometry(r, 0).rotateY(i * 1.1).rotateX(i * 0.7).translate(x, y, z),
    0.16 * r,
    false,
  ]),
];

/**
 * A tree model of a few low-poly parts in one geometry, flat shaded, with vertex colours that darken the foliage
 * low down and toward the trunk (a cheap stand-in for the shade inside a crown). Corners are pushed about by a fixed
 * seed, so the model is the same every time; each tree then gets its own size, turn and lean as an instance.
 * The `far` model has about a third of the triangles, for trees deep in the fog (see treeDetail).
 */
export const treeGeometry = (kind: TreeKind, far = false) => {
  let seed = kind === TreeKind.Pine ? 17 : 29;

  const rnd = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296 - 0.5;
  };

  const parts = kind === TreeKind.Pine ? pine(far) : broadleaf(far);
  const out: THREE.BufferGeometry[] = [];
  const c = new THREE.Color();
  const ref = FOLIAGE_REF[kind];
  const bark = BARK.clone().multiply(new THREE.Color(1 / ref.r, 1 / ref.g, 1 / ref.b));
  let lo = Infinity;
  let hi = -Infinity;
  let reach = 0;

  for (const [g] of parts) {
    g.computeBoundingBox();
  }

  for (const [g, , isBark] of parts) {
    if (!isBark) {
      const b = g.boundingBox!;

      lo = Math.min(lo, b.min.y);
      hi = Math.max(hi, b.max.y);
      reach = Math.max(reach, -b.min.x, b.max.x, -b.min.z, b.max.z);
    }
  }

  for (const [indexed, jitter, isBark] of parts) {
    const g = indexed.toNonIndexed();
    const pos = g.getAttribute('position');
    const colors = new Float32Array(pos.count * 3);
    // corners shared by several faces (and seams) move together, so the surface does not crack
    const moved = new Map<string, number[]>();

    indexed.dispose();
    g.deleteAttribute('uv');

    for (let i = 0; i < pos.count; i++) {
      const key = pos.getX(i).toFixed(3) + ',' + pos.getY(i).toFixed(3) + ',' + pos.getZ(i).toFixed(3);
      let d = moved.get(key);

      if (!d) {
        d = [rnd() * 2 * jitter, rnd() * 2 * jitter, rnd() * 2 * jitter];
        moved.set(key, d);
      }

      pos.setXYZ(i, pos.getX(i) + d[0], pos.getY(i) + d[1], pos.getZ(i) + d[2]);

      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);

      if (isBark) {
        c.copy(bark).multiplyScalar(0.7 + 0.3 * Math.min(1, Math.max(0, y / 3)));
      } else {
        const up = (y - lo) / (hi - lo);
        const edge = Math.min(1, Math.sqrt(x * x + z * z) / reach);

        c.setScalar((0.55 + 0.5 * up) * (0.78 + 0.22 * edge));
      }

      colors.set([c.r, c.g, c.b], i * 3);
    }

    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    // the faces do not share vertices any more, so these are face normals: flat shading
    g.computeVertexNormals();
    out.push(g);
  }

  const merged = mergeGeometries(out)!;

  for (const g of out) {
    g.dispose();
  }

  merged.computeBoundingSphere();
  return merged;
};
