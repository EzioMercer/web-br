import { zone } from '../br/zone';
import { byId, ctx2d } from '../dom';
import { playerBody, player } from '../player';
import { getIsland, terrain } from '../world/level';
import { KIND_COLORS } from '../world/terrain';
import type { GeneratedWorld } from '../world/worldgen';
import type { MapBg } from '../types';

/** Minimap size (CSS pixels). */
export const MINIMAP_SIZE = 190;
/** Minimap and big map backgrounds. */
export let miniBg: MapBg | null = null;
export let bigBg: MapBg | null = null;
export let bigMapOpen = false;

/** Renders the terrain of map `m` (S x S pixels) with building footprints and, if `labels`, region names. */
const renderMapBg = (m: GeneratedWorld, S: number, labels: boolean): MapBg => {
  const T = m.terrain;
  const half = T.half;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const x = ctx2d(c);
  const img = x.createImageData ? x.createImageData(S, S) : null;
  const out: MapBg = { canvas: c, pxPerMetre: S / (2 * half), offset: half, size: S };
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
      const h = T.height(wx, wz);
      let r: number;
      let g2: number;
      let b2: number;
      if (kd === 0) {
        const dp = Math.max(0, Math.min(1, -h / 7));
        r = 0.32 - 0.22 * dp;
        g2 = 0.6 - 0.34 * dp;
        b2 = 0.78 - 0.3 * dp;
      } else {
        const c0 = KIND_COLORS[kd];
        const v = 1 + Math.max(-0.4, Math.min(0.4, (T.height(wx - sc, wz - sc) - T.height(wx + sc, wz + sc)) * 0.014));
        r = c0[0] * v;
        g2 = c0[1] * v;
        b2 = c0[2] * v;
      }
      const q = (j * S + i) * 4;
      d[q] = r * 255;
      d[q + 1] = g2 * 255;
      d[q + 2] = b2 * 255;
      d[q + 3] = 255;
      reg[j * S + i] = T.region(wx, wz);
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

  const px = (v: number) => (v + half) / sc;

  x.fillStyle = '#5b4a3a';
  for (const f of m.footprints) {
    if (f[4] !== 'carpark' && f[4] !== 'runway' && f[4] !== 'plaza' && f[4] !== 'paddock' && f[4] !== 'containers' && f[4] !== 'gas') {
      x.fillRect(px(f[0] - f[2] / 2), px(f[1] - f[3] / 2), Math.max(1.5, f[2] / sc), Math.max(1.5, f[3] / sc));
    }
  }
  if (labels) {
    const sx = new Float64Array(T.regions.length);
    const sz = new Float64Array(T.regions.length);
    const n = new Float64Array(T.regions.length);
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
    for (let r = 0; r < T.regions.length; r++) {
      if (n[r] > 20) {
        const nm = T.regions[r].name.toUpperCase();
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
};

export const buildMinimap = (m: GeneratedWorld) => {
  miniBg = renderMapBg(m, Math.round(MINIMAP_SIZE * Math.min(devicePixelRatio || 1, 2)), false);
};

/** Draws the map background, the zone and the player's position and view cone. */
export const drawMap = (x: CanvasRenderingContext2D, Sd: number, bg: MapBg | null) => {
  const half = terrain!.half;
  const k = Sd / (2 * half);

  const px = (v: number) => (v + half) * k;

  const sc = Sd / 190;
  if (bg) {
    x.drawImage(bg.canvas, 0, 0, Sd, Sd);
  }
  x.beginPath();
  x.rect(0, 0, Sd, Sd);
  x.arc(px(zone.cx), px(zone.cz), zone.radius * k, 0, 6.2832, true);
  x.fillStyle = 'rgba(91,70,224,.4)';
  x.fill();
  if (zone.next) {
    x.beginPath();
    x.arc(px(zone.next.cx), px(zone.next.cz), zone.next.radius * k, 0, 6.2832);
    x.setLineDash([5 * sc, 4 * sc]);
    x.lineWidth = 2 * sc;
    x.strokeStyle = '#ffd24a';
    x.stroke();
    x.setLineDash([]);
  }
  x.beginPath();
  x.arc(px(zone.cx), px(zone.cz), zone.radius * k, 0, 6.2832);
  x.lineWidth = 2 * sc;
  x.strokeStyle = '#ffffff';
  x.stroke();
  const mx = px(playerBody.x);
  const my = px(playerBody.z);
  const an = Math.atan2(-Math.cos(player.yaw), -Math.sin(player.yaw));
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
};

export const openBigMap = (v: boolean) => {
  bigMapOpen = v;
  byId('bigmap').style.display = bigMapOpen ? 'block' : 'none';
  if (bigMapOpen && !bigBg) {
    const S = Math.max(360, Math.min(780, Math.floor(Math.min(innerWidth, innerHeight) * 0.84)));
    bigBg = renderMapBg(getIsland(), S, true);
  }
};
