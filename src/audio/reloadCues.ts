import { loadout } from '../loadout/state';
import { ReloadClick } from './types';

/** Reload sound cues: [delay in ms, click], scaled to the weapon's reload time. */
export const reloadCues = (): [number, ReloadClick][] => {
  const k = loadout.weapon.reloadTime / 2.4;
  const a: [number, ReloadClick][] = loadout.weapon.boltAction
    ? [
        [500, ReloadClick.Bolt],
        [1000, ReloadClick.MagIn],
        [1500, ReloadClick.MagIn],
        [2000, ReloadClick.MagIn],
        [2800, ReloadClick.Bolt],
      ]
    : loadout.weapon.pellets
      ? [
          [500, ReloadClick.Shell],
          [900, ReloadClick.Shell],
          [1300, ReloadClick.Shell],
          [1700, ReloadClick.Shell],
          [2100, ReloadClick.Shell],
          [2400, ReloadClick.Pump],
        ]
      : loadout.weapon.slot === 2
        ? [[600, ReloadClick.MagOut], [1250, ReloadClick.MagIn], [1600, ReloadClick.Slap]]
        : [[600, ReloadClick.MagOut], [1400, ReloadClick.MagIn], [1750, ReloadClick.Slap], [2050, ReloadClick.Bolt]];

  return a.map(([ms, t]) => [ms * k, t]);
};
