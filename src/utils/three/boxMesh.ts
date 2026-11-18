import * as THREE from 'three';

export const boxMesh = (
  g: THREE.Object3D,
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number,
  m: THREE.Material,
  rx?: number,
) => {
  const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);

  o.position.set(x, y, z);

  if (rx) {
    o.rotation.x = rx;
  }

  g.add(o);
  return o;
};
