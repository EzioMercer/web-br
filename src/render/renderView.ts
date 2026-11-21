import * as THREE from 'three';
import { VIEWMODEL_LAYER } from '../config';
import { camera } from './camera';
import { scene } from './scene';

/**
 * Draws the world, then the first-person weapon on top of it with a fresh depth buffer, so the gun never pokes into a
 * wall the player stands against. The lights are on both layers; the second pass reuses the
 * sun's shadow map instead of rendering it again.
 */
export const renderView = (r: THREE.WebGLRenderer) => {
  camera.layers.set(0);
  r.render(scene, camera);

  const autoClear = r.autoClear;
  const autoShadows = r.shadowMap.autoUpdate;
  const background = scene.background;

  // a colour background clears the screen even with autoClear off
  scene.background = null;
  r.autoClear = false;
  r.shadowMap.autoUpdate = false;
  r.shadowMap.needsUpdate = false;
  r.clearDepth();
  camera.layers.set(VIEWMODEL_LAYER);
  r.render(scene, camera);
  camera.layers.set(0);
  scene.background = background;
  r.autoClear = autoClear;
  r.shadowMap.autoUpdate = autoShadows;
};
