import { footstep } from '../audio/footstep';
import { panFor } from '../audio/panFor';
import { soundMark } from '../hud/soundMarks/soundMark';
import { zone } from '../br/zone/state';
import { ZonePhase } from '../br/zone/types';
import { PLAYER_HEIGHT } from '../config';
import { WEAPONS } from '../data/weapons';
import { ripple } from '../effects/ripple';
import { match } from '../match/state';
import { moveBody } from '../physics/moveBody';
import { eyePos } from '../player/eyePos';
import { player, playerBody } from '../player/state';
import { settings } from '../settings/state';
import { clock } from '../sim/state';
import { surfaceAt } from '../world/level/surfaceAt';
import { waterDepth } from '../world/level/waterDepth';
import { botLoot } from './botLoot';
import { botSees } from './botSees';
import { botShoot } from './botShoot';
import { engageRange } from './engageRange';
import { findCover } from './findCover';
import { pickWaypoint } from './pickWaypoint';
import { bots } from './state';
import { steer } from './steer';
import { BotMode } from './types';
import { Phase } from '../types';
import type { Vec3 } from '../types';
import type { Bot } from './types';
import { hypot } from '../utils/hypot';
import { wrapAngle } from '../utils/wrapAngle';

/** Walking speed of a bot (m/s), before the difficulty multiplier. */
const WALK = 3.4;

/** How far off the player a bot may still be facing when it fires (rad). */
const AIM_CONE = 0.3;

/** Starts a hunt for the player's last known position. */
const hunt = (b: Bot) => {
  if (b.mode !== BotMode.Hunt) {
    b.mode = BotMode.Hunt;
    b.modeUntil = clock.time + 20;
  }
};

/** Shot at: hide if it can't shoot back (or is badly hurt), otherwise keep fighting. */
const reactToFire = (b: Bot, canFight: boolean) => {
  b.coverAt = clock.time;

  if (canFight && (b.health > 40 * settings.difficulty.health || Math.random() < 0.5)) {
    return;
  }

  const c = findCover(b, [b.knownX, b.knownY + 1.5, b.knownZ]);

  if (c) {
    b.mode = BotMode.Cover;
    b.coverX = c[0];
    b.coverZ = c[1];
    b.inCover = false;
    b.modeUntil = clock.time + 7;
  } else if (!canFight) {
    hunt(b);
  }
};

/** Facing the player and shooting: riflemen strafe, snipers hold still. */
const fight = (b: Bot, dist: number, dx: number, dz: number, dt: number) => {
  const w = WEAPONS[b.weaponId];
  const still = w.sniper && dist > 25;

  b.mode = BotMode.Fight;
  b.faceYaw = Math.atan2(dx, dz);

  if (still) {
    b.vel.x = 0;
    b.vel.z = 0;
  } else {
    const st = Math.sin(clock.time * 1.7 + b.id * 2) * 2;
    const sm = b.crouch ? 0.25 : 1;

    b.vel.x = Math.cos(b.mesh.rotation.y) * st * sm;
    b.vel.z = -Math.sin(b.mesh.rotation.y) * st * sm;
  }

  if (w.melee && dist > 1.6) {
    const hd = hypot(dx, dz) || 1;

    b.vel.x = dx / hd * 4.2 * settings.difficulty.speed;
    b.vel.z = dz / hd * 4.2 * settings.difficulty.speed;
  }

  if (!still && !b.crouch && b.onGround && dist > 5 && dist < 30 && Math.random() < dt * 0.4) {
    b.vel.y = 7;
  }

  if (clock.time >= b.nextCrouchAt) {
    b.nextCrouchAt = clock.time + 1 + Math.random() * 2.5;
    b.crouch = Math.random() < (still ? 0.6 : 0.4) ? 1 : 0;
  }

  // it has to have turned to face the player first
  if (clock.time >= b.reactAt
    && clock.time >= b.nextShotAt
    && Math.abs(wrapAngle(b.faceYaw - b.mesh.rotation.y)) < AIM_CONE
    && (!w.melee || dist < 2.8)) {
    botShoot(b, dist);
  }
};

/** Walks between waypoints; a sniper that reaches its high spot holds it for a while. */
const roam = (b: Bot) => {
  const zt = zone.next || zone;
  const wd = hypot(b.targetX - b.x, b.targetZ - b.z);
  const badT = hypot(b.targetX - zone.cx, b.targetZ - zone.cz) > zone.radius
    || (b.running && hypot(b.targetX - zt.cx, b.targetZ - zt.cz) > zt.radius);

  b.mode = BotMode.Roam;
  b.crouch = 0;

  if (!b.running && botLoot(b, WALK * settings.difficulty.speed)) {
    return true;
  }

  if (wd < 1.5 && b.toOverwatch && !badT) {
    b.toOverwatch = false;
    b.mode = BotMode.Overwatch;
    b.modeUntil = clock.time + 15 + Math.random() * 20;
    b.detourDir = Math.random() < 0.5 ? -1 : 1;
    b.vel.x = 0;
    b.vel.z = 0;
    return false;
  }

  if (wd < 1.5 || badT) {
    pickWaypoint(b);
    b.stuck = 0;
    return false;
  }

  if (steer(b, b.targetX, b.targetZ, WALK * settings.difficulty.speed * (b.running ? 1.7 : 1)) < 0) {
    pickWaypoint(b);
  }

  return true;
};

/** Scope glint over a sniper's head while it aims at the player, so long-range shots come with a warning. */
const updateGlint = (b: Bot, dist: number) => {
  const on = b.mode === BotMode.Fight && Boolean(WEAPONS[b.weaponId].sniper) && dist > 30 && !player.dead;

  b.glint.visible = on;

  if (on) {
    // about the same size on screen at any range
    const s = (0.4 + dist * 0.05) * (0.8 + 0.2 * Math.sin(clock.time * 9 + b.id));
    const hy = b.y + 1.6 - 0.5 * b.crouchAmount;
    const e = eyePos();
    // drawn a little in front of the scope, toward the player, so the ground around the bot doesn't cut it off
    const k = Math.min(s * 0.6, dist * 0.5) / (hypot(e[0] - b.x, e[1] - hy, e[2] - b.z) || 1);

    b.glint.scale.set(s, s, 1);
    b.glint.position.set(b.x + (e[0] - b.x) * k, hy + (e[1] - hy) * k, b.z + (e[2] - b.z) * k);
  }
};

export const botsTick = (dt: number) => {
  for (const b of bots) {
    if (b.health <= 0) {
      b.glint.visible = false;

      if (b.corpse && b.fallY > b.y + 0.005) {
        b.fallVel -= 20 * dt;
        b.fallY = Math.max(b.y, b.fallY + b.fallVel * dt);
        b.mesh.position.set(b.x, b.fallY + 0.2, b.z);
      } // a body that dies in mid-air falls to the ground

      if (b.corpse && clock.time > b.corpseUntil) {
        b.mesh.visible = false;
        b.corpse = false;
      }

      continue;
    }

    let run = false;

    if (match.phase === Phase.Live) {
      const zt = zone.next || zone;
      const dn = hypot(b.x - zt.cx, b.z - zt.cz) - zt.radius;
      const d0 = hypot(b.x - zone.cx, b.z - zone.cz) - zone.radius;

      run = d0 > -10
        || (zone.phase === ZonePhase.Shrink && dn > -6)
        || (zone.phase === ZonePhase.Hold && zone.timeLeft < 45 && dn > -12);
    }

    b.running = run;

    const ey = b.y + 1.6 - 0.5 * b.crouchAmount;
    const o: Vec3 = [b.x, ey, b.z];
    const dx = playerBody.x - b.x;
    const dz = playerBody.z - b.z;
    const dist = hypot(dx, playerBody.y + 1.2 - ey, dz);
    const sees = botSees(b, o, dist);

    b.sees = sees;

    if (sees) {
      if (b.alert <= 0) {
        b.reactAt = clock.time + (0.35 + Math.random() * 0.3) * settings.difficulty.reactionTime + dist * 0.004;
      }

      b.alert = 1.2 * settings.difficulty.memory;
      b.knownX = playerBody.x;
      b.knownY = playerBody.y;
      b.knownZ = playerBody.z;
    } else {
      b.alert -= dt;
    }

    const px = b.x;
    const pz = b.z;
    const canFight = sees && dist <= engageRange(WEAPONS[b.weaponId]);
    const fleeing = b.running && dist > 14;
    const sp = WALK * settings.difficulty.speed;
    let moving = false;

    if (!fleeing && !player.dead && b.underFireAt > b.coverAt && clock.time - b.underFireAt < 0.6) {
      reactToFire(b, canFight);
    }

    if (player.dead || fleeing) {
      moving = roam(b);
    } else if (b.mode === BotMode.Cover && !b.inCover) {
      // sprinting for cover
      const left = steer(b, b.coverX, b.coverZ, sp * 1.6);

      b.crouch = 0;
      moving = true;

      if (left >= 0 && left < 1) {
        b.inCover = true;
        b.modeUntil = clock.time + 2 + Math.random() * 3;
      } else if (clock.time > b.modeUntil) {
        hunt(b);
      }
    } else if (canFight) {
      b.inCover = false;
      fight(b, dist, dx, dz, dt);
    } else if (b.mode === BotMode.Cover) {
      // hiding, then going after the player
      b.vel.x = 0;
      b.vel.z = 0;
      b.crouch = 1;
      b.faceYaw = Math.atan2(b.knownX - b.x, b.knownZ - b.z);

      if (clock.time > b.modeUntil) {
        b.inCover = false;
        hunt(b);
      }
    } else if (b.alert > 0 || b.mode === BotMode.Hunt || b.mode === BotMode.Fight) {
      // lost sight of the player (or heard them): go to where they were last seen
      hunt(b);
      b.crouch = 0;

      const left = steer(b, b.knownX, b.knownZ, sp * (sees ? 1.5 : 1.25));

      moving = true;

      if ((left >= 0 && left < 2.5)
        || clock.time > b.modeUntil
        || hypot(b.knownX - zone.cx, b.knownZ - zone.cz) > zone.radius) {
        b.alert = 0;
        moving = roam(b);
      }
    } else if (b.mode === BotMode.Overwatch) {
      // holding high ground with a sniper rifle, scanning the area
      b.vel.x = 0;
      b.vel.z = 0;
      b.faceYaw = wrapAngle(b.faceYaw + dt * 0.45 * b.detourDir);

      if (clock.time > b.modeUntil) {
        pickWaypoint(b);
        b.mode = BotMode.Roam;
      }
    } else {
      moving = roam(b);
    }

    {
      // turn toward where it wants to face, no faster than the difficulty allows
      const turn = wrapAngle(b.faceYaw - b.mesh.rotation.y);
      const step = settings.difficulty.turnRate * dt;

      b.mesh.rotation.y = wrapAngle(b.mesh.rotation.y + Math.max(-step, Math.min(step, turn)));
    }

    b.vel.y -= 20 * dt; {
      const wf = waterDepth(b.x, b.z, b.y);

      if (wf > 0) {
        b.vel.x *= 1 - 0.45 * wf;
        b.vel.z *= 1 - 0.45 * wf;
      }
    }
    moveBody(b, b.vel, dt);

    if (b.onGround && !b.crouch) {
      b.stepDist = (b.stepDist || 0) + hypot(b.vel.x, b.vel.z) * dt;

      if (b.stepDist > 1.9) {
        b.stepDist = 0;

        const d0 = hypot(b.x - playerBody.x, b.z - playerBody.z);

        if (d0 < 35) {
          const loud = Math.max(0, 1 - d0 / 35);

          footstep(surfaceAt(b.x, b.z, b.y), loud * 0.9, panFor(b.x, b.z));
          soundMark(b.x, b.z, false, loud * 1.6, b);

          if (waterDepth(b.x, b.z, b.y) > 0) {
            ripple(b.x, b.z);
          }
        }
      }
    }

    {
      const spd = hypot(b.vel.x, b.vel.z);

      b.crouchAmount += ((b.crouch ? 1 : 0) - b.crouchAmount) * Math.min(1, dt * 10);

      const c = b.crouchAmount;

      b.height = c > 0.5 ? 1.2 : PLAYER_HEIGHT;
      b.walkPhase += spd * dt * 2.4;

      const sw = Math.sin(b.walkPhase) * Math.min(1, spd / 3) * 0.7 * (b.onGround ? 1 : 0.3) * (1 - c);

      b.upperBody.position.y = -0.46 * c;
      b.legs.forEach((L, i) => {
        L.position.y = 0.88 - 0.46 * c;
        L.rotation.x = (i ? -sw : sw) - c;
      });
      b.knees.forEach((K, i) => {
        K.rotation.x = Math.max(0, i ? sw : -sw) * 0.9 + 1.9 * c;
      });
    }

    if (moving && hypot(b.x - px, b.z - pz) < 0.3 * WALK * dt) {
      b.stuck += dt;
    } else {
      b.stuck = 0;
    }

    b.mesh.position.set(b.x, b.y, b.z);
    updateGlint(b, dist);
  }
};
