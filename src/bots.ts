import * as THREE from 'three';
import { noiseBurst, footstep } from './audio';
import { zone, botDropSpot } from './br/zone';
import { PLAYER_HEIGHT } from './config';
import { ripple, tracer } from './effects';
import { lineOfSight, moveBody, rayBox, castRay } from './physics';
import { damagePlayer, playerBody, player, playerVel } from './player';
import { scene, srgbTex } from './render/renderer';
import { WEAPONS } from './weapons';
import { shatter } from './world/doors';
import { floorY, surfaceAt, terrain, waterDepth } from './world/level';
import { simTime } from './sim';
import { settings } from './settings';
import { phase } from './match';
import type { Vec3, Velocity } from './types';

export interface Bot {
  id: number;
  name: string;
  mesh: THREE.Group;
  /** Upper body, legs and knees, animated when walking and crouching. */
  upperBody: THREE.Group;
  legs: THREE.Group[];
  knees: THREE.Group[];
  gunGroup: THREE.Group;
  /** Name label: canvas, texture and sprite. */
  labelCanvas: HTMLCanvasElement;
  labelTexture: THREE.CanvasTexture;
  labelSprite: THREE.Sprite;
  /** Label visible until this time. */
  labelUntil: number;
  x: number;
  y: number;
  z: number;
  onGround: boolean;
  height?: number;
  vel: Velocity;
  health: number;
  /** Weapon id. */
  weaponId: string;
  /** Walk target. */
  targetX: number;
  targetZ: number;
  /** Seconds left of awareness of the player. */
  alert: number;
  /** Next allowed shot time. */
  nextShotAt: number;
  /** Earliest time to shoot after spotting the player. */
  reactAt: number;
  /** Seconds spent not moving toward the target. */
  stuck: number;
  /** Blinded by a flashbang until this time. */
  blindUntil: number;
  /** Running for the Battle Royale zone. */
  running: boolean;
  /** Sidestep around an obstacle until `detourUntil`, turning by sign `detourDir`. */
  detourUntil: number;
  detourDir: number;
  /** Walk phase, crouch target (0/1), crouch amount and next crouch decision time. */
  walkPhase: number;
  crouch: number;
  crouchAmount: number;
  nextCrouchAt: number;
  /** Distance since the last footstep. */
  stepDist: number;
  /** Lying dead: falls from height `fallY` at speed `fallVel`, hidden at `corpseUntil`. */
  corpse: boolean;
  corpseUntil: number;
  fallY: number;
  fallVel: number;
}

const PALETTE = [0x6b5a3a, 0x3b3f45, 0x5a3a32, 0x39503f, 0x4a4a2e];
const BOT_WEAPONS = ['rifle', 'rifle', 'm4', 'm4', 'mp5', 'p90', 'awp', 'scout', 'svd', 'm3', 'glock', 'deagle', 'pistol'];

/** Builds the bot model into `g` and returns its animated parts and name label. */
function buildBotModel(id: number, g: THREE.Group, legs: THREE.Group[], knees: THREE.Group[]): Pick<Bot, 'upperBody' | 'gunGroup' | 'labelCanvas' | 'labelTexture' | 'labelSprite'> {
  const mat = (c: number) => new THREE.MeshLambertMaterial({ color: c });

  const c = PALETTE[id % 5];
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
  return { upperBody: U, gunGroup: gunG, labelCanvas: cv, labelTexture: tex, labelSprite: sp };
}

function buildBotGun(b: Bot) {
  const G = b.gunGroup;
  while (G.children.length) {
    G.remove(G.children[0]);
  }
  const w = b.weaponId;
  const W = WEAPONS[w];

  const add = (sx: number, sy: number, sz: number, z: number, y: number, c: number) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), new THREE.MeshLambertMaterial({ color: c }));
    m.position.set(0, y, z);
    G.add(m);
  };

  if (W.sniper) {
    const L = w === 'm82' ? 0.95 : w === 'scout' ? 0.6 : 0.75;
    add(0.07, 0.1, L, 0, 0, 0x3d4a36);
    add(0.03, 0.03, L * 0.7, L * 0.8, 0.02, 0x1d2024);
    add(0.06, 0.06, 0.3, 0, 0.09, 0x1d2024);
  } else if (W.pellets) {
    add(0.07, 0.09, 0.6, 0.1, 0, 0x2a1c10);
    add(0.04, 0.04, 0.35, 0.5, 0.02, 0x1d2024);
  } else if (W.melee) {
    add(0.025, 0.07, 0.3, 0.2, 0, 0xb9c0c6);
    add(0.03, 0.04, 0.1, 0.02, 0, 0x2a2420);
  } else if (W.slot === 2) {
    add(0.05, 0.08, 0.22, 0.05, 0, 0x3a3f44);
  } else if (W.fireInterval < 0.1) {
    add(0.06, 0.09, 0.4, 0.05, 0, 0x1c1e20);
    add(0.04, 0.12, 0.05, 0, -0.1, 0x1c1e20);
  } else {
    add(0.06, 0.09, 0.5, 0.1, 0, w === 'rifle' ? 0x3a3f44 : 0x25282b);
    add(0.07, 0.07, 0.25, 0.4, 0, 0x6b4a2a);
    add(0.04, 0.14, 0.07, 0.05, -0.1, 0x1d2024);
  }
}

function drawLabel(b: Bot) {
  const x = b.labelCanvas.getContext('2d')!;
  x.clearRect(0, 0, 256, 64);
  x.font = 'bold 30px sans-serif';
  x.textAlign = 'center';
  x.lineWidth = 5;
  x.strokeStyle = '#000';
  const t = b.name + ' · ' + WEAPONS[b.weaponId].name;
  x.strokeText(t, 128, 40);
  x.fillStyle = '#ffcf5a';
  x.fillText(t, 128, 40);
  b.labelTexture.needsUpdate = true;
}

export function aimLabels() {
  if (player.dead) {
    return;
  }
  const cp = Math.cos(player.pitch);
  const d: Vec3 = [-Math.sin(player.yaw) * cp, Math.sin(player.pitch), -Math.cos(player.yaw) * cp];
  const o: Vec3 = [playerBody.x, playerBody.y + player.eyeHeight, playerBody.z];
  const wt = castRay(o, d);
  for (const b of bots) {
    if (b.health > 0 && rayBox(o, d, [b.x - 0.35, b.y, b.z - 0.35], [b.x + 0.35, b.y + 1.9, b.z + 0.35]) < wt) {
      b.labelUntil = simTime + 0.6;
    }
    b.labelSprite.visible = b.health > 0 && simTime < b.labelUntil;
  }
}

export function setBotWeapon(b: Bot, w: string) {
  b.weaponId = w;
  buildBotGun(b);
  drawLabel(b);
}

export const bots: Bot[] = [];

export function addBot(i: number) {
  const g = new THREE.Group();
  scene.add(g);
  const legs: THREE.Group[] = [];
  const knees: THREE.Group[] = [];
  const parts = buildBotModel(i, g, legs, knees);
  const b: Bot = {
    id: i,
    name: 'Bot ' + (i + 1),
    mesh: g,
    legs,
    knees,
    ...parts,
    labelUntil: 0,
    x: 0,
    y: 0,
    z: 0,
    onGround: true,
    vel: { x: 0, y: 0, z: 0 },
    health: 100,
    weaponId: 'rifle',
    targetX: 0,
    targetZ: 0,
    alert: 0,
    nextShotAt: 0,
    reactAt: 0,
    stuck: 0,
    blindUntil: 0,
    running: false,
    detourUntil: 0,
    detourDir: 1,
    walkPhase: 0,
    crouch: 0,
    crouchAmount: 0,
    nextCrouchAt: 0,
    stepDist: 0,
    corpse: false,
    corpseUntil: 0,
    fallY: 0,
    fallVel: 0,
  };
  bots.push(b);
}

/** A new walk target: somewhere dry in the (next) zone, sometimes near the player. */
function pickWaypoint(b: Bot) {
  const zt = zone.next || zone;
  for (let k = 0; k < 14; k++) {
    const a = Math.random() * 6.283;
    const r = Math.sqrt(Math.random()) * zt.radius * 0.8;
    b.targetX = zt.cx + Math.cos(a) * r;
    b.targetZ = zt.cz + Math.sin(a) * r;
    if (terrain!.height(b.targetX, b.targetZ) > 1.5) {
      break;
    }
  }
  if (!b.running && Math.random() < 0.35 && Math.hypot(playerBody.x - b.x, playerBody.z - b.z) < 120) {
    b.targetX = playerBody.x + (Math.random() - 0.5) * 12;
    b.targetZ = playerBody.z + (Math.random() - 0.5) * 12;
  }
}

/** Drops bot `b` at a random spot with full health and a random weapon. */
export function respawnBot(b: Bot) {
  const w = botDropSpot();
  b.x = w[0] + (Math.random() - 0.5) * 0.6;
  b.z = w[1];
  b.y = floorY(b.x, b.z);
  b.health = 100 * settings.difficulty.health;
  b.mesh.position.set(b.x, b.y, b.z);
  b.mesh.rotation.x = 0;
  b.corpse = false;
  b.mesh.visible = true;
  b.alert = 0;
  b.crouch = 0;
  b.crouchAmount = 0;
  b.height = PLAYER_HEIGHT;
  b.nextCrouchAt = 0;
  b.labelUntil = 0;
  setBotWeapon(b, BOT_WEAPONS[Math.random() * BOT_WEAPONS.length | 0]);
  pickWaypoint(b);
}

export function botsTick(dt: number) {
  for (const b of bots) {
    if (b.health <= 0) {
      if (b.corpse && b.fallY > b.y + 0.005) {
        b.fallVel -= 20 * dt;
        b.fallY = Math.max(b.y, b.fallY + b.fallVel * dt);
        b.mesh.position.set(b.x, b.fallY + 0.2, b.z);
      } // a body that dies in mid-air falls to the ground
      if (b.corpse && simTime > b.corpseUntil) {
        b.mesh.visible = false;
        b.corpse = false;
      }
      continue;
    }
    let run = false;
    if (phase === 'live') {
      const zt = zone.next || zone;
      const dn = Math.hypot(b.x - zt.cx, b.z - zt.cz) - zt.radius;
      const d0 = Math.hypot(b.x - zone.cx, b.z - zone.cz) - zone.radius;
      run = d0 > -10 || (zone.phase === 'shrink' && dn > -6) || (zone.phase === 'hold' && zone.timeLeft < 45 && dn > -12);
    }
    b.running = run;
    const ey = b.y + 1.6 - 0.5 * b.crouchAmount;
    const o: Vec3 = [b.x, ey, b.z];
    const dx = playerBody.x - b.x;
    const dy = playerBody.y + 1.2 - ey;
    const dz = playerBody.z - b.z;
    const dist = Math.hypot(dx, dy, dz);
    let sees = false;
    if (!player.dead && dist < 50 && simTime >= (b.blindUntil || 0)) {
      const da = Math.atan2(dx, dz) - b.mesh.rotation.y;
      const ang = Math.abs(((da + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI);
      sees = (b.alert > 0 || dist < 8 || ang < settings.difficulty.viewAngle) && lineOfSight(o, [playerBody.x, playerBody.y + player.eyeHeight, playerBody.z]) && lineOfSight(o, [playerBody.x, playerBody.y + player.eyeHeight * 0.65, playerBody.z]);
    }
    if (sees) {
      if (b.alert <= 0) {
        b.reactAt = simTime + (0.35 + Math.random() * 0.3) * settings.difficulty.reactionTime;
      }
      b.alert = 1.2 * settings.difficulty.memory;
    } else {
      b.alert -= dt;
    }
    const px = b.x;
    const pz = b.z;
    if (b.alert > 0 && !player.dead && !(b.running && dist > 14)) {
      b.mesh.rotation.y = Math.atan2(dx, dz);
      const st = Math.sin(simTime * 1.7 + b.id * 2) * 2;
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
      if (simTime >= b.nextCrouchAt) {
        b.nextCrouchAt = simTime + 1 + Math.random() * 2.5;
        b.crouch = sees && Math.random() < 0.4 ? 1 : 0;
      }
      if (sees && simTime >= b.reactAt && simTime >= b.nextShotAt && (!WEAPONS[b.weaponId].melee || dist < 2.8)) {
        b.nextShotAt = simTime + Math.max(0.1, WEAPONS[b.weaponId].fireInterval * 1.6 * settings.difficulty.fireDelay) + Math.random() * 0.15 * settings.difficulty.fireDelay;
        const hc = settings.difficulty.accuracy * Math.max(0.12, 0.7 - dist * 0.012) * (Math.hypot(playerVel.x, playerVel.z) > 3 ? 0.6 : 1) * (playerBody.height < PLAYER_HEIGHT ? 0.8 : 1) * (b.onGround ? 1 : 0.7);
        const hit = Math.random() < Math.min(0.95, hc);
        const m = hit ? 0 : 1.8;
        const tp: Vec3 = [playerBody.x + (Math.random() - 0.5) * m, playerBody.y + 1.1 + (Math.random() - 0.5) * m, playerBody.z + (Math.random() - 0.5) * m];
        const o2: Vec3 = [b.x, b.y + 1.3, b.z];
        const ex = tp[0] - o2[0];
        const ey = tp[1] - o2[1];
        const ez = tp[2] - o2[2];
        const el = Math.hypot(ex, ey, ez);
        const wt = Math.min(el, castRay(o2, [ex / el, ey / el, ez / el], el));
        shatter(o2, [ex / el, ey / el, ez / el], el);
        tracer(o2, [o2[0] + ex / el * wt, o2[1] + ey / el * wt, o2[2] + ez / el * wt], 0xff7a55);
        noiseBurst((WEAPONS[b.weaponId].sniper ? 0.6 : 0.22) / (1 + dist * 0.12), WEAPONS[b.weaponId].sniper ? 0.4 : 0.12, WEAPONS[b.weaponId].sniper ? 900 : 1500);
        if (hit) {
          damagePlayer(Math.min(60, WEAPONS[b.weaponId].damage * 0.3 * settings.difficulty.damage) * (0.8 + Math.random() * 0.4) * (WEAPONS[b.weaponId].pellets ? 2 : 1), b);
        }
      }
    } else {
      b.crouch = 0;
      const wx = b.targetX - b.x;
      const wz = b.targetZ - b.z;
      const wd = Math.hypot(wx, wz);
      const zt2 = zone.next || zone;
      const badT = Math.hypot(b.targetX - zone.cx, b.targetZ - zone.cz) > zone.radius || (b.running && Math.hypot(b.targetX - zt2.cx, b.targetZ - zt2.cz) > zt2.radius);
      if (wd < 1.5 || badT) {
        pickWaypoint(b);
        b.stuck = 0;
      } else if (b.stuck > 0.45) {
        b.detourUntil = simTime + 1.5;
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
        if (simTime < (b.detourUntil || 0)) {
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
}
