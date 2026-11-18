import * as THREE from 'three';

export const scene = new THREE.Scene();

scene.background = new THREE.Color(0x9cc3e6);

scene.fog = new THREE.Fog(0x9cc3e6, 160, 820);

// Physically based light values, fitted against renders of the original r128 (gamma-space) lighting.
scene.add(new THREE.HemisphereLight(0xffffff, 0x2c2418, 3.7));

const sun = new THREE.DirectionalLight(0xfff0d0, 5.7);

sun.position.set(30, 50, 20);

scene.add(sun);
