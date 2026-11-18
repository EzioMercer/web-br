// @ts-nocheck -- split from the original monolith, not typed yet
import { reloadSeq, rsnd } from './audio';
import { H } from './config';
import { $ } from './dom';
import { bumpBot } from './modes';
import { WPN } from './weapons';
import { floorY } from './world/level';
import { state } from './state';

export const P = { x: 0, y: 0, z: 26, g: true, h: 1.8 };
export const V = { x: 0, y: 0, z: 0 };

export function hurt(d, by, raw) {
  if (state.dead) {
    return;
  }
  const ab = raw ? 0 : Math.min(state.armor, d * 0.5);
  state.armor -= ab;
  state.hp -= d - ab;
  state.dmgFlash = raw ? Math.max(state.dmgFlash, 0.3) : 1;
  if (by && by.x !== undefined) {
    state.ddT = 1.4;
    $('dd').style.transform = 'translate(-50%,-50%) rotate(' + ((Math.atan2(by.x - P.x, -(by.z - P.z)) + state.yaw) * 57.2958) + 'deg)';
  }
  if (state.hp <= 0) {
    state.hp = 0;
    state.dead = true;
    state.deaths++;
    state.respawnAt = state.T + 2.5;
    state.mouse = false;
    $('msg').textContent = 'You were eliminated';
    if (by && state.mode === 'arms') {
      bumpBot(by);
    }
  }
}

export function spawn() {
  P.x = state.SPAWN[0] + (Math.random() - 0.5) * 5;
  P.z = state.SPAWN[1];
  P.y = floorY(P.x, P.z);
  P.h = H;
  V.x = V.y = V.z = 0;
  state.yaw = 0;
  state.pitch = 0;
  state.punchP = state.punchY = 0;
  state.hp = 100;
  if (state.mode !== 'br') {
    for (const k in state.owned) {
      state.owned[k] = { mag: WPN[k].mag, res: WPN[k].res };
    }
  }
  ({ mag: state.mag, res: state.res } = state.owned[state.cw]);
  state.reloading = false;
  state.dead = false;
  $('msg').textContent = '';
}

export function reload() {
  if (state.reloading || state.mag === state.WP.mag || state.res <= 0) {
    return;
  }
  state.reloading = true;
  state.scoped = false;
  state.reloadEnd = state.T + state.WP.rt;
  rsnd(reloadSeq());
}

export function switchW(id) {
  if (!state.owned[id] || id === state.cw || state.dead) {
    return;
  }
  state.owned[state.cw] = Object.assign(state.owned[state.cw] || {}, { mag: state.mag, res: state.res });
  state.cw = id;
  state.WP = WPN[id];
  ({ mag: state.mag, res: state.res } = state.owned[id]);
  state.cg = null;
  state.reloading = false;
  state.scoped = false;
  state.nextFire = Math.max(state.T + 0.4, WPN[id].bolt ? state.cycEnd : 0);
}
