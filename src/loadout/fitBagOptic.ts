import { OPTICS } from '../data/optics';
import { WEAPONS } from '../data/weapons';
import { feedMessage } from '../hud/feedMessage';
import { loadout } from './state';
import { takesOptic } from './takesOptic';
import type { WeaponId } from '../types';

/** Puts the first spare optic from the bag on gun `id` if it takes one and has none. */
export const fitBagOptic = (id: WeaponId) => {
  const i = loadout.opticBag.findIndex(Boolean);

  if (i < 0 || !takesOptic(id) || !loadout.owned[id] || loadout.owned[id].optic) {
    return;
  }

  loadout.owned[id].optic = loadout.opticBag[i]!;
  loadout.opticBag[i] = null;
  feedMessage('Attached ' + OPTICS[loadout.owned[id].optic].name + ' to ' + WEAPONS[id].name);
};
