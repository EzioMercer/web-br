import * as THREE from 'three';
import { fireSound } from '../audio/fireSound';
import { hearShot } from '../bots/hearShot';
import { screenFx } from '../effects/state';
import { loadout } from '../loadout/state';
import { scene } from '../render/scene';
import { player, playerVel } from '../player/state';
import { clock } from '../sim/state';
import { knifeAttack } from './knifeAttack';
import { shotSpread } from './shotSpread';
import { bullets, spray } from './state';
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
  hearShot();

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
    const v = loadout.weapon.bulletSpeed;
    const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...o), new THREE.Vector3(...o)]);
    const streak = new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0xffe08a, transparent: true }));

    scene.add(streak);
    bullets.push({
      x: o[0],
      y: o[1],
      z: o[2],
      vx: d[0] * v,
      vy: d[1] * v,
      vz: d[2] * v,
      weapon: loadout.weapon,
      flown: 0,
      streak,
      muzzle: [o[0] + cY * 0.2 - sY * 0.6, o[1] - 0.15, o[2] - cY * 0.6 - sY * 0.2],
    });
  }
};
