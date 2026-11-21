import { botDropSpot } from '../br/zone/botDropSpot';
import { PLAYER_HEIGHT } from '../config';
import { settings } from '../settings/state';
import { floorY } from '../world/level/floorY';
import { pickWaypoint } from './pickWaypoint';
import { setBotWeapon } from './setBotWeapon';
import { WeaponId } from '../types';
import { BotMode } from './types';
import type { Bot } from './types';

const BOT_WEAPONS: WeaponId[] = [
  WeaponId.Ak47,
  WeaponId.Ak47,
  WeaponId.M4a1,
  WeaponId.M4a1,
  WeaponId.Mp5,
  WeaponId.P90,
  WeaponId.Awp,
  WeaponId.Scout,
  WeaponId.Svd,
  WeaponId.M3,
  WeaponId.Glock18,
  WeaponId.DesertEagle,
  WeaponId.Usp,
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
  setBotWeapon(b, BOT_WEAPONS[Math.random() * BOT_WEAPONS.length | 0]);
  pickWaypoint(b);
};
