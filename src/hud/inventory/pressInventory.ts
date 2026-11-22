import { dropOptic } from '../../loadout/dropOptic';
import { opticAt } from '../../loadout/opticAt';
import { useMedkit } from '../../player/useMedkit';
import { useVest } from '../../player/useVest';
import { hitAt } from './hitAt';
import { inventory } from './state';

/**
 * A mouse button pressed over the open inventory. Left picks up the optic under the cursor to drag it, or uses the
 * medkit or vest under it; right throws the optic under it on the ground.
 */
export const pressInventory = (button: number) => {
  const s = hitAt(inventory.x, inventory.y, 'slot');
  const o = s && opticAt(s) ? s : null;

  if (button === 2) {
    if (o) {
      dropOptic(o);
    }

    return;
  }

  if (button !== 0) {
    return;
  }

  inventory.drag = o;

  const u = o ? null : hitAt(inventory.x, inventory.y, 'use');

  if (u === 'medkit') {
    useMedkit();
  } else if (u === 'vest') {
    useVest();
  }
};
