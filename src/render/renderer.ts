import * as THREE from 'three';
import { BASE_FOV } from '../config';
import { glCanvas } from '../dom';

export const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9cc3e6);
scene.fog = new THREE.Fog(0x9cc3e6, 160, 820);
export const camera = new THREE.PerspectiveCamera(BASE_FOV, 1, 0.05, 1500);
camera.rotation.order = 'YXZ';
scene.add(camera);
export const renderer = new THREE.WebGLRenderer({ canvas: glCanvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

// Canvas-drawn textures hold sRGB colors.
export const srgbTex = <T extends THREE.Texture>(t: T): T => {
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
};

const resize = () => {
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
};

addEventListener('resize', resize);
resize();
// Physically based light values, fitted against renders of the original r128 (gamma-space) lighting.
scene.add(new THREE.HemisphereLight(0xffffff, 0x2c2418, 3.7));

const sun = new THREE.DirectionalLight(0xfff0d0, 5.7);

sun.position.set(30, 50, 20);
scene.add(sun);
