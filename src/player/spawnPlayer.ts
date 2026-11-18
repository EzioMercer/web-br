import { PLAYER_HEIGHT } from '../config';
import { loadout } from '../loadout/state';
import { byId } from '../utils/byId';
import { floorY } from '../world/level/floorY';
import { player, playerBody, playerVel } from './state';
import type { Vec2 } from '../types';
import { loadAmmo } from '../loadout/loadAmmo';

/** Puts the player at landing spot `at` with full health. */
export const spawnPlayer = (at: Vec2) => {
  playerBody.x = at[0] + (Math.random() - 0.5) * 5;
  playerBody.z = at[1];
  playerBody.y = floorY(playerBody.x, playerBody.z);
  playerBody.height = PLAYER_HEIGHT;
  playerVel.x = playerVel.y = playerVel.z = 0;
  player.yaw = 0;
  player.pitch = 0;
  player.recoilPitch = player.recoilYaw = 0;
  player.health = 100;
  loadAmmo(loadout.weaponId);
  loadout.reloading = false;
  player.dead = false;
  byId('msg').textContent = '';
};
