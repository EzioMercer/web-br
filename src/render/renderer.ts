import * as THREE from 'three';
import { FOV } from '../config';
import { cv } from '../dom';

export const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9cc3e6);
scene.fog = new THREE.Fog(0x9cc3e6, 160, 820);
export const cam = new THREE.PerspectiveCamera(FOV, 1, 0.05, 1500);
cam.rotation.order = 'YXZ';
scene.add(cam);
export const ren = new THREE.WebGLRenderer({ canvas: cv, antialias: true });
ren.setPixelRatio(Math.min(devicePixelRatio, 2));

// Canvas-drawn textures hold sRGB colors.
export function srgbTex<T extends THREE.Texture>(t: T): T {
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function rs() {
  ren.setSize(innerWidth, innerHeight, false);
  cam.aspect = innerWidth / innerHeight;
  cam.updateProjectionMatrix();
}

addEventListener('resize', rs);
rs();
// Physically based light values, fitted against renders of the original r128 (gamma-space) lighting.
scene.add(new THREE.HemisphereLight(0xffffff, 0x2c2418, 3.7));
const sun = new THREE.DirectionalLight(0xfff0d0, 5.7);
sun.position.set(30, 50, 20);
scene.add(sun);
