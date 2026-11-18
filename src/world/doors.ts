// @ts-nocheck -- split from the original monolith, not typed yet
import * as THREE from 'three';
import { stepNoise, stepThump } from '../audio';
import { bots } from '../bots';
import { wallT } from '../physics';
import { P } from '../player';
import { scene } from '../render/renderer';
import { glassMat, unitGeo } from './level';
import { state } from '../state';

export const DR = [];
export const GL = [];
export const shards = [];
let dTick = 0;

// the door you are facing (or standing right next to), for the E key and the on-screen prompt
function findDoor() {
  if (state.dead) {
    return null;
  }
  let best = null;
  let bs = 0;
  const cp = Math.cos(state.pitch);
  const fx = -Math.sin(state.yaw) * cp;
  const fz = -Math.cos(state.yaw) * cp;
  const fl = Math.hypot(fx, fz) || 1;
  for (const d of DR) {
    const dx = d.x - P.x;
    const dz = d.z - P.z;
    const dist = Math.hypot(dx, dz);
    if (dist > 2.6 || Math.abs(P.y - d.y) > 2.4) {
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
}

// a door will not shut on somebody standing in the doorway
function doorBlocked(d) {
  const k = d.b;
  const m = 0.45;

  const hit = a => (a === P || a.hp > 0) && Math.abs(a.y - d.y) < 2.8 && a.x > k.min[0] - m && a.x < k.max[0] + m && a.z > k.min[2] - m && a.z < k.max[2] + m;

  return hit(P) || bots.some(b => b.hp > 0 && hit(b));
}

export function useDoor() {
  const d = findDoor();
  if (!d) {
    return;
  }
  if (d.tgt) {
    if (doorBlocked(d)) {
      return;
    }
    d.tgt = 0;
    d.lockP = true;
  } else {
    if (d.a < 0.02) {
      const side = d.ax === 'x' ? Math.sign(P.z - d.z) || 1 : Math.sign(P.x - d.x) || 1;
      d.sgn = d.ax === 'x' ? side : -side;
    }
    d.tgt = 1;
    d.lockP = false;
  }
  doorSnd();
}

export function doorsTick(dt) {
  if (!DR.length) {
    state.doorFocus = null;
    return;
  }
  dTick += dt;
  if (dTick < 0.05) {
    return;
  }
  const st = dTick;
  dTick = 0;
  const acts = bots.filter(b => b.hp > 0);
  if (!state.dead) {
    acts.push(P);
  }
  state.doorFocus = findDoor();
  for (const d of DR) {
    if (d.lockP && Math.hypot(P.x - d.x, P.z - d.z) > Math.sqrt(d.r2) + 0.8) {
      d.lockP = false;
    }
    if (d.tgt === 0) {
      let who = null;
      let bd = d.r2;
      for (const a of acts) {
        if (a === P && d.lockP) {
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
        if (d.a < 0.02) {
          const side = d.ax === 'x' ? Math.sign(who.z - d.z) || 1 : Math.sign(who.x - d.x) || 1;
          d.sgn = d.ax === 'x' ? side : -side;
        }
        d.tgt = 1;
        if (dx2(d)) {
          doorSnd();
        }
      }
    }
    if (d.a !== d.tgt) {
      d.a += Math.sign(d.tgt - d.a) * Math.min(Math.abs(d.tgt - d.a), st * 3.2);
      d.g.rotation.y = d.th0 + d.sgn * d.a * 1.5708;
      d.b.off = d.a > 0.5;
    }
  }
}

function dx2(d) {
  return Math.hypot(d.x - P.x, d.z - P.z) < 30;
}

function doorSnd() {
  stepThump(110, 70, 0.12, 0.12 * state.stepVol);
}

function glassSnd() {
  stepNoise(0.26 * Math.max(0.3, state.stepVol + 0.4), 0.22, 3200, 0.003);
  stepNoise(0.16, 0.18, 2200, 0.005, 0.04);
  stepThump(900, 500, 0.06, 0.04);
}

export function breakGlass(b) {
  if (b.off) {
    return;
  }
  b.off = true;
  const g = GL[b.gi];
  g.m.visible = false;
  glassSnd();
  const cx = (b.min[0] + b.max[0]) / 2;
  const cy = (b.min[1] + b.max[1]) / 2;
  const cz = (b.min[2] + b.max[2]) / 2;
  for (let i = 0; i < 8; i++) {
    const m = new THREE.Mesh(unitGeo, glassMat);
    m.scale.set(0.14, 0.14, 0.02);
    m.position.set(cx + (Math.random() - 0.5) * (b.max[0] - b.min[0]), cy + (Math.random() - 0.5) * (b.max[1] - b.min[1]), cz + (Math.random() - 0.5) * (b.max[2] - b.min[2]));
    scene.add(m);
    shards.push({ m, vx: (Math.random() - 0.5) * 3, vy: Math.random() * 2, vz: (Math.random() - 0.5) * 3, t: 1.1 });
  }
}

export function shatter(o, d, len) {
  let gb = 0;
  for (let i = 0; i < 4; i++) {
    const q = [o[0] + d[0] * gb, o[1] + d[1] * gb, o[2] + d[2] * gb];
    const t = wallT(q, d, len - gb);
    if (state.HB && state.HB.glass && t < len - gb) {
      breakGlass(state.HB);
      gb += t + 0.06;
    } else {
      break;
    }
  }
}
