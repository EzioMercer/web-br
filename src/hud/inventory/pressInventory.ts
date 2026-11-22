import { dropItem } from '../../loadout/dropItem';
import { itemAt } from '../../loadout/itemAt';
import { slotAt } from './slotAt';
import { inventory } from './state';

/**
 * A mouse button pressed over the open inventory. Left picks up the item under the cursor to drag it (letting go on
 * the same slot uses a medkit or vest, see `endDrag`); right throws it on the ground.
 */
export const pressInventory = (button: number) => {
  const s = slotAt(inventory.x, inventory.y);
  const k = s && itemAt(s) ? s : null;

  if (button === 2 && k) {
    dropItem(k);
  } else if (button === 0) {
    inventory.drag = k;
  }
};
