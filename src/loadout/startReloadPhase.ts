import { loadout } from './state';
import { ReloadPhase } from './types';

/** Starts step `p` of the reload at time `from`; its length comes from the weapon in hand. */
export const startReloadPhase = (p: ReloadPhase, from: number) => {
  const w = loadout.weapon;

  loadout.reloadPhase = p;
  loadout.reloadFrom = from;
  loadout.reloadEnd = from + (p === ReloadPhase.Open
    ? w.singleLoad!.open
    : p === ReloadPhase.Close
      ? w.singleLoad!.close
      : w.reloadTime);
};
