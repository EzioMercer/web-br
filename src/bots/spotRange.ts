import { PLAYER_HEIGHT } from '../config';
import { WEAPONS } from '../data/weapons';
import { loadout } from '../loadout/state';
import { playerBody, playerVel } from '../player/state';
import { clock } from '../sim/state';
import { SPOT_LIMIT } from './constants';
import type { Bot } from './types';
import { hypot } from '../utils/hypot';

/**
 * How far bot `b` can spot the player right now (m): farther through a sniper scope, when the player moves fast or
 * has just fired (muzzle flash), or stands high above the bot against the sky; less when the player crouches still.
 */
export const spotRange = (b: Bot) => {
  const w = WEAPONS[b.weaponId];
  const sp = hypot(playerVel.x, playerVel.z);
  const above = playerBody.y - b.y;
  let r = 55 * (w.sniper ? 2.6 : w.range >= 45 ? 1.6 : 1);

  if (playerBody.height < PLAYER_HEIGHT && sp < 1) {
    r *= 0.65;
  } else if (sp > 5) {
    r *= 1.25;
  }

  if (clock.time - loadout.lastShotAt < 1.5) {
    r *= 2;
  }

  if (above > 6) {
    r *= 1 + Math.min(1, (above - 6) / 30) * 0.6;
  }

  return Math.min(SPOT_LIMIT, r);
};
