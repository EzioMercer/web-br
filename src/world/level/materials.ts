import * as THREE from 'three';

export const glassMat = new THREE.MeshPhongMaterial(
  { color: 0x9fd8ff, transparent: true, opacity: 0.3, shininess: 100, specular: 0xffffff, depthWrite: false },
);

/** Door panels (white: each door's own colour is its instance colour) and knobs. */
export const doorMat = new THREE.MeshLambertMaterial({ color: 0xffffff });

export const knobMat = new THREE.MeshLambertMaterial({ color: 0xc9a227 });

export const unitGeo = new THREE.BoxGeometry(1, 1, 1);

// shared by every pane, shard and door: never freed
glassMat.userData.keep = true;
doorMat.userData.keep = true;
knobMat.userData.keep = true;
unitGeo.userData.keep = true;
