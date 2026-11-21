import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/** Material of merged plain-coloured meshes: each part keeps its colour as a vertex colour. Never freed. */
const vertexColorMat = new THREE.MeshLambertMaterial({ vertexColors: true });

vertexColorMat.userData.keep = true;

/** A plain opaque Lambert colour, which a vertex colour can stand in for. */
const plain = (m: THREE.Material) => m instanceof THREE.MeshLambertMaterial
  && !m.transparent
  && !m.map
  && !m.vertexColors
  && m.side === THREE.FrontSide
  && m.emissive.getHex() === 0;

/**
 * Merges the visible meshes under `root` (only its direct children unless `deep`) into one mesh per material, so a
 * model of many parts takes a few draw calls instead of one per part. Parts in plain Lambert colours share one mesh,
 * with their colours as vertex colours: the shading is the same. Use it on parts that do not move relative to `root`;
 * groups that animate on their own are merged separately. Leaves `root`'s other children (groups, sprites) as they are.
 */
export const mergeMeshes = (root: THREE.Object3D, deep = false) => {
  root.updateMatrixWorld(true);

  const inv = root.matrixWorld.clone().invert();
  const parts: THREE.Mesh[] = [];

  const collect = (o: THREE.Object3D) => {
    for (const c of o.children) {
      if (!c.visible) {
        continue;
      }

      const m = c as THREE.Mesh;

      if (m.isMesh && !Array.isArray(m.material) && m.geometry.index) {
        parts.push(m);
      } else if (deep) {
        collect(c);
      }
    }
  };

  collect(root);

  const buckets = new Map<THREE.Material, THREE.Mesh[]>();

  for (const m of parts) {
    const mat = m.material as THREE.Material;
    const k = plain(mat) ? vertexColorMat : mat;

    buckets.set(k, [...(buckets.get(k) ?? []), m]);
  }

  const C = new THREE.Color();

  for (const [mat, list] of buckets) {
    if (list.length < 2 && mat !== vertexColorMat) {
      continue;
    }

    const geos = list.map((m) => {
      const g = m.geometry.clone();

      // only what the materials read: geometries of different kinds may carry other attributes
      for (const name of Object.keys(g.attributes)) {
        if (name !== 'position' && name !== 'normal' && name !== 'uv') {
          g.deleteAttribute(name);
        }
      }

      g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, m.matrixWorld));

      if (mat === vertexColorMat) {
        const n = g.getAttribute('position').count;
        const col = new Float32Array(n * 3);

        C.copy((m.material as THREE.MeshLambertMaterial).color);

        for (let i = 0; i < n; i++) {
          col[i * 3] = C.r;
          col[i * 3 + 1] = C.g;
          col[i * 3 + 2] = C.b;
        }

        g.setAttribute('color', new THREE.BufferAttribute(col, 3));
      }

      return g;
    });
    const merged = mergeGeometries(geos);

    for (const g of geos) {
      g.dispose();
    }

    if (!merged) {
      continue;
    }

    for (const m of list) {
      m.removeFromParent();

      if (!m.geometry.userData.keep) {
        m.geometry.dispose();
      }

      const own = m.material as THREE.Material;

      if (mat === vertexColorMat && !own.userData.keep) {
        own.dispose();
      }
    }

    const out = new THREE.Mesh(merged, mat);

    out.layers.mask = list[0].layers.mask;
    root.add(out);
  }
};
