import { camera } from '../render/camera';
import { createRenderer, renderer, setResolution } from '../render/renderer';
import { scene } from '../render/scene';
import { sun } from '../render/sun';
import { currentOptions } from './currentOptions';
import { SHADOW_SETTINGS, VIEW_DISTANCES } from './tiers';
import { ShadowQuality } from './types';
import type * as THREE from 'three';

/** Antialiasing the current renderer was made with. */
let rendererAntialias: boolean | null = null;

/**
 * Applies the graphics options in effect. With `rebuild`, a change of antialiasing makes a new renderer; otherwise
 * (mid-match, where a new canvas would drop the mouse lock) antialiasing waits until the next call with `rebuild`.
 */
export const applyGraphics = (rebuild = true) => {
  const o = currentOptions();

  let r = renderer;

  if (!r || (rebuild && rendererAntialias !== o.antialias)) {
    // The shadow map belongs to the old WebGL context.
    sun.shadow.map?.dispose();
    sun.shadow.map = null;
    r = createRenderer(o.antialias);
    rendererAntialias = o.antialias;
  }

  setResolution(o.resolution);

  const vd = VIEW_DISTANCES[o.viewDistance];
  const fog = scene.fog as THREE.Fog;

  fog.near = vd.near;
  fog.far = vd.far;
  camera.far = vd.far + 20;
  camera.updateProjectionMatrix();

  const shadows = o.shadows !== ShadowQuality.Off;

  r.shadowMap.enabled = shadows;
  sun.castShadow = shadows;

  if (o.shadows !== ShadowQuality.Off) {
    const s = SHADOW_SETTINGS[o.shadows];
    const cam = sun.shadow.camera;

    if (sun.shadow.mapSize.width !== s.size) {
      sun.shadow.mapSize.set(s.size, s.size);
      sun.shadow.map?.dispose();
      sun.shadow.map = null;
    }

    cam.left = -s.radius;
    cam.right = s.radius;
    cam.top = s.radius;
    cam.bottom = -s.radius;
    cam.near = 1;
    cam.far = 400;
    cam.updateProjectionMatrix();
  }
};
