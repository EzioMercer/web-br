import * as THREE from 'three';
import { lambert } from '../utils/three/lambert';

export const gunMetal = lambert(0x3a3f44);

export const woodMat = lambert(0x7a4a22);

export const darkMat = lambert(0x1d2024);

export const oliveMat = lambert(0x3d4a36);

export const lensGlass = new THREE.MeshPhongMaterial(
  { color: 0x7fd0ff, transparent: true, opacity: 0.4, shininess: 120, specular: 0xffffff },
);

export const opticBlack = lambert(0x151719);
