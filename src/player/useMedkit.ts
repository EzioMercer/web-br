import { MEDKIT_HEAL } from '../config';
import { feedMessage } from '../hud/feedMessage';
import { player, supplies } from './state';

/** Uses a carried medkit, if there is one and it would heal anything. */
export const useMedkit = () => {
  if (player.dead || !supplies.medkits) {
    return;
  }

  if (player.health >= 100) {
    feedMessage('Health is already full');
    return;
  }

  supplies.medkits--;
  player.health = Math.min(100, player.health + MEDKIT_HEAL);
  feedMessage('Used a medkit');
};
