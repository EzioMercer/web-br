import { canHold } from './canHold';
import { itemAt } from './itemAt';
import { setItemAt } from './setItemAt';

/**
 * Drags the item in slot `from` onto slot `to` (see `itemAt`): it moves there, and whatever was there goes back to
 * `from`. Refused (false) if either slot cannot hold the other's item, e.g. a medkit onto a gun or an optic onto a
 * pistol.
 */
export const moveItem = (from: string, to: string) => {
  const a = itemAt(from);
  const b = itemAt(to);

  if (!a || from === to || !canHold(to, a) || (b && !canHold(from, b))) {
    return false;
  }

  setItemAt(to, a);
  setItemAt(from, b);
  return true;
};
