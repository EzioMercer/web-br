import * as THREE from 'three';
import { boxMesh } from '../utils/three/boxMesh';
import { cylinderMesh } from '../utils/three/cylinderMesh';
import { lambert } from '../utils/three/lambert';
import { opticBlack } from './materials';
import type { OpticId } from '../types';

const lensMat = (t: OpticId) => new THREE.MeshBasicMaterial(
  { color: t === 'rd' ? 0xff4030 : t === 'ho' ? 0xff6a50 : 0x7fb8ff, transparent: true, opacity: 0.8 },
);

/** Optic model (also used for Battle Royale pickups). */
export const makeOptic = (t: OpticId) => {
  const bk = opticBlack;
  const g = new THREE.Group();
  const l = lensMat(t);

  if (t === 'rd') {
    boxMesh(g, 0.03, 0.012, 0.08, 0, 0.006, 0, bk);
    boxMesh(g, 0.036, 0.045, 0.016, 0, 0.034, 0.03, bk);
    boxMesh(g, 0.036, 0.012, 0.07, 0, 0.06, 0, bk);
    boxMesh(g, 0.026, 0.034, 0.004, 0, 0.036, -0.03, l);
  } else if (t === 'ho') {
    boxMesh(g, 0.04, 0.012, 0.09, 0, 0.006, 0, bk);
    boxMesh(g, 0.006, 0.05, 0.07, -0.02, 0.037, 0, bk);
    boxMesh(g, 0.006, 0.05, 0.07, 0.02, 0.037, 0, bk);
    boxMesh(g, 0.046, 0.008, 0.07, 0, 0.066, 0, bk);
    boxMesh(g, 0.034, 0.04, 0.004, 0, 0.04, -0.034, l);
  } else if (t === 'x2') {
    boxMesh(g, 0.03, 0.02, 0.08, 0, 0.012, 0, bk);
    cylinderMesh(g, 0.02, 0.14, 0, 0.045, 0, bk);
    cylinderMesh(g, 0.026, 0.03, 0, 0.045, -0.08, bk);
    cylinderMesh(g, 0.017, 0.003, 0, 0.045, -0.097, l);
    cylinderMesh(g, 0.015, 0.003, 0, 0.045, 0.071, l);
  } else {
    boxMesh(g, 0.04, 0.03, 0.1, 0, 0.018, 0, bk);
    cylinderMesh(g, 0.026, 0.17, 0, 0.052, 0, bk);
    cylinderMesh(g, 0.034, 0.04, 0, 0.052, -0.1, bk);
    cylinderMesh(g, 0.02, 0.04, 0, 0.052, 0.1, bk);
    cylinderMesh(g, 0.03, 0.003, 0, 0.052, -0.121, l);
    cylinderMesh(g, 0.014, 0.003, 0, 0.052, 0.121, l);
    cylinderMesh(g, 0.006, 0.12, 0, 0.088, 0, lambert(0xff9a2a));
  }

  return g;
};
