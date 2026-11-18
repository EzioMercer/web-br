import { H, R, WLV } from './config';
import { smokes } from './grenades';
import { boxes, floorY } from './world/level';
import { terrT } from './world/terrain';
import { state } from './state';
import type { Body, Box, Sphere, Vec3, Vel } from './types';

/** Collision grid cell size (m). */
const GC = 16;
const EMPTY: Box[] = [];
let GR = new Map<number, Box[]>();
let qid = 0;

/** Distance along the ray to the box (0 if `o` is inside), or Infinity. */
export function rayBox(o: Vec3, d: Vec3, mn: Vec3, mx: Vec3) {
  let t0 = 0;
  let t1 = 1e9;
  for (let i = 0; i < 3; i++) {
    const inv = 1 / (d[i] || 1e-9);
    let a = (mn[i] - o[i]) * inv;
    let b = (mx[i] - o[i]) * inv;
    if (a > b) {
      const t = a;
      a = b;
      b = t;
    }
    if (a > t0) {
      t0 = a;
    }
    if (b < t1) {
      t1 = b;
    }
    if (t0 > t1) {
      return Infinity;
    }
  }
  return t0;
}

function gkey(i: number, j: number) {
  return (i + 2048) * 4096 + (j + 2048);
}

export function gridBuild() {
  GR = new Map<number, Box[]>();
  for (const b of boxes) {
    b.s = 0;
    const i0 = Math.floor(b.min[0] / GC);
    const i1 = Math.floor(b.max[0] / GC);
    const j0 = Math.floor(b.min[2] / GC);
    const j1 = Math.floor(b.max[2] / GC);
    for (let i = i0; i <= i1; i++) {
      for (let j = j0; j <= j1; j++) {
        const k = gkey(i, j);
        let a = GR.get(k);
        if (!a) {
          a = [];
          GR.set(k, a);
        }
        a.push(b);
      }
    }
  }
}

/** Boxes in the grid cells around (x, z). */
export function near(x: number, z: number, r: number) {
  const i0 = Math.floor((x - r) / GC);
  const i1 = Math.floor((x + r) / GC);
  const j0 = Math.floor((z - r) / GC);
  const j1 = Math.floor((z + r) / GC);
  if (i0 === i1 && j0 === j1) {
    return GR.get(gkey(i0, j0)) || EMPTY;
  }
  const out: Box[] = [];
  for (let i = i0; i <= i1; i++) {
    for (let j = j0; j <= j1; j++) {
      const a = GR.get(gkey(i, j));
      if (a) {
        for (const b of a) {
          out.push(b);
        }
      }
    }
  }
  return out;
}

/** Distance along the ray to the first wall or the ground, or Infinity. Sets `state.HB` to the box hit. */
export function wallT(o: Vec3, d: Vec3, maxTIn?: number, noGlass?: boolean) {
  const maxT = maxTIn || 1e4;
  let t = terrT(o, d, Math.min(maxT, 1500));
  state.HB = null;
  const qi = ++qid;
  const dx = d[0];
  const dz = d[2];
  const ax = Math.abs(dx) < 1e-9;
  const az = Math.abs(dz) < 1e-9;
  let i = Math.floor(o[0] / GC);
  let j = Math.floor(o[2] / GC);
  const sx = dx > 0 ? 1 : -1;
  const sz = dz > 0 ? 1 : -1;
  const tdx = ax ? 1e9 : GC / Math.abs(dx);
  const tdz = az ? 1e9 : GC / Math.abs(dz);
  let tx = ax ? 1e9 : (dx > 0 ? ((i + 1) * GC - o[0]) : (i * GC - o[0])) / dx;
  let tz = az ? 1e9 : (dz > 0 ? ((j + 1) * GC - o[2]) : (j * GC - o[2])) / dz;
  for (let n = 0; n < 4000; n++) {
    const a = GR.get(gkey(i, j));
    if (a) {
      for (const b of a) {
        if (b.s === qi) {
          continue;
        }
        b.s = qi;
        if (b.off || (noGlass && b.glass)) {
          continue;
        }
        const r = rayBox(o, d, b.min, b.max);
        if (r < t) {
          t = r;
          state.HB = b;
        }
      }
    }
    const nx = tx < tz ? tx : tz;
    if (t <= nx || nx > maxT) {
      break;
    }
    if (tx < tz) {
      i += sx;
      tx += tdx;
    } else {
      j += sz;
      tz += tdz;
    }
  }
  return t;
}

export function hitBox(p: Body, b: Box) {
  return !b.off && p.x + R > b.min[0] && p.x - R < b.max[0] && p.y + (p.h || H) > b.min[1] && p.y < b.max[1] && p.z + R > b.min[2] && p.z - R < b.max[2];
}

export function move(p: Body, v: Vel, dt: number) {
  const g0 = p.g;
  const half = state.TERR ? state.TERR.half - 3 : 1e9;
  const ox = p.x;
  p.x += v.x * dt;
  for (const b of near(p.x, p.z, R + 0.6)) {
    if (hitBox(p, b)) {
      if (p.g && b.max[1] - p.y <= 0.55) {
        const y0 = p.y;
        p.y = b.max[1] + 1e-4;
        if (!near(p.x, p.z, R + 0.6).some(q => hitBox(p, q))) {
          continue;
        }
        p.y = y0;
      }
      p.x = v.x > 0 ? b.min[0] - R - 1e-4 : b.max[0] + R + 1e-4;
      v.x = 0;
    }
  }
  if (state.TERR) {
    if (Math.abs(p.x) > half) {
      p.x = Math.max(-half, Math.min(half, p.x));
    }
    const nf = state.TERR.h(p.x, p.z);
    if (nf - p.y > Math.abs(p.x - ox) * 1.2 + 0.12 || (nf < WLV - 1.4 && nf < state.TERR.h(ox, p.z))) {
      p.x = ox;
      v.x = 0;
    }
  }
  const oz = p.z;
  p.z += v.z * dt;
  for (const b of near(p.x, p.z, R + 0.6)) {
    if (hitBox(p, b)) {
      if (p.g && b.max[1] - p.y <= 0.55) {
        const y0 = p.y;
        p.y = b.max[1] + 1e-4;
        if (!near(p.x, p.z, R + 0.6).some(q => hitBox(p, q))) {
          continue;
        }
        p.y = y0;
      }
      p.z = v.z > 0 ? b.min[2] - R - 1e-4 : b.max[2] + R + 1e-4;
      v.z = 0;
    }
  }
  if (state.TERR) {
    if (Math.abs(p.z) > half) {
      p.z = Math.max(-half, Math.min(half, p.z));
    }
    const nf = state.TERR.h(p.x, p.z);
    if (nf - p.y > Math.abs(p.z - oz) * 1.2 + 0.12 || (nf < WLV - 1.4 && nf < state.TERR.h(p.x, oz))) {
      p.z = oz;
      v.z = 0;
    }
  }
  p.g = false;
  p.y += v.y * dt;
  for (const b of near(p.x, p.z, R + 0.6)) {
    if (hitBox(p, b)) {
      if (v.y <= 0) {
        p.y = b.max[1] + 1e-4;
        p.g = true;
      } else {
        p.y = b.min[1] - (p.h || H) - 1e-4;
      }
      v.y = 0;
    }
  }
  const fy = floorY(p.x, p.z);
  if (p.y <= fy) {
    p.y = fy;
    if (v.y < 0) {
      v.y = 0;
    }
    p.g = true;
  } else if (g0 && !p.g && v.y <= 0 && p.y - fy < 0.45) {
    p.y = fy;
    v.y = 0;
    p.g = true;
  }
}

/** Accelerates `v` toward direction (wx, wz), up to speed `cap` along it. */
export function accel(v: Vel, wx: number, wz: number, cap: number, rate: number, dt: number) {
  const add = cap - (v.x * wx + v.z * wz);
  if (add <= 0) {
    return;
  }
  const a = Math.min(rate * dt, add);
  v.x += a * wx;
  v.z += a * wz;
}

/** Dry, gentle ground with room to stand. */
export function freeSpot(x: number, z: number) {
  const T = state.TERR!;
  if (T.h(x, z) < WLV + 0.4 || T.slope(x, z) > 0.55) {
    return false;
  }

  const y = floorY(x, z);
  return !near(x, z, R + 1).some(q => hitBox({ x, y, z, h: H }, q));
}

// the surface under a point: the terrain, or the top of a floor, roof or crate no higher than y0
export function groundAt(x: number, z: number, y0: number) {
  let g = floorY(x, z);
  for (const q of near(x, z, 0.5)) {
    if (!q.off && !q.glass && !q.door && x + 0.3 > q.min[0] && x - 0.3 < q.max[0] && z + 0.3 > q.min[2] && z - 0.3 < q.max[2] && q.max[1] <= y0 && q.max[1] > g) {
      g = q.max[1];
    }
  }
  return g;
}

/** Point inside (or touching) a box. */
export function inB(x: number, y: number, z: number) {
  return near(x, z, 1).some(b => !b.off && x > b.min[0] - 0.06 && x < b.max[0] + 0.06 && y > b.min[1] - 0.06 && y < b.max[1] + 0.06 && z > b.min[2] - 0.06 && z < b.max[2] + 0.06);
}

function segSph(o: Vec3, p: Vec3, s: Sphere) {
  const dx = p[0] - o[0];
  const dy = p[1] - o[1];
  const dz = p[2] - o[2];
  const l2 = dx * dx + dy * dy + dz * dz || 1;
  let t = ((s.x - o[0]) * dx + (s.y - o[1]) * dy + (s.z - o[2]) * dz) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(o[0] + dx * t - s.x, o[1] + dy * t - s.y, o[2] + dz * t - s.z) < s.r;
}

/** Line of sight from `o` to `p`: no walls (glass is see-through) and no smoke. */
export function clear(o: Vec3, p: Vec3) {
  const dx = p[0] - o[0];
  const dy = p[1] - o[1];
  const dz = p[2] - o[2];
  const l = Math.hypot(dx, dy, dz);
  return wallT(o, [dx / l, dy / l, dz / l], l, true) > l && !smokes.some(s => segSph(o, p, s));
}
