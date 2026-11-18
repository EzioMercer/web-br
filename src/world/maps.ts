// @ts-nocheck -- split from the original monolith, not typed yet
import { BRH } from './terrain';
import { genWorld } from './worldgen';

export const SURFC = { 0xc9b27c: 'dust', 0xb59a63: 'dust', 0xa9a47a: 'dust', 0xdfe6ea: 'snow', 0x6f8f55: 'grass', 0x7b9a5a: 'grass', 0x7a7a74: 'dust' };
const cW = 0xb8a173;
const cD = 0x9c8660;
const cC = 0x8b5a2b;
const cR = 0xe4dac3;
const cT = 0x8a7a5e;
const cH = 0x4f7a3a;
const cK = 0x6e4a2a;
const cF = 0x7a5a3a;

const out = c => [[0, -30.5, 62, 1, 7, c], [0, 30.5, 62, 1, 7, c], [-30.5, 0, 1, 62, 7, c], [30.5, 0, 1, 62, 7, c]];

const cK2 = 0x7a6a50;
const cG = 0x5a6a3a;

const sg = (ax, c, a, b, h, y, col = cR) => {
  const m = (a + b) / 2;
  const l = b - a;
  return ax === 'x' ? [m, c, l, 1, h, col, y] : [c, m, 1, l, h, col, y];
};

const wl = (ax, c, a, b, wins, y, col) => {
  const o = [];
  let q = a;
  for (const [m, w] of wins) {
    o.push(sg(ax, c, q, m - w / 2, 3, y, col), sg(ax, c, m - w / 2, m + w / 2, 0.9, y, col), sg(ax, c, m - w / 2, m + w / 2, 0.7, y + 2.3, col));
    q = m + w / 2;
  }
  o.push(sg(ax, c, q, b, 3, y, col));
  return o;
};

const fw = (y, g) => [...(g ? [[-9, -24, 14, 1, 3, cR, y], [9, -24, 14, 1, 3, cR, y], [-16, -20.5, 1, 7, 3, cR, y], [-16, -9.5, 1, 7, 3, cR, y], [16, -20.5, 1, 7, 3, cR, y], [16, -9.5, 1, 7, 3, cR, y]] : []), [-4, -22, 1, 4, 3, cR, y], [-4, -14, 1, 4, 3, cR, y], [-4, -7, 1, 2, 3, cR, y], [4, -22, 1, 4, 3, cR, y], [4, -14, 1, 4, 3, cR, y], [4, -7, 1, 2, 3, cR, y]];

const stairs = Array.from({ length: 8 }, (_, i) => [0, -10.5 - i, 2.5, 1, 0.4125 * (i + 1), cT]);
// Dust 2x2 (A-site section) primitive data: position = box centre [x,y,z], scale = full extents [w,h,d]
const DUST_2X2_MAP = [
  { name: 'Boundary_North', primitive_type: 'Box', position: [0, 3.5, -30.5], scale: [62, 7, 1], hex_color: '#D3B785' },
  { name: 'Boundary_South', primitive_type: 'Box', position: [0, 3.5, 30.5], scale: [62, 7, 1], hex_color: '#D3B785' },
  { name: 'Boundary_West', primitive_type: 'Box', position: [-30.5, 3.5, 0], scale: [1, 7, 62], hex_color: '#D3B785' },
  { name: 'Boundary_East', primitive_type: 'Box', position: [30.5, 3.5, 0], scale: [1, 7, 62], hex_color: '#D3B785' },
  { name: 'Boundary_WestBlock', primitive_type: 'Box', position: [-15, 2.5, 10], scale: [30, 5, 40], hex_color: '#D3B785' },
  { name: 'Long_EastBlock', primitive_type: 'Box', position: [27, 2.5, 12], scale: [6, 5, 36], hex_color: '#D3B785' },
  { name: 'CT_Roof', primitive_type: 'Box', position: [-20, 4.65, -20], scale: [20, 0.3, 20], hex_color: '#BBA072' },
  { name: 'CT_Pillar', primitive_type: 'Box', position: [-18, 2.5, -20], scale: [1.5, 5, 1.5], hex_color: '#D3B785' },
  { name: 'CT_Crate_1', primitive_type: 'Box', position: [-25, 0.75, -14], scale: [2, 1.5, 2], hex_color: '#A0784E' },
  { name: 'CT_Crate_2', primitive_type: 'Box', position: [-14, 0.5, -26], scale: [3, 1, 2], hex_color: '#A0784E' },
  { name: 'CT_Dumpster', primitive_type: 'Box', position: [-27, 1, -24], scale: [3, 2, 2], hex_color: '#A0784E' },
  { name: 'RampWall_North', primitive_type: 'Box', position: [-5, 2.5, -27], scale: [10, 5, 6], hex_color: '#BBA072' },
  { name: 'RampWall_South', primitive_type: 'Box', position: [-5, 2.5, -12], scale: [10, 5, 4], hex_color: '#BBA072' },
  { name: 'Ramp_Step_1', primitive_type: 'Box', position: [-5, 0.125, -19], scale: [2, 0.25, 10], hex_color: '#BBA072' },
  { name: 'Ramp_Step_2', primitive_type: 'Box', position: [-3, 0.25, -19], scale: [2, 0.5, 10], hex_color: '#BBA072' },
  { name: 'Ramp_Step_3', primitive_type: 'Box', position: [-1, 0.375, -19], scale: [2, 0.75, 10], hex_color: '#BBA072' },
  { name: 'A_SitePlatform', primitive_type: 'Box', position: [15, 0.5, -18], scale: [30, 1, 24], hex_color: '#E2C99D' },
  { name: 'A_PlantZone', primitive_type: 'Box', position: [16, 1.05, -16], scale: [8, 0.1, 8], hex_color: '#BBA072' },
  { name: 'A_DefaultBox', primitive_type: 'Box', position: [18, 1.75, -20], scale: [2, 1.5, 2], hex_color: '#A0784E' },
  { name: 'A_TripleBox_1', primitive_type: 'Box', position: [5, 1.75, -10], scale: [2, 1.5, 2], hex_color: '#A0784E' },
  { name: 'A_TripleBox_2', primitive_type: 'Box', position: [7.2, 1.75, -10], scale: [2, 1.5, 2], hex_color: '#A0784E' },
  { name: 'A_TripleBox_3', primitive_type: 'Box', position: [5, 1.75, -12.2], scale: [2, 1.5, 2], hex_color: '#A0784E' },
  { name: 'A_Goose', primitive_type: 'Box', position: [27, 1.75, -27], scale: [4, 1.5, 4], hex_color: '#A0784E' },
  { name: 'A_Car', primitive_type: 'Box', position: [20, 1.6, -8.5], scale: [4, 1.2, 2], hex_color: '#A0784E' },
  { name: 'Long_Step_1', primitive_type: 'Box', position: [18, 0.125, -1], scale: [12, 0.25, 2], hex_color: '#BBA072' },
  { name: 'Long_Step_2', primitive_type: 'Box', position: [18, 0.25, -3], scale: [12, 0.5, 2], hex_color: '#BBA072' },
  { name: 'Long_Step_3', primitive_type: 'Box', position: [18, 0.375, -5], scale: [12, 0.75, 2], hex_color: '#BBA072' },
  { name: 'Long_WestWall', primitive_type: 'Box', position: [11.5, 2.5, 8.25], scale: [1, 5, 28.5], hex_color: '#D3B785' },
  { name: 'Long_Corner', primitive_type: 'Box', position: [14, 2.5, 6.5], scale: [4, 5, 5], hex_color: '#BBA072' },
  { name: 'Long_CrateStack', primitive_type: 'Box', position: [19, 0.75, 10], scale: [1.5, 1.5, 1.5], hex_color: '#A0784E' },
  { name: 'Long_BlueContainer', primitive_type: 'Box', position: [21, 1.25, 14], scale: [3, 2.5, 7], hex_color: '#A0784E' },
  { name: 'Long_Car', primitive_type: 'Box', position: [14, 0.8, 18], scale: [2.2, 1.6, 4.5], hex_color: '#A0784E' },
  { name: 'LongDoors_Left', primitive_type: 'Box', position: [13.25, 2.5, 22.5], scale: [2.5, 5, 1], hex_color: '#D3B785' },
  { name: 'LongDoors_Pillar', primitive_type: 'Box', position: [18, 2.5, 22.5], scale: [2, 5, 1], hex_color: '#D3B785' },
  { name: 'LongDoors_Right', primitive_type: 'Box', position: [23, 2.5, 22.5], scale: [2, 5, 1], hex_color: '#D3B785' },
  { name: 'Outside_Car', primitive_type: 'Box', position: [20, 0.8, 26], scale: [4.5, 1.6, 2.2], hex_color: '#A0784E' },
  { name: 'Catwalk_Deck', primitive_type: 'Box', position: [5.5, 1, 4], scale: [11, 2, 20], hex_color: '#D3B785' },
  { name: 'Catwalk_Rail_Left', primitive_type: 'Box', position: [2.5, 2.6, -6], scale: [5, 1.2, 0.4], hex_color: '#BBA072' },
  { name: 'Catwalk_Rail_Right', primitive_type: 'Box', position: [9.5, 2.6, -6], scale: [3, 1.2, 0.4], hex_color: '#BBA072' },
  { name: 'Catwalk_DropStep', primitive_type: 'Box', position: [6.5, 1.25, -7], scale: [3, 0.5, 2], hex_color: '#BBA072' },
  { name: 'Catwalk_Crate_1', primitive_type: 'Box', position: [9.5, 2.75, 2], scale: [1.5, 1.5, 1.5], hex_color: '#A0784E' },
  { name: 'Catwalk_Crate_2', primitive_type: 'Box', position: [2.5, 2.75, 8], scale: [1.5, 1.5, 1.5], hex_color: '#A0784E' },
  ...[1, 2, 3, 4, 5, 6, 7, 8].map(i => ({ name: 'Short_Stair_' + i, primitive_type: 'Box', position: [5.5, 0.125 * i, 22.5 - i], scale: [11, 0.25 * i, 1], hex_color: '#BBA072' })),
];
const D2X2A_BOXES = DUST_2X2_MAP.filter(q => q.primitive_type === 'Box').map(q => [q.position[0], q.position[2], q.scale[0], q.scale[2], q.scale[1], parseInt(q.hex_color.slice(1), 16), q.position[1] - q.scale[1] / 2]);
export const MAPS = {
  blockout: { name: 'Blockout', sky: 0xc3d6e2, floor: 0xd8c498, spawn: [0, 26], ts: [[-12, -26], [-4, -26], [4, -26], [12, -26], [0, -24]], wp: [[-24, -22], [0, -22], [24, -12], [-24, -12], [-26, 24], [26, 24], [0, -14], [0, -4], [-12, 0], [12, 0], [0, 24], [-12, 12], [12, 22]], b: [...out(cW), [-10, -8, 16, 1, 4, cW], [10, -8, 16, 1, 4, cW], [-20, 8, 1, 14, 4, cD], [20, 8, 1, 14, 4, cD], [0, 16, 14, 1, 4, cD], [-12, -18, 6, 1, 3, cD], [12, -18, 6, 1, 3, cD], [-5, -2, 2, 2, 2, cC], [-3.2, -2.9, 1.4, 1.4, 1, cC], [6, -3, 2, 2, 2, cC], [0, 8, 3, 3, 1, cC], [-24, -15, 2, 2, 2, cC], [24, -15, 2, 2, 2, cC], [14, 10, 2, 2, 2, cC], [24, -24, 8, 8, 1, cD], [18.5, -24, 2, 4, 0.5, cD]] },
  mansion: { name: 'Mansion', surf: 'grass', sky: 0xaec3d8, floor: 0x93a87a, spawn: [0, 26], ts: [[-11, -21], [11, -21], [-11, -10], [11, -10], [0, -22]], wp: [[-11, -21], [11, -21], [-11, -10], [11, -10], [0, -22], [0, -8], [-24, -12], [24, -12], [-20, 4], [20, 4], [0, 4], [0, 16], [-22, 18], [22, 18]], b: [...out(0x8f9a7a), ...fw(0, true), ...fw(3.3, false), ...wl('x', -6, -16, 16, [[-7.5, 3], [0, 4], [7.5, 3]], 3.3), ...wl('x', -24, -16, 16, [[-8, 3], [0, 3], [8, 3]], 3.3), ...wl('z', -16, -24, -6, [[-20, 3], [-15, 3], [-10, 3]], 3.3), ...wl('z', 16, -24, -6, [[-20, 3], [-15, 3], [-10, 3]], 3.3), [-12.5, -6, 7, 1, 3, cR], [-7.5, -6, 3, 1, 1, cR], [-7.5, -6, 3, 1, 0.8, cR, 2.2], [-4, -6, 4, 1, 3, cR], [4, -6, 4, 1, 3, cR], [7.5, -6, 3, 1, 1, cR], [7.5, -6, 3, 1, 0.8, cR, 2.2], [12.5, -6, 7, 1, 3, cR], ...stairs, [-8.8, -15, 14.4, 18, 0.3, cF, 3], [8.8, -15, 14.4, 18, 0.3, cF, 3], [0, -21, 3.2, 6, 0.3, cF, 3], [0, -8, 3.2, 4, 0.3, cF, 3], [0, -15, 34, 20, 0.4, cT, 6.3], [-10, -16, 3, 1.5, 1, cK], [10, -16, 3, 1.5, 1, cK], [-12, -8.5, 2, 2, 0.8, cK], [12, -8.5, 2, 2, 0.8, cK], [-12, -21, 3, 2, 0.8, cK, 3.3], [12, -21, 3, 2, 0.8, cK, 3.3], [-20, 0, 10, 1, 1.6, cH], [20, 0, 10, 1, 1.6, cH], [-20, 20, 10, 1, 1.6, cH], [20, 20, 10, 1, 1.6, cH], [0, 10, 3, 3, 1.2, 0x9aa8b0], [24, 10, 6, 6, 3, cR], [-26, 10, 1.4, 1.4, 4.5, cK], [-26, -10, 1.4, 1.4, 4.5, cK], [26, -10, 1.4, 1.4, 4.5, cK], [-8, 18, 2, 2, 2, cC], [8, 18, 2, 2, 2, cC]] },
  dust2x2: { name: 'Dust 2 (B half)', sky: 0xe3d3a8, floor: 0xd5bf8a, spawn: [10, -18], ts: [[8, 24], [3, 26], [-2, 26], [12, 26], [5, 20]], wp: [[-27, 8], [-27, -6], [-27, -14], [-20, -23], [-18, -12], [-18, 0], [-12, 6], [-5, 6], [3, 8], [-4, -2], [4, -2], [0, -5], [-6, -14], [-4, -22], [2, -12], [10, -20], [10, -12], [-8, -18], [-8, 22], [-20, 18], [0, 16]], b: [[0, -30.5, 62, 1, 7, cW], [0, 30.5, 62, 1, 7, cW], [-30.5, 0, 1, 62, 7, cW], [14.5, 0, 1, 62, 7, cW], [-24, -4, 1, 12, 5, cD], [-24, 10, 1, 8, 5, cD], [-24, 4, 1, 4, 0.5, cD], [-16, -5, 16, 1, 5, cD], [-8, -6.5, 1, 3, 5, cD], [-8, 4.5, 1, 11, 5, cD], [10.5, 2, 8, 20, 5, cD], [-9.75, -8, 5.5, 1, 5, cD], [-2, -8, 3, 1, 5, cD], [4.75, -8, 3.5, 1, 5, cD], [6.5, -27, 1, 6, 5, cK2], [6.5, -10, 1, 4, 5, cK2], [10.5, -19, 8, 22, 0.4, cK2, 4.6], [-18.25, -10, 11.5, 1, 5, cD], [-12.5, -26.25, 1, 7.5, 5, cD], [-12.5, -19, 1, 1, 5, cD], ...wl('z', -12.5, -15.5, -8, [[-12.25, 3]], 0, cD), [-27, -25, 6, 6, 1.2, cD], [-22.5, -24, 3, 3, 0.6, cD], [-19, -18, 3, 3, 2, cC], [-21, -13, 3, 2, 1.5, cG], [-15, -14, 2, 2, 1, cC], [-26, -17, 2, 2, 1, cC], [0, 2, 3, 3, 1.8, cC], [-3, 8, 1.5, 1.5, 1.2, cC], [-4, -14, 2, 2, 1.5, cC], [2, -20, 3, 2, 1, cC], [-26, 20, 2, 2, 2, cC], [-22, 24, 2, 2, 1.5, cC], [-16, 18, 3, 1, 1.2, cC], [6, 22, 3, 2, 1.5, cG], [10, 17, 2, 2, 2, cC], [-4, 24, 2, 2, 1.2, cC]] },
  dust2x2a: { name: 'Dust 2x2', sky: 0xAEC1D4, floor: 0xE2C99D, spawn: [-20, -16], ts: [[2, 27], [6, 25], [10, 27], [14, 27], [16, 25]], wp: [[-20, -24], [-14, -18], [-26, -20], [-8, -19], [8, -20], [14, -12], [24, -14], [22, -24], [6, -24], [18, -3], [18, 2], [20, 7], [16, 12], [22, 19], [16, 20], [20, 28.5], [5, 18], [5, 6], [5, -2], [3, 25], [8, 25]], b: D2X2A_BOXES },
  br: { name: 'Battle Royale', hidden: true, inst: true, half: BRH, size: 900, sky: 0x9cc3e6, floor: 0x86a266, fogN: 160, fogF: 820, far: 1500, spawn: [0, 0], ts: [[0, 0]], wp: [[0, 0]], surf: 'grass', gen: genWorld },
};
MAPS.dust2 = (() => {
  const A = MAPS.dust2x2a;
  const B = MAPS.dust2x2;

  const sh = a => [a[0] - 45, ...a.slice(1)];

  const Ab = A.b.filter(a => !(a[2] === 62 && a[3] === 1) && !(a[2] === 1 && a[3] === 62) && !(a[0] === -15 && a[1] === 10 && a[2] === 30));
  return { name: 'Dust 2', sky: 0xAEC1D4, floor: 0xE2C99D, fw: 107, fd: 62, cx: -22.5, spawn: A.spawn, ts: [[2, 27], [10, 27], [16, 25], [-37, 24], [-42, 26]], wp: [...A.wp, ...B.wp.map(([x, z]) => [x - 45, z]), [-31, 22], [-31, -20], [-15, 22]], b: [[-22.5, -30.5, 107, 1, 7, cW], [-22.5, 30.5, 107, 1, 7, cW], [-75.5, 0, 1, 62, 7, cW], [30.5, 0, 1, 62, 7, cW], [-30.5, -29, 1, 4, 7, cW], [-30.5, 1, 1, 28, 7, cW], [-30.5, 30, 1, 2, 7, cW], [-15, 2, 30, 24, 5, 0xD3B785, 0], ...Ab, ...B.b.slice(4).map(sh)] };
})();
delete MAPS.dust2x2;
delete MAPS.dust2x2a;
