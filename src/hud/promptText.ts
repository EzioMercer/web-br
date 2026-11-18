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

  if (loadout.grenade) {
    return GRENADE_NAMES[loadout.grenade]
      + ' ready – hold click to aim, release to throw · Right-click: '
      + (grenadeThrow.lob ? 'far throw' : 'short toss');
  }

  return looting.prompt;
};
