import { currentOptions } from '../graphics/currentOptions';
import { graphics } from '../graphics/state';
import { GraphicsPreset } from '../graphics/types';
import { byId } from '../utils/byId';
import { PRESET_CHOICES } from './graphicsChoices';
import { settings } from '../settings/state';
import { gpuLabel } from '../graphics/gpuLabel';
import { isDedicatedGpu } from '../graphics/isDedicatedGpu';
import { isSoftwareGpu } from '../graphics/isSoftwareGpu';

/** Marks the button whose value is `v` in a row of option buttons. */
const select = (id: string, v: unknown) => {
  for (const b of byId(id).children) {
    b.classList.toggle('on', (b as HTMLElement).dataset.v === String(v));
  }
};

/** Shows the selected preset and the graphics options in effect in the Graphics tab. */
export const showGraphicsOptions = () => {
  const o = currentOptions();
  const pct = Math.round(o.resolution * 100);

  select('gpreset', graphics.preset);
  select('gview', o.viewDistance);
  select('gshadow', o.shadows);
  select('gaa', o.antialias);
  select('gfpsmax', settings.fpsLimit);
  select('gfps', settings.showFps);
  byId<HTMLInputElement>('gres').value = String(pct);
  byId('gresv').textContent = pct + '%';

  const tier = PRESET_CHOICES.find(([p]) => p === graphics.autoTier)?.[1];

  const gpu = gpuLabel();
  const software = isSoftwareGpu(gpu.toLowerCase());
  const integrated = gpu !== '' && !software && !isDedicatedGpu(gpu.toLowerCase());
  let device = gpu ? 'Running on: ' + gpu + '.' : '';

  if (software) {
    device = 'Running without graphics acceleration (the browser draws on the CPU): turn on hardware acceleration in'
      + ' the browser\'s settings and restart it.';
  } else if (integrated) {
    device += ' If this computer also has a graphics card, set your browser to use it (Windows: Settings → System →'
      + ' Display → Graphics → your browser → High performance), then restart the browser.';
  }

  byId('ghint').textContent = (graphics.preset === GraphicsPreset.Auto
    ? `Picked for this device: ${tier}. Lowered during a match if the frame rate drops. `
    : '') + device;
};
