import { footstep } from '../audio/footstep';
import { noiseBurst } from '../audio/noiseBurst';
import { zone } from '../br/zone/state';
import { PLAYER_HEIGHT } from '../config';
import { WEAPONS } from '../data/weapons';
import { ripple } from '../effects/ripple';
import { tracer } from '../effects/tracer';
import { match } from '../match/state';
import { castRay } from '../physics/castRay';
import { lineOfSight } from '../physics/lineOfSight';
import { moveBody } from '../physics/moveBody';
import { damagePlayer } from '../player/damagePlayer';
import { player, playerBody, playerVel } from '../player/state';
import { settings } from '../settings/state';
import { clock } from '../sim/state';
import { shatter } from '../world/doors/shatter';
import { surfaceAt } from '../world/level/surfaceAt';
import { waterDepth } from '../world/level/waterDepth';
import { pickWaypoint } from './pickWaypoint';
import { bots } from './state';
import type { Vec3 } from '../types';
import { eyePos } from '../player/eyePos';
import { Phase } from '../types';
import { ZonePhase } from '../br/zone/types';

export const botsTick = (dt: number) => {
  for (const b of bots) {
    if (b.health <= 0) {
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
      const dn = Math.hypot(b.x - zt.cx, b.z - zt.cz) - zt.radius;
      const d0 = Math.hypot(b.x - zone.cx, b.z - zone.cz) - zone.radius;

      run = d0 > -10
        || (zone.phase === ZonePhase.Shrink && dn > -6)
        || (zone.phase === ZonePhase.Hold && zone.timeLeft < 45 && dn > -12);
    }

    b.running = run;

    const ey = b.y + 1.6 - 0.5 * b.crouchAmount;
    const o: Vec3 = [b.x, ey, b.z];
    const dx = playerBody.x - b.x;
    const dy = playerBody.y + 1.2 - ey;
    const dz = playerBody.z - b.z;
    const dist = Math.hypot(dx, dy, dz);
    let sees = false;

    if (!player.dead && dist < 50 && clock.time >= (b.blindUntil || 0)) {
      const da = Math.atan2(dx, dz) - b.mesh.rotation.y;
      const ang = Math.abs(((da + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI);

      sees = (b.alert > 0 || dist < 8 || ang < settings.difficulty.viewAngle)
        && lineOfSight(o, eyePos())
        && lineOfSight(o, [playerBody.x, playerBody.y + player.eyeHeight * 0.65, playerBody.z]);
    }

    if (sees) {
      if (b.alert <= 0) {
        b.reactAt = clock.time + (0.35 + Math.random() * 0.3) * settings.difficulty.reactionTime;
      }

      b.alert = 1.2 * settings.difficulty.memory;
    } else {
      b.alert -= dt;
    }

    const px = b.x;
    const pz = b.z;

    if (b.alert > 0 && !player.dead && !(b.running && dist > 14)) {
      b.mesh.rotation.y = Math.atan2(dx, dz);

      const st = Math.sin(clock.time * 1.7 + b.id * 2) * 2;
      const rx = Math.cos(b.mesh.rotation.y);
      const rz = -Math.sin(b.mesh.rotation.y);
      const sm = b.crouch ? 0.25 : 1;

      b.vel.x = rx * st * sm;
      b.vel.z = rz * st * sm;

      if (WEAPONS[b.weaponId].melee && dist > 1.6) {
        const hd = Math.hypot(dx, dz) || 1;

        b.vel.x = dx / hd * 4.2 * settings.difficulty.speed;
        b.vel.z = dz / hd * 4.2 * settings.difficulty.speed;
      }

      if (!b.crouch && b.onGround && dist > 5 && Math.random() < dt * 0.4) {
        b.vel.y = 7;
      }

      if (clock.time >= b.nextCrouchAt) {
        b.nextCrouchAt = clock.time + 1 + Math.random() * 2.5;
        b.crouch = sees && Math.random() < 0.4 ? 1 : 0;
      }

      if (sees && clock.time >= b.reactAt && clock.time >= b.nextShotAt && (!WEAPONS[b.weaponId].melee || dist < 2.8)) {
        b.nextShotAt = clock.time
          + Math.max(0.1, WEAPONS[b.weaponId].fireInterval * 1.6 * settings.difficulty.fireDelay)
          + Math.random() * 0.15 * settings.difficulty.fireDelay;

        const hc = settings.difficulty.accuracy
          * Math.max(0.12, 0.7 - dist * 0.012)
          * (Math.hypot(playerVel.x, playerVel.z) > 3 ? 0.6 : 1)
          * (playerBody.height < PLAYER_HEIGHT ? 0.8 : 1)
          * (b.onGround ? 1 : 0.7);
        const hit = Math.random() < Math.min(0.95, hc);
        const m = hit ? 0 : 1.8;
        const tp: Vec3 = [
          playerBody.x + (Math.random() - 0.5) * m,
          playerBody.y + 1.1 + (Math.random() - 0.5) * m,
          playerBody.z + (Math.random() - 0.5) * m,
        ];
        const o2: Vec3 = [b.x, b.y + 1.3, b.z];
        const ex = tp[0] - o2[0];
        const ey = tp[1] - o2[1];
        const ez = tp[2] - o2[2];
        const el = Math.hypot(ex, ey, ez);
        const wt = Math.min(el, castRay(o2, [ex / el, ey / el, ez / el], el));

        shatter(o2, [ex / el, ey / el, ez / el], el);
        tracer(o2, [o2[0] + ex / el * wt, o2[1] + ey / el * wt, o2[2] + ez / el * wt], 0xff7a55);
        noiseBurst(
          (WEAPONS[b.weaponId].sniper ? 0.6 : 0.22) / (1 + dist * 0.12),
          WEAPONS[b.weaponId].sniper ? 0.4 : 0.12,
          WEAPONS[b.weaponId].sniper ? 900 : 1500,
        );

        if (hit) {
          damagePlayer(
            Math.min(
              60,
              WEAPONS[b.weaponId].damage * 0.3 * settings.difficulty.damage,
            ) * (0.8 + Math.random() * 0.4) * (WEAPONS[b.weaponId].pellets ? 2 : 1),
            b,
          );
        }
      }
    } else {
      b.crouch = 0;

      const wx = b.targetX - b.x;
      const wz = b.targetZ - b.z;
      const wd = Math.hypot(wx, wz);
      const zt2 = zone.next || zone;
      const badT = Math.hypot(b.targetX - zone.cx, b.targetZ - zone.cz) > zone.radius
        || (b.running && Math.hypot(b.targetX - zt2.cx, b.targetZ - zt2.cz) > zt2.radius);

      if (wd < 1.5 || badT) {
        pickWaypoint(b);
        b.stuck = 0;
      } else if (b.stuck > 0.45) {
        b.detourUntil = clock.time + 1.5;
        b.detourDir = Math.random() < 0.5 ? -1 : 1;

        if (Math.random() < 0.3) {
          pickWaypoint(b);
        }

        b.stuck = 0;
      } else {
        if (b.stuck > 0.12 && b.onGround) {
          b.vel.y = 7;
        }

        let ux = wx / wd;
        let uz = wz / wd;

        if (clock.time < (b.detourUntil || 0)) {
          const a = b.detourDir * 1.1;
          const c = Math.cos(a);
          const s2 = Math.sin(a);
          const tx = ux * c - uz * s2;

          uz = ux * s2 + uz * c;
          ux = tx;
        }

        const sp = 3.4 * settings.difficulty.speed * (b.running ? 1.7 : 1);

        b.vel.x = ux * sp;
        b.vel.z = uz * sp;
        b.mesh.rotation.y = Math.atan2(ux, uz);
      }
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
      b.stepDist = (b.stepDist || 0) + Math.hypot(b.vel.x, b.vel.z) * dt;

      if (b.stepDist > 1.9) {
        b.stepDist = 0;

        const d0 = Math.hypot(b.x - playerBody.x, b.z - playerBody.z);

        if (d0 < 35) {
          footstep(surfaceAt(b.x, b.z, b.y), Math.max(0, 1 - d0 / 35) * 0.9);

          if (waterDepth(b.x, b.z, b.y) > 0) {
            ripple(b.x, b.z);
          }
        }
      }
    }

    {
      const spd = Math.hypot(b.vel.x, b.vel.z);

      b.crouchAmount += ((b.crouch ? 1 : 0) - b.crouchAmount) * Math.min(1, dt * 10);

      const c = b.crouchAmount;

      b.height = c > 0.5 ? 1.2 : PLAYER_HEIGHT;
      b.walkPhase += spd * dt * 2.4;

      const sw = Math.sin(b.walkPhase) * Math.min(1, spd / 3) * 0.7 * (b.onGround ? 1 : 0.3) * (1 - c);

      b.upperBody.position.y = -0.46 * c;
      b.legs.forEach((L, i) => {
        L.position.y = 0.88 - 0.46 * c;
        L.rotation.x = (i ? -sw : sw) - 1.0 * c;
      });
      b.knees.forEach((K, i) => {
        K.rotation.x = Math.max(0, i ? sw : -sw) * 0.9 + 1.9 * c;
      });
    }

    if (b.alert <= 0) {
      if (Math.hypot(b.x - px, b.z - pz) < 0.3 * 3.4 * dt) {
        b.stuck += dt;
      } else {
        b.stuck = 0;
      }
    }

    b.mesh.position.set(b.x, b.y, b.z);
  }
};
