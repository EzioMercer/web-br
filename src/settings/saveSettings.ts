import { DIFFICULTIES } from '../data/difficulties';
import { graphics } from '../graphics/state';
import { SAVE_KEY, settings } from './state';

export const saveSettings = () => {
  try {
    const diff = Object.keys(DIFFICULTIES).find(k => DIFFICULTIES[k] === settings.difficulty);
    const gfx = { preset: graphics.preset, custom: graphics.custom };

    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({
        sens: settings.sensitivity,
        vol: settings.footstepVolume,
        fps: settings.showFps,
        fpsMax: settings.fpsLimit,
        diff,
        gfx,
      }),
    );
  } catch { /* Storage unavailable: settings last for this page only. */ }
};
