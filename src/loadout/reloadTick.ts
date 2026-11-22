import { reloadClick } from '../audio/reloadClick';
import { ReloadClick } from '../audio/types';
import { clock } from '../sim/state';
import { AmmoType } from '../types';
import { reserve } from './reserve';
import { startReloadPhase } from './startReloadPhase';
import { loadout } from './state';
import { ReloadPhase } from './types';

/** Moves rounds from the ammo bag into the magazine. */
const loadRounds = (n: number) => {
  loadout.ammo += n;
  loadout.ammoBag[loadout.weapon.ammoType ?? AmmoType.None] -= n;
};

/** Advances the reload: a magazine goes in at the end; a single-load weapon takes each round as it is pushed in. */
export const reloadTick = () => {
  if (!loadout.reloading || clock.time < loadout.reloadEnd) {
    return;
  }

  const w = loadout.weapon;

  if (!w.singleLoad) {
    loadRounds(Math.min(w.magSize - loadout.ammo, reserve()));
    loadout.reloading = false;
    return;
  }

  if (loadout.reloadPhase === ReloadPhase.Close) {
    loadout.reloading = false;
    return;
  }

  if (loadout.reloadPhase === ReloadPhase.Round) {
    loadRounds(1);
    reloadClick(w.pellets ? ReloadClick.Shell : ReloadClick.MagIn);
  }

  // a stop asked for on an empty magazine waits for the first round, so there is something to fire
  const more = (!loadout.reloadStop || loadout.ammo === 0) && loadout.ammo < w.magSize && reserve() > 0;

  startReloadPhase(more ? ReloadPhase.Round : ReloadPhase.Close, loadout.reloadEnd);

  if (!more) {
    reloadClick(w.pellets ? ReloadClick.Pump : ReloadClick.Bolt);
  }
};
