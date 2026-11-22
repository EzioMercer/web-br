import { looting } from '../br/pickups/state';
import { GRENADE_NAMES } from '../data/grenades';
import { grenadeThrow } from '../grenades/state';
import { loadout } from '../loadout/state';
import { player } from '../player/state';

/** Grenade selected, or the pickup and door prompt (HTML). */
export const promptText = () => {
  if (player.dead) {
    return '';
  }

  if (loadout.grenade && grenadeThrow.held) {
    return 'Throw power <b>' + Math.round(grenadeThrow.power * 100) + '%</b> · Wheel ± · Right-click: cancel';
  }

  if (loadout.grenade) {
    return GRENADE_NAMES[loadout.grenade] + ' ready – hold click to aim, release to throw';
  }

  return looting.prompt;
};
