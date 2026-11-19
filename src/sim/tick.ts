import { footstep } from '../audio/footstep';
import { stepNoise } from '../audio/stepNoise';
import { botsTick } from '../bots/botsTick';
import { fireWeapon } from '../combat/fireWeapon';
import { PLAYER_HEIGHT } from '../config';
import { ripple } from '../effects/ripple';
import { grenadesTick } from '../grenades/grenadesTick';
import { input, keys } from '../input/state';
import { reload } from '../loadout/reload';
import { loadout } from '../loadout/state';
import { matchTick } from '../match/matchTick';
import { match } from '../match/state';
import { accelerate } from '../physics/accelerate';
import { boxesNear } from '../physics/boxesNear';
import { moveBody } from '../physics/moveBody';
import { overlaps } from '../physics/overlaps';
import { player, playerBody, playerVel } from '../player/state';
import { settings } from '../settings/state';
import { doorsTick } from '../world/doors/doorsTick';
import { surfaceAt } from '../world/level/surfaceAt';
import { waterDepth } from '../world/level/waterDepth';
import { clock, slide } from './state';
import { Phase } from '../types';
import { Surface } from '../audio/types';

let stepDist = 0;

let wasCrouching = false;

let wasInWater = false;

/** One fixed simulation step. */
export const tick = (dt: number) => {
  clock.time += dt;
  matchTick(dt);

  if (!player.dead) {
    const cr = keys.ControlLeft || keys.KeyC;

    if (cr
      && !wasCrouching
      && playerBody.onGround
      && keys.ShiftLeft
      && clock.time >= slide.readyAt
      && playerBody.height >= PLAYER_HEIGHT
      && Math.hypot(playerVel.x, playerVel.z) > 4.6
      && waterDepth(playerBody.x, playerBody.z, playerBody.y) < 0.2) {
      const s0 = Math.hypot(playerVel.x, playerVel.z);

      slide.start = clock.time;
      slide.end = clock.time + 0.95;
      slide.readyAt = clock.time + 1.9;
      slide.dir = [playerVel.x / s0, playerVel.z / s0];
      slide.speed = Math.max(s0, 6.6) * 1.3;
      stepNoise(0.3 * Math.max(0.3, settings.footstepVolume), 0.7, 800, 0.05);
    }

    wasCrouching = cr;

    if (!cr) {
      slide.end = 0;
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
      slide.end = 0;
    }

    const sliding = clock.time < slide.end && playerBody.onGround;

    if (sliding) {
      const u = Math.min(1, (clock.time - slide.start) / 0.95);
      const spd = 1.2 + (slide.speed - 1.2) * (1 - u) * (1 - u);

      playerVel.x = slide.dir[0] * spd;
      playerVel.z = slide.dir[1] * spd;
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
      slide.end = 0;
    }

    {
      const w2 = waterDepth(playerBody.x, playerBody.z, playerBody.y);

      if (w2 > 0 && !wasInWater) {
        ripple(playerBody.x, playerBody.z);
        ripple(playerBody.x, playerBody.z);
        footstep(Surface.Water, 1.6);
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

    if (clock.time < loadout.boltCycleEnd) {
      loadout.scoped = false;
    }

    if (loadout.reloading && clock.time >= loadout.reloadEnd) {
      const n = Math.min(loadout.weapon.magSize - loadout.ammo, loadout.reserve);

      loadout.ammo += n;
      loadout.reserve -= n;
      loadout.reloading = false;
    }

    if (input.fireHeld && !loadout.grenade && !loadout.reloading && clock.time >= loadout.nextShotAt) {
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

  if (match.phase !== Phase.Start) {
    botsTick(dt);
  }
};
