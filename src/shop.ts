// @ts-nocheck -- split from the original monolith, not typed yet
import { nade } from './grenades';
import { EQ, SHOP, WPN } from './weapons';
import { state } from './state';

export function shopText() {
  if (state.phase !== 'buy' || state.dead || state.mode !== 'casual') {
    state.shop = null;
    return state.mode === 'br' && !state.dead ? (state.cg ? ({ he: 'HE grenade', fl: 'Flashbang', sm: 'Smoke grenade' }[state.cg]) + ' ready – hold click to aim, release to throw · Right-click: ' + (state.lob ? 'far throw' : 'short toss') : state.brPrompt) : '';
  }
  if (state.shop === null) {
    return 'Buy phase – press B for shop';
  }
  if (state.shop === 'm') {
    return 'BUY MENU<br>1 Pistols<br>2 Shotguns<br>3 Sub-machine guns<br>4 Rifles<br>5 Equipment<br>6 Primary ammo $60<br>7 Secondary ammo $60<br>0 Close';
  }
  return SHOP[state.shop][0] + '<br>' + SHOP[state.shop][1].map((id, i) => (i + 1) + ' ' + (WPN[id] || EQ[id]).name + ' $' + (WPN[id] || EQ[id]).cost).join('<br>') + '<br>0 Back';
}

export function shopKey(n) {
  if (state.shop === 'm') {
    if (n === 0) {
      state.shop = null;
    } else if (n <= 5) {
      state.shop = n - 1;
    } else if (n <= 7) {
      buyAmmo(n - 5);
      state.shop = null;
    }
    return;
  }
  if (n === 0) {
    state.shop = 'm';
    return;
  }
  const id = SHOP[state.shop][1][n - 1];
  if (id) {
    buyItem(id);
    state.shop = null;
  }
}

function buyAmmo(sl) {
  const k = Object.keys(state.owned).find(k => WPN[k].sl === sl);
  if (!k || state.money < 60) {
    return;
  }
  state.money -= 60;
  if (k === state.cw) {
    state.res += WPN[k].mag;
  } else {
    state.owned[k].res += WPN[k].mag;
  }
}

function buyItem(id) {
  const e = EQ[id];
  if (!e) {
    buy(id);
    return;
  }
  if (state.money < e.cost) {
    return;
  }
  if (id === 'kev') {
    if (state.armor >= 100) {
      return;
    }
    state.armor = 100;
  } else {
    if (nade[id] >= (id === 'fl' ? 2 : 1)) {
      return;
    }
    nade[id]++;
  }
  state.money -= e.cost;
}

function buy(id) {
  const w = WPN[id];
  if (state.dead || state.owned[id] || state.money < w.cost) {
    return;
  }
  state.owned[state.cw] = { mag: state.mag, res: state.res };
  for (const k in state.owned) {
    if (WPN[k].sl === w.sl) {
      delete state.owned[k];
    }
  }
  state.money -= w.cost;
  state.owned[id] = { mag: w.mag, res: w.res };
  state.cw = id;
  state.WP = w;
  ({ mag: state.mag, res: state.res } = state.owned[id]);
  state.reloading = false;
  state.scoped = false;
  state.cg = null;
}
