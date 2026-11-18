// @ts-nocheck -- split from the original monolith, not typed yet
import * as THREE from 'three';
import { WLV } from '../config';
import { state } from '../state';

export const BRH = 450;
const BRST = 4;
const BRN = Math.round(2 * BRH / BRST) + 1;
const MTN = [{ x: -170, z: -200, R: 170, H: 84, n: 'Mount Karst' }, { x: 235, z: -135, R: 130, H: 60, n: 'Redback Ridge' }, { x: -265, z: 165, R: 120, H: 46, n: 'Grey Teeth' }, { x: 135, z: 245, R: 85, H: 28, n: 'Hogback' }];
const LKS = [{ x: -135, z: 30, r: 44, n: 'Mirror Lake' }, { x: 62, z: -200, r: 28, n: 'Eagle Pond' }];
const RIV = [[[-70, -125], [-10, -150], [50, -152], [110, -118], [150, -70], [165, -10], [185, 50], [235, 105], [275, 170], [290, 240], [300, 330]]];
export const SITES = [
  { n: 'Central Mall', x: 40, z: 75, r: 56, t: 'mall' },
  { n: 'Aurora', x: -25, z: -55, r: 50, t: 'downtown' },
  { n: 'Maple Heights', x: 138, z: 152, r: 44, t: 'suburb' },
  { n: 'Pinecrest', x: -55, z: -245, r: 44, t: 'village' },
  { n: 'Frostpeak Lodge', x: -118, z: -152, r: 24, t: 'lodge' },
  { n: 'Fort Redstone', x: 150, z: -225, r: 48, t: 'fort' },
  { n: 'Ironworks', x: 300, z: 30, r: 46, t: 'industrial' },
  { n: 'Port Calder', x: 240, z: 245, r: 48, t: 'port' },
  { n: 'Meadowbrook Farm', x: -105, z: 220, r: 52, t: 'farm' },
  { n: 'Dusty Gulch', x: -225, z: 80, r: 36, t: 'hamlet' },
  { n: 'Skyfield Airstrip', x: -300, z: -30, r: 28, t: 'airfield' },
  { n: 'Cape Light', x: 330, z: -95, r: 22, t: 'lighthouse' },
];
export const BRG = [{ x: 20, z: -151, ax: 'z', len: 44 }, { x: 158, z: -40, ax: 'x', len: 44 }];
const ROADS = [[[-55, -245], [0, -200], [20, -172], [20, -130], [-25, -55]], [[-25, -55], [20, 0], [40, 75]], [[40, 75], [85, 115], [138, 152]], [[138, 152], [215, 110], [300, 30]], [[138, 152], [195, 205], [240, 245]], [[40, 75], [-30, 150], [-105, 220]], [[-25, -55], [-110, -40], [-200, -30], [-300, -30]], [[-300, -30], [-250, 40], [-225, 80]], [[40, 75], [100, 20], [158, -40], [150, -130], [150, -225]], [[-25, -55], [-80, -100], [-118, -152]], [[300, 30], [320, -30], [330, -95]]];
const REGX = [{ n: 'Whispering Pines', x: 60, z: -120, w: 1.3 }, { n: 'Golden Plains', x: 200, z: 20, w: 1.2 }, { n: 'Sunset Beach', x: -330, z: -170, w: 1.2 }, { n: 'Driftwood Cove', x: 0, z: 350, w: 1.2 }, { n: 'Salt Flats', x: -20, z: 200, w: 1.1 }];
const SURFK = ['water', 'dust', 'grass', 'grass', 'dust', 'snow', 'dust', 'grass', 'grass', 'grass'];
export const KCOL = [[0.52, 0.58, 0.55], [0.86, 0.79, 0.58], [0.40, 0.62, 0.31], [0.64, 0.63, 0.36], [0.52, 0.50, 0.47], [0.95, 0.96, 0.98], [0.47, 0.46, 0.44], [0.74, 0.64, 0.30], [0.33, 0.52, 0.24], [0.28, 0.42, 0.22]];

export function mkNoise(seed) {
  const hs = (i, j) => {
    let h = Math.imul(i, 374761393) ^ Math.imul(j, 668265263) ^ Math.imul(seed, 1274126177);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };

  const sm = t => t * t * (3 - 2 * t);

  const n2 = (x, y) => {
    const i = Math.floor(x);
    const j = Math.floor(y);
    const u = sm(x - i);
    const v = sm(y - j);
    const a = hs(i, j);
    const b = hs(i + 1, j);
    const c = hs(i, j + 1);
    const d = hs(i + 1, j + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };

  const fbm = (x, y, o) => {
    let s = 0;
    let a = 0.5;
    let f = 1;
    let t = 0;
    for (let k = 0; k < o; k++) {
      s += a * n2(x * f, y * f);
      t += a;
      a *= 0.5;
      f *= 2.03;
    }
    return s / t;
  };

  return { n2, fbm };
}

function catmull(pts, seg) {
  const o = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < seg; k++) {
      const t = k / seg;
      const t2 = t * t;
      const t3 = t2 * t;
      o.push([0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3), 0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]);
    }
  }
  o.push(pts[pts.length - 1]);
  return o;
}

export function genTerrain() {
  const { n2, fbm } = mkNoise(777);
  const N = BRN;
  const ST = BRST;
  const HF = new Float32Array(N * N);
  const SL = new Float32Array(N * N);
  const KD = new Uint8Array(N * N);
  const RM = new Uint8Array(N * N);
  const COL = new Float32Array(N * N * 3);

  const ss = (a, b, x) => {
    const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };

  const segd = (px, pz, ax, az, bx, bz) => {
    const dx = bx - ax;
    const dz = bz - az;
    const l2 = dx * dx + dz * dz || 1;
    let t = ((px - ax) * dx + (pz - az) * dz) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - ax - dx * t, pz - az - dz * t);
  };

  const base = (x, z) => {
    const r = Math.hypot(x, z) / BRH;
    const w = (fbm(x * 0.003 + 7, z * 0.003 + 3, 3) - 0.5) * 0.5;
    const rr = r + w * (0.35 + r);
    const land = 1 - ss(0.56, 0.9, rr);
    let h = -7 + land * (8.5 + 8 * fbm(x * 0.006, z * 0.006, 4));
    for (const m of MTN) {
      const d = Math.hypot(x - m.x, z - m.z) / m.R;
      if (d < 1) {
        const k = 1 - d;
        const s = k * k * (3 - 2 * k);
        const rg = 1 - Math.abs(2 * fbm(x * 0.012 + m.x, z * 0.012 + m.z, 4) - 1);
        h += m.H * s * (0.45 + 0.75 * rg);
      }
    }
    return h;
  };

  const rivs = RIV.map(r => catmull(r, 6));

  const carve = (x, z, h) => {
    let k = 0;
    for (const rv of rivs) {
      for (let i = 0; i < rv.length - 1; i++) {
        const d = segd(x, z, rv[i][0], rv[i][1], rv[i + 1][0], rv[i + 1][1]);
        if (d < 11) {
          k = Math.max(k, 1 - ss(4, 11, d));
        }
      }
    }
    for (const l of LKS) {
      const d = Math.hypot(x - l.x, z - l.z);
      if (d < l.r * 1.25) {
        k = Math.max(k, 1 - ss(l.r * 0.55, l.r * 1.25, d));
      }
    }
    k *= 1 - ss(9, 20, h);
    return k > 0 ? h + ((WLV - 1.05) - h) * k : h;
  };

  const flat = [];
  for (const s of SITES) {
    s.h = Math.max(WLV + 2.6, base(s.x, s.z));
    flat.push({ x: s.x, z: s.z, r: s.r, h: s.h });
  }
  const ah = Math.max(WLV + 2.6, base(-300, -30));
  for (const z of [-120, -90, -60, 0, 30, 60]) {
    flat.push({ x: -300, z, r: 26, h: ah });
  }
  SITES[10].h = ah;
  const YB = WLV + 2;
  for (const b of BRG) {
    const e = b.ax === 'z' ? [[b.x, b.z - b.len / 2], [b.x, b.z + b.len / 2]] : [[b.x - b.len / 2, b.z], [b.x + b.len / 2, b.z]];
    for (const q of e) {
      flat.push({ x: q[0], z: q[1], r: 9, h: YB });
    }
    b.y = YB;
  }
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const x = -BRH + i * ST;
      const z = -BRH + j * ST;
      let h = carve(x, z, base(x, z));
      for (const f of flat) {
        const d = Math.hypot(x - f.x, z - f.z);
        if (d < f.r * 1.6) {
          h += (f.h - h) * (1 - ss(f.r, f.r * 1.6, d));
        }
      }
      for (const b of BRG) {
        const ux = b.ax === 'z' ? 0 : 1;
        const uz = b.ax === 'z' ? 1 : 0;
        const al = (x - b.x) * ux + (z - b.z) * uz;
        const pp = Math.abs((x - b.x) * uz - (z - b.z) * ux);
        if (Math.abs(al) < b.len / 2 - 3) {
          const k = 1 - ss(7, 12, pp);
          const lim = YB - 1.25;
          if (k > 0 && h > lim) {
            h += (lim - h) * k;
          }
        }
      }
      HF[j * N + i] = h;
    }
  }
  let maxH = 0;
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const k = j * N + i;
      const a = HF[j * N + Math.max(0, i - 1)];
      const b = HF[j * N + Math.min(N - 1, i + 1)];
      const c = HF[Math.max(0, j - 1) * N + i];
      const d = HF[Math.min(N - 1, j + 1) * N + i];
      SL[k] = Math.hypot((b - a) / (2 * ST), (d - c) / (2 * ST));
      if (HF[k] > maxH) {
        maxH = HF[k];
      }
    }
  }
  const roads = ROADS.map(r => catmull(r, 10));
  for (const rd of roads) {
    for (const [px, pz] of rd) {
      const i0 = Math.round((px + BRH) / ST);
      const j0 = Math.round((pz + BRH) / ST);
      for (let dj = -1; dj <= 1; dj++) {
        for (let di = -1; di <= 1; di++) {
          const i = i0 + di;
          const j = j0 + dj;
          if (i < 0 || j < 0 || i >= N || j >= N) {
            continue;
          }
          if (Math.hypot(-BRH + i * ST - px, -BRH + j * ST - pz) < 3.6 && HF[j * N + i] > WLV + 0.3) {
            RM[j * N + i] = 1;
          }
        }
      }
    }
  }
  const farm = SITES[8];
  const FR = [[farm.x + 62, farm.z - 18, 46, 34], [farm.x + 62, farm.z + 30, 46, 28], [farm.x - 60, farm.z + 52, 40, 30], [farm.x + 6, farm.z + 66, 50, 24]];

  const fieldAt = (x, z) => {
    for (const f of FR) {
      if (Math.abs(x - f[0]) < f[2] / 2 && Math.abs(z - f[1]) < f[3] / 2) {
        return (Math.floor((x + z) / 7) & 1) ? 7 : 8;
      }
    }
    return 0;
  };

  const regs = [...SITES.map(s => ({ n: s.n, x: s.x, z: s.z, w: 1 })), ...MTN.map(m => ({ n: m.n, x: m.x, z: m.z, w: 1.7 })), ...LKS.map(l => ({ n: l.n, x: l.x, z: l.z, w: 1.3 })), ...REGX];
  const RG = new Uint8Array(N * N);
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const k = j * N + i;
      const x = -BRH + i * ST;
      const z = -BRH + j * ST;
      const h = HF[k];
      const sl = SL[k];
      const bio = n2(x * 0.008 + 50, z * 0.008);
      const fd = n2(x * 0.011 + 9, z * 0.011 + 4);
      let kd;
      if (h < WLV - 0.25) {
        kd = 0;
      } else if (h < WLV + 1.1) {
        kd = 1;
      } else if (RM[k]) {
        kd = 6;
      } else {
        const f = fieldAt(x, z);
        if (f) {
          kd = f;
        } else if (sl > 0.8 || (h > 22 && sl > 0.55)) {
          kd = 4;
        } else if (h > 40 - n2(x * 0.05, z * 0.05) * 7) {
          kd = 5;
        } else {
          kd = bio > 0.56 ? 3 : (fd > 0.62 ? 9 : 2);
        }
      }
      KD[k] = kd;
      const c = KCOL[kd];
      const v = 0.9 + 0.2 * n2(x * 0.35, z * 0.35);
      const rk = kd === 4 ? 0.88 + 0.24 * n2(x * 0.9, z * 0.12) : 1;
      COL[k * 3] = c[0] * v * rk;
      COL[k * 3 + 1] = c[1] * v * rk;
      COL[k * 3 + 2] = c[2] * v * rk;
      let bi = 255;
      let bd = 1e9;
      if (h > WLV - 1.2 || Math.hypot(x, z) < BRH * 0.78) {
        for (let q = 0; q < regs.length; q++) {
          const d = Math.hypot(x - regs[q].x, z - regs[q].z) / regs[q].w;
          if (d < bd) {
            bd = d;
            bi = q;
          }
        }
      }
      RG[k] = bi;
    }
  }

  const idx = (x, z) => {
    let i = Math.round((x + BRH) / ST);
    let j = Math.round((z + BRH) / ST);
    i = i < 0 ? 0 : i > N - 1 ? N - 1 : i;
    j = j < 0 ? 0 : j > N - 1 ? N - 1 : j;
    return j * N + i;
  };

  const T = { half: BRH, N, ST, HF, SL, KD, COL, RG, regs, maxH, roads, rivs, h(x, z) {
    let fx = (x + BRH) / ST;
    let fz = (z + BRH) / ST;
    if (fx < 0) {
      fx = 0;
    }
    if (fz < 0) {
      fz = 0;
    }
    if (fx > N - 1.001) {
      fx = N - 1.001;
    }
    if (fz > N - 1.001) {
      fz = N - 1.001;
    }
    const i = fx | 0;
    const j = fz | 0;
    const u = fx - i;
    const v = fz - j;
    const a = HF[j * N + i];
    const b = HF[j * N + i + 1];
    const c = HF[(j + 1) * N + i];
    const d = HF[(j + 1) * N + i + 1];
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }, slope: (x, z) => SL[idx(x, z)], kind: (x, z) => KD[idx(x, z)], reg: (x, z) => RG[idx(x, z)], surf: (x, z) => SURFK[KD[idx(x, z)]] };
  return T;
}

// Terrain colors are authored in sRGB (the minimap canvas uses them as-is); vertex colors must be linear.
function srgbToLinear(a) {
  const o = new Float32Array(a.length);
  for (let i = 0; i < a.length; i++) {
    const c = a[i];
    o[i] = c < 0.04045 ? c * 0.0773993808 : Math.pow(c * 0.9478672986 + 0.0521327014, 2.4);
  };
  return o;
}

export function terrMesh(T) {
  const N = T.N;
  const ST = T.ST;
  const pos = new Float32Array(N * N * 3);
  const idx = new Uint16Array((N - 1) * (N - 1) * 6);
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const k = j * N + i;
      pos[k * 3] = -T.half + i * ST;
      pos[k * 3 + 1] = T.HF[k];
      pos[k * 3 + 2] = -T.half + j * ST;
    }
  }
  let q = 0;
  for (let j = 0; j < N - 1; j++) {
    for (let i = 0; i < N - 1; i++) {
      const a = j * N + i;
      const b = a + 1;
      const c = a + N;
      const d = c + 1;
      idx[q++] = a;
      idx[q++] = c;
      idx[q++] = b;
      idx[q++] = b;
      idx[q++] = c;
      idx[q++] = d;
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(srgbToLinear(T.COL), 3));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  g.computeVertexNormals();
  return new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true }));
}

export function terrT(o, d, maxT) {
  if (!state.TERR) {
    return Infinity;
  }
  const lim = Math.min(maxT, 1500);
  if (d[1] >= 0 && o[1] > state.TERR.maxH + 2) {
    return Infinity;
  }
  let t = 0;
  let step = 1.2;
  if (o[1] - state.TERR.h(o[0], o[2]) < -0.6) {
    return 0;
  }
  while (t < lim) {
    t += step;
    const x = o[0] + d[0] * t;
    const z = o[2] + d[2] * t;
    if ((Math.abs(x) > state.TERR.half || Math.abs(z) > state.TERR.half) && d[1] >= 0) {
      return Infinity;
    }
    if (o[1] + d[1] * t - state.TERR.h(x, z) < 0) {
      let a = t - step;
      let b = t;
      for (let k = 0; k < 7; k++) {
        const m = (a + b) / 2;
        if (o[1] + d[1] * m - state.TERR.h(o[0] + d[0] * m, o[2] + d[2] * m) < 0) {
          b = m;
        } else {
          a = m;
        }
      }
      return b;
    }
    if (d[1] >= 0 && o[1] + d[1] * t > state.TERR.maxH + 2) {
      return Infinity;
    }
    step = Math.min(6, step * 1.05 + 0.03);
  }
  return Infinity;
}
