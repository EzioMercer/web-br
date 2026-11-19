import { fireSound } from '../audio/fireSound';
import { bots } from '../bots/state';
import { bulletMark } from '../effects/bulletMark';
import { screenFx } from '../effects/state';
import { tracer } from '../effects/tracer';
import { loadout } from '../loadout/state';
import { castRay } from '../physics/castRay';
import { rayBox } from '../physics/rayBox';
import { collision } from '../physics/state';
import { player, playerVel } from '../player/state';
import { clock } from '../sim/state';
import { breakGlass } from '../world/doors/breakGlass';
import { killBot } from './killBot';
import { knifeAttack } from './knifeAttack';
import { shotSpread } from './shotSpread';
import { spray } from './state';
import type { Bot } from '../bots/types';
import type { Vec3 } from '../types';
import { eyePos } from '../player/eyePos';
import { WeaponId } from '../types';

export const fireWeapon = () => {
  if (loadout.weapon.melee) {
    knifeAttack();
    return;
  }

  loadout.ammo--;
  loadout.nextShotAt = clock.time + loadout.weapon.fireInterval;

  if (clock.time - loadout.lastShotAt > 0.4) {
    spray.index = 0;
  }

  loadout.lastShotAt = clock.time;

  const i = spray.index++;
  const sp = Math.hypot(playerVel.x, playerVel.z);
  const bP = player.recoilPitch;
  const bY = player.recoilYaw;

  player.recoilPitch += Math.min(1.25, 0.5 + i * 0.12) * 0.0175 * loadout.weapon.recoil;
  player.recoilYaw += Math.sin(i * 0.65) * Math.min(1, i * 0.12) * 0.0175 * loadout.weapon.recoil;
  screenFx.gunKick = loadout.weapon.sniper
    ? (loadout.weaponId === WeaponId.BarrettM82 ? 0.2 : 0.14)
    : loadout.weapon.slot === 2
      ? 0.05
      : 0.07;
  screenFx.muzzleFlash = 0.04;
  fireSound();

  if (loadout.weapon.boltAction) {
    loadout.boltCycleEnd = clock.time + loadout.weapon.fireInterval;
  }

  const Y = player.yaw + bY;
  const Pp = player.pitch + bP;
  const sY = Math.sin(Y);
  const cY = Math.cos(Y);
  const sP = Math.sin(Pp);
  const cP = Math.cos(Pp);
  const o = eyePos();

  for (let n = 0; n < (loadout.weapon.pellets || 1); n++) {
    const spr = loadout.weapon.pellets ? 0.04 : shotSpread(sp);
    const a = Math.random() * 6.283;
    const r = Math.sqrt(Math.random()) * spr;
    const sx = Math.cos(a) * r;
    const sy = Math.sin(a) * r;
    const d0: Vec3 = [-sY * cP + cY * sx + sY * sP * sy, sP + cP * sy, -cY * cP - sY * sx + cY * sP * sy];
    const l = Math.hypot(...d0);
    const d: Vec3 = [d0[0] / l, d0[1] / l, d0[2] / l];
    let best = castRay(o, d);
    let tgt: Bot | null = null;
    let mult = 1;
    let gb = 0;

    for (let gi = 0; gi < 4 && collision.lastHit && collision.lastHit.glass && best < 1e8; gi++) {
      breakGlass(collision.lastHit);
      gb += best + 0.06;
      best = gb + castRay([o[0] + d[0] * gb, o[1] + d[1] * gb, o[2] + d[2] * gb], d);
    }

    for (const b of bots) {
      if (b.health <= 0) {
        continue;
      }

      const yo = b.y - 0.5 * b.crouchAmount;
      const tb = rayBox(o, d, [b.x - 0.3, b.y, b.z - 0.3], [b.x + 0.3, yo + 1.45, b.z + 0.3]);
      const th = rayBox(o, d, [b.x - 0.17, yo + 1.45, b.z - 0.17], [b.x + 0.17, yo + 1.85, b.z + 0.17]);
      const t = Math.min(tb, th);

      if (t < best) {
        best = t;
        tgt = b;

        const y = o[1] + d[1] * t;

        mult = th < tb ? 4 : (y < b.y + 0.7 ? 0.75 : 1);
      }
    }

    const e: Vec3 = [o[0] + d[0] * best, o[1] + d[1] * best, o[2] + d[2] * best];

    tracer([o[0] + cY * 0.2 - sY * 0.6, o[1] - 0.15, o[2] - cY * 0.6 - sY * 0.2], e, 0xffe08a);

    if (tgt) {
      tgt.health -= loadout.weapon.damage * mult;
      tgt.alert = 1.5;
      tgt.reactAt = clock.time + 0.15;
      screenFx.hitMarker = 1;

      if (tgt.health <= 0) {
        killBot(tgt, mult >= 4);
      }
    } else if (best < 1e8) {
      bulletMark([e[0] - d[0] * 0.03, e[1] - d[1] * 0.03, e[2] - d[2] * 0.03]);
    }
  }
};
