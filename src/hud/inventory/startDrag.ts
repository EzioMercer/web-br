import { opticAt } from '../../loadout/opticAt';
import { slotAt } from './slotAt';
import { inventory } from './state';

/** Mouse button down with the inventory cursor: picks up the optic under it, if any. */
export const startDrag = () => {
  const s = slotAt(inventory.x, inventory.y);

  inventory.drag = s && opticAt(s) ? s : null;
};
