import * as THREE from 'three';
import { camera } from './camera';
import { glCanvas } from './glCanvas';

export const renderer = new THREE.WebGLRenderer({ canvas: glCanvas, antialias: true });

renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

const resize = () => {
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
};

addEventListener('resize', resize);

resize();
