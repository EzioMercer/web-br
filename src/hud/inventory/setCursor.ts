import { input } from '../../input/state';
import { loadout } from '../../loadout/state';
import { inventory } from './state';

/**
 * Shows or hides the inventory cursor (Alt held with the panel open). While it shows, the mouse moves it instead of
 * the view, so it stops shooting and aiming; hiding it puts anything being dragged back where it came from. It comes
 * back where it was left (see `updateInventory` for the first time).
 */
export const setCursor = (on: boolean) => {
  on = on && inventory.open;

  if (on && !inventory.cursor) {
    input.fireHeld = false;
    loadout.scoped = false;
    inventory.x = Math.min(inventory.x, innerWidth - 1);
    inventory.y = Math.min(inventory.y, innerHeight - 1);
  }

  if (!on) {
    inventory.drag = null;
  }

  inventory.cursor = on;
};
