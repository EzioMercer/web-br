import { botDropSpot } from '../br/zone/botDropSpot';
import { PLAYER_HEIGHT } from '../config';
import { settings } from '../settings/state';
import { floorY } from '../world/level/floorY';
import { pickWaypoint } from './pickWaypoint';
import { setBotWeapon } from './setBotWeapon';
import { clock } from '../sim/state';
import { BOT_START_WEAPONS } from './constants';
import { BotMode } from './types';
import type { Bot } from './types';

/** Drops bot `b` at a random spot with full health and a starting gun (pistol mostly). */
export const respawnBot = (b: Bot) => {
  const w = botDropSpot();

  b.x = w[0] + (Math.random() - 0.5) * 0.6;
  b.z = w[1];
  b.y = floorY(b.x, b.z);
  b.health = 100 * settings.difficulty.health;
  b.mesh.position.set(b.x, b.y, b.z);
  b.mesh.rotation.x = 0;
  b.corpse = false;
  b.mesh.visible = true;
  b.alert = 0;
  b.mode = BotMode.Roam;
  b.inCover = false;
  b.underFireAt = 0;
  b.coverAt = 0;
  b.heardAt = -9;
  b.sees = false;
  b.nextSightAt = 0;
  b.stuck = 0;
  b.glint.visible = false;
  b.crouch = 0;
  b.crouchAmount = 0;
  b.height = PLAYER_HEIGHT;
  b.nextCrouchAt = 0;
  b.labelUntil = 0;
  b.lootTarget = null;
  b.nextLootAt = 0;
  // the first guns found out of sight come 50 to 125 s in (the countdown is 5 s)
  b.upgradeAt = clock.time + 50 + Math.random() * 75;
  setBotWeapon(b, BOT_START_WEAPONS[Math.random() * BOT_START_WEAPONS.length | 0]);
  pickWaypoint(b);
};
