import { stepNoise, footstep } from './audio';
import { botsTick } from './bots';
import { fireWeapon } from './combat';
import { PLAYER_HEIGHT } from './config';
import { ripple } from './effects';
import { grenadesTick } from './grenades';
import { input, keys } from './input';
import { matchTick, phase } from './match';
import { accelerate, overlaps, moveBody, boxesNear } from './physics';
import { playerBody, player, reload, playerVel } from './player';
import { doorsTick } from './world/doors';
import { surfaceAt, waterDepth } from './world/level';
import { settings } from './settings';
import { loadout } from './loadout';
import type { Vec2 } from './types';

/** Simulation time (s). */
export let simTime = 0;

let stepDist = 0;
let wasCrouching = false;
let slideEnd = 0;
let slideStart = 0;
let slideReadyAt = 0;
let slideDir: Vec2 = [0, 1];
let slideSpeed = 8;
let wasInWater = false;

/** The player is in a slide. */
export const isSliding = () => {
  return simTime < slideEnd;
};

/** One fixed simulation step. */
export const tick = (dt: number) => {
  simTime += dt;
  matchTick(dt);

  if (!player.dead) {
    const cr = keys.ControlLeft || keys.KeyC;

    if (cr
      && !wasCrouching
      && playerBody.onGround
      && keys.ShiftLeft
      && simTime >= slideReadyAt
      && playerBody.height >= PLAYER_HEIGHT
      && Math.hypot(playerVel.x, playerVel.z) > 4.6
      && waterDepth(playerBody.x, playerBody.z, playerBody.y) < 0.2) {
      const s0 = Math.hypot(playerVel.x, playerVel.z);

      slideStart = simTime;
      slideEnd = simTime + 0.95;
      slideReadyAt = simTime + 1.9;
      slideDir = [playerVel.x / s0, playerVel.z / s0];
      slideSpeed = Math.max(s0, 6.6) * 1.3;
      stepNoise(0.3 * Math.max(0.3, settings.footstepVolume), 0.7, 800, 0.05);
    }

    wasCrouching = cr;

    if (!cr) {
      slideEnd = 0;
    }

    if (cr) {
      playerBody.height = 1.2;
    } else if (playerBody.height < PLAYER_HEIGHT) {
      playerBody.height = PLAYER_HEIGHT;

      if (boxesNear(playerBody.x, playerBody.z, 1).some(b => overlaps(playerBody, b))) {
        playerBody.height = 1.2;
      }
    }

    {
      const tr = ((keys.ArrowLeft ? 1 : 0) - (keys.ArrowRight ? 1 : 0)) * 2.2 * dt;
      const tp = ((keys.ArrowUp ? 1 : 0) - (keys.ArrowDown ? 1 : 0)) * 1.6 * dt;

      player.yaw += tr;
      player.pitch = Math.max(-1.5, Math.min(1.5, player.pitch + tp));
    }

    const f = (keys.KeyW ? 1 : 0) - (keys.KeyS ? 1 : 0);
    const s = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0);
    const sy = Math.sin(player.yaw);
    const cy = Math.cos(player.yaw);
    let wx = -sy * f + cy * s;
    let wz = -cy * f - sy * s;
    const wl = Math.hypot(wx, wz);

    if (wl > 0) {
      wx /= wl;
      wz /= wl;
    }

    const wf = waterDepth(playerBody.x, playerBody.z, playerBody.y);
    const ws = (wl > 0 ? (playerBody.height < PLAYER_HEIGHT ? 2.4 : keys.ShiftLeft ? 6.6 : 3.9) : 0) * (1 - 0.5 * wf);

    if (playerBody.onGround && keys.Space) {
      playerVel.y = 7 - 3 * wf;
      playerBody.onGround = false;
      slideEnd = 0;
    }

    const sliding = simTime < slideEnd && playerBody.onGround;

    if (sliding) {
      const u = Math.min(1, (simTime - slideStart) / 0.95);
      const spd = 1.2 + (slideSpeed - 1.2) * (1 - u) * (1 - u);

      playerVel.x = slideDir[0] * spd;
      playerVel.z = slideDir[1] * spd;
    } else if (playerBody.onGround) {
      const sp = Math.hypot(playerVel.x, playerVel.z);

      if (sp > 0) {
        const k = Math.max(sp - Math.max(sp, 1.5) * 5 * dt, 0) / sp;

        playerVel.x *= k;
        playerVel.z *= k;
      }

      accelerate(playerVel, wx, wz, ws, 10 * ws, dt);
    } else if (wl > 0) {
      accelerate(playerVel, wx, wz, Math.min(ws, 0.9), 62, dt);
    }

    playerVel.y -= 20 * dt;
    moveBody(playerBody, playerVel, dt);

    if (sliding && Math.hypot(playerVel.x, playerVel.z) < 0.6) {
      slideEnd = 0;
    }

    {
      const w2 = waterDepth(playerBody.x, playerBody.z, playerBody.y);

      if (w2 > 0 && !wasInWater) {
        ripple(playerBody.x, playerBody.z);
        ripple(playerBody.x, playerBody.z);
        footstep('water', 1.6);
      }

      wasInWater = w2 > 0;

      if (playerBody.onGround) {
        const sp = Math.hypot(playerVel.x, playerVel.z);

        stepDist += sp * dt;

        if (stepDist > 1.9) {
          stepDist = 0;

          if (sp > 1.2 && playerBody.height >= PLAYER_HEIGHT) {
            footstep(surfaceAt(playerBody.x, playerBody.z, playerBody.y), keys.ShiftLeft ? 1 : 0.45);

            if (w2 > 0) {
              ripple(playerBody.x, playerBody.z);
            }
          }
        }
      }
    }

    const dk = Math.exp(-2.4 * dt);

    player.recoilPitch *= dk;
    player.recoilYaw *= dk;

    if (simTime < loadout.boltCycleEnd) {
      loadout.scoped = false;
    }

    if (loadout.reloading && simTime >= loadout.reloadEnd) {
      const n = Math.min(loadout.weapon.magSize - loadout.ammo, loadout.reserve);

      loadout.ammo += n;
      loadout.reserve -= n;
      loadout.reloading = false;
    }

    if (input.fireHeld && !loadout.grenade && !loadout.reloading && simTime >= loadout.nextShotAt) {
      if (loadout.ammo > 0) {
        fireWeapon();

        if (!loadout.weapon.auto) {
          input.fireHeld = false;
        }
      } else {
        reload();
      }
    }
  }

  grenadesTick(dt);
  doorsTick(dt);

  if (phase !== 'start') {
    botsTick(dt);
  }
};
