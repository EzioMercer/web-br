import { currentOptions } from '../graphics/currentOptions';
import { graphics } from '../graphics/state';
import { GraphicsPreset } from '../graphics/types';
import { byId } from '../utils/byId';
import { markOption } from '../utils/dom/markOption';
import { PRESET_CHOICES } from './graphicsChoices';
import { settings } from '../settings/state';
import { refreshRate } from '../graphics/refreshRate';

/** Shows the selected preset and the graphics options in effect in the Graphics tab. */
export const showGraphicsOptions = () => {
  const o = currentOptions();
  const pct = Math.round(o.resolution * 100);

  markOption('gpreset', graphics.preset);
  markOption('gview', o.viewDistance);
  markOption('gshadow', o.shadows);
  markOption('gaa', o.antialias);
  markOption('gfpsmax', settings.fpsLimit);

  // as many as the browser gives: its screen's refresh rate, once measured
  const hz = refreshRate();

  byId('gfpsmax').querySelector<HTMLElement>('[data-v="0"]')!.textContent = hz ? 'Max · ' + hz : 'Max';
  markOption('gfps', settings.showFps);
  byId<HTMLInputElement>('gres').value = String(pct);
  byId('gresv').textContent = pct + '%';

  const tier = PRESET_CHOICES.find(([p]) => p === graphics.autoTier)?.[1];

  byId('ghint').textContent = graphics.preset === GraphicsPreset.Auto
    ? `Picked for this device: ${tier}. Lowered during a match if the frame rate drops.`
    : '';
};
