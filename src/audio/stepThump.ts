import { footstepBus } from './footstepBus';
import { audio } from './state';

export const stepThump = (f0: number, f1: number, dur: number, vol: number, at?: number) => {
  if (!audio.ctx || vol <= 0) {
    return;
  }

  const t = audio.ctx.currentTime + (at || 0);
  const o = audio.ctx.createOscillator();
  const g = audio.ctx.createGain();

  o.type = 'sine';
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  o.connect(g);
  g.connect(footstepBus(audio.ctx));
  o.start(t);
  o.stop(t + dur + 0.02);
};
