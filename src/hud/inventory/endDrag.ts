import { dropOptic } from '../../loadout/dropOptic';
import { moveOptic } from '../../loadout/moveOptic';
import { slotAt } from './slotAt';
import { inventory } from './state';

/**
 * Mouse button up while dragging an optic: onto another optic slot swaps the two; outside the panel throws it on the
 * ground; anywhere else in the panel puts it back.
 */
export const endDrag = () => {
  const from = inventory.drag;

  inventory.drag = null;

  if (!from) {
    return;
  }

  const to = slotAt(inventory.x, inventory.y);
  const r = document.getElementById('inv')!.getBoundingClientRect();
  const outside = inventory.x < r.left || inventory.x > r.right || inventory.y < r.top || inventory.y > r.bottom;

  if (to) {
    moveOptic(from, to);
  } else if (outside) {
    dropOptic(from);
  }
};
