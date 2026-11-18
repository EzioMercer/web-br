// @ts-nocheck -- split from the original monolith, not typed yet
import { ZN } from '../br/zone';
import { $ } from '../dom';
import { P } from '../player';
import { MAPS } from '../world/maps';
import { KCOL } from '../world/terrain';
import { state } from '../state';

export const MMS = 190;

function mapBg(m, S, labels) {
  const T = m.terrain;
  const half = T.half;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const x = c.getContext('2d');
  const img = x.createImageData ? x.createImageData(S, S) : null;
  const out = { c, k: S / (2 * half), o: half, S };
  if (!img || !img.data) {
    return out;
  }
  const sc = 2 * half / S;
  const d = img.data;
  const reg = new Uint8Array(S * S);
  const sea = new Uint8Array(S * S);
  for (let j = 0; j < S; j++) {
    for (let i = 0; i < S; i++) {
      const wx = -half + (i + 0.5) * sc;
      const wz = -half + (j + 0.5) * sc;
      const kd = T.kind(wx, wz);
      const h = T.h(wx, wz);
      let r;
      let g2;
      let b2;
      if (kd === 0) {
        const dp = Math.max(0, Math.min(1, -h / 7));
        r = 0.32 - 0.22 * dp;
        g2 = 0.6 - 0.34 * dp;
        b2 = 0.78 - 0.3 * dp;
      } else {
        const c0 = KCOL[kd];
        const v = 1 + Math.max(-0.4, Math.min(0.4, (T.h(wx - sc, wz - sc) - T.h(wx + sc, wz + sc)) * 0.014));
        r = c0[0] * v;
        g2 = c0[1] * v;
        b2 = c0[2] * v;
      }
      const q = (j * S + i) * 4;
      d[q] = r * 255;
      d[q + 1] = g2 * 255;
      d[q + 2] = b2 * 255;
      d[q + 3] = 255;
      reg[j * S + i] = T.reg(wx, wz);
      if (kd === 0) {
        sea[j * S + i] = 1;
      }
    }
  }
  for (let j = 0; j < S - 1; j++) {
    for (let i = 0; i < S - 1; i++) {
      const a = reg[j * S + i];
      if (a !== 255 && !sea[j * S + i] && ((a !== reg[j * S + i + 1] && reg[j * S + i + 1] !== 255) || (a !== reg[(j + 1) * S + i] && reg[(j + 1) * S + i] !== 255))) {
        const q = (j * S + i) * 4;
        d[q] = d[q] * 0.55 + 255 * 0.45;
        d[q + 1] = d[q + 1] * 0.55 + 255 * 0.45;
        d[q + 2] = d[q + 2] * 0.55 + 255 * 0.45;
      }
    }
  }
  x.putImageData(img, 0, 0);

  const px = v => (v + half) / sc;

  x.fillStyle = '#5b4a3a';
  for (const f of m.fp) {
    if (f[4] !== 'carpark' && f[4] !== 'runway' && f[4] !== 'plaza' && f[4] !== 'paddock' && f[4] !== 'containers' && f[4] !== 'gas') {
      x.fillRect(px(f[0] - f[2] / 2), px(f[1] - f[3] / 2), Math.max(1.5, f[2] / sc), Math.max(1.5, f[3] / sc));
    }
  }
  if (labels) {
    const sx = new Float64Array(T.regs.length);
    const sz = new Float64Array(T.regs.length);
    const n = new Float64Array(T.regs.length);
    for (let j = 0; j < S; j++) {
      for (let i = 0; i < S; i++) {
        const r = reg[j * S + i];
        if (r !== 255 && T.kind(-half + (i + 0.5) * sc, -half + (j + 0.5) * sc) !== 0) {
          sx[r] += i;
          sz[r] += j;
          n[r]++;
        }
      }
    }
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.lineJoin = 'round';
    x.font = 'bold ' + Math.round(S / 46) + 'px Rajdhani, Arial Narrow, sans-serif';
    x.lineWidth = Math.max(3, S / 200);
    for (let r = 0; r < T.regs.length; r++) {
      if (n[r] > 20) {
        const nm = T.regs[r].n.toUpperCase();
        const cx = sx[r] / n[r];
        const cz = sz[r] / n[r];
        x.strokeStyle = 'rgba(0,0,0,.75)';
        x.strokeText(nm, cx, cz);
        x.fillStyle = '#fff';
        x.fillText(nm, cx, cz);
      }
    }
  }
  return out;
}

export function buildMini(m) {
  return mapBg(m, Math.round(MMS * Math.min(devicePixelRatio || 1, 2)), false);
}

export function drawMapOn(x, Sd, bg) {
  const half = state.TERR.half;
  const k = Sd / (2 * half);

  const px = v => (v + half) * k;

  const sc = Sd / 190;
  if (bg) {
    x.drawImage(bg.c, 0, 0, Sd, Sd);
  }
  x.beginPath();
  x.rect(0, 0, Sd, Sd);
  x.arc(px(ZN.cx), px(ZN.cz), ZN.r * k, 0, 6.2832, true);
  x.fillStyle = 'rgba(91,70,224,.4)';
  x.fill();
  if (ZN.next) {
    x.beginPath();
    x.arc(px(ZN.next.cx), px(ZN.next.cz), ZN.next.r * k, 0, 6.2832);
    x.setLineDash([5 * sc, 4 * sc]);
    x.lineWidth = 2 * sc;
    x.strokeStyle = '#ffd24a';
    x.stroke();
    x.setLineDash([]);
  }
  x.beginPath();
  x.arc(px(ZN.cx), px(ZN.cz), ZN.r * k, 0, 6.2832);
  x.lineWidth = 2 * sc;
  x.strokeStyle = '#ffffff';
  x.stroke();
  const mx = px(P.x);
  const my = px(P.z);
  const an = Math.atan2(-Math.cos(state.yaw), -Math.sin(state.yaw));
  x.beginPath();
  x.moveTo(mx, my);
  x.arc(mx, my, 30 * sc, an - 0.8, an + 0.8);
  x.closePath();
  x.fillStyle = 'rgba(90,209,255,.32)';
  x.fill();
  x.beginPath();
  x.moveTo(mx + Math.cos(an) * 8 * sc, my + Math.sin(an) * 8 * sc);
  x.lineTo(mx + Math.cos(an + 2.5) * 6 * sc, my + Math.sin(an + 2.5) * 6 * sc);
  x.lineTo(mx + Math.cos(an - 2.5) * 6 * sc, my + Math.sin(an - 2.5) * 6 * sc);
  x.closePath();
  x.fillStyle = '#5ad1ff';
  x.fill();
  x.lineWidth = 1.5 * sc;
  x.strokeStyle = '#000';
  x.stroke();
}

export function openBig(v) {
  state.bigOpen = v && state.mode === 'br';
  $('bigmap').style.display = state.bigOpen ? 'block' : 'none';
  if (state.bigOpen && !state.MMB) {
    const S = Math.max(360, Math.min(780, Math.floor(Math.min(innerWidth, innerHeight) * 0.84)));
    state.MMB = mapBg(MAPS.br, S, true);
  }
}
