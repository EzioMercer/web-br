import { canHoldOptic } from './canHoldOptic';
import { opticAt } from './opticAt';
import { setOpticAt } from './setOpticAt';

/**
 * Drags the optic in slot `from` onto slot `to` (see `opticAt`): it moves there, and whatever was there goes back to
 * `from`. Refused (false) if either slot cannot hold the other's optic, e.g. a pistol or sniper rifle.
 */
export const moveOptic = (from: string, to: string) => {
  const a = opticAt(from);
  const b = opticAt(to);

  if (!a || from === to || !canHoldOptic(to) || (b && !canHoldOptic(from))) {
    return false;
  }

  setOpticAt(to, a);
  setOpticAt(from, b);
  return true;
};
