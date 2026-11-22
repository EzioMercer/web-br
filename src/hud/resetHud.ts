import { screenFx } from '../effects/state';
import { grenadeThrow } from '../grenades/state';
import { byId } from '../utils/byId';
import { openInventory } from './inventory/openInventory';
import { openBigMap } from './minimap/openBigMap';
import { clearSoundMarks } from './soundMarks/clearSoundMarks';

/**
 * Puts the HUD back as a new round finds it: no sound marks, flashes, hit or damage markers, kill feed or message,
 * and the big map and inventory closed. Anything new the HUD keeps from one moment to the next is reset here too.
 */
export const resetHud = () => {
  for (const k of Object.keys(screenFx) as (keyof typeof screenFx)[]) {
    screenFx[k] = 0;
  }

  clearSoundMarks();
  byId('kf').replaceChildren();
  byId('msg').textContent = '';
  openBigMap(false);
  openInventory(false);
  grenadeThrow.held = false;
};
