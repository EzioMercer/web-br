import * as THREE from 'three';
import { srgbTex } from '../render/srgbTex';
import { ctx2d } from '../utils/ctx2d';

/**
 * A lumpy puff: overlapping soft blobs, each lighter at its top-left so the puff has some shape, fading to nothing at
 * the edge. The blobs come from a fixed sequence, so the texture is the same every time.
 */
const puffTexture = () => {
  const c = document.createElement('canvas');
  const g = ctx2d(c);
  let seed = 7;

  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  c.width = c.height = 128;

  for (let i = 0; i < 16; i++) {
    const a = rnd() * Math.PI * 2;
    const d = 30 * Math.sqrt(rnd()) * (i ? 1 : 0);
    const x = 64 + Math.cos(a) * d;
    const y = 64 + Math.sin(a) * d;
    const r = 16 + rnd() * 22 * (1 - d / 50);
    const gr = g.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
    const v = 200 + rnd() * 55 | 0;
    const al = 0.35 + rnd() * 0.3;

    gr.addColorStop(0, `rgba(255,255,255,${al})`);
    gr.addColorStop(0.6, `rgba(${v},${v},${v},${al * 0.7})`);
    gr.addColorStop(1, `rgba(${v},${v},${v},0)`);
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 128);
  }

  // keep the square's edge clear, so no puff shows a corner
  g.globalCompositeOperation = 'destination-in';

  const m = g.createRadialGradient(64, 64, 44, 64, 64, 64);

  m.addColorStop(0, 'rgba(0,0,0,1)');
  m.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = m;
  g.fillRect(0, 0, 128, 128);

  const t = srgbTex(new THREE.CanvasTexture(c));

  t.userData.keep = true;
  return t;
};

/**
 * Shared by every smoke cloud. Each puff's shade and opacity come from its vertex colours; depthWrite is off so the
 * puffs blend through each other (they are drawn far to near), and fog applies, so far clouds fade into the haze.
 */
export const smokeMaterial = new THREE.MeshBasicMaterial({
  map: puffTexture(),
  vertexColors: true,
  transparent: true,
  depthWrite: false,
});

smokeMaterial.userData.keep = true;
