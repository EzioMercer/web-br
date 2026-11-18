import * as THREE from 'three';
import { BASE_FOV } from '../config';
import { scene } from './scene';

export const camera = new THREE.PerspectiveCamera(BASE_FOV, 1, 0.05, 1500);

camera.rotation.order = 'YXZ';

scene.add(camera);
