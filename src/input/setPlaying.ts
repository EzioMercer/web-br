import { grenadeThrow } from '../grenades/state';
import { inventory } from '../hud/inventory/state';
import { openSettings } from '../menu/openSettings';
import { byId } from '../utils/byId';
import { input, keys } from './state';

export const setPlaying = (v: boolean) => {
  input.playing = v;

  if (!v) {
    grenadeThrow.held = false;
  }

  if (v) {
    openSettings(false);
  }

  byId('start').style.display = (v || input.inMenu) ? 'none' : 'flex';

  if (!v) {
    input.fireHeld = false;
    inventory.drag = null;

    for (const k in keys) {
      keys[k] = false;
    }
  }
};
