import * as THREE from 'three';
import { camera } from './camera';
import { SUN_DIR, sun } from './sun';

// The shadow map's axes: across (x, y) and along the sunlight (z).
const axes = new THREE.Matrix4().lookAt(SUN_DIR, new THREE.Vector3(), new THREE.Vector3(0, 1, 0));
const ax = new THREE.Vector3().setFromMatrixColumn(axes, 0);
const ay = new THREE.Vector3().setFromMatrixColumn(axes, 1);
const az = new THREE.Vector3().setFromMatrixColumn(axes, 2);

/** Keeps the sun's shadow box around the player, moved in whole shadow-map texels so shadow edges do not crawl. */
export const followSun = () => {
  if (!sun.castShadow) {
    return;
  }

  const cam = sun.shadow.camera;
  const texel = (cam.right - cam.left) / sun.shadow.mapSize.width;
  const p = camera.position;
  const x = Math.round(p.dot(ax) / texel) * texel;
  const y = Math.round(p.dot(ay) / texel) * texel;

  sun.target.position.set(0, 0, 0).addScaledVector(ax, x).addScaledVector(ay, y).addScaledVector(az, p.dot(az));
  sun.position.copy(sun.target.position).addScaledVector(SUN_DIR, 200);
  sun.target.updateMatrixWorld();
};
