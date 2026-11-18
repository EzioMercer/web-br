import { botDropSpot } from '../br/zone/botDropSpot';
import { PLAYER_HEIGHT } from '../config';
import { settings } from '../settings/state';
import { floorY } from '../world/level/floorY';
import { pickWaypoint } from './pickWaypoint';
import { setBotWeapon } from './setBotWeapon';
import type { Bot } from './types';

const BOT_WEAPONS = [
  'rifle',
  'rifle',
  'm4',
  'm4',
  'mp5',
  'p90',
  'awp',
  'scout',
  'svd',
  'm3',
  'glock',
  'deagle',
  'pistol',
];

/** Drops bot `b` at a random spot with full health and a random weapon. */
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
  b.crouch = 0;
  b.crouchAmount = 0;
  b.height = PLAYER_HEIGHT;
  b.nextCrouchAt = 0;
  b.labelUntil = 0;
  setBotWeapon(b, BOT_WEAPONS[Math.random() * BOT_WEAPONS.length | 0]);
  pickWaypoint(b);
};
