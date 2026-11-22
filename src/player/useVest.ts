import { feedMessage } from '../hud/feedMessage';
import { player, supplies } from './state';

/** Puts on a carried Kevlar vest (armor back to 100), if there is one and the armor is worn at all. */
export const useVest = () => {
  if (player.dead || !supplies.vests) {
    return;
  }

  if (player.armor >= 100) {
    feedMessage('Armor is already full');
    return;
  }

  supplies.vests--;
  player.armor = 100;
  feedMessage('Put on a Kevlar vest');
};
