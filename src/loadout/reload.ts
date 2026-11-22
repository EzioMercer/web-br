import { playReloadCues } from '../audio/playReloadCues';
import { reloadCues } from '../audio/reloadCues';
import { reloadClick } from '../audio/reloadClick';
import { ReloadClick } from '../audio/types';
import { clock } from '../sim/state';
import { reserve } from './reserve';
import { startReloadPhase } from './startReloadPhase';
import { loadout } from './state';
import { ReloadPhase } from './types';

export const reload = () => {
  if (loadout.reloading || loadout.ammo === loadout.weapon.magSize || reserve() <= 0) {
    return;
  }

  const w = loadout.weapon;

  loadout.reloading = true;
  loadout.reloadStop = false;
  loadout.scoped = false;

  if (w.singleLoad) {
    startReloadPhase(ReloadPhase.Open, clock.time);

    if (w.boltAction) {
      reloadClick(ReloadClick.Bolt);
    }

    return;
  }

  startReloadPhase(ReloadPhase.Round, clock.time);
  playReloadCues(reloadCues());
};
