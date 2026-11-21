import { applyGraphics } from '../graphics/applyGraphics';
import { currentOptions } from '../graphics/currentOptions';
import { graphics } from '../graphics/state';
import { GraphicsPreset } from '../graphics/types';
import type { GraphicsOptions } from '../graphics/types';
import { saveSettings } from '../settings/saveSettings';
import { byId } from '../utils/byId';
import {
  ANTIALIAS_CHOICES,
  FPS_CHOICES,
  FPS_LIMIT_CHOICES,
  PRESET_CHOICES,
  SHADOW_CHOICES,
  VIEW_CHOICES,
} from './graphicsChoices';
import { showGraphicsOptions } from './showGraphicsOptions';
import { settings } from '../settings/state';

/** Fills the Graphics tab with its buttons and hooks them up. */
export const setupGraphicsTab = () => {
  const changed = () => {
    applyGraphics();
    showGraphicsOptions();
    saveSettings();
  };

  // Changing a single option switches to the Custom preset, starting from the options in effect.
  const setOption = <K extends keyof GraphicsOptions>(k: K, v: GraphicsOptions[K]) => {
    if (currentOptions()[k] === v) {
      return;
    }

    graphics.custom = { ...currentOptions(), [k]: v };
    graphics.preset = GraphicsPreset.Custom;
    changed();
  };

  const buttons = <T>(id: string, choices: [T, string][], pick: (v: T) => void) => {
    const row = byId(id);

    for (const [v, label] of choices) {
      const b = document.createElement('button');

      b.className = 'dbtn';
      b.textContent = label;
      b.dataset.v = String(v);
      b.onclick = () => pick(v);
      row.appendChild(b);
    }
  };

  buttons('gpreset', PRESET_CHOICES, (p) => {
    graphics.preset = p;
    changed();
  });
  buttons('gview', VIEW_CHOICES, v => setOption('viewDistance', v));
  buttons('gshadow', SHADOW_CHOICES, v => setOption('shadows', v));
  buttons('gaa', ANTIALIAS_CHOICES, v => setOption('antialias', v));
  // not graphics options: they leave the preset as it is
  buttons('gfpsmax', FPS_LIMIT_CHOICES, (v) => {
    settings.fpsLimit = v;
    showGraphicsOptions();
    saveSettings();
  });
  buttons('gfps', FPS_CHOICES, (v) => {
    settings.showFps = v;
    showGraphicsOptions();
    saveSettings();
  });

  const res = byId<HTMLInputElement>('gres');

  res.oninput = () => setOption('resolution', Number(res.value) / 100);
  showGraphicsOptions();
};
