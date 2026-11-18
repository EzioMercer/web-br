// @ts-nocheck -- split from the original monolith, not typed yet
import { addBot, bots, respawnBot, setBotWeapon } from './bots';
import { clearPicks } from './br/pickups';
import { ZN, brStart, zoneM } from './br/zone';
import { $ } from './dom';
import { nade, nades, smokes } from './grenades';
import { feed } from './hud/hud';
import { P, spawn } from './player';
import { scene } from './render/renderer';
import { LADDER, WPN } from './weapons';
import { loadMap } from './world/level';
import { state } from './state';

function setLoad(id) {
  state.owned = {};
  state.owned[id] = { mag: WPN[id].mag, res: WPN[id].res };
  if (id !== 'knife') {
    state.owned.knife = { mag: 1, res: 0 };
  }
  state.cw = id;
  state.WP = WPN[id];
  ({ mag: state.mag, res: state.res } = state.owned[id]);
  state.reloading = false;
  state.scoped = false;
  state.cg = null;
  state.shotIdx = 0;
}

export function modeInfo() {
  const tm = 'Time ' + Math.max(0, Math.ceil(state.phaseEnd - state.T));
  if (state.mode === 'arms') {
    return 'Level ' + (Math.min(state.plv, LADDER.length - 1) + 1) + '/' + LADDER.length + ' · ' + WPN[LADDER[Math.min(state.plv, LADDER.length - 1)]].name + '<br>Leading bot: level ' + (Math.max(...bots.map(b => b.lv | 0)) + 1);
  }
  if (state.mode === 'br') {
    const al = bots.filter(b => b.hp > 0).length + (state.dead ? 0 : 1);
    return 'Weapons: ' + Object.keys(state.owned).map((k, i) => (i + 1) + ' ' + WPN[k].name + (k === state.cw ? ' ◀' : '')).join(' · ') + '<br>Alive ' + al + ' &nbsp; Zone radius ' + Math.round(ZN.r) + ' m' + (!state.dead && Math.hypot(P.x - ZN.cx, P.z - ZN.cz) > ZN.r ? '<br><b style="color:var(--hp)">OUTSIDE THE ZONE</b>' : '');
  }
  const base = 'Round ' + state.round + ' &nbsp; Score ' + state.rw + '–' + state.rl;
  return state.mode === 'casual' ? base + ' &nbsp; <span style="color:var(--amber)">$' + state.money + '</span><br>' + tm : base + '<br>' + tm;
}

function arenaWin(n) {
  state.phase = 'over';
  state.phaseEnd = state.T + 5;
  state.mouse = false;
  const m = $('msg');
  m.style.color = 'var(--xh)';
  m.textContent = n + (n === 'You' ? ' win!' : ' wins!');
}

export function armsKill() {
  state.plv++;
  if (state.plv >= LADDER.length) {
    state.plv = LADDER.length - 1;
    arenaWin('You');
    return;
  }
  setLoad(LADDER[state.plv]);
  feed('Level ' + (state.plv + 1) + ': ' + WPN[LADDER[state.plv]].name);
}

export function bumpBot(b) {
  b.lv = (b.lv | 0) + 1;
  if (b.lv >= LADDER.length) {
    b.lv = LADDER.length - 1;
    arenaWin(b.name);
    return;
  }
  setBotWeapon(b, LADDER[b.lv]);
}

export function respawnArms() {
  setLoad(LADDER[state.plv]);
  spawn();
}

export function setMode(m) {
  state.mode = m;
  state.botN = m === 'arms' ? 6 : m === 'br' ? 19 : 5;
  while (bots.length < state.botN) {
    addBot(bots.length);
  }
  zoneM.visible = m === 'br';
  if (m !== 'br') {
    clearPicks();
  }
  loadMap(m === 'br' ? 'br' : state.lastMap, true);
}

export function endRound(w, why) {
  state.phase = 'over';
  state.phaseEnd = state.T + 4;
  state.mouse = false;
  const m = $('msg');
  if (w) {
    state.rw++;
    state.money = Math.min(16000, state.money + 2700);
    m.style.color = 'var(--xh)';
    m.textContent = state.mode === 'br' ? 'VICTORY ROYALE!' : 'Round won' + (state.mode === 'casual' ? '  +$2700' : '');
  } else {
    state.rl++;
    state.money = Math.min(16000, state.money + 1400);
    m.style.color = 'var(--hp)';
    m.textContent = (why || 'Round lost') + (state.mode === 'casual' ? '  +$1400' : '');
  }
}

export function newRound() {
  state.round++;
  if (state.dead || state.mode === 'br') {
    state.owned = { pistol: { mag: 12, res: state.mode === 'br' ? 12 : 36 }, knife: { mag: 1, res: 0 } };
    state.cw = 'pistol';
    state.WP = WPN.pistol;
    state.scoped = false;
    state.armor = 0;
    nade.he = nade.fl = nade.sm = 0;
  }
  state.cg = null;
  state.shop = null;
  nades.forEach(n => scene.remove(n.m));
  nades.length = 0;
  smokes.forEach(q => scene.remove(q.m));
  smokes.length = 0;
  state.fbang = 0;
  if (state.mode === 'arms') {
    state.plv = 0;
    bots.forEach(b => b.lv = 0);
  }
  if (state.mode === 'br') {
    brStart();
  }
  spawn();
  if (state.mode === 'sniper') {
    setLoad('awp');
  } else if (state.mode === 'arms') {
    setLoad(LADDER[state.plv]);
  }
  bots.forEach((b, i) => {
    if (i < state.botN) {
      respawnBot(b);
      b.blind = 0;
    } else {
      b.hp = 0;
      b.mesh.visible = false;
      b.respawn = 1e9;
    }
  });
  state.phase = 'buy';
  state.phaseEnd = state.T + (state.mode === 'casual' ? 10 : state.mode === 'br' ? 5 : 3);
}
