import * as THREE from 'three';
import { TreeKind } from '../../types';
import type { MapTree } from '../../types';
import { byTile } from './byTile';
import { mapGroup } from './mapGroup';
import { tileMeshes, treeTiles } from './state';
import { treeGeometry } from './treeGeometry';

const KINDS = [TreeKind.Pine, TreeKind.Broadleaf];

/** The near and far model of each kind of tree, shared by every tree and match. Never freed. */
const models = Object.fromEntries(KINDS.map(k => [k, { near: treeGeometry(k), far: treeGeometry(k, true) }]));

const treeMat = new THREE.MeshLambertMaterial({ vertexColors: true });

for (const m of Object.values(models)) {
  m.near.userData.keep = true;
  m.far.userData.keep = true;
}

treeMat.userData.keep = true;

/**
 * Draws the trees as one instanced mesh per kind and map tile, like the map boxes (see flushBoxes): each instance
 * places, sizes, turns and tilts the shared model, and its colour is the tree's foliage colour.
 */
export const flushTrees = (trees: MapTree[]) => {
  const M = new THREE.Matrix4();
  const C = new THREE.Color();
  const P = new THREE.Vector3();
  const Q = new THREE.Quaternion();
  const S = new THREE.Vector3();
  const E = new THREE.Euler();

  for (const kind of KINDS) {
    const { near, far } = models[kind];

    for (const list of byTile(trees.filter(t => t[3] === kind), t => [t[0], t[1]])) {
      // bounds come from the near model, which the far one fits inside
      const im = new THREE.InstancedMesh(near, treeMat, list.length);

      im.name = 'trees';
      list.forEach(([x, z, y, , size, height, turn, leanX, leanZ, color], i) => {
        M.compose(P.set(x, y, z), Q.setFromEuler(E.set(leanX, turn, leanZ)), S.set(size, size * height, size));
        im.setMatrixAt(i, M);
        im.setColorAt(i, C.setHex(color));
      });
      im.instanceMatrix.needsUpdate = true;
      im.instanceColor!.needsUpdate = true;
      im.computeBoundingSphere();
      mapGroup.add(im);
      tileMeshes.push(im);

      const b = im.boundingSphere!;

      treeTiles.push({ mesh: im, x: b.center.x, z: b.center.z, radius: b.radius, near, far });
    }
  }
};
