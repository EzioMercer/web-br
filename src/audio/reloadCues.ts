import { loadout } from '../loadout/state';
import { ReloadClick } from './types';

/** Magazine reload sound cues: [delay in ms, click], scaled to the weapon's reload time. */
export const reloadCues = (): [number, ReloadClick][] => {
  const k = loadout.weapon.reloadTime / 2.4;
  // single-load weapons (shotguns, bolt actions) click per round from `reloadTick` instead
  const a: [number, ReloadClick][] = loadout.weapon.slot === 2
    ? [[600, ReloadClick.MagOut], [1250, ReloadClick.MagIn], [1600, ReloadClick.Slap]]
    : [[600, ReloadClick.MagOut], [1400, ReloadClick.MagIn], [1750, ReloadClick.Slap], [2050, ReloadClick.Bolt]];

  return a.map(([ms, t]) => [ms * k, t]);
};
