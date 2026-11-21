import * as THREE from 'three';

export const scene = new THREE.Scene();

scene.background = new THREE.Color(0x9cc3e6);

/** Fog start and end are set by the view distance (applyGraphics). */
scene.fog = new THREE.Fog(0x9cc3e6, 160, 820);

// Physically based light values, fitted against renders of the original r128 (gamma-space) lighting.
// The sun is in sun.ts.
scene.add(new THREE.HemisphereLight(0xffffff, 0x2c2418, 3.7));
