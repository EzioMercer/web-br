import { WATER_LEVEL } from '../../config';
import { catmullRom } from '../../utils/catmullRom';
import {
  BRIDGES,
  EXTRA_REGIONS,
  GRID_N,
  GRID_STEP,
  ISLAND_HALF,
  KIND_COLORS,
  KIND_SURFACE,
  LAKES,
  MOUNTAINS,
  RIVERS,
  ROADS,
  SITES,
} from './constants';
import { makeNoise } from './makeNoise';
import type { Vec2 } from '../../types';
import type { Region } from './types';
import { smoothstep } from '../../utils/smoothstep';
import { Axis } from '../../types';

export const genTerrain = () => {
  const { n2, fbm } = makeNoise(777);
  const gridN = GRID_N;
  const step = GRID_STEP;
  const heights = new Float32Array(gridN * gridN);
  const slopes = new Float32Array(gridN * gridN);
  const kinds = new Uint8Array(gridN * gridN);
  const roadMask = new Uint8Array(gridN * gridN);
  const colors = new Float32Array(gridN * gridN * 3);

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
    const e: Vec2[] = b.axis === Axis.Z
      ? [[b.x, b.z - b.length / 2], [b.x, b.z + b.length / 2]]
      : [[b.x - b.length / 2, b.z], [b.x + b.length / 2, b.z]];

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
        const ux = b.axis === Axis.Z ? 0 : 1;
        const uz = b.axis === Axis.Z ? 1 : 0;
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

          if (Math.hypot(-ISLAND_HALF + i * step - px, -ISLAND_HALF + j * step - pz) < 3.6
            && heights[j * gridN + i] > WATER_LEVEL + 0.3) {
            roadMask[j * gridN + i] = 1;
          }
        }
      }
    }
  }

  const farm = SITES[8];
  const fields: [number, number, number, number][] = [
    [farm.x + 62, farm.z - 18, 46, 34],
    [farm.x + 62, farm.z + 30, 46, 28],
    [farm.x - 60, farm.z + 52, 40, 30],
    [farm.x + 6, farm.z + 66, 50, 24],
  ];

  const fieldAt = (x: number, z: number) => {
    for (const f of fields) {
      if (Math.abs(x - f[0]) < f[2] / 2 && Math.abs(z - f[1]) < f[3] / 2) {
        return (Math.floor((x + z) / 7) & 1) ? 7 : 8;
      }
    }

    return 0;
  };

  const regions: Region[] = [
    ...SITES.map(s => ({ name: s.name, x: s.x, z: s.z, weight: 1 })),
    ...MOUNTAINS.map(m => ({ name: m.name, x: m.x, z: m.z, weight: 1.7 })),
    ...LAKES.map(l => ({ name: l.name, x: l.x, z: l.z, weight: 1.3 })),
    ...EXTRA_REGIONS,
  ];
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

  const T = {
    half: ISLAND_HALF,
    gridN: gridN,
    step: step,
    heights: heights,
    slopes: slopes,
    kinds: kinds,
    colors: colors,
    regionIds: regionIds,
    regions: regions,
    maxHeight: maxHeight,
    roads,
    rivers: rivers,
    height: (x: number, z: number) => {
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
    },
    slope: (x: number, z: number) => slopes[cellIndex(x, z)],
    kind: (x: number, z: number) => kinds[cellIndex(x, z)],
    region: (x: number, z: number) => regionIds[cellIndex(x, z)],
    surface: (
      x: number,
      z: number,
    ) => KIND_SURFACE[kinds[cellIndex(x, z)]],
  };

  return T;
};
