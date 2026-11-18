// @ts-nocheck -- split from the original monolith, not typed yet
import * as THREE from 'three';
import { nade } from '../grenades';
import { feed } from '../hud/hud';
import { giveW, gunKeys, optTarget, swapOpt } from '../loadout';
import { scene, srgbTex } from '../render/renderer';
import { VM, bx, cy, mt } from '../viewmodel';
import { NC, OPT, WPN } from '../weapons';
import { floorY } from '../world/level';
import { state } from '../state';

export const pickups = [];

function mkLabel(text, col) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 64;
  const x = c.getContext('2d');
  x.font = 'bold 30px sans-serif';
  x.textAlign = 'center';
  x.lineWidth = 5;
  x.strokeStyle = '#000';
  x.strokeText(text, 128, 40);
  x.fillStyle = col;
  x.fillText(text, 128, 40);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: srgbTex(new THREE.CanvasTexture(c)), transparent: true }));
  sp.scale.set(2.4, 0.6, 1);
  return sp;
}

const AMN = { pst: 'Pistol ammo', smg: 'SMG ammo', rif: 'Rifle ammo', shl: 'Shotgun shells', snp: 'Sniper ammo' };
const GN = { he: 'HE grenade', fl: 'Flashbang', sm: 'Smoke grenade' };

export function mkPick(x, z, t, id, st, y0) {
  const col = t === 'w' ? 0xf2a23a : t === 'a' ? 0x4a8cff : t === 'm' ? 0xd9d046 : t === 'g' ? 0xe05a3a : t === 'o' ? 0xb98cff : 0x4ad66a;
  const g = new THREE.Group();
  const it = new THREE.Group();
  const n = t === 'w' ? WPN[id].name + (st && st.opt ? ' + ' + OPT[st.opt].s : '') : t === 'a' ? 'Kevlar vest' : t === 'm' ? AMN[id] : t === 'g' ? GN[id] : t === 'o' ? OPT[id].n : 'Medkit';
  if (t === 'w') {
    const m = VM[id].clone(true);
    m.visible = true;
    m.position.set(0, 0, 0);
    m.rotation.set(0, 0, 0);
    m.scale.setScalar(WPN[id].sl === 2 ? 2.4 : 1.4);
    it.add(m);
    it.position.y = 0.95;
  } else if (t === 'a') {
    const b = mt(0x2f5fb8);
    bx(it, 0.5, 0.6, 0.3, 0, 0, 0, b);
    bx(it, 0.38, 0.4, 0.05, 0, 0, 0.17, mt(0x1c2a44));
    bx(it, 0.12, 0.2, 0.32, -0.17, 0.38, 0, b);
    bx(it, 0.12, 0.2, 0.32, 0.17, 0.38, 0, b);
    it.position.y = 0.7;
  } else if (t === 'm') {
    bx(it, 0.55, 0.28, 0.36, 0, 0, 0, mt(0x55603a));
    for (const i of [-1, 0, 1]) {
      cy(it, 0.05, 0.22, i * 0.14, 0.2, 0, mt(0xc9a227));
    }
    it.position.y = 0.45;
  } else if (t === 'o') {
    const m = window.mkOptic(id);
    m.scale.setScalar(4.2);
    m.visible = true;
    it.add(m);
    it.position.y = 0.5;
  } else if (t === 'g') {
    it.add(new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), new THREE.MeshLambertMaterial({ color: NC[id] })));
    cy(it, 0.05, 0.12, 0, 0.17, 0, mt(0x444));
    it.position.y = 0.55;
  } else {
    bx(it, 0.55, 0.36, 0.38, 0, 0, 0, mt(0xeeeeee));
    bx(it, 0.3, 0.03, 0.08, 0, 0.19, 0, mt(0xd22222));
    bx(it, 0.08, 0.03, 0.3, 0, 0.19, 0, mt(0xd22222));
    it.position.y = 0.55;
  }
  g.add(it);
  const bm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 12, 6), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.35 }));
  bm.position.y = 6;
  g.add(bm);
  const lab = mkLabel(n, t === 'w' ? '#ffcf5a' : t === 'a' ? '#8fb8ff' : t === 'm' ? '#ffe27a' : t === 'g' ? '#ff9a7a' : t === 'o' ? '#d3b2ff' : '#8fffa8');
  lab.position.y = 2.1;
  lab.visible = false;
  g.add(lab);
  const gy = y0 === undefined ? floorY(x, z) : y0;
  g.position.set(x, gy, z);
  scene.add(g);
  pickups.push({ m: g, lab, x, z, y: gy, t, id, n, st });
}

export function swapPick(k) {
  if (k.t === 'o') {
    swapOpt(k);
    return;
  }
  if (gunKeys().length < 2 || state.owned[k.id]) {
    return;
  }
  const drop = state.cw !== 'knife' ? state.cw : gunKeys()[1];
  const st = drop === state.cw ? { mag: state.mag, res: state.res, opt: state.owned[state.cw] && state.owned[state.cw].opt } : { mag: state.owned[drop].mag, res: state.owned[drop].res, opt: state.owned[drop].opt };
  mkPick(k.x, k.z, 'w', drop, st, k.y);
  giveW(k.id, k.st, drop);
  scene.remove(k.m);
  pickups.splice(pickups.indexOf(k), 1);
  state.brNear = null;
}

export function wslot(n) {
  return state.mode === 'br' ? gunKeys()[n - 1] : (Object.keys(state.owned).find(k => WPN[k].sl === n) || 'pistol');
}

export function clearPicks() {
  for (const k of pickups) {
    scene.remove(k.m);
  }
  pickups.length = 0;
}

export function take(k) {
  if (k.t === 'w') {
    giveW(k.id, k.st);
  } else if (k.t === 'a') {
    state.armor = 100;
  } else if (k.t === 'g') {
    nade[k.id]++;
  } else if (k.t === 'o') {
    const tg = optTarget();
    if (tg) {
      state.owned[tg].opt = k.id;
      feed('Attached ' + k.n + ' to ' + WPN[tg].name);
    }
    return;
  } else if (k.t === 'm') {
    let add = 0;
    for (const q in state.owned) {
      if (WPN[q].at === k.id) {
        add = WPN[q].mag * 2;
        if (q === state.cw) {
          state.res += add;
        } else {
          state.owned[q].res += add;
        }
      }
    }
    feed('Picked up ' + k.n + ' (+' + add + ' rounds)');
    return;
  } else {
    state.hp = Math.min(100, state.hp + 50);
  }
  feed('Picked up ' + k.n);
}
