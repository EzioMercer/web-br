// @ts-nocheck -- split from the original monolith, not typed yet
import * as THREE from 'three';
import { bots } from '../bots';
import { clearPicks, mkPick, pickups, take } from './pickups';
import { bodyDown } from '../combat';
import { nade } from '../grenades';
import { gunKeys, optTarget } from '../loadout';
import { endRound } from '../modes';
import { freeSpot } from '../physics';
import { P, hurt } from '../player';
import { scene } from '../render/renderer';
import { LW1, LW2, OPT, WPN } from '../weapons';
import { MAPS } from '../world/maps';
import { state } from '../state';

export const ZN = { cx: 0, cz: 0, r: 999 };
export const BRS = [[75, 70, 0.55], [55, 60, 0.36], [45, 50, 0.22], [35, 40, 0.12], [30, 35, 0.05]];
export const zoneM = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 420, 64, 1, true), new THREE.MeshBasicMaterial({ color: 0x3a7bff, transparent: true, opacity: 0.2, side: THREE.DoubleSide, depthWrite: false }));
zoneM.visible = false;
scene.add(zoneM);

function landSpot(minD, fromP) {
  for (let i = 0; i < 300; i++) {
    const a = Math.random() * 6.283;
    const r = Math.sqrt(Math.random()) * 330;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    if (state.TERR.h(x, z) > 2 && state.TERR.slope(x, z) < 0.35 && [[0, 0], [3, 0], [-3, 0], [0, 3], [0, -3]].every(([p, q]) => freeSpot(x + p, z + q)) && (!fromP || Math.hypot(x - P.x, z - P.z) > minD)) {
      return [x, z];
    }
  }
  return [0, 0];
}

export function brSpot() {
  return landSpot(110, true);
}

export function brStart() {
  clearPicks();
  state.SPAWN = landSpot(0, false);
  const R0 = MAPS.br.half * 1.5;
  state.brZ = [];
  let pv = { cx: 0, cz: 0, r: R0 };
  for (const [hold, shrink, f] of BRS) {
    const r = R0 * f;
    let to = null;
    for (let k = 0; k < 60; k++) {
      const a = Math.random() * 6.283;
      const dd = Math.random() * (pv.r - r) * 0.85;
      const cx = pv.cx + Math.cos(a) * dd;
      const cz = pv.cz + Math.sin(a) * dd;
      if (k === 59 || state.TERR.h(cx, cz) > 1.5) {
        to = { cx, cz, r };
        break;
      }
    }
    state.brZ.push({ hold, shrink, from: pv, to });
    pv = to;
  }
  ZN.cx = 0;
  ZN.cz = 0;
  ZN.r = R0;
  state.brT0 = 0; {
    const zp = zonePhase(0);
    ZN.ph = zp.ph;
    ZN.stage = zp.st;
    ZN.left = zp.left;
    ZN.next = zp.next;
  }
  const AT = ['pst', 'smg', 'rif', 'shl', 'snp'];
  const GI = ['he', 'fl', 'sm'];
  for (const [x, z, y, tier] of MAPS.br.loot) {
    if (Math.random() > 0.74) {
      continue;
    }
    const r = Math.random();
    const t2 = tier >= 2;
    const t = r < (t2 ? 0.40 : 0.26) ? 'w' : r < (t2 ? 0.58 : 0.50) ? 'm' : r < (t2 ? 0.68 : 0.58) ? 'a' : r < (t2 ? 0.76 : 0.70) ? 'h' : r < (t2 ? 0.90 : 0.82) ? 'o' : 'g';
    mkPick(x, z, t, t === 'w' ? (t2 ? LW2 : LW1)[Math.random() * (t2 ? LW2 : LW1).length | 0] : t === 'm' ? AT[Math.random() * AT.length | 0] : t === 'g' ? GI[Math.random() * 3 | 0] : t === 'o' ? ['rd', 'rd', 'rd', 'ho', 'ho', 'x2', 'x2', 'x4'][Math.random() * 8 | 0] : null, undefined, y);
  }
}

function zonePhase(t) {
  let acc = 0;
  for (let i = 0; i < state.brZ.length; i++) {
    const q = state.brZ[i];
    if (t < acc + q.hold) {
      return { ph: 'hold', st: i + 1, left: acc + q.hold - t, next: q.to };
    }
    if (t < acc + q.hold + q.shrink) {
      return { ph: 'shrink', st: i + 1, left: acc + q.hold + q.shrink - t, next: q.to };
    }
    acc += q.hold + q.shrink;
  }
  return { ph: 'final', st: state.brZ.length, left: 0, next: null };
}

export function brTick(dt) {
  if (!state.brT0) {
    state.brT0 = state.T;
  }
  const t = state.T - state.brT0;
  let acc = 0;
  let z = null;
  let st = 0;
  for (let i = 0; i < state.brZ.length; i++) {
    const q = state.brZ[i];
    st = i;
    if (t < acc + q.hold) {
      z = q.from;
      break;
    }
    if (t < acc + q.hold + q.shrink) {
      const u = (t - acc - q.hold) / q.shrink;
      z = { cx: q.from.cx + (q.to.cx - q.from.cx) * u, cz: q.from.cz + (q.to.cz - q.from.cz) * u, r: q.from.r + (q.to.r - q.from.r) * u };
      break;
    }
    acc += q.hold + q.shrink;
  }
  if (!z) {
    z = state.brZ[state.brZ.length - 1].to;
  }
  ZN.cx = z.cx;
  ZN.cz = z.cz;
  ZN.r = z.r; {
    const zp = zonePhase(t);
    ZN.ph = zp.ph;
    ZN.stage = zp.st;
    ZN.left = zp.left;
    ZN.next = zp.next;
  }zoneM.position.set(z.cx, 150, z.cz);
  zoneM.scale.set(z.r, 1, z.r);
  const dps = 1.5 + st * 1.5;
  if (!state.dead && Math.hypot(P.x - z.cx, P.z - z.cz) > z.r) {
    hurt(dps * dt, null, true);
  }
  for (const b of bots) {
    if (b.hp > 0 && Math.hypot(b.x - z.cx, b.z - z.cz) > z.r) {
      b.hp -= dps * dt * 0.5;
      if (b.hp <= 0 && !b.corpse) {
        bodyDown(b);
      }
    }
  }
  state.brPrompt = '';
  state.brNear = null;
  let nd = 2.2;
  let hint = '';
  for (let i = pickups.length - 1; i >= 0; i--) {
    const k = pickups[i];
    k.m.rotation.y += dt * 2;
    const d = Math.hypot(P.x - k.x, P.z - k.z);
    k.lab.visible = d < 18;
    k.m.visible = d < 170;
    if (state.dead || d > 2.2 || Math.abs(P.y - k.y) > 2) {
      continue;
    }
    let ok = false;
    if (k.t === 'w') {
      if (gunKeys().length < 2 || state.owned[k.id]) {
        ok = true;
      } else if (d < nd) {
        state.brNear = k;
        nd = d;
      }
    } else if (k.t === 'o') {
      const tg = optTarget();
      if (!tg) {
        hint = 'Optics fit rifles, SMGs and shotguns – not pistols or snipers';
      } else if (!state.owned[tg].opt) {
        ok = true;
      } else if (d < nd) {
        state.brNear = k;
        nd = d;
      }
    } else if (k.t === 'a') {
      ok = state.armor < 100;
    } else if (k.t === 'm') {
      ok = Object.keys(state.owned).some(q => WPN[q].at === k.id);
    } else if (k.t === 'g') {
      ok = nade[k.id] < 2;
    } else {
      ok = state.hp < 100;
    }
    if (ok) {
      take(k);
      scene.remove(k.m);
      pickups.splice(i, 1);
    }
  }
  if (state.brNear) {
    state.brPrompt = state.brNear.t === 'o' ? 'Press E to swap ' + OPT[state.owned[optTarget()].opt].n + ' for ' + state.brNear.n : 'Press E to swap ' + WPN[state.cw !== 'knife' ? state.cw : gunKeys()[1]].name + ' for ' + state.brNear.n;
  } else if (hint) {
    state.brPrompt = hint;
  } else if (state.doorFocus && !state.cg) {
    state.brPrompt = 'Press E to ' + (state.doorFocus.tgt ? 'close' : 'open') + ' the door';
  }
  if (state.dead) {
    endRound(false, 'Eliminated');
  } else if (bots.every(b => b.hp <= 0)) {
    endRound(true);
  }
}
