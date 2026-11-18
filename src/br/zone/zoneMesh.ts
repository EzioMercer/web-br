import * as THREE from 'three';
import { scene } from '../../render/scene';

export const zoneMesh = new THREE.Mesh(
  new THREE.CylinderGeometry(1, 1, 420, 64, 1, true),
  new THREE.MeshBasicMaterial(
    { color: 0x3a7bff, transparent: true, opacity: 0.2, side: THREE.DoubleSide, depthWrite: false },
  ),
);

zoneMesh.visible = false;

scene.add(zoneMesh);
