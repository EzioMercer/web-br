import { loadout } from '../loadout/state';
import type { ReloadClick } from './types';

/** Reload sound cues: [delay in ms, click], scaled to the weapon's reload time. */
export const reloadCues = (): [number, ReloadClick][] => {
  const k = loadout.weapon.reloadTime / 2.4;
  const a: [number, ReloadClick][] = loadout.weapon.boltAction
    ? [[500, 'bolt'], [1000, 'in'], [1500, 'in'], [2000, 'in'], [2800, 'bolt']]
    : loadout.weapon.pellets
      ? [[500, 'shell'], [900, 'shell'], [1300, 'shell'], [1700, 'shell'], [2100, 'shell'], [2400, 'pump']]
      : loadout.weapon.slot === 2
        ? [[600, 'out'], [1250, 'in'], [1600, 'slap']]
        : [[600, 'out'], [1400, 'in'], [1750, 'slap'], [2050, 'bolt']];

  return a.map(([ms, t]) => [ms * k, t]);
};
