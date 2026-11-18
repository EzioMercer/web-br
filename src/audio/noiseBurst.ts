import { audio } from './state';

/** Filtered noise burst. */
export const noiseBurst = (vol: number, dur: number, freq: number) => {
  if (!audio.ctx) {
    return;
  }

  const n = audio.ctx.sampleRate * dur | 0;
  const b = audio.ctx.createBuffer(1, n, audio.ctx.sampleRate);
  const d = b.getChannelData(0);

  for (let i = 0; i < n; i++) {
    d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3);
  }

  const s = audio.ctx.createBufferSource();
  const f = audio.ctx.createBiquadFilter();
  const g = audio.ctx.createGain();

  s.buffer = b;
  f.type = 'lowpass';
  f.frequency.value = freq;
  g.gain.value = vol;
  s.connect(f);
  f.connect(g);
  g.connect(audio.ctx.destination);
  s.start();
};
