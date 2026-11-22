import { panner } from './panner';
import { audio } from './state';
import { noiseBuffer } from './noiseBuffer';

/** Filtered noise burst, panned left (-1) or right (1) by `pan`. */
export const noiseBurst = (vol: number, dur: number, freq: number, pan = 0) => {
  if (!audio.ctx) {
    return;
  }

  const n = audio.ctx.sampleRate * dur | 0;
  const b = noiseBuffer(audio.ctx, n, 3);

  const s = audio.ctx.createBufferSource();
  const f = audio.ctx.createBiquadFilter();
  const g = audio.ctx.createGain();

  s.buffer = b;
  f.type = 'lowpass';
  f.frequency.value = freq;
  g.gain.value = vol;
  s.connect(f);
  f.connect(g);
  g.connect(panner(pan, audio.ctx.destination));
  s.start();
};
