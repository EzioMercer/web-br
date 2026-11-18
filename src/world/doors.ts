import * as THREE from 'three';
import { stepNoise, stepThump } from '../audio';
import { bots } from '../bots';
import { lastHit, castRay } from '../physics';
import { playerBody, player } from '../player';
import { scene } from '../render/renderer';
import { glassMat, unitGeo } from './level';
import { settings } from '../settings';
import type { Body, Box, Door, Vec3 } from '../types';

export const doors: Door[] = [];
/** Glass panes: collision box and mesh. */
export const panes: { box: Box; mesh: THREE.Mesh }[] = [];
/** Flying glass shards. */
export const shards: { mesh: THREE.Mesh; vx: number; vy: number; vz: number; life: number }[] = [];
let doorTimer = 0;
/** The door the E key would toggle. */
export let focusedDoor: Door | null = null;

// the door you are facing (or standing right next to), for the E key and the on-screen prompt
const findDoor = () => {
  if (player.dead) {
    return null;
  }
  let best: Door | null = null;
  let bs = 0;
  const cp = Math.cos(player.pitch);
  const fx = -Math.sin(player.yaw) * cp;
  const fz = -Math.cos(player.yaw) * cp;
  const fl = Math.hypot(fx, fz) || 1;
  for (const d of doors) {
    const dx = d.x - playerBody.x;
    const dz = d.z - playerBody.z;
    const dist = Math.hypot(dx, dz);
    if (dist > 2.6 || Math.abs(playerBody.y - d.y) > 2.4) {
      continue;
    }
    const dot = dist > 0.01 ? (dx * fx + dz * fz) / (dist * fl) : 1;
    if (dist > 1.3 && dot < 0.3) {
      continue;
    }
    const sc = dist - dot;
    if (!best || sc < bs) {
      best = d;
      bs = sc;
    }
  }
  return best;
};

// a door will not shut on somebody standing in the doorway
const doorBlocked = (d: Door) => {
  const k = d.box;
  const m = 0.45;

  const hit = (a: Body) => Math.abs(a.y - d.y) < 2.8 && a.x > k.min[0] - m && a.x < k.max[0] + m && a.z > k.min[2] - m && a.z < k.max[2] + m;

  return hit(playerBody) || bots.some(b => b.health > 0 && hit(b));
};

export const useDoor = () => {
  const d = findDoor();
  if (!d) {
    return;
  }
  if (d.target) {
    if (doorBlocked(d)) {
      return;
    }
    d.target = 0;
    d.closedByPlayer = true;
  } else {
    if (d.openAmount < 0.02) {
      const side = d.axis === 'x' ? Math.sign(playerBody.z - d.z) || 1 : Math.sign(playerBody.x - d.x) || 1;
      d.swingDir = d.axis === 'x' ? side : -side;
    }
    d.target = 1;
    d.closedByPlayer = false;
  }
  doorSound();
};

/** Opens doors for anyone walking up to them and animates them (every 50 ms). */
export const doorsTick = (dt: number) => {
  if (!doors.length) {
    focusedDoor = null;
    return;
  }
  doorTimer += dt;
  if (doorTimer < 0.05) {
    return;
  }
  const st = doorTimer;
  doorTimer = 0;
  const acts: Body[] = bots.filter(b => b.health > 0);
  if (!player.dead) {
    acts.push(playerBody);
  }
  focusedDoor = findDoor();
  for (const d of doors) {
    if (d.closedByPlayer && Math.hypot(playerBody.x - d.x, playerBody.z - d.z) > Math.sqrt(d.reachSq) + 0.8) {
      d.closedByPlayer = false;
    }
    if (d.target === 0) {
      let who: Body | null = null;
      let bd = d.reachSq;
      for (const a of acts) {
        if (a === playerBody && d.closedByPlayer) {
          continue;
        }
        const dx = a.x - d.x;
        const dz = a.z - d.z;
        const q = dx * dx + dz * dz;
        if (q < bd && Math.abs(a.y - d.y) < 2.8) {
          bd = q;
          who = a;
        }
      }
      if (who) {
        if (d.openAmount < 0.02) {
          const side = d.axis === 'x' ? Math.sign(who.z - d.z) || 1 : Math.sign(who.x - d.x) || 1;
          d.swingDir = d.axis === 'x' ? side : -side;
        }
        d.target = 1;
        if (inEarshot(d)) {
          doorSound();
        }
      }
    }
    if (d.openAmount !== d.target) {
      d.openAmount += Math.sign(d.target - d.openAmount) * Math.min(Math.abs(d.target - d.openAmount), st * 3.2);
      d.pivot.rotation.y = d.baseAngle + d.swingDir * d.openAmount * 1.5708;
      d.box.disabled = d.openAmount > 0.5;
    }
  }
};

/** Close enough to the player to hear. */
const inEarshot = (d: Door) => {
  return Math.hypot(d.x - playerBody.x, d.z - playerBody.z) < 30;
};

const doorSound = () => {
  stepThump(110, 70, 0.12, 0.12 * settings.footstepVolume);
};

const glassSound = () => {
  stepNoise(0.26 * Math.max(0.3, settings.footstepVolume + 0.4), 0.22, 3200, 0.003);
  stepNoise(0.16, 0.18, 2200, 0.005, 0.04);
  stepThump(900, 500, 0.06, 0.04);
};

export const breakGlass = (b: Box) => {
  if (b.disabled) {
    return;
  }
  b.disabled = true;
  const g = panes[b.glassIndex!];
  g.mesh.visible = false;
  glassSound();
  const cx = (b.min[0] + b.max[0]) / 2;
  const cy = (b.min[1] + b.max[1]) / 2;
  const cz = (b.min[2] + b.max[2]) / 2;
  for (let i = 0; i < 8; i++) {
    const m = new THREE.Mesh(unitGeo, glassMat);
    m.scale.set(0.14, 0.14, 0.02);
    m.position.set(cx + (Math.random() - 0.5) * (b.max[0] - b.min[0]), cy + (Math.random() - 0.5) * (b.max[1] - b.min[1]), cz + (Math.random() - 0.5) * (b.max[2] - b.min[2]));
    scene.add(m);
    shards.push({ mesh: m, vx: (Math.random() - 0.5) * 3, vy: Math.random() * 2, vz: (Math.random() - 0.5) * 3, life: 1.1 });
  }
};

/** Breaks up to four panes of glass along a shot. */
export const shatter = (o: Vec3, d: Vec3, len: number) => {
  let gb = 0;
  for (let i = 0; i < 4; i++) {
    const q: Vec3 = [o[0] + d[0] * gb, o[1] + d[1] * gb, o[2] + d[2] * gb];
    const t = castRay(q, d, len - gb);
    if (lastHit && lastHit.glass && t < len - gb) {
      breakGlass(lastHit);
      gb += t + 0.06;
    } else {
      break;
    }
  }
};
