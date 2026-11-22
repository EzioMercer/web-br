import type * as THREE from 'three';

/** A map tile's trees of one kind, with the models it switches between by distance (see treeDetail). */
export interface TreeTile {
  mesh: THREE.InstancedMesh;
  /** Centre (x, z) and radius of the tile's trees (m). */
  x: number;
  z: number;
  radius: number;
  near: THREE.BufferGeometry;
  far: THREE.BufferGeometry;
}
