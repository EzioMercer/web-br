import { WATER_LEVEL } from '../config';
import { BRIDGES, SITES, genTerrain, makeNoise, terrainMesh } from './terrain';
import type { Bridge } from './terrain';
import type { Face, Footprint, MapBox, MapDoor, MapGlass, MapLoot, Stairwell, Vec2 } from '../types';

/** Wall opening centred at `center` along the wall, `width` wide. */
interface Opening {
  center: number;
  width: number;
  type: 'door' | 'window' | 'gate';
  /** Window sill height. */
  sill?: number;
  /** Window top height. */
  top?: number;
  /** Door (or gate) height. */
  doorHeight?: number;
  color?: number;
}

/** Window style for the walls of a shell. */
interface ShellWindow {
  width: number;
  sill: number;
  top: number;
}

/** Optional building parameters. */
interface BuildOpts {
  color?: number;
  roofColor?: number;
  /** Loot tier. */
  tier?: number;
  height?: number;
  /** Gate width and height. */
  gateWidth?: number;
  gateHeight?: number;
  /** Outer size of a tower. */
  size?: number;
  face?: Face;
  /** Footprint kind. */
  footprintKind?: string;
}

export type GeneratedWorld = ReturnType<typeof genWorld>;

export function genWorld() {
  const T = genTerrain();
  let seed = 4242;

  const rand = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  const randRange = (a: number, b: number) => a + rand() * (b - a);

  const pick = <T>(a: T[]) => a[(rand() * a.length) | 0];

  const randInt = (a: number, b: number) => Math.floor(randRange(a, b + 1));

  const mapBoxes: MapBox[] = [];
  const mapGlass: MapGlass[] = [];
  const mapDoors: MapDoor[] = [];
  const lootSpots: MapLoot[] = [];
  const footprints: Footprint[] = [];
  const stairwells: Stairwell[] = [];

  const addBox = (x: number, z: number, w: number, d: number, h: number, c: number, y?: number, nc?: boolean) => mapBoxes.push([x, z, w, d, h, c, y, nc]);

  const addGlass = (ax: 'x' | 'z', c: number, m: number, w: number, y: number, h: number) => mapGlass.push(ax === 'x' ? [m, c, w, 0.1, h, y] : [c, m, 0.1, w, h, y]);

  const addDoor = (ax: 'x' | 'z', c: number, m: number, w: number, y: number, h: number, col?: number) => mapDoors.push({ axis: ax, wallAt: c, center: m, width: w, y, height: h, color: col || 0x6b4a2a });

  const addLoot = (x: number, z: number, y: number, t?: number) => lootSpots.push([x, z, y, t || 1]);

  /** Wall along `ax` at coordinate `c`, from `a` to `b`, with openings cut out of it. */
  const wall = (ax: 'x' | 'z', c: number, a: number, b: number, Y: number, h: number, col: number, opsIn?: Opening[], thIn?: number) => {
    const th = thIn || 0.4;
    const ops = (opsIn || []).slice().sort((p, q) => p.center - q.center);
    let q = a;

    const seg = (u: number, v: number, yy: number, hh: number) => {
      if (v - u < 0.06 || hh < 0.05) {
        return;
      }
      const m = (u + v) / 2;
      const l = v - u;
      if (ax === 'x') {
        addBox(m, c, l, th, hh, col, yy);
      } else {
        addBox(c, m, th, l, hh, col, yy);
      }
    };

    for (const o of ops) {
      const u = o.center - o.width / 2;
      const v = o.center + o.width / 2;
      seg(q, u, Y, h);
      if (o.type === 'window') {
        const s = o.sill ?? 0.9;
        const tp = o.top ?? 2.3;
        seg(u, v, Y, s);
        seg(u, v, Y + tp, h - tp);
        addGlass(ax, c, o.center, o.width, Y + s, tp - s);
      } else {
        const dh = o.doorHeight ?? 2.3;
        seg(u, v, Y + dh, h - dh);
        if (o.type === 'door') {
          addDoor(ax, c, o.center, o.width, Y, dh, o.color);
        }
      }
      q = v;
    }
    seg(q, b, Y, h);
  };

  const addFootprint = (x: number, z: number, w: number, d: number, n?: string) => footprints.push([x, z, w, d, n || '']);

  const insideFootprint = (x: number, z: number, m: number) => footprints.some(f => Math.abs(x - f[0]) < f[2] / 2 + m && Math.abs(z - f[1]) < f[3] / 2 + m);

  const gap = (a: number, c: number) => Math.abs(a - c);

  /** Drops windows that would overlap a door. */
  const dropWindowsAtDoors = (ops: Opening[], keep?: boolean) => ops.filter(q => q.type === 'door' || keep || ops.every(o => o === q || o.type !== 'door' || gap(o.center, q.center) > (o.width + q.width) / 2 + 0.15));

  const roof = (cx: number, cz: number, w: number, d: number, Y: number, rc: number) => {
    addBox(cx, cz, w + 0.8, d + 0.8, 0.3, rc, Y);
    addBox(cx, cz, w - 1.5, d + 0.8, 0.45, rc, Y + 0.3);
  };

  const table = (x: number, z: number, Y: number, w?: number, d?: number) => {
    addBox(x, z, w || 1.6, d || 1, 0.8, 0x6e4a2a, Y);
  };

  const car = (x: number, z: number, Y: number, al: 'x' | 'z') => {
    const c = pick([0xb03a2e, 0x2e6db0, 0xd9d9d9, 0x2e2e2e, 0xc9a227, 0x3a8a4a]);
    const w = al === 'x' ? 4.4 : 1.9;
    const d = al === 'x' ? 1.9 : 4.4;
    addBox(x, z, w, d, 0.9, c, Y + 0.35);
    addBox(x, z, al === 'x' ? 2.4 : 1.7, al === 'x' ? 1.7 : 2.4, 0.7, 0x9fb7c8, Y + 1.25);
  };

  /* ----- house (1 floor) ----- */
  const house = (cx: number, cz: number, w: number, d: number, Y: number, o: BuildOpts = {}) => {
    const h = 3.2;
    const col = o.color || pick([0xe4dac3, 0xd9c8a8, 0xcfd6c2, 0xe8c8a0, 0xc9d3d9]);
    const rc = o.roofColor || pick([0x8a4a3a, 0x6b6358, 0x4a5a6a, 0x7a5a3a]);
    const x0 = cx - w / 2;
    const x1 = cx + w / 2;
    const z0 = cz - d / 2;
    const z1 = cz + d / 2;
    const dm = cx + randRange(-w / 6, w / 6);
    const pz = cz - d / 6;
    wall('x', z1, x0, x1, Y, h, col, dropWindowsAtDoors([{ center: dm, width: 1.4, type: 'door' }, { center: cx - w / 2 + 1.6, width: 1.6, type: 'window' }, { center: cx + w / 2 - 1.6, width: 1.6, type: 'window' }]));
    wall('x', z0, x0, x1, Y, h, col, dropWindowsAtDoors([...(rand() < 0.5 ? [{ center: cx, width: 1.3, type: 'door' } as Opening] : []), { center: cx - w / 3, width: 1.6, type: 'window' }, { center: cx + w / 3, width: 1.6, type: 'window' }]));
    wall('z', x0, z0, z1, Y, h, col, [{ center: cz, width: 1.6, type: 'window' }]);
    wall('z', x1, z0, z1, Y, h, col, [{ center: cz, width: 1.6, type: 'window' }]);
    wall('x', pz, x0, x1, Y, h, col, [{ center: cx + randRange(-w / 4, w / 4), width: 1.2, type: 'door' }]);
    roof(cx, cz, w, d, Y + h, rc);
    addBox(x1 - 1.4, cz + 1, 1, 1, 1.6, 0x7a5a4a, Y + h + 0.4);
    table(cx + randRange(-1.5, 1.5), (pz + z1) / 2 + 0.4, Y);
    addBox(x0 + 1.2, (pz + z1) / 2 + 1, 0.9, 2.4, 0.9, pick([0x8a4a3a, 0x4a5a6a]), Y);
    addBox(cx + w / 4, (z0 + pz) / 2 - 0.8, 2, 1, 0.6, 0xd8d2c4, Y);
    addBox(x1 - 0.8, (z0 + pz) / 2, 0.5, 2.6, 1.8, 0x6e4a2a, Y);
    addLoot(x0 + 1.5, z1 - 1.6, Y, 1);
    addLoot(x1 - 1.6, z0 + 1.6, Y, o.tier || 1);
    addFootprint(cx, cz, w + 1, d + 1, 'house');
    return { x0, x1, z0, z1 };
  };

  /* ----- villa / apartment block (2 floors, stairs) ----- */
  const villa = (cx: number, cz: number, w: number, d: number, Y: number, o: BuildOpts = {}) => {
    const h = 3.2;
    const col = o.color || pick([0xe8dcc0, 0xd8c9ad, 0xc9d3d9, 0xd7b9a4]);
    const rc = o.roofColor || 0x6b6358;
    const x0 = cx - w / 2;
    const x1 = cx + w / 2;
    const z0 = cz - d / 2;
    const z1 = cz + d / 2;
    const Y2 = Y + 3.5;
    const dm = cx + randRange(1, w / 5);
    const pz = cz + d / 6;
    wall('x', z1, x0, x1, Y, h, col, dropWindowsAtDoors([{ center: dm, width: 1.6, type: 'door', color: 0x4a3a2a }, { center: cx - w / 3, width: 1.8, type: 'window' }, { center: cx + w / 2 - 2, width: 1.8, type: 'window' }, { center: cx - w / 2 + 1.8, width: 1.4, type: 'window' }]));
    wall('x', z0, x0, x1, Y, h, col, [{ center: cx + w / 4, width: 1.4, type: 'door' }, { center: cx, width: 1.8, type: 'window' }, { center: cx - w / 3, width: 1.8, type: 'window' }]);
    wall('z', x0, z0, z1, Y, h, col, [{ center: cz + 1, width: 1.8, type: 'window' }]);
    wall('z', x1, z0, z1, Y, h, col, [{ center: cz - 1, width: 1.8, type: 'window' }]);
    wall('x', pz, x0 + 9, x1, Y, h, col, [{ center: cx + randRange(2, w / 4), width: 1.3, type: 'door' }]);
    for (let i = 1; i <= 8; i++) {
      addBox(x0 + 1.4 + (i - 0.5), z0 + 1.5, 1, 2.3, 0.4375 * i, 0x8a6a4a, Y);
    }
    // upper slab: everything except the stairwell hole (x0..x0+9.4, z0..z0+3)
    addBox((x0 + 9.4 + x1) / 2, (z0 + z1) / 2, x1 - x0 - 9.4, d, 0.3, 0xa89b84, Y + 3.2);
    addBox(x0 + 4.7, (z0 + 3 + z1) / 2, 9.4, z1 - z0 - 3, 0.3, 0xa89b84, Y + 3.2);
    wall('x', z1, x0, x1, Y2, h, col, [{ center: cx - w / 3, width: 1.8, type: 'window' }, { center: cx, width: 1.8, type: 'window' }, { center: cx + w / 4, width: 1.8, type: 'window' }]);
    wall('x', z0, x0, x1, Y2, h, col, [{ center: cx - w / 4, width: 1.8, type: 'window' }, { center: cx + w / 4, width: 1.8, type: 'window' }]);
    wall('z', x0, z0, z1, Y2, h, col, [{ center: cz, width: 1.8, type: 'window' }]);
    wall('z', x1, z0, z1, Y2, h, col, [{ center: cz, width: 1.8, type: 'window' }]);
    wall('z', cx + w / 6, z0 + 3, z1, Y2, h, col, [{ center: cz + d / 6, width: 1.2, type: 'door' }]);
    roof(cx, cz, w, d, Y2 + h, rc);
    addBox(cx + w / 4, pz + 2, 2.2, 1, 0.8, 0x6e4a2a, Y);
    addBox(cx - w / 3, cz + d / 4, 2, 1, 0.6, 0xd8d2c4, Y2);
    addLoot(x1 - 1.6, z0 + 2, Y, o.tier || 1);
    addLoot(x0 + 1.6, z1 - 1.6, Y, 1);
    addLoot(x1 - 1.6, z1 - 1.6, Y2, o.tier || 1);
    addLoot(x0 + 1.8, z0 + 4.2, Y2, 1);
    addFootprint(cx, cz, w + 1, d + 1, 'villa');
  };

  /* ----- shop ----- */
  const shop = (cx: number, cz: number, w: number, d: number, Y: number, o: BuildOpts = {}) => {
    const h = 3.8;
    const col = o.color || pick([0xd8c9ad, 0xc9a77a, 0xb9c9d3, 0xe0b9a4]);
    const sign = pick([0xd9342b, 0x2b7bd9, 0xe0b02b, 0x2bb36b, 0x9b3ad9]);
    const x0 = cx - w / 2;
    const x1 = cx + w / 2;
    const z0 = cz - d / 2;
    const z1 = cz + d / 2;
    const ops: Opening[] = [{ center: cx, width: 1.8, type: 'door', color: 0x3a3a3a }];
    for (let x = x0 + 2.4; x < x1 - 2; x += 4.2) {
      if (gap(x, cx) > 2.9) {
        ops.push({ center: x, width: 3.2, type: 'window', sill: 0.35, top: 2.9 });
      }
    }
    wall('x', z1, x0, x1, Y, h, col, ops);
    wall('x', z0, x0, x1, Y, h, col, [{ center: x1 - 3, width: 1.3, type: 'door' }, { center: x0 + 3, width: 1.6, type: 'window', sill: 1.6, top: 2.7 }]);
    wall('z', x0, z0, z1, Y, h, col, [{ center: cz + 1, width: 1.6, type: 'window' }]);
    wall('z', x1, z0, z1, Y, h, col, []);
    wall('x', z0 + 3.4, x0, x1, Y, h, col, [{ center: x1 - 3, width: 1.2, type: 'door' }]);
    roof(cx, cz, w, d, Y + h, 0x5a5a60);
    addBox(cx, z1 + 0.35, 5, 0.3, 0.8, sign, Y + 3.95);
    addBox(cx, z0 + 5.4, w * 0.55, 0.8, 1.1, 0x7a5a3a, Y);
    addBox(cx - w / 4, cz + 1, w * 0.28, 0.5, 2, 0x8a7a6a, Y);
    addBox(cx + w / 4, cz + 1, w * 0.28, 0.5, 2, 0x8a7a6a, Y);
    addLoot(x0 + 1.6, z0 + 1.8, Y, o.tier || 1);
    addLoot(cx + w / 4, z0 + 5, Y, o.tier || 1);
    addFootprint(cx, cz, w + 1, d + 1.4, 'shop');
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
      fr.push({ center: cx + xx, width: 4, type: 'window', sill: 0.5, top: 4.4 });
    }
    for (const xx of [-10, 10]) {
      fr.push({ center: cx + xx - 0.9, width: 1.7, type: 'door', doorHeight: 3.4, color: 0x4a5a6a });
      fr.push({ center: cx + xx + 0.9, width: 1.7, type: 'door', doorHeight: 3.4, color: 0x4a5a6a });
    }
    wall('x', z1, x0, x1, Y, h, col, fr);
    wall('x', z0, x0, x1, Y, h, col, [{ center: cx + 20, width: 1.8, type: 'door', doorHeight: 3 }, { center: cx - 15, width: 3, type: 'window', sill: 3.6, top: 4.8 }, { center: cx + 3, width: 3, type: 'window', sill: 3.6, top: 4.8 }, { center: cx + 12, width: 3, type: 'window', sill: 3.6, top: 4.8 }]);
    wall('z', x0, z0, z1, Y, h, col, [{ center: cz, width: 1.8, type: 'door', doorHeight: 3 }, { center: cz - 9, width: 3, type: 'window', sill: 1.2, top: 3.6 }, { center: cz + 9, width: 3, type: 'window', sill: 1.2, top: 3.6 }]);
    wall('z', x1, z0, z1, Y, h, col, [{ center: cz, width: 1.8, type: 'door', doorHeight: 3 }, { center: cz - 9, width: 3, type: 'window', sill: 1.2, top: 3.6 }, { center: cz + 9, width: 3, type: 'window', sill: 1.2, top: 3.6 }]);
    addBox(cx, cz, w + 1, d + 1, 0.4, 0x77787a, Y + h);
    addBox(cx, z1 + 0.4, w, 0.5, 0.9, 0xc9342b, Y + h + 0.2);
    // north row: six shops (8.67 m wide, 12 deep) facing the atrium
    for (let i = 0; i < 6; i++) {
      const sx0 = x0 + 2 + i * (w - 4) / 6;
      const sx1 = sx0 + (w - 4) / 6;
      const sm = (sx0 + sx1) / 2;
      wall('z', sx0, z0, az0, Y, h, col, []);
      wall('x', az0, sx0, sx1, Y, h, col, [{ center: sm - 1.5, width: 1.6, type: 'door', color: 0x3a3a3a }, { center: sm + 1.7, width: 3, type: 'window', sill: 0.4, top: 3 }]);
      addBox(sm, z0 + 2, sx1 - sx0 - 2, 0.8, 1.1, 0x7a5a3a, Y);
      addBox(sm, z0 + 6, sx1 - sx0 - 3, 0.5, 2, 0x8a7a6a, Y);
      addLoot(sm - 2.5, z0 + 4, Y, 2);
    }
    wall('z', x1 - 2, z0, az0, Y, h, col, []);
    // south row: shops either side of the two entrance bays
    for (const [a, b] of [[-26, -13.5], [-6.5, 6.5], [13.5, 26]]) {
      const sx0 = cx + a;
      const sx1 = cx + b;
      const sm = (sx0 + sx1) / 2;
      wall('x', az1, sx0, sx1, Y, h, col, [{ center: sm - 1.2, width: 1.6, type: 'door', color: 0x3a3a3a }, { center: sm + Math.min(2.6, (b - a) / 2 - 1.8), width: 3, type: 'window', sill: 0.4, top: 3 }]);
      addBox(sm, z1 - 2, sx1 - sx0 - 2, 0.8, 1.1, 0x7a5a3a, Y);
      addBox(sm, z1 - 6, sx1 - sx0 - 3, 0.5, 2, 0x8a7a6a, Y);
      addLoot(sm - 2.5, z1 - 4, Y, 2);
    }
    for (const xx of [-26, -13.5, -6.5, 6.5, 13.5, 26]) {
      wall('z', cx + xx, az1, z1, Y, h, col, []);
    }
    for (const xx of [-18, -6, 6, 18]) {
      addBox(cx + xx, cz, 1, 1, h - 0.2, 0xbfb8a8, Y);
      addBox(cx + xx + 3, cz + 2.5, 2.2, 1.4, 0.5, 0x4a7a3a, Y);
      table(cx + xx - 3, cz - 2.5, Y, 1.4, 1.4);
    }
    addLoot(cx, cz - 2.5, Y, 2);
    addLoot(cx - 12, cz + 2.5, Y, 2);
    addLoot(cx + 12, cz - 2.5, Y, 2);
    addFootprint(cx, cz, w + 2, d + 2, 'mall');
    // car park south of the mall
    addBox(cx, z1 + 17, w + 6, 26, 0.02, 0x55585a, Y + 0.03, true);
    for (let r = 0; r < 3; r++) {
      for (let c = -4; c <= 4; c++) {
        if (rand() < 0.55) {
          car(cx + c * 6, z1 + 10 + r * 8, Y, 'z');
        }
      }
    }
    for (const xx of [-24, 0, 24]) {
      addBox(cx + xx, z1 + 22, 0.5, 0.5, 7, 0x666, Y);
    }
    addFootprint(cx, z1 + 17, w + 6, 26, 'carpark');
  };

  /* ----- warehouse / hangar ----- */
  const warehouse = (cx: number, cz: number, w: number, d: number, Y: number, o: BuildOpts = {}) => {
    const h = o.height || 6.5;
    const col = o.color || 0x9aa4ab;
    const x0 = cx - w / 2;
    const x1 = cx + w / 2;
    const z0 = cz - d / 2;
    const z1 = cz + d / 2;
    const gw = o.gateWidth || 6;
    wall('x', z1, x0, x1, Y, h, col, [{ center: cx, width: gw, type: 'gate', doorHeight: o.gateHeight || 4.5 }, { center: x1 - 3, width: 1.4, type: 'door' }]);
    wall('x', z0, x0, x1, Y, h, col, [{ center: cx - w / 3, width: 2, type: 'window', sill: 3.8, top: 5.4 }, { center: cx + w / 3, width: 2, type: 'window', sill: 3.8, top: 5.4 }, { center: cx, width: 1.4, type: 'door' }]);
    wall('z', x0, z0, z1, Y, h, col, [{ center: cz, width: 1.4, type: 'door' }, { center: cz - d / 4, width: 2, type: 'window', sill: 3.8, top: 5.4 }, { center: cz + d / 4, width: 2, type: 'window', sill: 3.8, top: 5.4 }]);
    wall('z', x1, z0, z1, Y, h, col, [{ center: cz - d / 4, width: 2, type: 'window', sill: 3.8, top: 5.4 }, { center: cz + d / 4, width: 2, type: 'window', sill: 3.8, top: 5.4 }]);
    addBox(cx, cz, w + 0.8, d + 0.8, 0.4, 0x6a7077, Y + h);
    const rows = Math.max(2, Math.floor((w - 10) / 6));
    for (let i = 0; i < rows; i++) {
      const sx = x0 + 5 + i * ((w - 10) / Math.max(1, rows - 1));
      addBox(sx, cz - d / 6, 1.2, d * 0.45, 2.8, 0x7a6a5a, Y);
    }
    for (let i = 0; i < 4; i++) {
      addBox(x0 + 3 + rand() * (w - 6), z1 - 3 - rand() * 3, 1.4, 1.4, 1.3, 0x9a7448, Y);
    }
    addBox(x0 + 3.6, z0 + 3.6, 7, 0.4, 3, col, Y);
    wall('z', x0 + 7, z0, z0 + 7, Y, 3, col, [{ center: z0 + 4, width: 1.2, type: 'door' }]);
    addBox(x0 + 3.5, z0 + 3.5, 6, 6, 0.3, 0x6a7077, Y + 3, true);
    addLoot(x0 + 2.5, z0 + 2.5, Y, o.tier || 1);
    addLoot(cx + w / 4, cz, Y, o.tier || 1);
    addLoot(x1 - 2, z1 - 3, Y, 1);
    addFootprint(cx, cz, w + 1, d + 1, 'warehouse');
  };

  const hangar = (cx: number, cz: number, Y: number) => {
    const w = 22;
    const d = 30;
    const h = 9;
    warehouse(cx, cz, w, d, Y, { height: h, gateWidth: 14, gateHeight: 7, color: 0xb7bcc2, tier: 2 });
    addBox(cx, cz + 2, 3, 12, 3, 0xd9d9d9, Y);
    addBox(cx, cz - 1, 18, 3, 0.3, 0xd9d9d9, Y + 2);
    addBox(cx, cz - 6.5, 1, 5, 0.2, 0xd9d9d9, Y + 3.4);
    addBox(cx, cz - 7, 6, 0.3, 1.8, 0xd9d9d9, Y + 3.4);
  };

  /* ----- enterable structures: hollow shells with a door, stair towers with a glazed lookout, silos ----- */
  /** Local offset rotated so the local +z side faces `f`. */
  const rotateLocal = (f: Face, lx: number, lz: number): Vec2 => f === 's' ? [lx, lz] : f === 'n' ? [-lx, -lz] : f === 'e' ? [lz, -lx] : [-lz, lx];

  const rotateRect = (f: Face, lx: number, lz: number, sx: number, sz: number) => {
    const [a, b] = rotateLocal(f, lx, lz);
    return f === 'e' || f === 'w' ? [a, b, sz, sx] : [a, b, sx, sz];
  };

  const shell = (cx: number, cz: number, Y: number, out: number, h: number, col: number, face: Face, win: ShellWindow | null) => {
    const x0 = cx - out / 2;
    const x1 = cx + out / 2;
    const z0 = cz - out / 2;
    const z1 = cz + out / 2;

    const dd = (m: number): Opening[] => [{ center: m, width: 1.4, type: 'door', color: 0x4a4036 }];

    const ww = (m: number): Opening[] => win && h >= 3.2 ? [{ center: m, width: win.width, type: 'window', sill: win.sill, top: win.top }] : [];

    const op = (sd: Face, m: number) => face === sd ? dd(m) : ww(m);

    wall('x', z1, x0 - 0.2, x1 + 0.2, Y, h, col, op('s', cx));
    wall('x', z0, x0 - 0.2, x1 + 0.2, Y, h, col, op('n', cx));
    wall('z', x1, z0, z1, Y, h, col, op('e', cz));
    wall('z', x0, z0, z1, Y, h, col, op('w', cz));
  };

  const stairTower = (cx: number, cz: number, Y: number, o: BuildOpts = {}) => {
    const out = o.size || 6.4;
    const f = o.face || 's';
    const col = o.color || 0xbfc4c8;
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
    const N = Math.max(C.length, Math.round((o.height || 14) / RISE) - 1);
    const hf = (N + 1) * RISE;
    const rec: Stairwell = { cx, cz, baseY: Y, floorHeight: hf, face: f, treads: [] };
    const last: (typeof C)[number][] = [];
    for (let k = 1; k <= N; k++) {
      const c = C[(k - 1) % C.length];
      const [a, b, w, d] = rotateRect(f, c[0], c[1], c[2], c[3]);
      addBox(cx + a, cz + b, w, d, 0.45, 0x8a6a4a, Y + k * RISE - 0.45);
      rec.treads.push([cx + a, cz + b, Y + k * RISE]);
      if (k * RISE > hf - 2.3) {
        last.push(c);
      }
    }
    for (let y = 0; y < hf - 0.01; y += 4) {
      const hh = Math.min(4, hf - y);
      shell(cx, cz, Y + y, out, hh, col, y === 0 ? f : '-', y === 0 ? { width: 1.2, sill: 1, top: 2.4 } : { width: 0.9, sill: 1, top: 2.6 });
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
            const [a, b, w, d] = rotateRect(f, (xa + xb) / 2, -hi + (r + 0.5) * cs, xb - xa, cs);
            addBox(cx + a, cz + b, w + 0.02, d + 0.02, 0.3, 0xa89b84, Y + hf - 0.3);
            run = -1;
          }
        }
      }
    }
    shell(cx, cz, Y + hf, out, 3.2, col, '-', { width: 3.2, sill: 0.9, top: 2.5 });
    addBox(cx, cz, out + 0.9, out + 0.9, 0.4, o.roofColor || 0x444a50, Y + hf + 3.2);
    {
      const [a, b] = rotateLocal(f, 0.2, -1.4);
      addLoot(cx + a, cz + b, Y + hf, 2);
    } {
      const [a, b] = rotateLocal(f, -0.6, hi - 1.5);
      addLoot(cx + a, cz + b, Y, 1);
    }
    rec.door = rotateLocal(f, 0, out / 2).map((v, i) => (i ? cz : cx) + v);
    stairwells.push(rec);
    addFootprint(cx, cz, out + 1, out + 1, o.footprintKind || 'tower');
    return rec;
  };

  const silo = (cx: number, cz: number, Y: number, out: number, h: number, col: number, o: BuildOpts = {}) => {
    const f = o.face || 's';
    const h1 = Math.min(h, 4.4);
    shell(cx, cz, Y, out, h1, col, f, { width: 1, sill: 1, top: 2.4 });
    if (h > h1 + 0.05) {
      shell(cx, cz, Y + h1, out, h - h1, col, '-', h - h1 >= 3.2 ? { width: 0.9, sill: 1.2, top: 2.8 } : null);
    }
    addBox(cx, cz, out + 0.8, out + 0.8, 0.5, o.roofColor || 0x666b70, Y + h);
    addBox(cx + out / 4, cz - out / 4, 1.3, 1.3, 1.1, 0x9a7448, Y);
    const [a, b] = rotateLocal(f, -out / 4, out / 2 - 1.6);
    addLoot(cx + a, cz + b, Y, o.tier || 1);
  };

  const tower = (cx: number, cz: number, Y: number, h: number) => stairTower(cx, cz, Y, { size: h > 14 ? 7.2 : 6.4, height: h });

  const containers = (x: number, z: number, Y: number, nx: number, nz: number, hi: boolean) => {
    const cols = [0xb03a2e, 0x2e6db0, 0x3a8a4a, 0xd9822b, 0x7a7f85, 0xc9a227];
    for (let i = 0; i < nx; i++) {
      for (let j = 0; j < nz; j++) {
        if (rand() < 0.2) {
          continue;
        }
        const c = pick(cols);
        const cx = x + i * 14.5;
        const cz = z + j * 6;
        addBox(cx, cz, 12, 2.6, 2.6, c, Y);
        if (hi && rand() < 0.4) {
          addBox(cx, cz, 12, 2.6, 2.6, pick(cols), Y + 2.6);
        }
      }
    }
    addFootprint(x + (nx - 1) * 7.25, z + (nz - 1) * 3, nx * 14.5, nz * 6 + 2.6, 'containers');
  };

  /* ----- bridge: thin deck on pillars, so the river can still be waded underneath ----- */
  const bridge = (b: Bridge) => {
    const Y = b.deckY! + 0.2;
    const z = b.axis === 'z';
    addBox(b.x, b.z, z ? 6 : b.length, z ? b.length : 6, 0.4, 0x8a6a4a, Y - 0.4);
    addBox(b.x + (z ? -2.8 : 0), b.z + (z ? 0 : -2.8), z ? 0.4 : b.length, z ? b.length : 0.4, 1.1, 0x6b4a2a, Y);
    addBox(b.x + (z ? 2.8 : 0), b.z + (z ? 0 : 2.8), z ? 0.4 : b.length, z ? b.length : 0.4, 1.1, 0x6b4a2a, Y);
    for (const k of [-b.length / 4, b.length / 4]) {
      addBox(b.x + (z ? 0 : k), b.z + (z ? k : 0), z ? 5.6 : 1, z ? 1 : 5.6, Y + 0.3, 0x77695a, -1.2);
    }
  };

  /** Site by name, with its ground height (set by `genTerrain`). */
  const site = (n: string) => {
    const s = SITES.find(q => q.name === n)!;
    return { ...s, groundY: s.groundY! };
  };

  /* ===== landmarks ===== */
  {
    const s = site('Central Mall');
    mall(s.x, s.z - 10, s.groundY);
  }
  {
    const s = site('Aurora');
    const Y = s.groundY;
    const types = ['villa', 'shop', 'house', 'villa', 'warehouse', 'house', 'shop', 'villa'];
    let k = 0;
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const x = s.x + i * 30;
        const z = s.z + j * 28;
        if (!i && !j) {
          addBox(x, z, 3, 3, 4, 0x9a9a9a, Y);
          addBox(x, z, 10, 10, 0.5, 0x8a8a8a, Y);
          for (const q of [[-5, 0], [5, 0], [0, 5], [0, -5]]) {
            addBox(x + q[0], z + q[1], q[0] ? 0.8 : 2, q[0] ? 2 : 0.8, 0.6, 0x6e4a2a, Y);
          }
          addFootprint(x, z, 12, 12, 'plaza');
          addLoot(x + 3, z + 3, Y, 1);
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
          warehouse(x, z, 18, 12, Y, { height: 5, gateWidth: 4, gateHeight: 3.6 });
        }
      }
    }
    for (let q = 0; q < 10; q++) {
      const x = s.x + (rand() < 0.5 ? -15 : 15) + randRange(-2, 2);
      const z = s.z + randRange(-40, 40);
      if (!insideFootprint(x, z, 5)) {
        car(x, z, Y, 'z');
      }
    }
  }
  {
    const s = site('Maple Heights');
    const Y = s.groundY;
    for (const rz of [-16, 16]) {
      for (const rx of [-30, -10, 10, 30]) {
        house(s.x + rx, s.z + rz, 10, 9, Y);
        if (rand() < 0.6) {
          car(s.x + rx + 7.5, s.z + rz + 8, Y, 'z');
        }
      }
    }
    villa(s.x, s.z - 36, 14, 11, Y);
    shop(s.x + 14, s.z + 29, 14, 8, Y);
  }
  {
    const s = site('Pinecrest');
    const Y = s.groundY;
    for (const q of [[-28, -8], [-14, -26], [8, -30], [28, -12], [30, 12], [-30, 14], [-12, 26]]) {
      house(s.x + q[0], s.z + q[1], randInt(9, 11), randInt(8, 9), Y, { roofColor: 0x5a4a3a, color: pick([0xc9a77a, 0xb89a6a, 0xd6c3a0]) });
    }
    warehouse(s.x - 2, s.z + 2, 10, 18, Y, { height: 6, gateWidth: 3, gateHeight: 3.2, color: 0xc9c4b8, tier: 1 });
    tower(s.x + 11, s.z - 6, Y, 14);
    shop(s.x + 14, s.z + 28, 14, 8, Y);
    for (let q = 0; q < 5; q++) {
      const x = s.x + randRange(-34, 34);
      const z = s.z + randRange(-34, 34);
      if (Math.hypot(x - s.x, z - s.z) < 38 && !insideFootprint(x, z, 4.5)) {
        addBox(x, z, 2.4, 1.2, 1.1, 0x7a5a3a, Y);
      }
    }
  }
  {
    const s = site('Frostpeak Lodge');
    const Y = s.groundY;
    villa(s.x, s.z - 2, 20, 13, Y, { color: 0x9a7448, roofColor: 0xe8eef2, tier: 2 });
    house(s.x - 14, s.z + 9, 9, 8, Y, { color: 0x9a7448, roofColor: 0xe8eef2 });
    house(s.x + 14, s.z + 9, 9, 8, Y, { color: 0x9a7448, roofColor: 0xe8eef2 });
    stairTower(s.x - 15, s.z - 12, Y, { size: 6.4, height: 9, color: 0x7a6a50, roofColor: 0x6b3a2a, face: 'e', footprintKind: 'lookout' });
  }
  {
    const s = site('Fort Redstone');
    const Y = s.groundY;
    const hh = 26;
    const c = 0x8a8f94;
    const th = 1.2;
    wall('x', s.z - hh, s.x - hh, s.x + hh, Y, 5, c, [{ center: s.x, width: 8, type: 'gate', doorHeight: 4.2 }], th);
    wall('x', s.z + hh, s.x - hh, s.x + hh, Y, 5, c, [{ center: s.x, width: 8, type: 'gate', doorHeight: 4.2 }], th);
    wall('z', s.x - hh, s.z - hh, s.z + hh, Y, 5, c, [], th);
    wall('z', s.x + hh, s.z - hh, s.z + hh, Y, 5, c, [], th);
    for (const q of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const x = s.x + q[0] * (hh - 4);
      const z = s.z + q[1] * (hh - 4);
      stairTower(x, z, Y, { size: 6.4, height: 13, color: 0x7a7f84, roofColor: 0x555a60, face: q[0] < 0 ? 'e' : 'w', footprintKind: 'fortTower' });
    }
    house(s.x - 8, s.z - 14, 24, 9, Y, { color: 0x9aa08c, roofColor: 0x555a50, tier: 2 });
    house(s.x - 8, s.z + 14, 24, 9, Y, { color: 0x9aa08c, roofColor: 0x555a50, tier: 2 });
    house(s.x + 15, s.z + 2, 10, 9, Y, { color: 0x7a7f84, roofColor: 0x44484c, tier: 2 });
    tower(s.x + 14, s.z - 16, Y, 14);
    addBox(s.x + 15, s.z + 19, 12, 12, 0.05, 0x55585a, Y + 0.03, true);
    for (let q = 0; q < 14; q++) {
      const x = s.x + randRange(-22, 22);
      const z = s.z + randRange(-22, 22);
      if (!insideFootprint(x, z, 4.5)) {
        addBox(x, z, 3, 1, 1.1, 0x9a8a6a, Y);
      }
    }
  }
  {
    const s = site('Ironworks');
    const Y = s.groundY;
    warehouse(s.x - 20, s.z - 18, 30, 18, Y, { tier: 1 });
    warehouse(s.x + 14, s.z - 20, 24, 16, Y, { tier: 1 });
    warehouse(s.x + 8, s.z + 16, 28, 14, Y, { height: 8, gateWidth: 6, gateHeight: 5.5, color: 0x8a8f94, tier: 2 });
    addBox(s.x + 26, s.z + 16, 4, 4, 34, 0x7a7468, Y);
    addFootprint(s.x + 26, s.z + 16, 5, 5, 'stack');
    for (const q of [[-30, 10], [-30, 24], [-18, 32]]) {
      silo(s.x + q[0], s.z + q[1], Y, 8, 7, 0x8a9098, { face: q[0] < -20 ? 'e' : 'n' });
      addFootprint(s.x + q[0], s.z + q[1], 9, 9, 'tank');
    }
    containers(s.x + 4, s.z + 38, Y, 2, 1, false);
    for (let q = 0; q < 5; q++) {
      addBox(s.x - 12 + q * 7, s.z - 2, 1, 1, 3, 0x666b70, Y);
    }
  }
  {
    const s = site('Port Calder');
    const Y = s.groundY;
    warehouse(s.x - 24, s.z - 20, 26, 14, Y, { tier: 1 });
    warehouse(s.x - 26, s.z + 14, 22, 12, Y, { tier: 1, gateWidth: 5 });
    shop(s.x + 4, s.z + 30, 13, 9, Y, { tier: 2 });
    containers(s.x - 10, s.z - 38, Y, 3, 2, true);
    for (const pz of [-14, 10]) {
      addBox(s.x + 52, s.z + pz, 64, 5, 0.5, 0x7a6a58, Y - 0.3);
      for (let k = 24; k <= 84; k += 12) {
        addBox(s.x + k, s.z + pz - 2.2, 0.6, 0.6, 1, 0x333, Y + 0.2);
      }
    }
    for (const q of [-4, 4]) {
      addBox(s.x + 34, s.z - 14 + q, 1.4, 1.4, 18, 0xd9822b, Y);
      addBox(s.x + 34 + 0, s.z - 14, 2.2, 10, 2.2, 0xd9822b, Y + 18);
    }
    addLoot(s.x + 60, s.z - 14, Y + 0.2, 2);
    addLoot(s.x + 60, s.z + 10, Y + 0.2, 2);
  }
  {
    const s = site('Meadowbrook Farm');
    const Y = s.groundY;
    warehouse(s.x - 18, s.z - 10, 22, 14, Y, { height: 6.5, gateWidth: 6, gateHeight: 4.6, color: 0x8a3a2e, tier: 1 });
    house(s.x + 14, s.z - 18, 12, 9, Y);
    for (const q of [[22, 8], [22, 16], [30, 12]]) {
      silo(s.x + q[0], s.z + q[1], Y, 6, 14, 0xc9ccd0, { roofColor: 0x888888, face: q[0] > 25 ? 'e' : 'w' });
      addFootprint(s.x + q[0], s.z + q[1], 7, 7, 'silo');
    }
    for (let k = 0; k <= 24; k += 2) {
      addBox(s.x - 30 + k, s.z + 14, 0.3, 0.3, 1.1, 0x6b4a2a, Y);
      addBox(s.x - 30 + k, s.z + 40, 0.3, 0.3, 1.1, 0x6b4a2a, Y);
    }
    addBox(s.x - 18, s.z + 14, 24, 0.2, 0.3, 0x6b4a2a, Y + 0.8);
    addBox(s.x - 18, s.z + 40, 24, 0.2, 0.3, 0x6b4a2a, Y + 0.8);
    addFootprint(s.x - 18, s.z + 27, 26, 28, 'paddock');
    for (let q = 0; q < 8; q++) {
      addBox(s.x - 30 + randRange(0, 24), s.z + 16 + randRange(0, 22), 1.6, 1.6, 1.4, 0xd6b84a, Y);
    }
    silo(s.x - 34, s.z - 30, Y, 6, 7, 0xe0e0e0, { roofColor: 0xe0e0e0, face: 's', tier: 1 });
    addBox(s.x - 34, s.z - 30, 3.6, 3.6, 8, 0xe0e0e0, Y + 7.5);
    addBox(s.x - 34, s.z - 27.9, 0.4, 0.3, 10, 0x5a4a3a, Y + 11);
    addBox(s.x - 34, s.z - 27.9, 10, 0.3, 0.4, 0x5a4a3a, Y + 15.8);
    addFootprint(s.x - 34, s.z - 30, 7, 7, 'mill');
    addBox(s.x + 4, s.z - 4, 3.6, 2.2, 1.6, 0x2e8a3a, Y);
    addBox(s.x + 4, s.z - 5, 2, 1.6, 1, 0x3a3a3a, Y + 1.6);
    addLoot(s.x + 4, s.z + 2, Y, 1);
  }
  {
    const s = site('Dusty Gulch');
    const Y = s.groundY;
    for (const q of [[-22, -14], [-4, -24], [16, -14], [22, 8], [-20, 12]]) {
      house(s.x + q[0], s.z + q[1], randInt(9, 11), randInt(8, 9), Y, { color: pick([0xd8b98a, 0xcaa878, 0xe0c8a0]), roofColor: 0xb08a5a });
    }
    shop(s.x, s.z + 22, 16, 9, Y, { color: 0xc9a77a });
    for (const q of [[-3, -3], [3, -3], [-3, 3], [3, 3]]) {
      addBox(s.x + q[0], s.z + q[1], 0.6, 0.6, 6, 0x6b4a2a, Y);
    }
    addBox(s.x, s.z, 6, 6, 2.2, 0x8a6a4a, Y + 6);
    addFootprint(s.x, s.z, 7, 7, 'wtower');
    addBox(s.x + 8, s.z + 8, 2, 2, 1, 0x888, Y);
    addFootprint(s.x + 8, s.z + 8, 3, 3, 'well');
  }
  {
    const s = site('Skyfield Airstrip');
    const Y = s.groundY;
    const rx = -312;
    addBox(rx, -30, 16, 190, 0.02, 0x4a4d50, Y + 0.03, true);
    for (let z = -115; z <= 55; z += 14) {
      addBox(rx, z, 0.5, 6, 0.02, 0xeeeeee, Y + 0.06, true);
    }
    addFootprint(rx, -30, 18, 192, 'runway');
    hangar(-285, -70, Y);
    hangar(-285, -25, Y);
    tower(-285, 20, Y, 16);
    shop(-285, 45, 22, 10, Y, { color: 0xbfc4c8, tier: 2 });
    silo(-285, 66, Y, 6, 5, 0x8a9098, { face: 'n' });
    addFootprint(-285, 66, 7, 7, 'tank');
    addBox(rx + 10, -60, 0.3, 0.3, 5, 0xcc3322, Y);
  }
  {
    const s = site('Cape Light');
    const Y = s.groundY;
    stairTower(s.x, s.z, Y, { size: 7.2, height: 17, color: 0xf0f0f0, roofColor: 0xc9342b, footprintKind: 'lighthouse' });
    for (const q of [5, 10]) {
      addBox(s.x, s.z, 7.9, 7.9, 1.3, 0xc9342b, Y + q, true);
    }
    house(s.x - 13, s.z + 6, 10, 8, Y, { color: 0xf0f0f0, roofColor: 0xc9342b, tier: 1 });
  }
  for (const b of BRIDGES) {
    bridge(b);
  }

  /* ===== wilderness: cabins, gas stations, forests, rocks ===== */
  const nearSite = (x: number, z: number, m: number) => SITES.some(s => Math.hypot(x - s.x, z - s.z) < s.radius + m) || BRIDGES.some(b => Math.hypot(x - b.x, z - b.z) < b.length / 2 + 16);

  /** Lowest and highest ground under a rectangle. */
  const groundRange = (x: number, z: number, w: number, d: number) => {
    let mn = 1e9;
    let mx = -1e9;
    for (let a = -1; a <= 1; a++) {
      for (let b = -1; b <= 1; b++) {
        const h = T.height(x + a * w / 2, z + b * d / 2);
        mn = Math.min(mn, h);
        mx = Math.max(mx, h);
      }
    }
    return [mn, mx];
  };

  const roadNear = (x: number, z: number) => T.kind(x, z) === 6 || T.kind(x + 4, z) === 6 || T.kind(x - 4, z) === 6 || T.kind(x, z + 4) === 6 || T.kind(x, z - 4) === 6;

  const inSiteCore = (x: number, z: number, k: number) => SITES.some(s => Math.hypot(x - s.x, z - s.z) < s.radius * k) || (x < -270 && Math.abs(z + 30) < 110);

  const cabins: Vec2[] = [];

  for (let n = 0; n < 1500 && cabins.length < 16; n++) {
    const x = randRange(-330, 330);
    const z = randRange(-330, 330);
    if (Math.hypot(x, z) > 340) {
      continue;
    }
    const [mn, mx] = groundRange(x, z, 12, 11);
    const k = T.kind(x, z);
    if (mn < WATER_LEVEL + 1.6 || mx - mn > 0.5 || nearSite(x, z, 26) || inSiteCore(x, z, 1) || k === 6 || k === 0 || k === 4 || k === 5 || roadNear(x, z) || cabins.some(c => Math.hypot(c[0] - x, c[1] - z) < 70)) {
      continue;
    }
    cabins.push([x, z]);
    addBox(x, z, 12, 11, mx - mn + 0.8, 0x7a7468, mn - 0.8);
    house(x, z, 9 + 2 * (n % 2), 8, mx, { tier: 1, color: pick([0x9a7448, 0xb89a6a, 0xc9c4b8]) });
  }
  let gasStations = 0;
  for (const rd of T.roads) {
    if (gasStations >= 4) {
      break;
    }
    for (let tries = 0; tries < 12; tries++) {
      const p = rd[Math.floor(randRange(0.2, 0.8) * rd.length)];
      const x = p[0] + randRange(10, 16) * (rand() < 0.5 ? -1 : 1);
      const z = p[1] + randRange(10, 16) * (rand() < 0.5 ? -1 : 1);
      const [mn, mx] = groundRange(x, z, 16, 22);
      if (mn < WATER_LEVEL + 1.6 || mx - mn > 0.5 || nearSite(x, z, 24) || insideFootprint(x, z, 12) || roadNear(x, z)) {
        continue;
      }
      addBox(x, z, 18, 24, mx - mn + 0.8, 0x6a6e72, mn - 0.8);
      shop(x, z, 12, 8, mx, { tier: 1, color: 0xe0e0e0 });
      addBox(x, z + 12, 10, 6, 0.4, 0xc9342b, mx + 4.2);
      for (const q of [-4, 4]) {
        addBox(x + q, z + 9.5, 0.6, 0.6, 4.2, 0x666, mx);
      }
      for (const q of [-2.5, 2.5]) {
        addBox(x + q, z + 12, 1, 0.8, 1.6, 0x2a2a2a, mx);
      }
      addFootprint(x, z + 6, 14, 22, 'gas');
      gasStations++;
      break;
    }
  }
  const { n2 } = makeNoise(31);
  let treeCount = 0;
  for (let x = -345; x < 345; x += 9) {
    for (let z = -345; z < 345; z += 9) {
      const px = x + randRange(-3, 3);
      const pz = z + randRange(-3, 3);
      const k = T.kind(px, pz);
      if (k !== 2 && k !== 3 && k !== 9) {
        continue;
      }
      const sl = T.slope(px, pz);
      const h = T.height(px, pz);
      if (sl > 0.5 || h < WATER_LEVEL + 1.4) {
        continue;
      }
      const fd = n2(px * 0.011 + 9, pz * 0.011 + 4);
      if (fd < (k === 9 ? 0.5 : 0.67) || rand() < 0.12 || inSiteCore(px, pz, 0.95) || roadNear(px, pz) || insideFootprint(px, pz, 3) || nearSite(px, pz, -2)) {
        continue;
      }
      const pine = h > 16 || rand() < 0.35;
      const gc = pick([0x2f6b2f, 0x3a7a38, 0x2a5a2a]);
      addBox(px, pz, 0.9, 0.9, 5, 0x6b4a2a, h - 0.6);
      if (pine) {
        addBox(px, pz, 4.6, 4.6, 2.2, gc, h + 2.4, true);
        addBox(px, pz, 2.8, 2.8, 2.2, gc, h + 4.4, true);
        addBox(px, pz, 1.2, 1.2, 1.4, gc, h + 6.4, true);
      } else {
        addBox(px, pz, 5.2, 5.2, 3, gc, h + 3.4, true);
      }
      treeCount++;
      if (treeCount > 1300) {
        break;
      }
    }
  }
  let rockCount = 0;
  for (let x = -345; x < 345; x += 13) {
    for (let z = -345; z < 345; z += 13) {
      const px = x + randRange(-5, 5);
      const pz = z + randRange(-5, 5);
      const k = T.kind(px, pz);
      if (k !== 4 && k !== 5) {
        continue;
      }
      if (T.slope(px, pz) < 0.3 || rand() < 0.7 || inSiteCore(px, pz, 0.95)) {
        continue;
      }
      const h = T.height(px, pz);
      const n = randInt(1, 3);
      for (let q = 0; q < n; q++) {
        const sz = randRange(2.2, 6);
        const hh = randRange(1.6, 4.5);
        const rx = px + randRange(-3, 3);
        const rz = pz + randRange(-3, 3);
        addBox(rx, rz, sz, sz * randRange(0.7, 1.3), hh, pick([0x8a867c, 0x77736a, 0x9a968c]), T.height(rx, rz) - 1.4);
        if (h > 38) {
          addBox(rx, rz, sz * 0.8, sz * 0.8, 0.5, 0xf1f4f6, T.height(rx, rz) - 1.4 + hh);
        }
      }
      rockCount++;
    }
  }
  for (let n = 0; n < 600 && lootSpots.length < lootSpots.length + 1; n++) {
    if (n >= 40) {
      break;
    }
    const x = randRange(-330, 330);
    const z = randRange(-330, 330);
    const h = T.height(x, z);
    if (h < WATER_LEVEL + 2 || T.slope(x, z) > 0.3 || insideFootprint(x, z, 2) || T.kind(x, z) === 0) {
      continue;
    }
    lootSpots.push([x, z, h, 1]);
  }
  return { terrain: T, mesh: terrainMesh(T), boxes: mapBoxes, glass: mapGlass, doors: mapDoors, loot: lootSpots, footprints: footprints, stairs: stairwells, pois: SITES, counts: { trees: treeCount, rocks: rockCount, cabins: cabins.length, gas: gasStations } };
}
