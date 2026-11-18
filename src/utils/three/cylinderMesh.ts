import * as THREE from 'three';

/** Cylinder along z. */
export const cylinderMesh = (
  g: THREE.Object3D,
  r: number,
  l: number,
  x: number,
  y: number,
  z: number,
  m: THREE.Material,
) => {
  const o = new THREE.Mesh(new THREE.CylinderGeometry(r, r, l, 16), m);

  o.rotation.x = Math.PI / 2;
  o.position.set(x, y, z);
  g.add(o);
  return o;
};
