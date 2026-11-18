import { WEAPONS } from '../data/weapons';
import { feedMessage } from '../hud/feedMessage';
import { layBodyDown } from './layBodyDown';
import type { Bot } from '../bots/types';

/** The player killed bot `b` (`hs`: with a headshot). */
export const killBot = (b: Bot, hs: boolean) => {
  layBodyDown(b);
  feedMessage('You eliminated ' + b.name + ' [' + WEAPONS[b.weaponId].name + ']' + (hs ? ' (headshot)' : ''));
};
