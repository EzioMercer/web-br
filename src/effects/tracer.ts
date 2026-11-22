import * as THREE from 'three';
import { scene } from '../render/scene';
import type { Vec3 } from '../types';

/** Bot shot tracers alive at once, at most (the oldest is reused). */
const MAX = 256;

/** How long a tracer fades (s). */
const LIFE = 0.07;

const pos = new Float32Array(MAX * 6);

/** Colour and alpha per vertex: the alpha fades each tracer out. */
const rgba = new Float32Array(MAX * 8);

const life = new Float32Array(MAX);

let next = 0;

const geo = new THREE.BufferGeometry();

geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
geo.setAttribute('color', new THREE.BufferAttribute(rgba, 4).setUsage(THREE.DynamicDrawUsage));

/**
 * All tracers in one draw call, instead of a line (geometry, material, draw call) per shot. No depth writes: a faded
 * tracer is invisible but would still cut its line out of see-through things drawn after it (the zone wall, glass).
 */
const lines = new THREE.LineSegments(
  geo,
  new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false }),
);

lines.frustumCulled = false;
scene.add(lines);

const C = new THREE.Color();

/** A tracer line from `a` to `b`, fading out over LIFE seconds. */
export const tracer = (a: Vec3, b: Vec3, col: THREE.ColorRepresentation) => {
  const i = next;

  next = (next + 1) % MAX;
  pos.set(a, i * 6);
  pos.set(b, i * 6 + 3);
  C.set(col);

  for (const k of [0, 4]) {
    rgba[i * 8 + k] = C.r;
    rgba[i * 8 + k + 1] = C.g;
    rgba[i * 8 + k + 2] = C.b;
    rgba[i * 8 + k + 3] = 1;
  }

  life[i] = LIFE;
  geo.attributes.position.needsUpdate = true;
  geo.attributes.color.needsUpdate = true;
};

/** Fades the tracers (render loop). */
export const tracersTick = (dt: number) => {
  let changed = false;
  let moved = false;

  for (let i = 0; i < MAX; i++) {
    if (life[i] <= 0) {
      continue;
    }

    life[i] = Math.max(0, life[i] - dt);
    rgba[i * 8 + 3] = rgba[i * 8 + 7] = life[i] / LIFE;
    changed = true;

    // a spent tracer shrinks to a point, so nothing of it is drawn
    if (life[i] === 0) {
      pos.copyWithin(i * 6 + 3, i * 6, i * 6 + 3);
      moved = true;
    }
  }

  if (changed) {
    geo.attributes.color.needsUpdate = true;
  }

  if (moved) {
    geo.attributes.position.needsUpdate = true;
  }
};
