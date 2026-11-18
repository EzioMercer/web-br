import { loadout } from '../loadout/state';
import { reloadClick } from './reloadClick';
import type { ReloadClick } from './types';

export const playReloadCues = (list: [number, ReloadClick][]) => {
  const w = loadout.weaponId;

  for (const [ms, t] of list) {
    setTimeout(() => {
      if (loadout.reloading && loadout.weaponId === w) {
        reloadClick(t);
      }
    }, ms);
  }
};
