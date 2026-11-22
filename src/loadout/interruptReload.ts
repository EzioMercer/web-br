import { reloadClick } from '../audio/reloadClick';
import { ReloadClick } from '../audio/types';
import { clock } from '../sim/state';
import { startReloadPhase } from './startReloadPhase';
import { loadout } from './state';
import { ReloadPhase } from './types';

/**
 * Fire pressed during a single-load reload: with rounds in the magazine the round in hand is dropped and the action
 * closes at once; on an empty one the round in hand goes in first. The shot follows when the action is closed.
 */
export const interruptReload = () => {
  if (!loadout.reloading || !loadout.weapon.singleLoad) {
    return;
  }

  loadout.shotQueued = true;

  if (loadout.reloadPhase === ReloadPhase.Close) {
    return;
  }

  if (loadout.ammo > 0) {
    startReloadPhase(ReloadPhase.Close, clock.time);
    reloadClick(loadout.weapon.pellets ? ReloadClick.Pump : ReloadClick.Bolt);
  } else {
    loadout.reloadStop = true;
  }
};
