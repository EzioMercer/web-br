import { playReloadCues } from '../audio/playReloadCues';
import { reloadCues } from '../audio/reloadCues';
import { clock } from '../sim/state';
import { loadout } from './state';

export const reload = () => {
  if (loadout.reloading || loadout.ammo === loadout.weapon.magSize || loadout.reserve <= 0) {
    return;
  }

  loadout.reloading = true;
  loadout.scoped = false;
  loadout.reloadEnd = clock.time + loadout.weapon.reloadTime;
  playReloadCues(reloadCues());
};
