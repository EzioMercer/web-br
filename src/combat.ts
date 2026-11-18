import { fireSnd, stepNoise, stepThump } from './audio';
import { bots } from './bots';
import { mkPick } from './br/pickups';
import { mark, tracer } from './effects';
import { feed } from './hud/hud';
import { canOpt } from './loadout';
import { freeSpot, groundAt, rayBox, wallT } from './physics';
import { P, V } from './player';
import { OPTK, WPN } from './weapons';
import { breakGlass } from './world/doors';
import { state } from './state';
import type { Bot } from './bots';
import type { OwnedWeapon, PickupKind, Vec3 } from './types';

/** Battle Royale: scatters a dead bot's gear around it. */
function dropLoot(b: Bot) {
  const w = b.w;
  const W = WPN[w];
  const items: [PickupKind, string?, OwnedWeapon?][] = [];
  if (!W.melee) {
    items.push(['w', w, { mag: Math.max(4, Math.round(W.mag * (0.35 + Math.random() * 0.65))), res: W.mag * (1 + Math.floor(Math.random() * 2)), opt: canOpt(w) && Math.random() < 0.3 ? OPTK[Math.random() * 3 | 0] : undefined }]);
  }
  if (!W.melee && Math.random() < 0.75) {
    items.push(['m', W.at!]);
  }
  if (Math.random() < 0.4) {
    items.push(['a']);
  }
  if (Math.random() < 0.4) {
    items.push(['h']);
  }
  if (Math.random() < 0.4) {
    items.push(['g', ['he', 'fl', 'sm'][Math.random() * 3 | 0]]);
  }
  if (Math.random() < 0.22) {
    items.push(['o', OPTK[Math.random() * 4 | 0]]);
  }
  const n = items.length;
  const a0 = Math.random() * 6.283;
  items.forEach((it, i) => {
    const a = a0 + i / n * 6.283;
    const r = 1.0 + Math.random() * 0.4;
    let x = b.x + Math.cos(a) * r;
    let z = b.z + Math.sin(a) * r;
    if (!freeSpot(x, z)) {
      x = b.x;
      z = b.z;
    }
    mkPick(x, z, it[0], it[1] ?? null, it[2], groundAt(x, z, b.y + 0.6));
  });
}

// the body stays where it fell (lying down) with its gear dropped around it
export function bodyDown(b: Bot) {
  b.corpse = true;
  b.corpseT = state.T + 150;
  b.mesh.rotation.order = 'YXZ';
  b.mesh.rotation.x = -Math.PI / 2;
  b.fy = b.y;
  b.fv = 0;
  b.y = groundAt(b.x, b.z, b.y + 0.6);
  if (b.fy < b.y) {
    b.fy = b.y;
  }
  b.mesh.position.set(b.x, b.fy + 0.2, b.z);
  b.sp.visible = false;
  dropLoot(b);
}

/** The player killed bot `b` (`hs`: with a headshot). */
export function killBot(b: Bot, hs: boolean) {
  bodyDown(b);
  feed('You eliminated ' + b.name + ' [' + WPN[b.w].name + ']' + (hs ? ' (headshot)' : ''));
}

function knifeHit() {
  state.nextFire = state.T + state.WP.rate;
  state.slashEnd = state.T + 0.3;
  stepNoise(0.22, 0.18, 1500, 0.03);
  const cp = Math.cos(state.pitch);
  const d: Vec3 = [-Math.sin(state.yaw) * cp, Math.sin(state.pitch), -Math.cos(state.yaw) * cp];
  const o: Vec3 = [P.x, P.y + state.eye, P.z];
  let best = wallT(o, d, 2.6);
  let tgt: Bot | null = null;
  if (state.HB && state.HB.glass && best < 2.6) {
    breakGlass(state.HB);
    best = 2.6;
  }
  for (const b of bots) {
    if (b.hp <= 0) {
      continue;
    }
    const t = rayBox(o, d, [b.x - 0.45, b.y, b.z - 0.45], [b.x + 0.45, b.y + 1.9, b.z + 0.45]);
    if (t < Math.min(best, 2.4)) {
      best = t;
      tgt = b;
    }
  }
  if (tgt) {
    tgt.hp -= state.WP.dmg;
    tgt.alert = 1.5;
    tgt.react = state.T + 0.15;
    state.hmT = 1;
    stepNoise(0.4, 0.08, 900, 0.004);
    stepThump(140, 70, 0.1, 0.25);
    if (tgt.hp <= 0) {
      killBot(tgt, false);
    }
  }
}

export function fire() {
  if (state.WP.melee) {
    knifeHit();
    return;
  }
  state.mag--;
  state.nextFire = state.T + state.WP.rate;
  if (state.T - state.lastShot > 0.4) {
    state.shotIdx = 0;
  }
  state.lastShot = state.T;
  const i = state.shotIdx++;
  const sp = Math.hypot(V.x, V.z);
  const bP = state.punchP;
  const bY = state.punchY;
  state.punchP += Math.min(1.25, 0.5 + i * 0.12) * 0.0175 * state.WP.rec;
  state.punchY += Math.sin(i * 0.65) * Math.min(1, i * 0.12) * 0.0175 * state.WP.rec;
  state.kick = state.WP.snp ? (state.cw === 'm82' ? 0.2 : 0.14) : state.WP.sl === 2 ? 0.05 : 0.07;
  state.flashT = 0.04;
  fireSnd();
  if (state.WP.bolt) {
    state.cycEnd = state.T + state.WP.rate;
  }
  const Y = state.yaw + bY;
  const Pp = state.pitch + bP;
  const sY = Math.sin(Y);
  const cY = Math.cos(Y);
  const sP = Math.sin(Pp);
  const cP = Math.cos(Pp);
  const o: Vec3 = [P.x, P.y + state.eye, P.z];
  for (let n = 0; n < (state.WP.pel || 1); n++) {
    const spr = state.WP.pel ? 0.04 : spread(sp);
    const a = Math.random() * 6.283;
    const r = Math.sqrt(Math.random()) * spr;
    const sx = Math.cos(a) * r;
    const sy = Math.sin(a) * r;
    const d0: Vec3 = [-sY * cP + cY * sx + sY * sP * sy, sP + cP * sy, -cY * cP - sY * sx + cY * sP * sy];
    const l = Math.hypot(...d0);
    const d: Vec3 = [d0[0] / l, d0[1] / l, d0[2] / l];
    let best = wallT(o, d);
    let tgt: Bot | null = null;
    let mult = 1;
    let gb = 0;
    for (let gi = 0; gi < 4 && state.HB && state.HB.glass && best < 1e8; gi++) {
      breakGlass(state.HB);
      gb += best + 0.06;
      best = gb + wallT([o[0] + d[0] * gb, o[1] + d[1] * gb, o[2] + d[2] * gb], d);
    }
    for (const b of bots) {
      if (b.hp <= 0) {
        continue;
      }
      const yo = b.y - 0.5 * b.cs;
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
      tgt.hp -= state.WP.dmg * mult;
      tgt.alert = 1.5;
      tgt.react = state.T + 0.15;
      state.hmT = 1;
      if (tgt.hp <= 0) {
        killBot(tgt, mult >= 4);
      }
    } else if (best < 1e8) {
      mark([e[0] - d[0] * 0.03, e[1] - d[1] * 0.03, e[2] - d[2] * 0.03]);
    }
  }
}

/** Shot spread (radians) at movement speed `sp`. */
export function spread(sp: number) {
  if (state.WP.snp) {
    return state.scoped && sp < 1 && P.g ? (state.WP.bolt ? 0.0004 : 0.0016) : 0.06;
  }
  const b = 0.0015 + sp * 0.0012 + (P.g ? 0 : 0.035) + Math.min(state.shotIdx, 10) * 0.0003;
  return state.scoped ? b * 0.6 : b;
}
