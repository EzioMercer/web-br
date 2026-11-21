import * as THREE from 'three';
import { camera } from './camera';
import { glCanvas, replaceGlCanvas } from './glCanvas';

/** The WebGL renderer, made by createRenderer (applyGraphics does that before the first frame). */
export let renderer: THREE.WebGLRenderer | null = null;

/** Render resolution as a fraction of the screen's. */
let resolution = 1;

const resize = () => {
  if (!renderer) {
    return;
  }

  renderer.setPixelRatio(Math.min(devicePixelRatio, 2) * resolution);
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
};

addEventListener('resize', resize);

/** (Re)creates the renderer: antialiasing can only be set when the WebGL context is created. */
export const createRenderer = (antialias: boolean) => {
  if (renderer) {
    renderer.dispose();
    renderer.forceContextLoss();
    replaceGlCanvas();
  }

  // on laptops with two GPUs, ask for the strong one: the default is often the power-saving integrated GPU
  renderer = new THREE.WebGLRenderer({ canvas: glCanvas, antialias, powerPreference: 'high-performance' });
  renderer.shadowMap.type = THREE.PCFShadowMap;
  resize();

  return renderer;
};

export const setResolution = (r: number) => {
  resolution = r;
  resize();
};
