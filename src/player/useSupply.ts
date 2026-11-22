import { MEDKIT_HEAL } from '../config';
import { feedMessage } from '../hud/feedMessage';
import { loadout } from '../loadout/state';
import { player } from './state';
import { Supply } from '../types';

/**
 * Uses a medkit (+50 health) or puts on a Kevlar vest (armor back to 100) from the bag: the one in bag slot `slot`,
 * else the first one. Does nothing if there is none, or if health (armor) is already full.
 */
export const useSupply = (s: Supply, slot = loadout.bag.indexOf(s)) => {
  if (player.dead || loadout.bag[slot] !== s) {
    return;
  }

  const medkit = s === Supply.Medkit;

  if ((medkit ? player.health : player.armor) >= 100) {
    feedMessage(medkit ? 'Health is already full' : 'Armor is already full');
    return;
  }

  loadout.bag[slot] = null;

  if (medkit) {
    player.health = Math.min(100, player.health + MEDKIT_HEAL);
  } else {
    player.armor = 100;
  }

  feedMessage(medkit ? 'Used a medkit' : 'Put on a Kevlar vest');
};
