import * as THREE from 'three';
import { scene } from './scene';

/** Direction the sunlight comes from. */
export const SUN_DIR = new THREE.Vector3(30, 50, 20).normalize();

export const sun = new THREE.DirectionalLight(0xfff0d0, 5.7);

sun.position.copy(SUN_DIR);
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.04;

scene.add(sun, sun.target);
