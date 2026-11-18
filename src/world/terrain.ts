import * as THREE from 'three';
import { WATER_LEVEL } from '../config';
import type { Surface } from '../audio';
import type { Vec2, Vec3 } from '../types';

/** Kind of Battle Royale site, which decides what the world generator builds there. */
export type SiteType = 'mall' | 'downtown' | 'suburb' | 'village' | 'lodge' | 'fort' | 'industrial' | 'port' | 'farm' | 'hamlet' | 'airfield' | 'lighthouse';

export interface Site {
  name: string;
  x: number;
  z: number;
  radius: number;
  type: SiteType;
  /** Ground height, set by `genTerrain`. */
  groundY?: number;
}

export interface Bridge {
  x: number;
  z: number;
  axis: 'x' | 'z';
  length: number;
  /** Deck height, set by `genTerrain`. */
  deckY?: number;
}

/** Named map region (for labels): sites, mountains, lakes and extra areas. */
export interface Region {
  name: string;
  x: number;
  z: number;
  /** Weight: larger regions claim more of the map. */
  weight: number;
}

export const ISLAND_HALF = 450;
const GRID_STEP = 4;
const GRID_N = Math.round(2 * ISLAND_HALF / GRID_STEP) + 1;
/** Mountains: centre, radius and peak height (m). */
const MOUNTAINS = [{ x: -170, z: -200, radius: 170, height: 84, name: 'Mount Karst' }, { x: 235, z: -135, radius: 130, height: 60, name: 'Redback Ridge' }, { x: -265, z: 165, radius: 120, height: 46, name: 'Grey Teeth' }, { x: 135, z: 245, radius: 85, height: 28, name: 'Hogback' }];
const LAKES = [{ x: -135, z: 30, radius: 44, name: 'Mirror Lake' }, { x: 62, z: -200, radius: 28, name: 'Eagle Pond' }];
const RIVERS: Vec2[][] = [[[-70, -125], [-10, -150], [50, -152], [110, -118], [150, -70], [165, -10], [185, 50], [235, 105], [275, 170], [290, 240], [300, 330]]];
export const SITES: Site[] = [
  { name: 'Central Mall', x: 40, z: 75, radius: 56, type: 'mall' },
  { name: 'Aurora', x: -25, z: -55, radius: 50, type: 'downtown' },
  { name: 'Maple Heights', x: 138, z: 152, radius: 44, type: 'suburb' },
  { name: 'Pinecrest', x: -55, z: -245, radius: 44, type: 'village' },
  { name: 'Frostpeak Lodge', x: -118, z: -152, radius: 24, type: 'lodge' },
  { name: 'Fort Redstone', x: 150, z: -225, radius: 48, type: 'fort' },
  { name: 'Ironworks', x: 300, z: 30, radius: 46, type: 'industrial' },
  { name: 'Port Calder', x: 240, z: 245, radius: 48, type: 'port' },
  { name: 'Meadowbrook Farm', x: -105, z: 220, radius: 52, type: 'farm' },
  { name: 'Dusty Gulch', x: -225, z: 80, radius: 36, type: 'hamlet' },
  { name: 'Skyfield Airstrip', x: -300, z: -30, radius: 28, type: 'airfield' },
  { name: 'Cape Light', x: 330, z: -95, radius: 22, type: 'lighthouse' },
];
export const BRIDGES: Bridge[] = [{ x: 20, z: -151, axis: 'z', length: 44 }, { x: 158, z: -40, axis: 'x', length: 44 }];
const ROADS: Vec2[][] = [[[-55, -245], [0, -200], [20, -172], [20, -130], [-25, -55]], [[-25, -55], [20, 0], [40, 75]], [[40, 75], [85, 115], [138, 152]], [[138, 152], [215, 110], [300, 30]], [[138, 152], [195, 205], [240, 245]], [[40, 75], [-30, 150], [-105, 220]], [[-25, -55], [-110, -40], [-200, -30], [-300, -30]], [[-300, -30], [-250, 40], [-225, 80]], [[40, 75], [100, 20], [158, -40], [150, -130], [150, -225]], [[-25, -55], [-80, -100], [-118, -152]], [[300, 30], [320, -30], [330, -95]]];
const EXTRA_REGIONS: Region[] = [{ name: 'Whispering Pines', x: 60, z: -120, weight: 1.3 }, { name: 'Golden Plains', x: 200, z: 20, weight: 1.2 }, { name: 'Sunset Beach', x: -330, z: -170, weight: 1.2 }, { name: 'Driftwood Cove', x: 0, z: 350, weight: 1.2 }, { name: 'Salt Flats', x: -20, z: 200, weight: 1.1 }];
/** Footstep surface per terrain kind. */
const KIND_SURFACE: Surface[] = ['water', 'dust', 'grass', 'grass', 'dust', 'snow', 'dust', 'grass', 'grass', 'grass'];
/**
 * Color per terrain kind: 0 water, 1 sand, 2 grass, 3 dry grass, 4 rock, 5 snow, 6 road, 7-8 crop fields, 9 dark grass.
 */
export const KIND_COLORS: Vec3[] = [[0.52, 0.58, 0.55], [0.86, 0.79, 0.58], [0.40, 0.62, 0.31], [0.64, 0.63, 0.36], [0.52, 0.50, 0.47], [0.95, 0.96, 0.98], [0.47, 0.46, 0.44], [0.74, 0.64, 0.30], [0.33, 0.52, 0.24], [0.28, 0.42, 0.22]];

export const makeNoise = (seed: number) => {
  const hash = (i: number, j: number) => {
    let h = Math.imul(i, 374761393) ^ Math.imul(j, 668265263) ^ Math.imul(seed, 1274126177);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };

  const smooth = (t: number) => t * t * (3 - 2 * t);

  const n2 = (x: number, y: number) => {
    const i = Math.floor(x);
    const j = Math.floor(y);
    const u = smooth(x - i);
    const v = smooth(y - j);
    const a = hash(i, j);
    const b = hash(i + 1, j);
    const c = hash(i, j + 1);
    const d = hash(i + 1, j + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };

  const fbm = (x: number, y: number, o: number) => {
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
};

/** Catmull-Rom spline through `pts`, with `seg` points per segment. */
const catmullRom = (pts: Vec2[], seg: number) => {
  const o: Vec2[] = [];
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
};

export const genTerrain = () => {
  const { n2, fbm } = makeNoise(777);
  const gridN = GRID_N;
  const step = GRID_STEP;
  const heights = new Float32Array(gridN * gridN);
  const slopes = new Float32Array(gridN * gridN);
  const kinds = new Uint8Array(gridN * gridN);
  const roadMask = new Uint8Array(gridN * gridN);
  const colors = new Float32Array(gridN * gridN * 3);

  const smoothstep = (a: number, b: number, x: number) => {
    const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };

  const segmentDist = (px: number, pz: number, ax: number, az: number, bx: number, bz: number) => {
    const dx = bx - ax;
    const dz = bz - az;
    const l2 = dx * dx + dz * dz || 1;
    let t = ((px - ax) * dx + (pz - az) * dz) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - ax - dx * t, pz - az - dz * t);
  };

  const baseHeight = (x: number, z: number) => {
    const r = Math.hypot(x, z) / ISLAND_HALF;
    const w = (fbm(x * 0.003 + 7, z * 0.003 + 3, 3) - 0.5) * 0.5;
    const rr = r + w * (0.35 + r);
    const land = 1 - smoothstep(0.56, 0.9, rr);
    let h = -7 + land * (8.5 + 8 * fbm(x * 0.006, z * 0.006, 4));
    for (const m of MOUNTAINS) {
      const d = Math.hypot(x - m.x, z - m.z) / m.radius;
      if (d < 1) {
        const k = 1 - d;
        const s = k * k * (3 - 2 * k);
        const rg = 1 - Math.abs(2 * fbm(x * 0.012 + m.x, z * 0.012 + m.z, 4) - 1);
        h += m.height * s * (0.45 + 0.75 * rg);
      }
    }
    return h;
  };

  const rivers = RIVERS.map(r => catmullRom(r, 6));

  const carve = (x: number, z: number, h: number) => {
    let k = 0;
    for (const rv of rivers) {
      for (let i = 0; i < rv.length - 1; i++) {
        const d = segmentDist(x, z, rv[i][0], rv[i][1], rv[i + 1][0], rv[i + 1][1]);
        if (d < 11) {
          k = Math.max(k, 1 - smoothstep(4, 11, d));
        }
      }
    }
    for (const l of LAKES) {
      const d = Math.hypot(x - l.x, z - l.z);
      if (d < l.radius * 1.25) {
        k = Math.max(k, 1 - smoothstep(l.radius * 0.55, l.radius * 1.25, d));
      }
    }
    k *= 1 - smoothstep(9, 20, h);
    return k > 0 ? h + ((WATER_LEVEL - 1.05) - h) * k : h;
  };

  const flats: { x: number; z: number; radius: number; height: number }[] = [];
  for (const s of SITES) {
    const h = Math.max(WATER_LEVEL + 2.6, baseHeight(s.x, s.z));
    s.groundY = h;
    flats.push({ x: s.x, z: s.z, radius: s.radius, height: h });
  }
  const airfieldY = Math.max(WATER_LEVEL + 2.6, baseHeight(-300, -30));
  for (const z of [-120, -90, -60, 0, 30, 60]) {
    flats.push({ x: -300, z, radius: 26, height: airfieldY });
  }
  SITES[10].groundY = airfieldY;
  const bridgeY = WATER_LEVEL + 2;
  for (const b of BRIDGES) {
    const e: Vec2[] = b.axis === 'z' ? [[b.x, b.z - b.length / 2], [b.x, b.z + b.length / 2]] : [[b.x - b.length / 2, b.z], [b.x + b.length / 2, b.z]];
    for (const q of e) {
      flats.push({ x: q[0], z: q[1], radius: 9, height: bridgeY });
    }
    b.deckY = bridgeY;
  }
  for (let j = 0; j < gridN; j++) {
    for (let i = 0; i < gridN; i++) {
      const x = -ISLAND_HALF + i * step;
      const z = -ISLAND_HALF + j * step;
      let h = carve(x, z, baseHeight(x, z));
      for (const f of flats) {
        const d = Math.hypot(x - f.x, z - f.z);
        if (d < f.radius * 1.6) {
          h += (f.height - h) * (1 - smoothstep(f.radius, f.radius * 1.6, d));
        }
      }
      for (const b of BRIDGES) {
        const ux = b.axis === 'z' ? 0 : 1;
        const uz = b.axis === 'z' ? 1 : 0;
        const al = (x - b.x) * ux + (z - b.z) * uz;
        const pp = Math.abs((x - b.x) * uz - (z - b.z) * ux);
        if (Math.abs(al) < b.length / 2 - 3) {
          const k = 1 - smoothstep(7, 12, pp);
          const lim = bridgeY - 1.25;
          if (k > 0 && h > lim) {
            h += (lim - h) * k;
          }
        }
      }
      heights[j * gridN + i] = h;
    }
  }
  let maxHeight = 0;
  for (let j = 0; j < gridN; j++) {
    for (let i = 0; i < gridN; i++) {
      const k = j * gridN + i;
      const a = heights[j * gridN + Math.max(0, i - 1)];
      const b = heights[j * gridN + Math.min(gridN - 1, i + 1)];
      const c = heights[Math.max(0, j - 1) * gridN + i];
      const d = heights[Math.min(gridN - 1, j + 1) * gridN + i];
      slopes[k] = Math.hypot((b - a) / (2 * step), (d - c) / (2 * step));
      if (heights[k] > maxHeight) {
        maxHeight = heights[k];
      }
    }
  }
  const roads = ROADS.map(r => catmullRom(r, 10));
  for (const rd of roads) {
    for (const [px, pz] of rd) {
      const i0 = Math.round((px + ISLAND_HALF) / step);
      const j0 = Math.round((pz + ISLAND_HALF) / step);
      for (let dj = -1; dj <= 1; dj++) {
        for (let di = -1; di <= 1; di++) {
          const i = i0 + di;
          const j = j0 + dj;
          if (i < 0 || j < 0 || i >= gridN || j >= gridN) {
            continue;
          }
          if (Math.hypot(-ISLAND_HALF + i * step - px, -ISLAND_HALF + j * step - pz) < 3.6 && heights[j * gridN + i] > WATER_LEVEL + 0.3) {
            roadMask[j * gridN + i] = 1;
          }
        }
      }
    }
  }
  const farm = SITES[8];
  const fields: [number, number, number, number][] = [[farm.x + 62, farm.z - 18, 46, 34], [farm.x + 62, farm.z + 30, 46, 28], [farm.x - 60, farm.z + 52, 40, 30], [farm.x + 6, farm.z + 66, 50, 24]];

  const fieldAt = (x: number, z: number) => {
    for (const f of fields) {
      if (Math.abs(x - f[0]) < f[2] / 2 && Math.abs(z - f[1]) < f[3] / 2) {
        return (Math.floor((x + z) / 7) & 1) ? 7 : 8;
      }
    }
    return 0;
  };

  const regions: Region[] = [...SITES.map(s => ({ name: s.name, x: s.x, z: s.z, weight: 1 })), ...MOUNTAINS.map(m => ({ name: m.name, x: m.x, z: m.z, weight: 1.7 })), ...LAKES.map(l => ({ name: l.name, x: l.x, z: l.z, weight: 1.3 })), ...EXTRA_REGIONS];
  const regionIds = new Uint8Array(gridN * gridN);
  for (let j = 0; j < gridN; j++) {
    for (let i = 0; i < gridN; i++) {
      const k = j * gridN + i;
      const x = -ISLAND_HALF + i * step;
      const z = -ISLAND_HALF + j * step;
      const h = heights[k];
      const sl = slopes[k];
      const bio = n2(x * 0.008 + 50, z * 0.008);
      const fd = n2(x * 0.011 + 9, z * 0.011 + 4);
      let kd: number;
      if (h < WATER_LEVEL - 0.25) {
        kd = 0;
      } else if (h < WATER_LEVEL + 1.1) {
        kd = 1;
      } else if (roadMask[k]) {
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
      kinds[k] = kd;
      const c = KIND_COLORS[kd];
      const v = 0.9 + 0.2 * n2(x * 0.35, z * 0.35);
      const rk = kd === 4 ? 0.88 + 0.24 * n2(x * 0.9, z * 0.12) : 1;
      colors[k * 3] = c[0] * v * rk;
      colors[k * 3 + 1] = c[1] * v * rk;
      colors[k * 3 + 2] = c[2] * v * rk;
      let bi = 255;
      let bd = 1e9;
      if (h > WATER_LEVEL - 1.2 || Math.hypot(x, z) < ISLAND_HALF * 0.78) {
        for (let q = 0; q < regions.length; q++) {
          const d = Math.hypot(x - regions[q].x, z - regions[q].z) / regions[q].weight;
          if (d < bd) {
            bd = d;
            bi = q;
          }
        }
      }
      regionIds[k] = bi;
    }
  }

  const cellIndex = (x: number, z: number) => {
    let i = Math.round((x + ISLAND_HALF) / step);
    let j = Math.round((z + ISLAND_HALF) / step);
    i = i < 0 ? 0 : i > gridN - 1 ? gridN - 1 : i;
    j = j < 0 ? 0 : j > gridN - 1 ? gridN - 1 : j;
    return j * gridN + i;
  };

  const T = { half: ISLAND_HALF, gridN: gridN, step: step, heights: heights, slopes: slopes, kinds: kinds, colors: colors, regionIds: regionIds, regions: regions, maxHeight: maxHeight, roads, rivers: rivers, height: (x: number, z: number) => {
    let fx = (x + ISLAND_HALF) / step;
    let fz = (z + ISLAND_HALF) / step;
    if (fx < 0) {
      fx = 0;
    }
    if (fz < 0) {
      fz = 0;
    }
    if (fx > gridN - 1.001) {
      fx = gridN - 1.001;
    }
    if (fz > gridN - 1.001) {
      fz = gridN - 1.001;
    }
    const i = fx | 0;
    const j = fz | 0;
    const u = fx - i;
    const v = fz - j;
    const a = heights[j * gridN + i];
    const b = heights[j * gridN + i + 1];
    const c = heights[(j + 1) * gridN + i];
    const d = heights[(j + 1) * gridN + i + 1];
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }, slope: (x: number, z: number) => slopes[cellIndex(x, z)], kind: (x: number, z: number) => kinds[cellIndex(x, z)], region: (x: number, z: number) => regionIds[cellIndex(x, z)], surface: (x: number, z: number) => KIND_SURFACE[kinds[cellIndex(x, z)]] };
  return T;
};

// Terrain colors are authored in sRGB (the minimap canvas uses them as-is); vertex colors must be linear.
const srgbToLinear = (a: Float32Array) => {
  const o = new Float32Array(a.length);
  for (let i = 0; i < a.length; i++) {
    const c = a[i];
    o[i] = c < 0.04045 ? c * 0.0773993808 : Math.pow(c * 0.9478672986 + 0.0521327014, 2.4);
  }
  return o;
};

export type Terrain = ReturnType<typeof genTerrain>;

export const terrainMesh = (T: Terrain) => {
  const N = T.gridN;
  const ST = T.step;
  const pos = new Float32Array(N * N * 3);
  const idx = new Uint16Array((N - 1) * (N - 1) * 6);
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const k = j * N + i;
      pos[k * 3] = -T.half + i * ST;
      pos[k * 3 + 1] = T.heights[k];
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
  g.setAttribute('color', new THREE.BufferAttribute(srgbToLinear(T.colors), 3));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  g.computeVertexNormals();
  return new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true }));
};

/** Distance along the ray from `o` in direction `d` to the terrain, or Infinity. */
export const rayTerrain = (T: Terrain | null, o: Vec3, d: Vec3, maxT: number) => {
  if (!T) {
    return Infinity;
  }
  const lim = Math.min(maxT, 1500);
  if (d[1] >= 0 && o[1] > T.maxHeight + 2) {
    return Infinity;
  }
  let t = 0;
  let step = 1.2;
  if (o[1] - T.height(o[0], o[2]) < -0.6) {
    return 0;
  }
  while (t < lim) {
    t += step;
    const x = o[0] + d[0] * t;
    const z = o[2] + d[2] * t;
    if ((Math.abs(x) > T.half || Math.abs(z) > T.half) && d[1] >= 0) {
      return Infinity;
    }
    if (o[1] + d[1] * t - T.height(x, z) < 0) {
      let a = t - step;
      let b = t;
      for (let k = 0; k < 7; k++) {
        const m = (a + b) / 2;
        if (o[1] + d[1] * m - T.height(o[0] + d[0] * m, o[2] + d[2] * m) < 0) {
          b = m;
        } else {
          a = m;
        }
      }
      return b;
    }
    if (d[1] >= 0 && o[1] + d[1] * t > T.maxHeight + 2) {
      return Infinity;
    }
    step = Math.min(6, step * 1.05 + 0.03);
  }
  return Infinity;
};
