import { grenadeThrow } from '../grenades/state';
import { setCursor } from '../hud/inventory/setCursor';
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
    setCursor(false);

    for (const k in keys) {
      keys[k] = false;
    }
  }
};
