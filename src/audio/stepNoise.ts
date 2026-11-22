import { footstepBus } from './footstepBus';
import { audio } from './state';
import { noiseBuffer } from './noiseBuffer';

export const stepNoise = (vol: number, dur: number, f: number, att: number, at?: number, out?: AudioNode) => {
  if (!audio.ctx || vol <= 0) {
    return;
  }

  const t = audio.ctx.currentTime + (at || 0);
  const n = Math.max(8, audio.ctx.sampleRate * dur | 0);
  const b = noiseBuffer(audio.ctx, n, 2);

  const src = audio.ctx.createBufferSource();
  const f1 = audio.ctx.createBiquadFilter();
  const f2 = audio.ctx.createBiquadFilter();
  const g = audio.ctx.createGain();

  src.buffer = b;
  f1.type = f2.type = 'lowpass';
  f1.frequency.value = f2.frequency.value = f;

  if (f1.Q) {
    f1.Q.value = f2.Q.value = 0.5;
  }

  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + att);
  g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  src.connect(f1);
  f1.connect(f2);
  f2.connect(g);
  g.connect(out || footstepBus(audio.ctx));
  src.start(t);
};
