import { fireSound, stepNoise, stepThump } from './audio';
import { bots } from './bots';
import { spawnPickup } from './br/pickups';
import { bulletMark, screenFx, tracer } from './effects';
import { feedMessage } from './hud/hud';
import { takesOptic, loadout } from './loadout';
import { isFreeSpot, groundAt, lastHit, rayBox, castRay } from './physics';
import { playerBody, player, playerVel } from './player';
import { OPTIC_IDS, WEAPONS } from './weapons';
import { breakGlass } from './world/doors';
import { simTime } from './sim';
import type { Bot } from './bots';
import type { OwnedWeapon, PickupKind, Vec3 } from './types';

/** Shot number within the current spray. */
let sprayIndex = 0;

/** Battle Royale: scatters a dead bot's gear around it. */
const dropLoot = (b: Bot) => {
  const w = b.weaponId;
  const W = WEAPONS[w];
  const items: [PickupKind, string?, OwnedWeapon?][] = [];
  if (!W.melee) {
    items.push(['weapon', w, { ammo: Math.max(4, Math.round(W.magSize * (0.35 + Math.random() * 0.65))), reserve: W.magSize * (1 + Math.floor(Math.random() * 2)), optic: takesOptic(w) && Math.random() < 0.3 ? OPTIC_IDS[Math.random() * 3 | 0] : undefined }]);
  }
  if (!W.melee && Math.random() < 0.75) {
    items.push(['ammo', W.ammoType!]);
  }
  if (Math.random() < 0.4) {
    items.push(['armor']);
  }
  if (Math.random() < 0.4) {
    items.push(['health']);
  }
  if (Math.random() < 0.4) {
    items.push(['grenade', ['he', 'fl', 'sm'][Math.random() * 3 | 0]]);
  }
  if (Math.random() < 0.22) {
    items.push(['optic', OPTIC_IDS[Math.random() * 4 | 0]]);
  }
  const n = items.length;
  const a0 = Math.random() * 6.283;
  items.forEach((it, i) => {
    const a = a0 + i / n * 6.283;
    const r = 1.0 + Math.random() * 0.4;
    let x = b.x + Math.cos(a) * r;
    let z = b.z + Math.sin(a) * r;
    if (!isFreeSpot(x, z)) {
      x = b.x;
      z = b.z;
    }
    spawnPickup(x, z, it[0], it[1] ?? null, it[2], groundAt(x, z, b.y + 0.6));
  });
};

// the body stays where it fell (lying down) with its gear dropped around it
export const layBodyDown = (b: Bot) => {
  b.corpse = true;
  b.corpseUntil = simTime + 150;
  b.mesh.rotation.order = 'YXZ';
  b.mesh.rotation.x = -Math.PI / 2;
  b.fallY = b.y;
  b.fallVel = 0;
  b.y = groundAt(b.x, b.z, b.y + 0.6);
  if (b.fallY < b.y) {
    b.fallY = b.y;
  }
  b.mesh.position.set(b.x, b.fallY + 0.2, b.z);
  b.labelSprite.visible = false;
  dropLoot(b);
};

/** The player killed bot `b` (`hs`: with a headshot). */
export const killBot = (b: Bot, hs: boolean) => {
  layBodyDown(b);
  feedMessage('You eliminated ' + b.name + ' [' + WEAPONS[b.weaponId].name + ']' + (hs ? ' (headshot)' : ''));
};

const knifeAttack = () => {
  loadout.nextShotAt = simTime + loadout.weapon.fireInterval;
  loadout.slashEnd = simTime + 0.3;
  stepNoise(0.22, 0.18, 1500, 0.03);
  const cp = Math.cos(player.pitch);
  const d: Vec3 = [-Math.sin(player.yaw) * cp, Math.sin(player.pitch), -Math.cos(player.yaw) * cp];
  const o: Vec3 = [playerBody.x, playerBody.y + player.eyeHeight, playerBody.z];
  let best = castRay(o, d, 2.6);
  let tgt: Bot | null = null;
  if (lastHit && lastHit.glass && best < 2.6) {
    breakGlass(lastHit);
    best = 2.6;
  }
  for (const b of bots) {
    if (b.health <= 0) {
      continue;
    }
    const t = rayBox(o, d, [b.x - 0.45, b.y, b.z - 0.45], [b.x + 0.45, b.y + 1.9, b.z + 0.45]);
    if (t < Math.min(best, 2.4)) {
      best = t;
      tgt = b;
    }
  }
  if (tgt) {
    tgt.health -= loadout.weapon.damage;
    tgt.alert = 1.5;
    tgt.reactAt = simTime + 0.15;
    screenFx.hitMarker = 1;
    stepNoise(0.4, 0.08, 900, 0.004);
    stepThump(140, 70, 0.1, 0.25);
    if (tgt.health <= 0) {
      killBot(tgt, false);
    }
  }
};

export const fireWeapon = () => {
  if (loadout.weapon.melee) {
    knifeAttack();
    return;
  }
  loadout.ammo--;
  loadout.nextShotAt = simTime + loadout.weapon.fireInterval;
  if (simTime - loadout.lastShotAt > 0.4) {
    sprayIndex = 0;
  }
  loadout.lastShotAt = simTime;
  const i = sprayIndex++;
  const sp = Math.hypot(playerVel.x, playerVel.z);
  const bP = player.recoilPitch;
  const bY = player.recoilYaw;
  player.recoilPitch += Math.min(1.25, 0.5 + i * 0.12) * 0.0175 * loadout.weapon.recoil;
  player.recoilYaw += Math.sin(i * 0.65) * Math.min(1, i * 0.12) * 0.0175 * loadout.weapon.recoil;
  screenFx.gunKick = loadout.weapon.sniper ? (loadout.weaponId === 'm82' ? 0.2 : 0.14) : loadout.weapon.slot === 2 ? 0.05 : 0.07;
  screenFx.muzzleFlash = 0.04;
  fireSound();
  if (loadout.weapon.boltAction) {
    loadout.boltCycleEnd = simTime + loadout.weapon.fireInterval;
  }
  const Y = player.yaw + bY;
  const Pp = player.pitch + bP;
  const sY = Math.sin(Y);
  const cY = Math.cos(Y);
  const sP = Math.sin(Pp);
  const cP = Math.cos(Pp);
  const o: Vec3 = [playerBody.x, playerBody.y + player.eyeHeight, playerBody.z];
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
    for (let gi = 0; gi < 4 && lastHit && lastHit.glass && best < 1e8; gi++) {
      breakGlass(lastHit);
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
      tgt.reactAt = simTime + 0.15;
      screenFx.hitMarker = 1;
      if (tgt.health <= 0) {
        killBot(tgt, mult >= 4);
      }
    } else if (best < 1e8) {
      bulletMark([e[0] - d[0] * 0.03, e[1] - d[1] * 0.03, e[2] - d[2] * 0.03]);
    }
  }
};

/** Shot spread (radians) at movement speed `sp`. */
export const shotSpread = (sp: number) => {
  if (loadout.weapon.sniper) {
    return loadout.scoped && sp < 1 && playerBody.onGround ? (loadout.weapon.boltAction ? 0.0004 : 0.0016) : 0.06;
  }
  const b = 0.0015 + sp * 0.0012 + (playerBody.onGround ? 0 : 0.035) + Math.min(sprayIndex, 10) * 0.0003;
  return loadout.scoped ? b * 0.6 : b;
};
