import { audio } from './state';

/** Pitch sweep from `f0` to `f1` Hz. */
export const tone = (f0: number, f1: number, dur: number, vol: number, type?: OscillatorType) => {
  if (!audio.ctx) {
    return;
  }

  const o = audio.ctx.createOscillator();
  const g = audio.ctx.createGain();
  const t = audio.ctx.currentTime;

  o.type = type || 'sine';
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g);
  g.connect(audio.ctx.destination);
  o.start(t);
  o.stop(t + dur);
};
