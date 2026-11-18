import * as THREE from 'three';
import { srgbTex } from '../../render/srgbTex';
import { drawOutlinedText } from '../../utils/drawOutlinedText';

export const makeLabel = (text: string, col: string) => {
  const c = document.createElement('canvas');

  c.width = 256;
  c.height = 64;

  const x = c.getContext('2d')!;

  drawOutlinedText(x, text, col);

  const sp = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: srgbTex(new THREE.CanvasTexture(c)), transparent: true }),
  );

  sp.scale.set(2.4, 0.6, 1);
  return sp;
};
