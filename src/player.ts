import { reloadCues, playReloadCues } from './audio';
import { PLAYER_HEIGHT } from './config';
import { byId } from './dom';
import { WEAPONS } from './weapons';
import { floorY } from './world/level';
import { screenFx } from './effects';
import { input } from './input';
import { loadout } from './loadout';
import { simTime } from './sim';
import type { Bot } from './bots';
import type { Body, OwnedWeapon, Vec2, Velocity } from './types';

/** Health, armor, view angles and recoil of the player. */
export const player = {
  health: 100,
  armor: 0,
  dead: false,
  yaw: 0,
  pitch: 0,
  /** Current eye height (m), eased between standing, crouching and sliding. */
  eyeHeight: 1.62,
  /** Recoil offsets added to the view. */
  recoilPitch: 0,
  recoilYaw: 0,
};

/** The player's body (feet position) and velocity. */
export const playerBody: Required<Body> = { x: 0, y: 0, z: 26, onGround: true, height: 1.8 };
export const playerVel: Velocity = { x: 0, y: 0, z: 0 };

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
    byId('dd').style.transform = 'translate(-50%,-50%) rotate(' + ((Math.atan2(by.x - playerBody.x, -(by.z - playerBody.z)) + player.yaw) * 57.2958) + 'deg)';
  }
  if (player.health <= 0) {
    player.health = 0;
    player.dead = true;
    input.fireHeld = false;
    byId('msg').textContent = 'You were eliminated';
  }
};

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
  ({ ammo: loadout.ammo, reserve: loadout.reserve } = loadout.owned[loadout.weaponId]);
  loadout.reloading = false;
  player.dead = false;
  byId('msg').textContent = '';
};

export const reload = () => {
  if (loadout.reloading || loadout.ammo === loadout.weapon.magSize || loadout.reserve <= 0) {
    return;
  }
  loadout.reloading = true;
  loadout.scoped = false;
  loadout.reloadEnd = simTime + loadout.weapon.reloadTime;
  playReloadCues(reloadCues());
};

export const switchWeapon = (id: string) => {
  if (!loadout.owned[id] || id === loadout.weaponId || player.dead) {
    return;
  }
  loadout.owned[loadout.weaponId] = Object.assign(loadout.owned[loadout.weaponId] || {}, { ammo: loadout.ammo, reserve: loadout.reserve } satisfies Partial<OwnedWeapon>);
  loadout.weaponId = id;
  loadout.weapon = WEAPONS[id];
  ({ ammo: loadout.ammo, reserve: loadout.reserve } = loadout.owned[id]);
  loadout.grenade = null;
  loadout.reloading = false;
  loadout.scoped = false;
  loadout.nextShotAt = Math.max(simTime + 0.4, WEAPONS[id].boltAction ? loadout.boltCycleEnd : 0);
};
