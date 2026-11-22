import { applyGraphics } from '../graphics/applyGraphics';
import { currentOptions } from '../graphics/currentOptions';
import { graphics } from '../graphics/state';
import { GraphicsPreset } from '../graphics/types';
import type { GraphicsOptions } from '../graphics/types';
import { saveSettings } from '../settings/saveSettings';
import { byId } from '../utils/byId';
import { optionButtons } from '../utils/dom/optionButtons';
import {
  ANTIALIAS_CHOICES,
  FPS_LIMIT_CHOICES,
  ON_OFF_CHOICES,
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

  optionButtons('gpreset', PRESET_CHOICES, (p) => {
    graphics.preset = p;
    changed();
  });
  optionButtons('gview', VIEW_CHOICES, v => setOption('viewDistance', v));
  optionButtons('gshadow', SHADOW_CHOICES, v => setOption('shadows', v));
  optionButtons('gaa', ANTIALIAS_CHOICES, v => setOption('antialias', v));
  // not graphics options: they leave the preset as it is
  optionButtons('gfpsmax', FPS_LIMIT_CHOICES, (v) => {
    settings.fpsLimit = v;
    showGraphicsOptions();
    saveSettings();
  });
  optionButtons('gfps', ON_OFF_CHOICES, (v) => {
    settings.showFps = v;
    showGraphicsOptions();
    saveSettings();
  });

  const res = byId<HTMLInputElement>('gres');

  res.oninput = () => setOption('resolution', Number(res.value) / 100);
  showGraphicsOptions();
};
