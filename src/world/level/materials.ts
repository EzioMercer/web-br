import * as THREE from 'three';

export const glassMat = new THREE.MeshPhongMaterial(
  { color: 0x9fd8ff, transparent: true, opacity: 0.3, shininess: 100, specular: 0xffffff, depthWrite: false },
);

export const doorMats: Record<string, THREE.MeshLambertMaterial> = {};

export const unitGeo = new THREE.BoxGeometry(1, 1, 1);
