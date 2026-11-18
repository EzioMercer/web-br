import { OPTICS } from '../data/optics';
import { loadout } from './state';
import { takesOptic } from './takesOptic';

export const currentOptic = () => {
  const o = loadout.owned[loadout.weaponId];

  return o && o.optic && takesOptic(loadout.weaponId) ? OPTICS[o.optic] : null;
};
