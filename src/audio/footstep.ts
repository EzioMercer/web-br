import { settings } from '../settings/state';
import { footstepBus } from './footstepBus';
import { panner } from './panner';
import { audio } from './state';
import { stepNoise } from './stepNoise';
import { stepThump } from './stepThump';
import { Surface } from './types';

/** A footstep on surface `s` at loudness `v`, panned left (-1) or right (1) by `pan`. */
export const footstep = (s: Surface, v: number, pan = 0) => {
  if (!audio.ctx || v <= 0) {
    return;
  }

  const o = panner(pan, footstepBus(audio.ctx));

  v = Math.min(v, 1.2) * settings.footstepVolume;

  const r = 0.85 + Math.random() * 0.3;

  if (s === Surface.Dust) {
    stepNoise(0.30 * v, 0.10, 1100 * r, 0.006, 0, o);
    stepThump(120 * r, 65, 0.09, 0.20 * v, 0, o);
  } else if (s === Surface.Grass) {
    stepNoise(0.22 * v, 0.14, 720 * r, 0.012, 0, o);
  } else if (s === Surface.Snow) {
    stepNoise(0.20 * v, 0.07, 1900 * r, 0.008, 0, o);
    stepNoise(0.15 * v, 0.07, 1500 * r, 0.008, 0.05, o);
    stepThump(95 * r, 60, 0.10, 0.10 * v, 0, o);
  } else if (s === Surface.Water) {
    stepNoise(0.30 * v, 0.26, 650 * r, 0.012, 0, o);
    stepThump(230 * r, 110, 0.13, 0.13 * v, 0, o);
    stepNoise(0.12 * v, 0.12, 900 * r, 0.01, 0.09, o);
    stepThump(320 * r, 190, 0.10, 0.06 * v, 0.11, o);
  }
};
