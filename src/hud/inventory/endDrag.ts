import { dropItem } from '../../loadout/dropItem';
import { isOptic } from '../../loadout/isOptic';
import { itemAt } from '../../loadout/itemAt';
import { moveItem } from '../../loadout/moveItem';
import { useSupply } from '../../player/useSupply';
import { slotAt } from './slotAt';
import { inventory } from './state';

/**
 * Mouse button up while dragging an item: onto another slot swaps the two; outside the panel throws it on the ground;
 * back on its own slot (a click) uses a medkit or vest; anywhere else in the panel puts it back.
 */
export const endDrag = () => {
  const from = inventory.drag;

  inventory.drag = null;

  if (!from) {
    return;
  }

  const to = slotAt(inventory.x, inventory.y);
  const it = itemAt(from);
  const r = document.getElementById('inv')!.getBoundingClientRect();
  const outside = inventory.x < r.left || inventory.x > r.right || inventory.y < r.top || inventory.y > r.bottom;

  if (to === from) {
    if (it && !isOptic(it)) {
      useSupply(it, Number(from.split(':')[1]));
    }
  } else if (to) {
    moveItem(from, to);
  } else if (outside) {
    dropItem(from);
  }
};
