import { input } from '../input/state';
import { applyGraphics } from './applyGraphics';
import { graphics } from './state';
import { TIER_ORDER } from './tiers';
import { GraphicsPreset } from './types';
import { settings } from '../settings/state';

/** Average frame rate Auto keeps: below it, it steps down a tier. */
const MIN_FPS = 40;

/** Seconds of play skipped after (re)starting, while shaders compile, and seconds averaged per check. */
const WARMUP = 3;
const WINDOW = 4;

/** When the current measurement started (ms), or null while not measuring. */
let since: number | null = null;

let frames = 0;

/** With the Auto preset, lowers the quality tier during play when the frame rate stays below MIN_FPS. */
export const autoTune = () => {
  if (graphics.preset !== GraphicsPreset.Auto || !input.playing) {
    since = null;

    return;
  }

  const now = performance.now();

  if (since === null) {
    // Frames during the warm-up are not counted.
    since = now + WARMUP * 1000;
    frames = 0;

    return;
  }

  if (now < since) {
    return;
  }

  frames++;

  const elapsed = (now - since) / 1000;

  if (elapsed < WINDOW) {
    return;
  }

  const fps = frames / elapsed;
  const i = TIER_ORDER.indexOf(graphics.autoTier);

  since = now;
  frames = 0;

  // a frame rate limit below MIN_FPS is the player's choice, not a slow device
  const floor = settings.fpsLimit ? Math.min(MIN_FPS, settings.fpsLimit * 0.9) : MIN_FPS;

  if (fps < floor && i > 0) {
    graphics.autoTier = TIER_ORDER[i - 1];
    // Antialiasing follows on the next match: a new renderer mid-match would drop the mouse lock.
    applyGraphics(false);
    since = null;
  }
};
