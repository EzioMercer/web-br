import * as THREE from 'three';
import { srgbToLinear } from '../../utils/srgbToLinear';
import type { Terrain } from './types';

export const terrainMesh = (T: Terrain) => {
  const N = T.gridN;
  const ST = T.step;
  const pos = new Float32Array(N * N * 3);
  const idx = new Uint16Array((N - 1) * (N - 1) * 6);

  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const k = j * N + i;

      pos[k * 3] = -T.half + i * ST;
      pos[k * 3 + 1] = T.heights[k];
      pos[k * 3 + 2] = -T.half + j * ST;
    }
  }

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

  const g = new THREE.BufferGeometry();

  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(srgbToLinear(T.colors), 3));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  g.computeVertexNormals();
  return new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true }));
};
