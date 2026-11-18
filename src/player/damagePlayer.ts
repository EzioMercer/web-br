import { screenFx } from '../effects/state';
import { input } from '../input/state';
import { byId } from '../utils/byId';
import { player, playerBody } from './state';
import type { Bot } from '../bots/types';

/** Damages the player by `d` (armor absorbs half, unless `raw`), from bot `by` if any. */
export const damagePlayer = (d: number, by?: Bot | null, raw?: boolean) => {
  if (player.dead) {
    return;
  }

  const ab = raw ? 0 : Math.min(player.armor, d * 0.5);

  player.armor -= ab;
  player.health -= d - ab;
  screenFx.damageFlash = raw ? Math.max(screenFx.damageFlash, 0.3) : 1;

  if (by) {
    screenFx.damageDir = 1.4;
    byId('dd').style.transform = 'translate(-50%,-50%) rotate('
      + ((Math.atan2(by.x - playerBody.x, -(by.z - playerBody.z)) + player.yaw) * 57.2958)
      + 'deg)';
  }

  if (player.health <= 0) {
    player.health = 0;
    player.dead = true;
    input.fireHeld = false;
    byId('msg').textContent = 'You were eliminated';
  }
};
