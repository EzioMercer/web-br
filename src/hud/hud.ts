// @ts-nocheck -- split from the original monolith, not typed yet
import { bots } from '../bots';
import { BRS, ZN } from '../br/zone';
import { $ } from '../dom';
import { nade } from '../grenades';
import { MMS, drawMapOn, openBig } from './minimap';
import { curOpt, gunKeys } from '../loadout';
import { P } from '../player';
import { OPT, WPN } from '../weapons';
import { state } from '../state';

export function feed(t) {
  const d = document.createElement('div');
  d.textContent = t;
  $('kf').appendChild(d);
  setTimeout(() => d.remove(), 4000);
}

const PIC = '<svg width="22" height="22" viewBox="0 0 20 20"><circle cx="10" cy="6" r="4" fill="currentColor"/><path d="M2 19c0-5 3-8 8-8s8 3 8 8z" fill="currentColor"/></svg>';
const CARD = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
let mmx = null;

function fmtT(v) {
  v = Math.max(0, Math.ceil(v));
  return Math.floor(v / 60) + ':' + ('0' + v % 60).slice(-2);
}

const ICO = { p: 'M10 12h62v9H60l-3 14H46l3-14H34l-3 5H10z', s: 'M6 14h74v8H66l-2 14h-9l2-14H44l-2 12h-8l2-12H6z M80 16h30v4H80z', r: 'M4 16h40l6-4h30l4 3h30v5H84l-4 3H58l-2 12h-9l1-12H20l-6 7H4z', g: 'M4 18h100v5H60v4H40v-4H4z M50 23h14v8H50z', n: 'M2 20h104v4H70l-6 4H44l-4 10h-8l3-10H18l-4 3H2z M40 12h30v4H40z', k: 'M18 29L76 13l8 2-6 7-58 9z M12 29h10v6H12z' };
const WCLS = { pistol: 'p', glock: 'p', deagle: 'p', mp5: 's', p90: 's', rifle: 'r', m4: 'r', m3: 'g', awp: 'n', scout: 'n', svd: 'n', g3: 'n', kar: 'n', m82: 'n', knife: 'k' };
let lastW = null;
let lastChips = '';
let cmx = null;

export function hudUpdate() {
  $('hpf').style.width = Math.max(0, Math.min(100, state.hp)) + '%';
  $('hpn').textContent = Math.ceil(state.hp);
  $('arf').style.width = Math.max(0, Math.min(100, state.armor)) + '%';
  $('arn').textContent = Math.ceil(state.armor);
  $('hp').classList.toggle('low', state.hp < 30 && !state.dead);
  const wk = state.cw + (curOpt() ? state.owned[state.cw].opt : '');
  if (lastW !== wk) {
    lastW = wk;
    $('wname').textContent = state.WP.name + (curOpt() ? ' · ' + OPT[state.owned[state.cw].opt].s : '');
    $('wicop').setAttribute('d', ICO[WCLS[state.cw] || 'r']);
  }
  const mel = !!state.WP.melee;
  $('mag').textContent = mel ? '—' : state.mag;
  $('rsv').textContent = mel ? '' : '/ ' + state.res;
  $('rlt').textContent = state.reloading ? 'RELOADING' : (state.WP.bolt && state.T < state.cycEnd ? 'CHAMBERING' : '');
  const gk = gunKeys();
  let h = '';
  for (const k of gk) {
    h += '<span class="chip' + (k === state.cw && !state.cg ? ' on' : '') + '"><i>' + (state.mode === 'br' ? gk.indexOf(k) + 1 : WPN[k].sl) + '</i>' + WPN[k].name + '</span>';
  }
  if (state.owned.knife) {
    h += '<span class="chip' + (state.cw === 'knife' && !state.cg ? ' on' : '') + '"><i>3</i>Knife</span>';
  }
  [['he', 'HE', 4], ['fl', 'FL', 5], ['sm', 'SM', 6]].forEach(([k, n, i]) => {
    if (nade[k] > 0) {
      h += '<span class="chip' + (state.cg === k ? ' on' : '') + '"><i>' + i + '</i>' + n + ' ×' + nade[k] + '</span>';
    }
  });
  if (h !== lastChips) {
    $('chips').innerHTML = h;
    lastChips = h;
  }
}

export function drawCompass() {
  const c = $('cmp');
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const W = 460;
  const Hh = 34;
  if (!cmx || c.width !== W * dpr) {
    c.width = W * dpr;
    c.height = Hh * dpr;
    cmx = c.getContext('2d');
  }
  const x = cmx;
  x.setTransform(dpr, 0, 0, dpr, 0, 0);
  x.clearRect(0, 0, W, Hh);
  x.fillStyle = 'rgba(12,16,20,.7)';
  x.fillRect(0, 0, W, Hh);
  const hdg = ((-state.yaw * 180 / Math.PI) % 360 + 360) % 360;
  const span = 100;
  const ppd = W / span;
  const NAMES = { 0: 'N', 45: 'NE', 90: 'E', 135: 'SE', 180: 'S', 225: 'SW', 270: 'W', 315: 'NW' };
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  for (let d = Math.ceil((hdg - span / 2) / 5) * 5; d <= hdg + span / 2; d += 5) {
    const px = W / 2 + (d - hdg) * ppd;
    const dg = ((d % 360) + 360) % 360;
    if (dg % 45 === 0) {
      x.fillStyle = dg === 0 ? '#ff6a5a' : '#fff';
      x.font = '700 17px Rajdhani, Arial Narrow, sans-serif';
      x.fillText(NAMES[dg], px, 15);
    } else if (dg % 15 === 0) {
      x.fillStyle = 'rgba(255,255,255,.75)';
      x.font = '600 12px Rajdhani, Arial Narrow, sans-serif';
      x.fillText(dg, px, 12);
      x.fillRect(px - 0.5, 23, 1, 6);
    } else {
      x.fillStyle = 'rgba(255,255,255,.4)';
      x.fillRect(px - 0.5, 25, 1, 4);
    }
  }
  if (state.mode === 'br' && state.TERR && ZN.r < 900) {
    const bz = Math.atan2(ZN.cx - P.x, -(ZN.cz - P.z)) * 180 / Math.PI;
    const rel = ((bz - hdg + 540) % 360) - 180;
    const mx = W / 2 + Math.max(-span / 2 + 2, Math.min(span / 2 - 2, rel)) * ppd;
    const edge = Math.abs(rel) > span / 2 - 2;
    x.fillStyle = Math.hypot(ZN.cx - P.x, ZN.cz - P.z) > ZN.r ? '#ff7a6a' : '#ffd24a';
    x.beginPath();
    x.moveTo(mx, edge ? 17 : 21);
    x.lineTo(mx + 6, edge ? 23 : 27);
    x.lineTo(mx, edge ? 29 : 33);
    x.lineTo(mx - 6, edge ? 23 : 27);
    x.closePath();
    x.fill();
  }
  x.fillStyle = 'rgba(12,16,20,.9)';
  x.fillRect(0, 0, 22, Hh);
  x.fillRect(W - 22, 0, 22, Hh);
  x.fillStyle = 'rgba(12,16,20,.5)';
  x.fillRect(22, 0, 16, Hh);
  x.fillRect(W - 38, 0, 16, Hh);
  x.fillStyle = '#f2b134';
  x.beginPath();
  x.moveTo(W / 2 - 6, 0);
  x.lineTo(W / 2 + 6, 0);
  x.lineTo(W / 2, 8);
  x.closePath();
  x.fill();
}

export function brHud() {
  document.body.classList.toggle('br', state.mode === 'br');
  if (state.mode !== 'br') {
    if (state.bigOpen) {
      openBig(false);
    }
    return;
  }
  const alive = bots.filter(b => b.hp > 0).length + (state.dead ? 0 : 1);
  $('pcount').innerHTML = PIC + alive + ' / ' + (state.botN + 1);
  const hdr = state.phase === 'buy' ? 'Match starts in ' + Math.max(0, Math.ceil(state.phaseEnd - state.T)) + ' s' : ZN.ph === 'hold' ? 'Zone ' + ZN.stage + '/' + BRS.length + ' · shrinks in ' + fmtT(ZN.left) : ZN.ph === 'shrink' ? 'Zone ' + ZN.stage + '/' + BRS.length + ' · shrinking, ' + fmtT(ZN.left) + ' left' : 'Final zone';
  $('mmh').textContent = hdr;
  // ----- mini map
  const c = $('mmc');
  const dpr = Math.min(devicePixelRatio || 1, 2);
  if (!mmx || c.width !== MMS * dpr) {
    c.width = c.height = MMS * dpr;
    mmx = c.getContext('2d');
  }
  mmx.setTransform(dpr, 0, 0, dpr, 0, 0);
  mmx.clearRect(0, 0, MMS, MMS);
  drawMapOn(mmx, MMS, state.MM);
  const rg = state.TERR.reg(P.x, P.z);
  if (state.bigOpen && state.MMB) {
    const bc = $('bmc');
    const S = state.MMB.S;
    if (bc.width !== S) {
      bc.width = S;
      bc.height = S;
    }
    const bx = bc.getContext('2d');
    bx.setTransform(1, 0, 0, 1, 0, 0);
    bx.clearRect(0, 0, S, S);
    drawMapOn(bx, S, state.MMB);
    $('bmt').textContent = hdr + '   ·   You are in: ' + (rg === 255 ? 'open sea' : state.TERR.regs[rg].n) + '   ·   M to close';
  }
  // ----- zone strip (one line): time left, the safe area along the line from you to its centre, and the distance to its edge
  {
    const ph = state.phase === 'buy' ? 'buy' : ZN.ph;
    const tl = ph === 'buy' ? Math.max(0, state.phaseEnd - state.T) : ZN.left;
    const ti = Math.max(0, Math.ceil(tl));

    const p2 = n => ('0' + n).slice(-2);

    $('ztv').textContent = ph === 'final' ? '--:--' : p2(Math.floor(ti / 60)) + ':' + p2(ti % 60);
    $('ztv').style.color = ph === 'shrink' ? '#ff7a6a' : '#fff';
  }
  const dx = ZN.cx - P.x;
  const dz = ZN.cz - P.z;
  const dC = Math.hypot(dx, dz);
  const lo = dC - ZN.r;
  const hi = dC + ZN.r;
  const pad = Math.max(25, (hi - Math.min(lo, 0)) * 0.12);
  const a = Math.min(0, lo) - pad;
  const b = Math.max(0, hi) + pad;
  const W = b - a;

  const pc = t => Math.max(0, Math.min(100, (t - a) / W * 100));

  const mw = 6;
  let sl = pc(lo);
  let sw = pc(hi) - sl;
  if (sw < mw) {
    sl = Math.max(0, Math.min(100 - mw, sl + sw / 2 - mw / 2));
    sw = mw;
  }
  $('zsafe').style.left = sl + '%';
  $('zsafe').style.width = sw + '%';
  $('zrun').style.left = pc(0) + '%';
  {
    const out = dC > ZN.r;
    const d = Math.round(Math.abs(dC - ZN.r));
    const zd = $('zdist');
    zd.textContent = d + 'm';
    zd.style.color = out ? '#ff8a7a' : '#fff';
  }
}
