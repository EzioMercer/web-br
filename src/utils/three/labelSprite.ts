import * as THREE from 'three';
import { srgbTex } from '../../render/srgbTex';

/**
 * A sprite showing a 256×64 canvas, for text labels above things in the world. Draw on `canvas` (see
 * `drawOutlinedText`), then set `texture.needsUpdate` when redrawing later.
 */
export const labelSprite = (width: number, height: number) => {
  const canvas = document.createElement('canvas');

  canvas.width = 256;
  canvas.height = 64;

  const texture = srgbTex(new THREE.CanvasTexture(canvas));
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true }));

  sprite.scale.set(width, height, 1);
  return { sprite, canvas, texture };
};
