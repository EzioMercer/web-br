import { audio } from './state';

/**
 * A stereo panner feeding `out`, so a sound plays from the left (-1) or the right (1). Returns `out` itself when the
 * sound is centred or the browser has no StereoPannerNode.
 */
export const panner = (pan: number, out: AudioNode) => {
  if (!audio.ctx || !pan || !audio.ctx.createStereoPanner) {
    return out;
  }

  const p = audio.ctx.createStereoPanner();

  p.pan.value = Math.max(-1, Math.min(1, pan));
  p.connect(out);

  return p;
};
