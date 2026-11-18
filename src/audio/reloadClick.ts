import { noiseBurst } from './noiseBurst';
import { tone } from './tone';
import type { ReloadClick } from './types';

export const reloadClick = (k: ReloadClick) => {
  if (k === 'out') {
    noiseBurst(0.5, 0.07, 1800);
    tone(220, 90, 0.07, 0.5, 'triangle');
  } else if (k === 'in') {
    noiseBurst(0.7, 0.06, 3000);
    tone(420, 160, 0.08, 0.6, 'square');
  } else if (k === 'slap') {
    noiseBurst(0.6, 0.05, 4500);
    tone(700, 300, 0.05, 0.4, 'square');
  } else if (k === 'bolt') {
    tone(300, 120, 0.09, 0.5, 'sawtooth');
    noiseBurst(0.5, 0.1, 2500);
  } else if (k === 'shell') {
    noiseBurst(0.4, 0.04, 3500);
    tone(900, 500, 0.04, 0.4, 'square');
  } else if (k === 'pump') {
    noiseBurst(0.7, 0.12, 1500);
    tone(180, 70, 0.12, 0.6, 'triangle');
  }
};
