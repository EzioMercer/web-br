import * as THREE from 'three';

export const lambert = (c: number) => new THREE.MeshLambertMaterial({ color: c });
