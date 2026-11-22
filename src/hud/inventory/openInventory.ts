import { input } from '../../input/state';
import { loadout } from '../../loadout/state';
import { inventory } from './state';

/**
 * Opens or closes the inventory. While it is open the mouse moves a cursor over it (and the view stays still), so it
 * stops shooting and aiming. The cursor comes back where it was left (see `updateInventory` for the first time);
 * closing puts anything being dragged back where it came from.
 */
export const openInventory = (on: boolean) => {
  inventory.open = on;
  inventory.drag = null;

  if (!on) {
    return;
  }

  input.fireHeld = false;
  loadout.scoped = false;
  inventory.x = Math.min(inventory.x, innerWidth - 1);
  inventory.y = Math.min(inventory.y, innerHeight - 1);
};
