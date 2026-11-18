import { settings } from '../settings/state';
import { audio } from './state';
import { stepNoise } from './stepNoise';
import { stepThump } from './stepThump';
import type { Surface } from './types';

export const footstep = (s: Surface, v: number) => {
  if (!audio.ctx || v <= 0) {
    return;
  }

  v = Math.min(v, 1.2) * settings.footstepVolume;

  const r = 0.85 + Math.random() * 0.3;

  if (s === 'dust') {
    stepNoise(0.30 * v, 0.10, 1100 * r, 0.006);
    stepThump(120 * r, 65, 0.09, 0.20 * v);
  } else if (s === 'grass') {
    stepNoise(0.22 * v, 0.14, 720 * r, 0.012);
  } else if (s === 'snow') {
    stepNoise(0.20 * v, 0.07, 1900 * r, 0.008);
    stepNoise(0.15 * v, 0.07, 1500 * r, 0.008, 0.05);
    stepThump(95 * r, 60, 0.10, 0.10 * v);
  } else if (s === 'water') {
    stepNoise(0.30 * v, 0.26, 650 * r, 0.012);
    stepThump(230 * r, 110, 0.13, 0.13 * v);
    stepNoise(0.12 * v, 0.12, 900 * r, 0.01, 0.09);
    stepThump(320 * r, 190, 0.10, 0.06 * v, 0.11);
  }
};
