import { carriedGuns } from './carriedGuns';
import { loadout } from './state';
import { takesOptic } from './takesOptic';

/** The gun a new optic would go on: the current one if free, else another free one, else the current or first one. */
export const opticTarget = () => {
  const ks = carriedGuns().filter(takesOptic);

  if (!ks.length) {
    return null;
  }

  const cur = ks.includes(loadout.weaponId) ? loadout.weaponId : null;
  const free = ks.filter(k => !loadout.owned[k].optic);

  return cur && !loadout.owned[cur].optic ? cur : free[0] || cur || ks[0];
};
