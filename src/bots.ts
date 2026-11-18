import * as THREE from 'three';
import { snd, stepSnd } from './audio';
import { ZN, brSpot } from './br/zone';
import { H } from './config';
import { ripple, tracer } from './effects';
import { clear, move, rayBox, wallT } from './physics';
import { P, V, hurt } from './player';
import { scene, srgbTex } from './render/renderer';
import { WPN } from './weapons';
import { shatter } from './world/doors';
import { floorY, surfAt, waterF } from './world/level';
import { state } from './state';
import type { Vec3, Vel } from './types';

export interface Bot {
  id: number;
  name: string;
  mesh: THREE.Group;
  /** Upper body, legs and knees, animated when walking and crouching. */
  up: THREE.Group;
  legs: THREE.Group[];
  knees: THREE.Group[];
  gunG: THREE.Group;
  /** Name label: canvas, texture and sprite. */
  cv: HTMLCanvasElement;
  tex: THREE.CanvasTexture;
  sp: THREE.Sprite;
  /** Label visible until this time. */
  lab: number;
  x: number;
  y: number;
  z: number;
  g: boolean;
  h?: number;
  v: Vel;
  hp: number;
  /** Weapon id. */
  w: string;
  /** Walk target. */
  tx: number;
  tz: number;
  /** Seconds left of awareness of the player. */
  alert: number;
  /** Next allowed shot time. */
  cool: number;
  /** Earliest time to shoot after spotting the player. */
  react: number;
  /** Seconds spent not moving toward the target. */
  stuck: number;
  /** Blinded by a flashbang until this time. */
  blind: number;
  /** Running for the Battle Royale zone. */
  run: boolean;
  /** Sidestep around an obstacle until `detour`, turning by sign `dsg`. */
  detour: number;
  dsg: number;
  /** Walk phase, crouch target (0/1), crouch amount and next crouch decision time. */
  ph: number;
  cr: number;
  cs: number;
  crT: number;
  /** Distance since the last footstep. */
  sd: number;
  /** Lying dead: falls from height `fy` at speed `fv`, hidden at `corpseT`. */
  corpse: boolean;
  corpseT: number;
  fy: number;
  fv: number;
}

const PAL = [0x6b5a3a, 0x3b3f45, 0x5a3a32, 0x39503f, 0x4a4a2e];
const BW = ['rifle', 'rifle', 'm4', 'm4', 'mp5', 'p90', 'awp', 'scout', 'svd', 'm3', 'glock', 'deagle', 'pistol'];

/** Builds the bot model into `g` and returns its animated parts and name label. */
function mkBot(id: number, g: THREE.Group, legs: THREE.Group[], knees: THREE.Group[]) {
  const mat = (c: number) => new THREE.MeshLambertMaterial({ color: c });

  const c = PAL[id % 5];
  const skin = 0xd9a77d;
  const dk = 0x24262a;
  const vest = 0x2e3a33;
  const U = new THREE.Group();
  g.add(U);

  const add = (p: THREE.Object3D, w: number, h: number, d: number, x: number, y: number, z: number, col: number) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(col));
    m.position.set(x, y, z);
    p.add(m);
    return m;
  };

  add(U, 0.5, 0.2, 0.28, 0, 0.92, 0, dk);
  add(U, 0.5, 0.5, 0.3, 0, 1.2, 0, c);
  add(U, 0.52, 0.38, 0.12, 0, 1.22, 0.13, vest);
  add(U, 0.52, 0.3, 0.1, 0, 1.25, -0.13, vest);
  add(U, 0.1, 0.1, 0.08, -0.15, 1.08, 0.2, dk);
  add(U, 0.1, 0.1, 0.08, 0.15, 1.08, 0.2, dk);
  add(U, 0.12, 0.08, 0.12, 0, 1.47, 0, skin);
  add(U, 0.24, 0.26, 0.24, 0, 1.62, 0, dk);
  add(U, 0.2, 0.06, 0.02, 0, 1.64, 0.125, skin);
  add(U, 0.27, 0.07, 0.27, 0, 1.77, 0, c);
  add(U, 0.27, 0.04, 0.1, 0, 1.74, 0.17, c);
  for (const s of [-1, 1]) {
    const L = new THREE.Group();
    L.position.set(s * 0.13, 0.88, 0);
    g.add(L);
    add(L, 0.18, 0.44, 0.21, 0, -0.22, 0, c);
    const K = new THREE.Group();
    K.position.y = -0.44;
    L.add(K);
    add(K, 0.15, 0.4, 0.18, 0, -0.2, 0, c);
    add(K, 0.17, 0.1, 0.27, 0, -0.42, 0.04, dk);
    add(K, 0.19, 0.06, 0.2, 0, -0.12, 0.02, vest);
    legs.push(L);
    knees.push(K);
    const A = new THREE.Group();
    A.position.set(s * 0.32, 1.4, 0);
    A.rotation.set(-1.15, 0, -s * 0.25);
    U.add(A);
    add(A, 0.13, 0.3, 0.15, 0, -0.15, 0, c);
    const F = new THREE.Group();
    F.position.y = -0.3;
    F.rotation.x = -0.3;
    A.add(F);
    add(F, 0.11, 0.28, 0.13, 0, -0.14, 0, c);
    add(F, 0.11, 0.09, 0.11, 0, -0.31, 0, dk);
  }
  const gunG = new THREE.Group();
  gunG.position.set(0, 1.18, 0.3);
  U.add(gunG);
  const cv = document.createElement('canvas');
  cv.width = 256;
  cv.height = 64;
  const tex = srgbTex(new THREE.CanvasTexture(cv));
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
  sp.scale.set(1.6, 0.4, 1);
  sp.position.set(0, 2.15, 0);
  sp.visible = false;
  U.add(sp);
  return { up: U, gunG, cv, tex, sp };
}

function botGun(b: Bot) {
  const G = b.gunG;
  while (G.children.length) {
    G.remove(G.children[0]);
  }
  const w = b.w;
  const W = WPN[w];

  const add = (sx: number, sy: number, sz: number, z: number, y: number, c: number) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), new THREE.MeshLambertMaterial({ color: c }));
    m.position.set(0, y, z);
    G.add(m);
  };

  if (W.snp) {
    const L = w === 'm82' ? 0.95 : w === 'scout' ? 0.6 : 0.75;
    add(0.07, 0.1, L, 0, 0, 0x3d4a36);
    add(0.03, 0.03, L * 0.7, L * 0.8, 0.02, 0x1d2024);
    add(0.06, 0.06, 0.3, 0, 0.09, 0x1d2024);
  } else if (W.pel) {
    add(0.07, 0.09, 0.6, 0.1, 0, 0x2a1c10);
    add(0.04, 0.04, 0.35, 0.5, 0.02, 0x1d2024);
  } else if (W.melee) {
    add(0.025, 0.07, 0.3, 0.2, 0, 0xb9c0c6);
    add(0.03, 0.04, 0.1, 0.02, 0, 0x2a2420);
  } else if (W.sl === 2) {
    add(0.05, 0.08, 0.22, 0.05, 0, 0x3a3f44);
  } else if (W.rate < 0.1) {
    add(0.06, 0.09, 0.4, 0.05, 0, 0x1c1e20);
    add(0.04, 0.12, 0.05, 0, -0.1, 0x1c1e20);
  } else {
    add(0.06, 0.09, 0.5, 0.1, 0, w === 'rifle' ? 0x3a3f44 : 0x25282b);
    add(0.07, 0.07, 0.25, 0.4, 0, 0x6b4a2a);
    add(0.04, 0.14, 0.07, 0.05, -0.1, 0x1d2024);
  }
}

function drawLabel(b: Bot) {
  const x = b.cv.getContext('2d')!;
  x.clearRect(0, 0, 256, 64);
  x.font = 'bold 30px sans-serif';
  x.textAlign = 'center';
  x.lineWidth = 5;
  x.strokeStyle = '#000';
  const t = b.name + ' · ' + WPN[b.w].name;
  x.strokeText(t, 128, 40);
  x.fillStyle = '#ffcf5a';
  x.fillText(t, 128, 40);
  b.tex.needsUpdate = true;
}

export function aimLabels() {
  if (state.dead) {
    return;
  }
  const cp = Math.cos(state.pitch);
  const d: Vec3 = [-Math.sin(state.yaw) * cp, Math.sin(state.pitch), -Math.cos(state.yaw) * cp];
  const o: Vec3 = [P.x, P.y + state.eye, P.z];
  const wt = wallT(o, d);
  for (const b of bots) {
    if (b.hp > 0 && rayBox(o, d, [b.x - 0.35, b.y, b.z - 0.35], [b.x + 0.35, b.y + 1.9, b.z + 0.35]) < wt) {
      b.lab = state.T + 0.6;
    }
    b.sp.visible = b.hp > 0 && state.T < b.lab;
  }
}

export function setBotWeapon(b: Bot, w: string) {
  b.w = w;
  botGun(b);
  drawLabel(b);
}

export const bots: Bot[] = [];

export function addBot(i: number) {
  const g = new THREE.Group();
  scene.add(g);
  const legs: THREE.Group[] = [];
  const knees: THREE.Group[] = [];
  const parts = mkBot(i, g, legs, knees);
  const b: Bot = {
    id: i,
    name: 'Bot ' + (i + 1),
    mesh: g,
    legs,
    knees,
    ...parts,
    lab: 0,
    x: 0,
    y: 0,
    z: 0,
    g: true,
    v: { x: 0, y: 0, z: 0 },
    hp: 100,
    w: 'rifle',
    tx: 0,
    tz: 0,
    alert: 0,
    cool: 0,
    react: 0,
    stuck: 0,
    blind: 0,
    run: false,
    detour: 0,
    dsg: 1,
    ph: 0,
    cr: 0,
    cs: 0,
    crT: 0,
    sd: 0,
    corpse: false,
    corpseT: 0,
    fy: 0,
    fv: 0,
  };
  bots.push(b);
}

/** A new walk target: somewhere dry in the (next) zone, sometimes near the player. */
function pickWP(b: Bot) {
  const zt = ZN.next || ZN;
  for (let k = 0; k < 14; k++) {
    const a = Math.random() * 6.283;
    const r = Math.sqrt(Math.random()) * zt.r * 0.8;
    b.tx = zt.cx + Math.cos(a) * r;
    b.tz = zt.cz + Math.sin(a) * r;
    if (state.TERR!.h(b.tx, b.tz) > 1.5) {
      break;
    }
  }
  if (!b.run && Math.random() < 0.35 && Math.hypot(P.x - b.x, P.z - b.z) < 120) {
    b.tx = P.x + (Math.random() - 0.5) * 12;
    b.tz = P.z + (Math.random() - 0.5) * 12;
  }
}

/** Drops bot `b` at a random spot with full health and a random weapon. */
export function respawnBot(b: Bot) {
  const w = brSpot();
  b.x = w[0] + (Math.random() - 0.5) * 0.6;
  b.z = w[1];
  b.y = floorY(b.x, b.z);
  b.hp = 100 * state.D.hp;
  b.mesh.position.set(b.x, b.y, b.z);
  b.mesh.rotation.x = 0;
  b.corpse = false;
  b.mesh.visible = true;
  b.alert = 0;
  b.cr = 0;
  b.cs = 0;
  b.h = H;
  b.crT = 0;
  b.lab = 0;
  setBotWeapon(b, BW[Math.random() * BW.length | 0]);
  pickWP(b);
}

export function botsTick(dt: number) {
  for (const b of bots) {
    if (b.hp <= 0) {
      if (b.corpse && b.fy > b.y + 0.005) {
        b.fv -= 20 * dt;
        b.fy = Math.max(b.y, b.fy + b.fv * dt);
        b.mesh.position.set(b.x, b.fy + 0.2, b.z);
      } // a body that dies in mid-air falls to the ground
      if (b.corpse && state.T > b.corpseT) {
        b.mesh.visible = false;
        b.corpse = false;
      }
      continue;
    }
    let run = false;
    if (state.phase === 'live') {
      const zt = ZN.next || ZN;
      const dn = Math.hypot(b.x - zt.cx, b.z - zt.cz) - zt.r;
      const d0 = Math.hypot(b.x - ZN.cx, b.z - ZN.cz) - ZN.r;
      run = d0 > -10 || (ZN.ph === 'shrink' && dn > -6) || (ZN.ph === 'hold' && ZN.left < 45 && dn > -12);
    }
    b.run = run;
    const ey = b.y + 1.6 - 0.5 * b.cs;
    const o: Vec3 = [b.x, ey, b.z];
    const dx = P.x - b.x;
    const dy = P.y + 1.2 - ey;
    const dz = P.z - b.z;
    const dist = Math.hypot(dx, dy, dz);
    let sees = false;
    if (!state.dead && dist < 50 && state.T >= (b.blind || 0)) {
      const da = Math.atan2(dx, dz) - b.mesh.rotation.y;
      const ang = Math.abs(((da + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI);
      sees = (b.alert > 0 || dist < 8 || ang < state.D.fov) && clear(o, [P.x, P.y + state.eye, P.z]) && clear(o, [P.x, P.y + state.eye * 0.65, P.z]);
    }
    if (sees) {
      if (b.alert <= 0) {
        b.react = state.T + (0.35 + Math.random() * 0.3) * state.D.react;
      }
      b.alert = 1.2 * state.D.mem;
    } else {
      b.alert -= dt;
    }
    const px = b.x;
    const pz = b.z;
    if (b.alert > 0 && !state.dead && !(b.run && dist > 14)) {
      b.mesh.rotation.y = Math.atan2(dx, dz);
      const st = Math.sin(state.T * 1.7 + b.id * 2) * 2;
      const rx = Math.cos(b.mesh.rotation.y);
      const rz = -Math.sin(b.mesh.rotation.y);
      const sm = b.cr ? 0.25 : 1;
      b.v.x = rx * st * sm;
      b.v.z = rz * st * sm;
      if (WPN[b.w].melee && dist > 1.6) {
        const hd = Math.hypot(dx, dz) || 1;
        b.v.x = dx / hd * 4.2 * state.D.spd;
        b.v.z = dz / hd * 4.2 * state.D.spd;
      }
      if (!b.cr && b.g && dist > 5 && Math.random() < dt * 0.4) {
        b.v.y = 7;
      }
      if (state.T >= b.crT) {
        b.crT = state.T + 1 + Math.random() * 2.5;
        b.cr = sees && Math.random() < 0.4 ? 1 : 0;
      }
      if (sees && state.T >= b.react && state.T >= b.cool && (!WPN[b.w].melee || dist < 2.8)) {
        b.cool = state.T + Math.max(0.1, WPN[b.w].rate * 1.6 * state.D.cool) + Math.random() * 0.15 * state.D.cool;
        const hc = state.D.acc * Math.max(0.12, 0.7 - dist * 0.012) * (Math.hypot(V.x, V.z) > 3 ? 0.6 : 1) * (P.h < H ? 0.8 : 1) * (b.g ? 1 : 0.7);
        const hit = Math.random() < Math.min(0.95, hc);
        const m = hit ? 0 : 1.8;
        const tp: Vec3 = [P.x + (Math.random() - 0.5) * m, P.y + 1.1 + (Math.random() - 0.5) * m, P.z + (Math.random() - 0.5) * m];
        const o2: Vec3 = [b.x, b.y + 1.3, b.z];
        const ex = tp[0] - o2[0];
        const ey = tp[1] - o2[1];
        const ez = tp[2] - o2[2];
        const el = Math.hypot(ex, ey, ez);
        const wt = Math.min(el, wallT(o2, [ex / el, ey / el, ez / el], el));
        shatter(o2, [ex / el, ey / el, ez / el], el);
        tracer(o2, [o2[0] + ex / el * wt, o2[1] + ey / el * wt, o2[2] + ez / el * wt], 0xff7a55);
        snd((WPN[b.w].snp ? 0.6 : 0.22) / (1 + dist * 0.12), WPN[b.w].snp ? 0.4 : 0.12, WPN[b.w].snp ? 900 : 1500);
        if (hit) {
          hurt(Math.min(60, WPN[b.w].dmg * 0.3 * state.D.dmg) * (0.8 + Math.random() * 0.4) * (WPN[b.w].pel ? 2 : 1), b);
        }
      }
    } else {
      b.cr = 0;
      const wx = b.tx - b.x;
      const wz = b.tz - b.z;
      const wd = Math.hypot(wx, wz);
      const zt2 = ZN.next || ZN;
      const badT = Math.hypot(b.tx - ZN.cx, b.tz - ZN.cz) > ZN.r || (b.run && Math.hypot(b.tx - zt2.cx, b.tz - zt2.cz) > zt2.r);
      if (wd < 1.5 || badT) {
        pickWP(b);
        b.stuck = 0;
      } else if (b.stuck > 0.45) {
        b.detour = state.T + 1.5;
        b.dsg = Math.random() < 0.5 ? -1 : 1;
        if (Math.random() < 0.3) {
          pickWP(b);
        }

        b.stuck = 0;
      } else {
        if (b.stuck > 0.12 && b.g) {
          b.v.y = 7;
        }
        let ux = wx / wd;
        let uz = wz / wd;
        if (state.T < (b.detour || 0)) {
          const a = b.dsg * 1.1;
          const c = Math.cos(a);
          const s2 = Math.sin(a);
          const tx = ux * c - uz * s2;
          uz = ux * s2 + uz * c;
          ux = tx;
        }
        const sp = 3.4 * state.D.spd * (b.run ? 1.7 : 1);
        b.v.x = ux * sp;
        b.v.z = uz * sp;
        b.mesh.rotation.y = Math.atan2(ux, uz);
      }
    }
    b.v.y -= 20 * dt; {
      const wf = waterF(b.x, b.z, b.y);
      if (wf > 0) {
        b.v.x *= 1 - 0.45 * wf;
        b.v.z *= 1 - 0.45 * wf;
      }
    }
    move(b, b.v, dt);

    if (b.g && !b.cr) {
      b.sd = (b.sd || 0) + Math.hypot(b.v.x, b.v.z) * dt;
      if (b.sd > 1.9) {
        b.sd = 0;
        const d0 = Math.hypot(b.x - P.x, b.z - P.z);
        if (d0 < 35) {
          stepSnd(surfAt(b.x, b.z, b.y), Math.max(0, 1 - d0 / 35) * 0.9);
          if (waterF(b.x, b.z, b.y) > 0) {
            ripple(b.x, b.z);
          }
        }
      }
    }
    {
      const spd = Math.hypot(b.v.x, b.v.z);
      b.cs += ((b.cr ? 1 : 0) - b.cs) * Math.min(1, dt * 10);
      const c = b.cs;
      b.h = c > 0.5 ? 1.2 : H;
      b.ph += spd * dt * 2.4;
      const sw = Math.sin(b.ph) * Math.min(1, spd / 3) * 0.7 * (b.g ? 1 : 0.3) * (1 - c);
      b.up.position.y = -0.46 * c;
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
}
