import * as THREE from 'three';
import { srgbToLinear } from '../../utils/srgbToLinear';
import { TERRAIN_TILE_CELLS } from './constants';
import type { Terrain } from './types';

/**
 * The terrain as a group of square tiles, so the renderer skips the tiles out of view and the shadow pass draws only
 * the few around the player. Normals come from the whole height field, so the tiles meet without seams.
 */
export const terrainMesh = (T: Terrain) => {
  const N = T.gridN;
  const ST = T.step;
  const pos = new Float32Array(N * N * 3);

  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const k = j * N + i;

      pos[k * 3] = -T.half + i * ST;
      pos[k * 3 + 1] = T.heights[k];
      pos[k * 3 + 2] = -T.half + j * ST;
    }
  }

  const idx = new Uint32Array((N - 1) * (N - 1) * 6);
  let q = 0;

  for (let j = 0; j < N - 1; j++) {
    for (let i = 0; i < N - 1; i++) {
      const a = j * N + i;
      const b = a + 1;
      const c = a + N;
      const d = c + 1;

      idx[q++] = a;
      idx[q++] = c;
      idx[q++] = b;
      idx[q++] = b;
      idx[q++] = c;
      idx[q++] = d;
    }
  }

  // the whole field, only to compute the normals
  const full = new THREE.BufferGeometry();

  full.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  full.setIndex(new THREE.BufferAttribute(idx, 1));
  full.computeVertexNormals();

  const nrm = full.getAttribute('normal').array as Float32Array;
  const col = srgbToLinear(T.colors);
  const mat = new THREE.MeshLambertMaterial({ vertexColors: true });
  const group = new THREE.Group();
  const C = TERRAIN_TILE_CELLS;

  for (let j0 = 0; j0 < N - 1; j0 += C) {
    for (let i0 = 0; i0 < N - 1; i0 += C) {
      // vertices i0..i1, j0..j1: neighbouring tiles share their edge vertices
      const i1 = Math.min(N - 1, i0 + C);
      const j1 = Math.min(N - 1, j0 + C);
      const w = i1 - i0 + 1;
      const h = j1 - j0 + 1;
      const tp = new Float32Array(w * h * 3);
      const tn = new Float32Array(w * h * 3);
      const tc = new Float32Array(w * h * 3);

      for (let j = 0; j < h; j++) {
        for (let i = 0; i < w; i++) {
          const src = ((j0 + j) * N + i0 + i) * 3;
          const dst = (j * w + i) * 3;

          for (let c = 0; c < 3; c++) {
            tp[dst + c] = pos[src + c];
            tn[dst + c] = nrm[src + c];
            tc[dst + c] = col[src + c];
          }
        }
      }

      const ti = new Uint16Array((w - 1) * (h - 1) * 6);
      let t = 0;

      for (let j = 0; j < h - 1; j++) {
        for (let i = 0; i < w - 1; i++) {
          const a = j * w + i;
          const b = a + 1;
          const c = a + w;
          const d = c + 1;

          ti[t++] = a;
          ti[t++] = c;
          ti[t++] = b;
          ti[t++] = b;
          ti[t++] = c;
          ti[t++] = d;
        }
      }

      const g = new THREE.BufferGeometry();

      g.setAttribute('position', new THREE.BufferAttribute(tp, 3));
      g.setAttribute('normal', new THREE.BufferAttribute(tn, 3));
      g.setAttribute('color', new THREE.BufferAttribute(tc, 3));
      g.setIndex(new THREE.BufferAttribute(ti, 1));
      g.computeBoundingSphere();
      group.add(new THREE.Mesh(g, mat));
    }
  }

  full.dispose();
  return group;
};
