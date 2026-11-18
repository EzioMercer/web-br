import { WLV } from '../config';
import { BRG, SITES, genTerrain, mkNoise, terrMesh } from './terrain';
import type { Bridge } from './terrain';
import type { Face, Footprint, MapBox, MapDoor, MapGlass, MapLoot, Stairwell, Vec2 } from '../types';

/** Wall opening centred at `m` along the wall, `w` wide: door, window or open gate. */
interface Opening {
  m: number;
  w: number;
  t: 'd' | 'w' | 'g';
  /** Window sill height. */
  s?: number;
  /** Window top height. */
  top?: number;
  /** Door (or gate) height. */
  dh?: number;
  col?: number;
}

/** Window style for the walls of a shell. */
interface ShellWindow {
  w: number;
  s: number;
  top: number;
}

/** Optional building parameters. */
interface BuildOpts {
  col?: number;
  roof?: number;
  /** Loot tier. */
  tier?: number;
  h?: number;
  /** Gate width and height. */
  gate?: number;
  gh?: number;
  /** Outer size of a tower. */
  out?: number;
  face?: Face;
  /** Footprint kind. */
  fpn?: string;
}

export type GeneratedWorld = ReturnType<typeof genWorld>;

export function genWorld() {
  const T = genTerrain();
  let sd = 4242;

  const rnd = () => {
    sd = (Math.imul(sd, 1664525) + 1013904223) >>> 0;
    return sd / 4294967296;
  };

  const R = (a: number, b: number) => a + rnd() * (b - a);

  const pick = <T>(a: T[]) => a[(rnd() * a.length) | 0];

  const RI = (a: number, b: number) => Math.floor(R(a, b + 1));

  const B: MapBox[] = [];
  const G: MapGlass[] = [];
  const D: MapDoor[] = [];
  const LOOT: MapLoot[] = [];
  const FP: Footprint[] = [];
  const STR: Stairwell[] = [];

  const wb = (x: number, z: number, w: number, d: number, h: number, c: number, y?: number, nc?: boolean) => B.push([x, z, w, d, h, c, y, nc]);

  const glass = (ax: 'x' | 'z', c: number, m: number, w: number, y: number, h: number) => G.push(ax === 'x' ? [m, c, w, 0.1, h, y] : [c, m, 0.1, w, h, y]);

  const door = (ax: 'x' | 'z', c: number, m: number, w: number, y: number, h: number, col?: number) => D.push({ ax, c, m, w, y, h, col: col || 0x6b4a2a });

  const loot = (x: number, z: number, y: number, t?: number) => LOOT.push([x, z, y, t || 1]);

  /** Wall along `ax` at coordinate `c`, from `a` to `b`, with openings cut out of it. */
  const wall = (ax: 'x' | 'z', c: number, a: number, b: number, Y: number, h: number, col: number, opsIn?: Opening[], thIn?: number) => {
    const th = thIn || 0.4;
    const ops = (opsIn || []).slice().sort((p, q) => p.m - q.m);
    let q = a;

    const seg = (u: number, v: number, yy: number, hh: number) => {
      if (v - u < 0.06 || hh < 0.05) {
        return;
      }
      const m = (u + v) / 2;
      const l = v - u;
      if (ax === 'x') {
        wb(m, c, l, th, hh, col, yy);
      } else {
        wb(c, m, th, l, hh, col, yy);
      }
    };

    for (const o of ops) {
      const u = o.m - o.w / 2;
      const v = o.m + o.w / 2;
      seg(q, u, Y, h);
      if (o.t === 'w') {
        const s = o.s ?? 0.9;
        const tp = o.top ?? 2.3;
        seg(u, v, Y, s);
        seg(u, v, Y + tp, h - tp);
        glass(ax, c, o.m, o.w, Y + s, tp - s);
      } else {
        const dh = o.dh ?? 2.3;
        seg(u, v, Y + dh, h - dh);
        if (o.t === 'd') {
          door(ax, c, o.m, o.w, Y, dh, o.col);
        }
      }
      q = v;
    }
    seg(q, b, Y, h);
  };

  const fp = (x: number, z: number, w: number, d: number, n?: string) => FP.push([x, z, w, d, n || '']);

  const insideFP = (x: number, z: number, m: number) => FP.some(f => Math.abs(x - f[0]) < f[2] / 2 + m && Math.abs(z - f[1]) < f[3] / 2 + m);

  const gap = (a: number, c: number) => Math.abs(a - c);

  /** Drops windows that would overlap a door. */
  const clearOf = (ops: Opening[], keep?: boolean) => ops.filter(q => q.t === 'd' || keep || ops.every(o => o === q || o.t !== 'd' || gap(o.m, q.m) > (o.w + q.w) / 2 + 0.15));

  const roof = (cx: number, cz: number, w: number, d: number, Y: number, rc: number) => {
    wb(cx, cz, w + 0.8, d + 0.8, 0.3, rc, Y);
    wb(cx, cz, w - 1.5, d + 0.8, 0.45, rc, Y + 0.3);
  };

  const tbl = (x: number, z: number, Y: number, w?: number, d?: number) => {
    wb(x, z, w || 1.6, d || 1, 0.8, 0x6e4a2a, Y);
  };

  const carAt = (x: number, z: number, Y: number, al: 'x' | 'z') => {
    const c = pick([0xb03a2e, 0x2e6db0, 0xd9d9d9, 0x2e2e2e, 0xc9a227, 0x3a8a4a]);
    const w = al === 'x' ? 4.4 : 1.9;
    const d = al === 'x' ? 1.9 : 4.4;
    wb(x, z, w, d, 0.9, c, Y + 0.35);
    wb(x, z, al === 'x' ? 2.4 : 1.7, al === 'x' ? 1.7 : 2.4, 0.7, 0x9fb7c8, Y + 1.25);
  };

  /* ----- house (1 floor) ----- */
  const house = (cx: number, cz: number, w: number, d: number, Y: number, o: BuildOpts = {}) => {
    const h = 3.2;
    const col = o.col || pick([0xe4dac3, 0xd9c8a8, 0xcfd6c2, 0xe8c8a0, 0xc9d3d9]);
    const rc = o.roof || pick([0x8a4a3a, 0x6b6358, 0x4a5a6a, 0x7a5a3a]);
    const x0 = cx - w / 2;
    const x1 = cx + w / 2;
    const z0 = cz - d / 2;
    const z1 = cz + d / 2;
    const dm = cx + R(-w / 6, w / 6);
    const pz = cz - d / 6;
    wall('x', z1, x0, x1, Y, h, col, clearOf([{ m: dm, w: 1.4, t: 'd' }, { m: cx - w / 2 + 1.6, w: 1.6, t: 'w' }, { m: cx + w / 2 - 1.6, w: 1.6, t: 'w' }]));
    wall('x', z0, x0, x1, Y, h, col, clearOf([...(rnd() < 0.5 ? [{ m: cx, w: 1.3, t: 'd' } as Opening] : []), { m: cx - w / 3, w: 1.6, t: 'w' }, { m: cx + w / 3, w: 1.6, t: 'w' }]));
    wall('z', x0, z0, z1, Y, h, col, [{ m: cz, w: 1.6, t: 'w' }]);
    wall('z', x1, z0, z1, Y, h, col, [{ m: cz, w: 1.6, t: 'w' }]);
    wall('x', pz, x0, x1, Y, h, col, [{ m: cx + R(-w / 4, w / 4), w: 1.2, t: 'd' }]);
    roof(cx, cz, w, d, Y + h, rc);
    wb(x1 - 1.4, cz + 1, 1, 1, 1.6, 0x7a5a4a, Y + h + 0.4);
    tbl(cx + R(-1.5, 1.5), (pz + z1) / 2 + 0.4, Y);
    wb(x0 + 1.2, (pz + z1) / 2 + 1, 0.9, 2.4, 0.9, pick([0x8a4a3a, 0x4a5a6a]), Y);
    wb(cx + w / 4, (z0 + pz) / 2 - 0.8, 2, 1, 0.6, 0xd8d2c4, Y);
    wb(x1 - 0.8, (z0 + pz) / 2, 0.5, 2.6, 1.8, 0x6e4a2a, Y);
    loot(x0 + 1.5, z1 - 1.6, Y, 1);
    loot(x1 - 1.6, z0 + 1.6, Y, o.tier || 1);
    fp(cx, cz, w + 1, d + 1, 'house');
    return { x0, x1, z0, z1 };
  };

  /* ----- villa / apartment block (2 floors, stairs) ----- */
  const villa = (cx: number, cz: number, w: number, d: number, Y: number, o: BuildOpts = {}) => {
    const h = 3.2;
    const col = o.col || pick([0xe8dcc0, 0xd8c9ad, 0xc9d3d9, 0xd7b9a4]);
    const rc = o.roof || 0x6b6358;
    const x0 = cx - w / 2;
    const x1 = cx + w / 2;
    const z0 = cz - d / 2;
    const z1 = cz + d / 2;
    const Y2 = Y + 3.5;
    const dm = cx + R(1, w / 5);
    const pz = cz + d / 6;
    wall('x', z1, x0, x1, Y, h, col, clearOf([{ m: dm, w: 1.6, t: 'd', col: 0x4a3a2a }, { m: cx - w / 3, w: 1.8, t: 'w' }, { m: cx + w / 2 - 2, w: 1.8, t: 'w' }, { m: cx - w / 2 + 1.8, w: 1.4, t: 'w' }]));
    wall('x', z0, x0, x1, Y, h, col, [{ m: cx + w / 4, w: 1.4, t: 'd' }, { m: cx, w: 1.8, t: 'w' }, { m: cx - w / 3, w: 1.8, t: 'w' }]);
    wall('z', x0, z0, z1, Y, h, col, [{ m: cz + 1, w: 1.8, t: 'w' }]);
    wall('z', x1, z0, z1, Y, h, col, [{ m: cz - 1, w: 1.8, t: 'w' }]);
    wall('x', pz, x0 + 9, x1, Y, h, col, [{ m: cx + R(2, w / 4), w: 1.3, t: 'd' }]);
    for (let i = 1; i <= 8; i++) {
      wb(x0 + 1.4 + (i - 0.5), z0 + 1.5, 1, 2.3, 0.4375 * i, 0x8a6a4a, Y);
    }
    // upper slab: everything except the stairwell hole (x0..x0+9.4, z0..z0+3)
    wb((x0 + 9.4 + x1) / 2, (z0 + z1) / 2, x1 - x0 - 9.4, d, 0.3, 0xa89b84, Y + 3.2);
    wb(x0 + 4.7, (z0 + 3 + z1) / 2, 9.4, z1 - z0 - 3, 0.3, 0xa89b84, Y + 3.2);
    wall('x', z1, x0, x1, Y2, h, col, [{ m: cx - w / 3, w: 1.8, t: 'w' }, { m: cx, w: 1.8, t: 'w' }, { m: cx + w / 4, w: 1.8, t: 'w' }]);
    wall('x', z0, x0, x1, Y2, h, col, [{ m: cx - w / 4, w: 1.8, t: 'w' }, { m: cx + w / 4, w: 1.8, t: 'w' }]);
    wall('z', x0, z0, z1, Y2, h, col, [{ m: cz, w: 1.8, t: 'w' }]);
    wall('z', x1, z0, z1, Y2, h, col, [{ m: cz, w: 1.8, t: 'w' }]);
    wall('z', cx + w / 6, z0 + 3, z1, Y2, h, col, [{ m: cz + d / 6, w: 1.2, t: 'd' }]);
    roof(cx, cz, w, d, Y2 + h, rc);
    wb(cx + w / 4, pz + 2, 2.2, 1, 0.8, 0x6e4a2a, Y);
    wb(cx - w / 3, cz + d / 4, 2, 1, 0.6, 0xd8d2c4, Y2);
    loot(x1 - 1.6, z0 + 2, Y, o.tier || 1);
    loot(x0 + 1.6, z1 - 1.6, Y, 1);
    loot(x1 - 1.6, z1 - 1.6, Y2, o.tier || 1);
    loot(x0 + 1.8, z0 + 4.2, Y2, 1);
    fp(cx, cz, w + 1, d + 1, 'villa');
  };

  /* ----- shop ----- */
  const shop = (cx: number, cz: number, w: number, d: number, Y: number, o: BuildOpts = {}) => {
    const h = 3.8;
    const col = o.col || pick([0xd8c9ad, 0xc9a77a, 0xb9c9d3, 0xe0b9a4]);
    const sign = pick([0xd9342b, 0x2b7bd9, 0xe0b02b, 0x2bb36b, 0x9b3ad9]);
    const x0 = cx - w / 2;
    const x1 = cx + w / 2;
    const z0 = cz - d / 2;
    const z1 = cz + d / 2;
    const ops: Opening[] = [{ m: cx, w: 1.8, t: 'd', col: 0x3a3a3a }];
    for (let x = x0 + 2.4; x < x1 - 2; x += 4.2) {
      if (gap(x, cx) > 2.9) {
        ops.push({ m: x, w: 3.2, t: 'w', s: 0.35, top: 2.9 });
      }
    }
    wall('x', z1, x0, x1, Y, h, col, ops);
    wall('x', z0, x0, x1, Y, h, col, [{ m: x1 - 3, w: 1.3, t: 'd' }, { m: x0 + 3, w: 1.6, t: 'w', s: 1.6, top: 2.7 }]);
    wall('z', x0, z0, z1, Y, h, col, [{ m: cz + 1, w: 1.6, t: 'w' }]);
    wall('z', x1, z0, z1, Y, h, col, []);
    wall('x', z0 + 3.4, x0, x1, Y, h, col, [{ m: x1 - 3, w: 1.2, t: 'd' }]);
    roof(cx, cz, w, d, Y + h, 0x5a5a60);
    wb(cx, z1 + 0.35, 5, 0.3, 0.8, sign, Y + 3.95);
    wb(cx, z0 + 5.4, w * 0.55, 0.8, 1.1, 0x7a5a3a, Y);
    wb(cx - w / 4, cz + 1, w * 0.28, 0.5, 2, 0x8a7a6a, Y);
    wb(cx + w / 4, cz + 1, w * 0.28, 0.5, 2, 0x8a7a6a, Y);
    loot(x0 + 1.6, z0 + 1.8, Y, o.tier || 1);
    loot(cx + w / 4, z0 + 5, Y, o.tier || 1);
    fp(cx, cz, w + 1, d + 1.4, 'shop');
  };

  /* ----- mall (landmark) ----- */
  const mall = (cx: number, cz: number, Y: number) => {
    const w = 56;
    const d = 34;
    const h = 5.5;
    const x0 = cx - 28;
    const x1 = cx + 28;
    const z0 = cz - 17;
    const z1 = cz + 17;
    const col = 0xd8d2c4;
    const az0 = cz - 5;
    const az1 = cz + 5;
    const fr: Opening[] = [];
    for (const xx of [-24, -17, -3.5, 3.5, 17, 24]) {
      fr.push({ m: cx + xx, w: 4, t: 'w', s: 0.5, top: 4.4 });
    }
    for (const xx of [-10, 10]) {
      fr.push({ m: cx + xx - 0.9, w: 1.7, t: 'd', dh: 3.4, col: 0x4a5a6a });
      fr.push({ m: cx + xx + 0.9, w: 1.7, t: 'd', dh: 3.4, col: 0x4a5a6a });
    }
    wall('x', z1, x0, x1, Y, h, col, fr);
    wall('x', z0, x0, x1, Y, h, col, [{ m: cx + 20, w: 1.8, t: 'd', dh: 3 }, { m: cx - 15, w: 3, t: 'w', s: 3.6, top: 4.8 }, { m: cx + 3, w: 3, t: 'w', s: 3.6, top: 4.8 }, { m: cx + 12, w: 3, t: 'w', s: 3.6, top: 4.8 }]);
    wall('z', x0, z0, z1, Y, h, col, [{ m: cz, w: 1.8, t: 'd', dh: 3 }, { m: cz - 9, w: 3, t: 'w', s: 1.2, top: 3.6 }, { m: cz + 9, w: 3, t: 'w', s: 1.2, top: 3.6 }]);
    wall('z', x1, z0, z1, Y, h, col, [{ m: cz, w: 1.8, t: 'd', dh: 3 }, { m: cz - 9, w: 3, t: 'w', s: 1.2, top: 3.6 }, { m: cz + 9, w: 3, t: 'w', s: 1.2, top: 3.6 }]);
    wb(cx, cz, w + 1, d + 1, 0.4, 0x77787a, Y + h);
    wb(cx, z1 + 0.4, w, 0.5, 0.9, 0xc9342b, Y + h + 0.2);
    // north row: six shops (8.67 m wide, 12 deep) facing the atrium
    for (let i = 0; i < 6; i++) {
      const sx0 = x0 + 2 + i * (w - 4) / 6;
      const sx1 = sx0 + (w - 4) / 6;
      const sm = (sx0 + sx1) / 2;
      wall('z', sx0, z0, az0, Y, h, col, []);
      wall('x', az0, sx0, sx1, Y, h, col, [{ m: sm - 1.5, w: 1.6, t: 'd', col: 0x3a3a3a }, { m: sm + 1.7, w: 3, t: 'w', s: 0.4, top: 3 }]);
      wb(sm, z0 + 2, sx1 - sx0 - 2, 0.8, 1.1, 0x7a5a3a, Y);
      wb(sm, z0 + 6, sx1 - sx0 - 3, 0.5, 2, 0x8a7a6a, Y);
      loot(sm - 2.5, z0 + 4, Y, 2);
    }
    wall('z', x1 - 2, z0, az0, Y, h, col, []);
    // south row: shops either side of the two entrance bays
    for (const [a, b] of [[-26, -13.5], [-6.5, 6.5], [13.5, 26]]) {
      const sx0 = cx + a;
      const sx1 = cx + b;
      const sm = (sx0 + sx1) / 2;
      wall('x', az1, sx0, sx1, Y, h, col, [{ m: sm - 1.2, w: 1.6, t: 'd', col: 0x3a3a3a }, { m: sm + Math.min(2.6, (b - a) / 2 - 1.8), w: 3, t: 'w', s: 0.4, top: 3 }]);
      wb(sm, z1 - 2, sx1 - sx0 - 2, 0.8, 1.1, 0x7a5a3a, Y);
      wb(sm, z1 - 6, sx1 - sx0 - 3, 0.5, 2, 0x8a7a6a, Y);
      loot(sm - 2.5, z1 - 4, Y, 2);
    }
    for (const xx of [-26, -13.5, -6.5, 6.5, 13.5, 26]) {
      wall('z', cx + xx, az1, z1, Y, h, col, []);
    }
    for (const xx of [-18, -6, 6, 18]) {
      wb(cx + xx, cz, 1, 1, h - 0.2, 0xbfb8a8, Y);
      wb(cx + xx + 3, cz + 2.5, 2.2, 1.4, 0.5, 0x4a7a3a, Y);
      tbl(cx + xx - 3, cz - 2.5, Y, 1.4, 1.4);
    }
    loot(cx, cz - 2.5, Y, 2);
    loot(cx - 12, cz + 2.5, Y, 2);
    loot(cx + 12, cz - 2.5, Y, 2);
    fp(cx, cz, w + 2, d + 2, 'mall');
    // car park south of the mall
    wb(cx, z1 + 17, w + 6, 26, 0.02, 0x55585a, Y + 0.03, true);
    for (let r = 0; r < 3; r++) {
      for (let c = -4; c <= 4; c++) {
        if (rnd() < 0.55) {
          carAt(cx + c * 6, z1 + 10 + r * 8, Y, 'z');
        }
      }
    }
    for (const xx of [-24, 0, 24]) {
      wb(cx + xx, z1 + 22, 0.5, 0.5, 7, 0x666, Y);
    }
    fp(cx, z1 + 17, w + 6, 26, 'carpark');
  };

  /* ----- warehouse / hangar ----- */
  const warehouse = (cx: number, cz: number, w: number, d: number, Y: number, o: BuildOpts = {}) => {
    const h = o.h || 6.5;
    const col = o.col || 0x9aa4ab;
    const x0 = cx - w / 2;
    const x1 = cx + w / 2;
    const z0 = cz - d / 2;
    const z1 = cz + d / 2;
    const gw = o.gate || 6;
    wall('x', z1, x0, x1, Y, h, col, [{ m: cx, w: gw, t: 'g', dh: o.gh || 4.5 }, { m: x1 - 3, w: 1.4, t: 'd' }]);
    wall('x', z0, x0, x1, Y, h, col, [{ m: cx - w / 3, w: 2, t: 'w', s: 3.8, top: 5.4 }, { m: cx + w / 3, w: 2, t: 'w', s: 3.8, top: 5.4 }, { m: cx, w: 1.4, t: 'd' }]);
    wall('z', x0, z0, z1, Y, h, col, [{ m: cz, w: 1.4, t: 'd' }, { m: cz - d / 4, w: 2, t: 'w', s: 3.8, top: 5.4 }, { m: cz + d / 4, w: 2, t: 'w', s: 3.8, top: 5.4 }]);
    wall('z', x1, z0, z1, Y, h, col, [{ m: cz - d / 4, w: 2, t: 'w', s: 3.8, top: 5.4 }, { m: cz + d / 4, w: 2, t: 'w', s: 3.8, top: 5.4 }]);
    wb(cx, cz, w + 0.8, d + 0.8, 0.4, 0x6a7077, Y + h);
    const rows = Math.max(2, Math.floor((w - 10) / 6));
    for (let i = 0; i < rows; i++) {
      const sx = x0 + 5 + i * ((w - 10) / Math.max(1, rows - 1));
      wb(sx, cz - d / 6, 1.2, d * 0.45, 2.8, 0x7a6a5a, Y);
    }
    for (let i = 0; i < 4; i++) {
      wb(x0 + 3 + rnd() * (w - 6), z1 - 3 - rnd() * 3, 1.4, 1.4, 1.3, 0x9a7448, Y);
    }
    wb(x0 + 3.6, z0 + 3.6, 7, 0.4, 3, col, Y);
    wall('z', x0 + 7, z0, z0 + 7, Y, 3, col, [{ m: z0 + 4, w: 1.2, t: 'd' }]);
    wb(x0 + 3.5, z0 + 3.5, 6, 6, 0.3, 0x6a7077, Y + 3, true);
    loot(x0 + 2.5, z0 + 2.5, Y, o.tier || 1);
    loot(cx + w / 4, cz, Y, o.tier || 1);
    loot(x1 - 2, z1 - 3, Y, 1);
    fp(cx, cz, w + 1, d + 1, 'warehouse');
  };

  const hangar = (cx: number, cz: number, Y: number) => {
    const w = 22;
    const d = 30;
    const h = 9;
    warehouse(cx, cz, w, d, Y, { h, gate: 14, gh: 7, col: 0xb7bcc2, tier: 2 });
    wb(cx, cz + 2, 3, 12, 3, 0xd9d9d9, Y);
    wb(cx, cz - 1, 18, 3, 0.3, 0xd9d9d9, Y + 2);
    wb(cx, cz - 6.5, 1, 5, 0.2, 0xd9d9d9, Y + 3.4);
    wb(cx, cz - 7, 6, 0.3, 1.8, 0xd9d9d9, Y + 3.4);
  };

  /* ----- enterable structures: hollow shells with a door, stair towers with a glazed lookout, silos ----- */
  /** Local offset rotated so the local +z side faces `f`. */
  const rot = (f: Face, lx: number, lz: number): Vec2 => f === 's' ? [lx, lz] : f === 'n' ? [-lx, -lz] : f === 'e' ? [lz, -lx] : [-lz, lx];

  const rrect = (f: Face, lx: number, lz: number, sx: number, sz: number) => {
    const [a, b] = rot(f, lx, lz);
    return f === 'e' || f === 'w' ? [a, b, sz, sx] : [a, b, sx, sz];
  };

  const shell = (cx: number, cz: number, Y: number, out: number, h: number, col: number, face: Face, win: ShellWindow | null) => {
    const x0 = cx - out / 2;
    const x1 = cx + out / 2;
    const z0 = cz - out / 2;
    const z1 = cz + out / 2;

    const dd = (m: number): Opening[] => [{ m, w: 1.4, t: 'd', col: 0x4a4036 }];

    const ww = (m: number): Opening[] => win && h >= 3.2 ? [{ m, w: win.w, t: 'w', s: win.s, top: win.top }] : [];

    const op = (sd: Face, m: number) => face === sd ? dd(m) : ww(m);

    wall('x', z1, x0 - 0.2, x1 + 0.2, Y, h, col, op('s', cx));
    wall('x', z0, x0 - 0.2, x1 + 0.2, Y, h, col, op('n', cx));
    wall('z', x1, z0, z1, Y, h, col, op('e', cz));
    wall('z', x0, z0, z1, Y, h, col, op('w', cz));
  };

  const stairTower = (cx: number, cz: number, Y: number, o: BuildOpts = {}) => {
    const out = o.out || 6.4;
    const f = o.face || 's';
    const col = o.col || 0xbfc4c8;
    const RISE = 0.45;
    const sw = 1.2;
    const inn = out - 0.4;
    const hi = inn / 2;
    const TD = 0.8;
    // one loop of stair cells around the inside of the shaft (local frame, door on +z): up the west wall, across the north wall, down the east wall, back along the south wall
    const n1 = Math.floor((inn - 1 - sw) / TD);
    const n2 = Math.floor((inn - 2 * sw) / TD);
    const t1 = (inn - 1 - sw) / n1;
    const t2 = (inn - 2 * sw) / n2;
    /** Stair cells: local centre x and z, size x and z. */
    const C: [number, number, number, number][] = [];
    for (let j = 0; j < n1; j++) {
      C.push([-hi + sw / 2, hi - 1 - t1 * (j + 0.5), sw, t1]);
    }
    C.push([-hi + sw / 2, -hi + sw / 2, sw, sw]);
    for (let j = 0; j < n2; j++) {
      C.push([-hi + sw + t2 * (j + 0.5), -hi + sw / 2, t2, sw]);
    }
    C.push([hi - sw / 2, -hi + sw / 2, sw, sw]);
    for (let j = 0; j < n2; j++) {
      C.push([hi - sw / 2, -hi + sw + t2 * (j + 0.5), sw, t2]);
    }
    C.push([hi - sw / 2, hi - sw / 2, sw, sw]);
    for (let j = 0; j < n2; j++) {
      C.push([hi - sw - t2 * (j + 0.5), hi - sw / 2, t2, sw]);
    }
    const N = Math.max(C.length, Math.round((o.h || 14) / RISE) - 1);
    const hf = (N + 1) * RISE;
    const rec: Stairwell = { cx, cz, Y, hf, face: f, tr: [] };
    const last: (typeof C)[number][] = [];
    for (let k = 1; k <= N; k++) {
      const c = C[(k - 1) % C.length];
      const [a, b, w, d] = rrect(f, c[0], c[1], c[2], c[3]);
      wb(cx + a, cz + b, w, d, 0.45, 0x8a6a4a, Y + k * RISE - 0.45);
      rec.tr.push([cx + a, cz + b, Y + k * RISE]);
      if (k * RISE > hf - 2.3) {
        last.push(c);
      }
    }
    for (let y = 0; y < hf - 0.01; y += 4) {
      const hh = Math.min(4, hf - y);
      shell(cx, cz, Y + y, out, hh, col, y === 0 ? f : '-', y === 0 ? { w: 1.2, s: 1, top: 2.4 } : { w: 0.9, s: 1, top: 2.6 });
    }
    // lookout floor: a grid of cells, minus the ones above the last few treads (headroom)
    {
      const G = Math.round(inn / 0.4);
      const cs = inn / G;
      for (let r = 0; r < G; r++) {
        let run = -1;
        for (let q = 0; q <= G; q++) {
          const x0 = -hi + q * cs;
          const z0 = -hi + r * cs;
          let free = q < G;
          if (free) {
            for (const c of last) {
              if (x0 < c[0] + c[2] / 2 + 0.05 && x0 + cs > c[0] - c[2] / 2 - 0.05 && z0 < c[1] + c[3] / 2 + 0.05 && z0 + cs > c[1] - c[3] / 2 - 0.05) {
                free = false;
                break;
              }
            }
          }
          if (free && run < 0) {
            run = q;
          }
          if (!free && run >= 0) {
            const xa = -hi + run * cs;
            const xb = -hi + q * cs;
            const [a, b, w, d] = rrect(f, (xa + xb) / 2, -hi + (r + 0.5) * cs, xb - xa, cs);
            wb(cx + a, cz + b, w + 0.02, d + 0.02, 0.3, 0xa89b84, Y + hf - 0.3);
            run = -1;
          }
        }
      }
    }
    shell(cx, cz, Y + hf, out, 3.2, col, '-', { w: 3.2, s: 0.9, top: 2.5 });
    wb(cx, cz, out + 0.9, out + 0.9, 0.4, o.roof || 0x444a50, Y + hf + 3.2);
    {
      const [a, b] = rot(f, 0.2, -1.4);
      loot(cx + a, cz + b, Y + hf, 2);
    } {
      const [a, b] = rot(f, -0.6, hi - 1.5);
      loot(cx + a, cz + b, Y, 1);
    }
    rec.door = rot(f, 0, out / 2).map((v, i) => (i ? cz : cx) + v);
    STR.push(rec);
    fp(cx, cz, out + 1, out + 1, o.fpn || 'tower');
    return rec;
  };

  const silo = (cx: number, cz: number, Y: number, out: number, h: number, col: number, o: BuildOpts = {}) => {
    const f = o.face || 's';
    const h1 = Math.min(h, 4.4);
    shell(cx, cz, Y, out, h1, col, f, { w: 1, s: 1, top: 2.4 });
    if (h > h1 + 0.05) {
      shell(cx, cz, Y + h1, out, h - h1, col, '-', h - h1 >= 3.2 ? { w: 0.9, s: 1.2, top: 2.8 } : null);
    }
    wb(cx, cz, out + 0.8, out + 0.8, 0.5, o.roof || 0x666b70, Y + h);
    wb(cx + out / 4, cz - out / 4, 1.3, 1.3, 1.1, 0x9a7448, Y);
    const [a, b] = rot(f, -out / 4, out / 2 - 1.6);
    loot(cx + a, cz + b, Y, o.tier || 1);
  };

  const tower = (cx: number, cz: number, Y: number, h: number) => stairTower(cx, cz, Y, { out: h > 14 ? 7.2 : 6.4, h });

  const containers = (x: number, z: number, Y: number, nx: number, nz: number, hi: boolean) => {
    const cols = [0xb03a2e, 0x2e6db0, 0x3a8a4a, 0xd9822b, 0x7a7f85, 0xc9a227];
    for (let i = 0; i < nx; i++) {
      for (let j = 0; j < nz; j++) {
        if (rnd() < 0.2) {
          continue;
        }
        const c = pick(cols);
        const cx = x + i * 14.5;
        const cz = z + j * 6;
        wb(cx, cz, 12, 2.6, 2.6, c, Y);
        if (hi && rnd() < 0.4) {
          wb(cx, cz, 12, 2.6, 2.6, pick(cols), Y + 2.6);
        }
      }
    }
    fp(x + (nx - 1) * 7.25, z + (nz - 1) * 3, nx * 14.5, nz * 6 + 2.6, 'containers');
  };

  /* ----- bridge: thin deck on pillars, so the river can still be waded underneath ----- */
  const bridge = (b: Bridge) => {
    const Y = b.y! + 0.2;
    const z = b.ax === 'z';
    wb(b.x, b.z, z ? 6 : b.len, z ? b.len : 6, 0.4, 0x8a6a4a, Y - 0.4);
    wb(b.x + (z ? -2.8 : 0), b.z + (z ? 0 : -2.8), z ? 0.4 : b.len, z ? b.len : 0.4, 1.1, 0x6b4a2a, Y);
    wb(b.x + (z ? 2.8 : 0), b.z + (z ? 0 : 2.8), z ? 0.4 : b.len, z ? b.len : 0.4, 1.1, 0x6b4a2a, Y);
    for (const k of [-b.len / 4, b.len / 4]) {
      wb(b.x + (z ? 0 : k), b.z + (z ? k : 0), z ? 5.6 : 1, z ? 1 : 5.6, Y + 0.3, 0x77695a, -1.2);
    }
  };

  /** Site by name, with its ground height (set by `genTerrain`). */
  const S = (n: string) => {
    const s = SITES.find(q => q.n === n)!;
    return { ...s, h: s.h! };
  };

  /* ===== landmarks ===== */
  {
    const s = S('Central Mall');
    mall(s.x, s.z - 10, s.h);
  }
  {
    const s = S('Aurora');
    const Y = s.h;
    const types = ['villa', 'shop', 'house', 'villa', 'warehouse', 'house', 'shop', 'villa'];
    let k = 0;
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const x = s.x + i * 30;
        const z = s.z + j * 28;
        if (!i && !j) {
          wb(x, z, 3, 3, 4, 0x9a9a9a, Y);
          wb(x, z, 10, 10, 0.5, 0x8a8a8a, Y);
          for (const q of [[-5, 0], [5, 0], [0, 5], [0, -5]]) {
            wb(x + q[0], z + q[1], q[0] ? 0.8 : 2, q[0] ? 2 : 0.8, 0.6, 0x6e4a2a, Y);
          }
          fp(x, z, 12, 12, 'plaza');
          loot(x + 3, z + 3, Y, 1);
          continue;
        }
        const t = types[k++ % types.length];
        if (t === 'villa') {
          villa(x, z, 14, 11, Y);
        } else if (t === 'shop') {
          shop(x, z, 16, 9, Y);
        } else if (t === 'house') {
          house(x, z, 10, 9, Y);
        } else {
          warehouse(x, z, 18, 12, Y, { h: 5, gate: 4, gh: 3.6 });
        }
      }
    }
    for (let q = 0; q < 10; q++) {
      const x = s.x + (rnd() < 0.5 ? -15 : 15) + R(-2, 2);
      const z = s.z + R(-40, 40);
      if (!insideFP(x, z, 5)) {
        carAt(x, z, Y, 'z');
      }
    }
  }
  {
    const s = S('Maple Heights');
    const Y = s.h;
    for (const rz of [-16, 16]) {
      for (const rx of [-30, -10, 10, 30]) {
        house(s.x + rx, s.z + rz, 10, 9, Y);
        if (rnd() < 0.6) {
          carAt(s.x + rx + 7.5, s.z + rz + 8, Y, 'z');
        }
      }
    }
    villa(s.x, s.z - 36, 14, 11, Y);
    shop(s.x + 14, s.z + 29, 14, 8, Y);
  }
  {
    const s = S('Pinecrest');
    const Y = s.h;
    for (const q of [[-28, -8], [-14, -26], [8, -30], [28, -12], [30, 12], [-30, 14], [-12, 26]]) {
      house(s.x + q[0], s.z + q[1], RI(9, 11), RI(8, 9), Y, { roof: 0x5a4a3a, col: pick([0xc9a77a, 0xb89a6a, 0xd6c3a0]) });
    }
    warehouse(s.x - 2, s.z + 2, 10, 18, Y, { h: 6, gate: 3, gh: 3.2, col: 0xc9c4b8, tier: 1 });
    tower(s.x + 11, s.z - 6, Y, 14);
    shop(s.x + 14, s.z + 28, 14, 8, Y);
    for (let q = 0; q < 5; q++) {
      const x = s.x + R(-34, 34);
      const z = s.z + R(-34, 34);
      if (Math.hypot(x - s.x, z - s.z) < 38 && !insideFP(x, z, 4.5)) {
        wb(x, z, 2.4, 1.2, 1.1, 0x7a5a3a, Y);
      }
    }
  }
  {
    const s = S('Frostpeak Lodge');
    const Y = s.h;
    villa(s.x, s.z - 2, 20, 13, Y, { col: 0x9a7448, roof: 0xe8eef2, tier: 2 });
    house(s.x - 14, s.z + 9, 9, 8, Y, { col: 0x9a7448, roof: 0xe8eef2 });
    house(s.x + 14, s.z + 9, 9, 8, Y, { col: 0x9a7448, roof: 0xe8eef2 });
    stairTower(s.x - 15, s.z - 12, Y, { out: 6.4, h: 9, col: 0x7a6a50, roof: 0x6b3a2a, face: 'e', fpn: 'lookout' });
  }
  {
    const s = S('Fort Redstone');
    const Y = s.h;
    const hh = 26;
    const c = 0x8a8f94;
    const th = 1.2;
    wall('x', s.z - hh, s.x - hh, s.x + hh, Y, 5, c, [{ m: s.x, w: 8, t: 'g', dh: 4.2 }], th);
    wall('x', s.z + hh, s.x - hh, s.x + hh, Y, 5, c, [{ m: s.x, w: 8, t: 'g', dh: 4.2 }], th);
    wall('z', s.x - hh, s.z - hh, s.z + hh, Y, 5, c, [], th);
    wall('z', s.x + hh, s.z - hh, s.z + hh, Y, 5, c, [], th);
    for (const q of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const x = s.x + q[0] * (hh - 4);
      const z = s.z + q[1] * (hh - 4);
      stairTower(x, z, Y, { out: 6.4, h: 13, col: 0x7a7f84, roof: 0x555a60, face: q[0] < 0 ? 'e' : 'w', fpn: 'fortTower' });
    }
    house(s.x - 8, s.z - 14, 24, 9, Y, { col: 0x9aa08c, roof: 0x555a50, tier: 2 });
    house(s.x - 8, s.z + 14, 24, 9, Y, { col: 0x9aa08c, roof: 0x555a50, tier: 2 });
    house(s.x + 15, s.z + 2, 10, 9, Y, { col: 0x7a7f84, roof: 0x44484c, tier: 2 });
    tower(s.x + 14, s.z - 16, Y, 14);
    wb(s.x + 15, s.z + 19, 12, 12, 0.05, 0x55585a, Y + 0.03, true);
    for (let q = 0; q < 14; q++) {
      const x = s.x + R(-22, 22);
      const z = s.z + R(-22, 22);
      if (!insideFP(x, z, 4.5)) {
        wb(x, z, 3, 1, 1.1, 0x9a8a6a, Y);
      }
    }
  }
  {
    const s = S('Ironworks');
    const Y = s.h;
    warehouse(s.x - 20, s.z - 18, 30, 18, Y, { tier: 1 });
    warehouse(s.x + 14, s.z - 20, 24, 16, Y, { tier: 1 });
    warehouse(s.x + 8, s.z + 16, 28, 14, Y, { h: 8, gate: 6, gh: 5.5, col: 0x8a8f94, tier: 2 });
    wb(s.x + 26, s.z + 16, 4, 4, 34, 0x7a7468, Y);
    fp(s.x + 26, s.z + 16, 5, 5, 'stack');
    for (const q of [[-30, 10], [-30, 24], [-18, 32]]) {
      silo(s.x + q[0], s.z + q[1], Y, 8, 7, 0x8a9098, { face: q[0] < -20 ? 'e' : 'n' });
      fp(s.x + q[0], s.z + q[1], 9, 9, 'tank');
    }
    containers(s.x + 4, s.z + 38, Y, 2, 1, false);
    for (let q = 0; q < 5; q++) {
      wb(s.x - 12 + q * 7, s.z - 2, 1, 1, 3, 0x666b70, Y);
    }
  }
  {
    const s = S('Port Calder');
    const Y = s.h;
    warehouse(s.x - 24, s.z - 20, 26, 14, Y, { tier: 1 });
    warehouse(s.x - 26, s.z + 14, 22, 12, Y, { tier: 1, gate: 5 });
    shop(s.x + 4, s.z + 30, 13, 9, Y, { tier: 2 });
    containers(s.x - 10, s.z - 38, Y, 3, 2, true);
    for (const pz of [-14, 10]) {
      wb(s.x + 52, s.z + pz, 64, 5, 0.5, 0x7a6a58, Y - 0.3);
      for (let k = 24; k <= 84; k += 12) {
        wb(s.x + k, s.z + pz - 2.2, 0.6, 0.6, 1, 0x333, Y + 0.2);
      }
    }
    for (const q of [-4, 4]) {
      wb(s.x + 34, s.z - 14 + q, 1.4, 1.4, 18, 0xd9822b, Y);
      wb(s.x + 34 + 0, s.z - 14, 2.2, 10, 2.2, 0xd9822b, Y + 18);
    }
    loot(s.x + 60, s.z - 14, Y + 0.2, 2);
    loot(s.x + 60, s.z + 10, Y + 0.2, 2);
  }
  {
    const s = S('Meadowbrook Farm');
    const Y = s.h;
    warehouse(s.x - 18, s.z - 10, 22, 14, Y, { h: 6.5, gate: 6, gh: 4.6, col: 0x8a3a2e, tier: 1 });
    house(s.x + 14, s.z - 18, 12, 9, Y);
    for (const q of [[22, 8], [22, 16], [30, 12]]) {
      silo(s.x + q[0], s.z + q[1], Y, 6, 14, 0xc9ccd0, { roof: 0x888888, face: q[0] > 25 ? 'e' : 'w' });
      fp(s.x + q[0], s.z + q[1], 7, 7, 'silo');
    }
    for (let k = 0; k <= 24; k += 2) {
      wb(s.x - 30 + k, s.z + 14, 0.3, 0.3, 1.1, 0x6b4a2a, Y);
      wb(s.x - 30 + k, s.z + 40, 0.3, 0.3, 1.1, 0x6b4a2a, Y);
    }
    wb(s.x - 18, s.z + 14, 24, 0.2, 0.3, 0x6b4a2a, Y + 0.8);
    wb(s.x - 18, s.z + 40, 24, 0.2, 0.3, 0x6b4a2a, Y + 0.8);
    fp(s.x - 18, s.z + 27, 26, 28, 'paddock');
    for (let q = 0; q < 8; q++) {
      wb(s.x - 30 + R(0, 24), s.z + 16 + R(0, 22), 1.6, 1.6, 1.4, 0xd6b84a, Y);
    }
    silo(s.x - 34, s.z - 30, Y, 6, 7, 0xe0e0e0, { roof: 0xe0e0e0, face: 's', tier: 1 });
    wb(s.x - 34, s.z - 30, 3.6, 3.6, 8, 0xe0e0e0, Y + 7.5);
    wb(s.x - 34, s.z - 27.9, 0.4, 0.3, 10, 0x5a4a3a, Y + 11);
    wb(s.x - 34, s.z - 27.9, 10, 0.3, 0.4, 0x5a4a3a, Y + 15.8);
    fp(s.x - 34, s.z - 30, 7, 7, 'mill');
    wb(s.x + 4, s.z - 4, 3.6, 2.2, 1.6, 0x2e8a3a, Y);
    wb(s.x + 4, s.z - 5, 2, 1.6, 1, 0x3a3a3a, Y + 1.6);
    loot(s.x + 4, s.z + 2, Y, 1);
  }
  {
    const s = S('Dusty Gulch');
    const Y = s.h;
    for (const q of [[-22, -14], [-4, -24], [16, -14], [22, 8], [-20, 12]]) {
      house(s.x + q[0], s.z + q[1], RI(9, 11), RI(8, 9), Y, { col: pick([0xd8b98a, 0xcaa878, 0xe0c8a0]), roof: 0xb08a5a });
    }
    shop(s.x, s.z + 22, 16, 9, Y, { col: 0xc9a77a });
    for (const q of [[-3, -3], [3, -3], [-3, 3], [3, 3]]) {
      wb(s.x + q[0], s.z + q[1], 0.6, 0.6, 6, 0x6b4a2a, Y);
    }
    wb(s.x, s.z, 6, 6, 2.2, 0x8a6a4a, Y + 6);
    fp(s.x, s.z, 7, 7, 'wtower');
    wb(s.x + 8, s.z + 8, 2, 2, 1, 0x888, Y);
    fp(s.x + 8, s.z + 8, 3, 3, 'well');
  }
  {
    const s = S('Skyfield Airstrip');
    const Y = s.h;
    const rx = -312;
    wb(rx, -30, 16, 190, 0.02, 0x4a4d50, Y + 0.03, true);
    for (let z = -115; z <= 55; z += 14) {
      wb(rx, z, 0.5, 6, 0.02, 0xeeeeee, Y + 0.06, true);
    }
    fp(rx, -30, 18, 192, 'runway');
    hangar(-285, -70, Y);
    hangar(-285, -25, Y);
    tower(-285, 20, Y, 16);
    shop(-285, 45, 22, 10, Y, { col: 0xbfc4c8, tier: 2 });
    silo(-285, 66, Y, 6, 5, 0x8a9098, { face: 'n' });
    fp(-285, 66, 7, 7, 'tank');
    wb(rx + 10, -60, 0.3, 0.3, 5, 0xcc3322, Y);
  }
  {
    const s = S('Cape Light');
    const Y = s.h;
    stairTower(s.x, s.z, Y, { out: 7.2, h: 17, col: 0xf0f0f0, roof: 0xc9342b, fpn: 'lighthouse' });
    for (const q of [5, 10]) {
      wb(s.x, s.z, 7.9, 7.9, 1.3, 0xc9342b, Y + q, true);
    }
    house(s.x - 13, s.z + 6, 10, 8, Y, { col: 0xf0f0f0, roof: 0xc9342b, tier: 1 });
  }
  for (const b of BRG) {
    bridge(b);
  }

  /* ===== wilderness: cabins, gas stations, forests, rocks ===== */
  const nearSite = (x: number, z: number, m: number) => SITES.some(s => Math.hypot(x - s.x, z - s.z) < s.r + m) || BRG.some(b => Math.hypot(x - b.x, z - b.z) < b.len / 2 + 16);

  /** Lowest and highest ground under a rectangle. */
  const flatAt = (x: number, z: number, w: number, d: number) => {
    let mn = 1e9;
    let mx = -1e9;
    for (let a = -1; a <= 1; a++) {
      for (let b = -1; b <= 1; b++) {
        const h = T.h(x + a * w / 2, z + b * d / 2);
        mn = Math.min(mn, h);
        mx = Math.max(mx, h);
      }
    }
    return [mn, mx];
  };

  const roadNear = (x: number, z: number) => T.kind(x, z) === 6 || T.kind(x + 4, z) === 6 || T.kind(x - 4, z) === 6 || T.kind(x, z + 4) === 6 || T.kind(x, z - 4) === 6;

  const siteNear2 = (x: number, z: number, k: number) => SITES.some(s => Math.hypot(x - s.x, z - s.z) < s.r * k) || (x < -270 && Math.abs(z + 30) < 110);

  const cabins: Vec2[] = [];

  for (let n = 0; n < 1500 && cabins.length < 16; n++) {
    const x = R(-330, 330);
    const z = R(-330, 330);
    if (Math.hypot(x, z) > 340) {
      continue;
    }
    const [mn, mx] = flatAt(x, z, 12, 11);
    const k = T.kind(x, z);
    if (mn < WLV + 1.6 || mx - mn > 0.5 || nearSite(x, z, 26) || siteNear2(x, z, 1) || k === 6 || k === 0 || k === 4 || k === 5 || roadNear(x, z) || cabins.some(c => Math.hypot(c[0] - x, c[1] - z) < 70)) {
      continue;
    }
    cabins.push([x, z]);
    wb(x, z, 12, 11, mx - mn + 0.8, 0x7a7468, mn - 0.8);
    house(x, z, 9 + 2 * (n % 2), 8, mx, { tier: 1, col: pick([0x9a7448, 0xb89a6a, 0xc9c4b8]) });
  }
  let gs = 0;
  for (const rd of T.roads) {
    if (gs >= 4) {
      break;
    }
    for (let tries = 0; tries < 12; tries++) {
      const p = rd[Math.floor(R(0.2, 0.8) * rd.length)];
      const x = p[0] + R(10, 16) * (rnd() < 0.5 ? -1 : 1);
      const z = p[1] + R(10, 16) * (rnd() < 0.5 ? -1 : 1);
      const [mn, mx] = flatAt(x, z, 16, 22);
      if (mn < WLV + 1.6 || mx - mn > 0.5 || nearSite(x, z, 24) || insideFP(x, z, 12) || roadNear(x, z)) {
        continue;
      }
      wb(x, z, 18, 24, mx - mn + 0.8, 0x6a6e72, mn - 0.8);
      shop(x, z, 12, 8, mx, { tier: 1, col: 0xe0e0e0 });
      wb(x, z + 12, 10, 6, 0.4, 0xc9342b, mx + 4.2);
      for (const q of [-4, 4]) {
        wb(x + q, z + 9.5, 0.6, 0.6, 4.2, 0x666, mx);
      }
      for (const q of [-2.5, 2.5]) {
        wb(x + q, z + 12, 1, 0.8, 1.6, 0x2a2a2a, mx);
      }
      fp(x, z + 6, 14, 22, 'gas');
      gs++;
      break;
    }
  }
  const { n2 } = mkNoise(31);
  let nt = 0;
  for (let x = -345; x < 345; x += 9) {
    for (let z = -345; z < 345; z += 9) {
      const px = x + R(-3, 3);
      const pz = z + R(-3, 3);
      const k = T.kind(px, pz);
      if (k !== 2 && k !== 3 && k !== 9) {
        continue;
      }
      const sl = T.slope(px, pz);
      const h = T.h(px, pz);
      if (sl > 0.5 || h < WLV + 1.4) {
        continue;
      }
      const fd = n2(px * 0.011 + 9, pz * 0.011 + 4);
      if (fd < (k === 9 ? 0.5 : 0.67) || rnd() < 0.12 || siteNear2(px, pz, 0.95) || roadNear(px, pz) || insideFP(px, pz, 3) || nearSite(px, pz, -2)) {
        continue;
      }
      const pine = h > 16 || rnd() < 0.35;
      const gc = pick([0x2f6b2f, 0x3a7a38, 0x2a5a2a]);
      wb(px, pz, 0.9, 0.9, 5, 0x6b4a2a, h - 0.6);
      if (pine) {
        wb(px, pz, 4.6, 4.6, 2.2, gc, h + 2.4, true);
        wb(px, pz, 2.8, 2.8, 2.2, gc, h + 4.4, true);
        wb(px, pz, 1.2, 1.2, 1.4, gc, h + 6.4, true);
      } else {
        wb(px, pz, 5.2, 5.2, 3, gc, h + 3.4, true);
      }
      nt++;
      if (nt > 1300) {
        break;
      }
    }
  }
  let nr = 0;
  for (let x = -345; x < 345; x += 13) {
    for (let z = -345; z < 345; z += 13) {
      const px = x + R(-5, 5);
      const pz = z + R(-5, 5);
      const k = T.kind(px, pz);
      if (k !== 4 && k !== 5) {
        continue;
      }
      if (T.slope(px, pz) < 0.3 || rnd() < 0.7 || siteNear2(px, pz, 0.95)) {
        continue;
      }
      const h = T.h(px, pz);
      const n = RI(1, 3);
      for (let q = 0; q < n; q++) {
        const sz = R(2.2, 6);
        const hh = R(1.6, 4.5);
        const rx = px + R(-3, 3);
        const rz = pz + R(-3, 3);
        wb(rx, rz, sz, sz * R(0.7, 1.3), hh, pick([0x8a867c, 0x77736a, 0x9a968c]), T.h(rx, rz) - 1.4);
        if (h > 38) {
          wb(rx, rz, sz * 0.8, sz * 0.8, 0.5, 0xf1f4f6, T.h(rx, rz) - 1.4 + hh);
        }
      }
      nr++;
    }
  }
  for (let n = 0; n < 600 && LOOT.length < LOOT.length + 1; n++) {
    if (n >= 40) {
      break;
    }
    const x = R(-330, 330);
    const z = R(-330, 330);
    const h = T.h(x, z);
    if (h < WLV + 2 || T.slope(x, z) > 0.3 || insideFP(x, z, 2) || T.kind(x, z) === 0) {
      continue;
    }
    LOOT.push([x, z, h, 1]);
  }
  return { terrain: T, mesh: terrMesh(T), b: B, glass: G, doors: D, loot: LOOT, fp: FP, stairs: STR, pois: SITES, counts: { trees: nt, rocks: nr, cabins: cabins.length, gas: gs } };
}
