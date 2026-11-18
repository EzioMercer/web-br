// @ts-nocheck -- split from the original monolith, not typed yet

export const OPT = { rd: { n: 'Red dot sight', s: 'Red dot', fov: 60, sens: 0.85 }, ho: { n: 'Holographic sight', s: 'Holo', fov: 56, sens: 0.8 }, x2: { n: '2x scope', s: '2x', fov: 38, sens: 0.6 }, x4: { n: '4x ACOG scope', s: '4x', fov: 22, sens: 0.4 } };
export const OPTK = ['rd', 'ho', 'x2', 'x4'];
export const NC = { he: 0x3c5a3a, fl: 0xd8d8d8, sm: 0x7a8288 };
export const WPN = { pistol: { name: 'USP', cost: 0, mag: 12, res: 36, rate: 0.17, dmg: 34, rec: 0.8, auto: false, rt: 1.9, sl: 2 }, glock: { name: 'Glock 18', cost: 400, mag: 20, res: 40, rate: 0.12, dmg: 26, rec: 0.7, auto: false, rt: 2.2, sl: 2 }, deagle: { name: 'Desert Eagle', cost: 650, mag: 7, res: 35, rate: 0.3, dmg: 62, rec: 2.2, auto: false, rt: 2.2, sl: 2 }, m3: { name: 'M3 Shotgun', cost: 1700, mag: 8, res: 32, rate: 0.9, dmg: 16, pel: 8, rec: 2, auto: false, rt: 2.6, sl: 1 }, mp5: { name: 'MP5', cost: 1500, mag: 30, res: 120, rate: 0.075, dmg: 20, rec: 0.7, auto: true, rt: 2.3, sl: 1 }, p90: { name: 'P90', cost: 2350, mag: 50, res: 100, rate: 0.07, dmg: 21, rec: 0.7, auto: true, rt: 3, sl: 1 }, rifle: { name: 'AK-47', cost: 2500, mag: 30, res: 90, rate: 0.1, dmg: 28, rec: 1, auto: true, rt: 2.4, sl: 1 }, m4: { name: 'M4A1', cost: 3100, mag: 30, res: 90, rate: 0.09, dmg: 25, rec: 0.8, auto: true, rt: 2.4, sl: 1 }, awp: { name: 'AWP', cost: 4750, mag: 10, res: 30, rate: 1.45, dmg: 115, rec: 2, auto: false, rt: 3.2, sl: 1 } };
for (const [k, t] of Object.entries({ pistol: 'pst', glock: 'pst', deagle: 'pst', m3: 'shl', mp5: 'smg', p90: 'smg', rifle: 'rif', m4: 'rif', awp: 'snp' })) {
  WPN[k].at = t;
}
export const DIFF = { easy: { n: 'Easy', acc: 0.7, react: 1.2, dmg: 0.7, spd: 0.9, hp: 1, cool: 1.3, fov: 0.8, mem: 1, hunt: 0.25 }, normal: { n: 'Normal', acc: 1.5, react: 0.8, dmg: 1.1, spd: 1.05, hp: 1, cool: 0.85, fov: 1.2, mem: 1.5, hunt: 0.45 }, hard: { n: 'Hard', acc: 2.2, react: 0.5, dmg: 1.4, spd: 1.2, hp: 1.3, cool: 0.7, fov: 1.8, mem: 2.2, hunt: 0.65 }, insane: { n: 'Insane', acc: 3, react: 0.25, dmg: 1.8, spd: 1.35, hp: 1.6, cool: 0.55, fov: 4, mem: 3, hunt: 0.85 } };
Object.assign(WPN, { scout: { name: 'Scout', cost: 2750, mag: 10, res: 30, rate: 1.25, dmg: 80, rec: 1.4, auto: false, rt: 2.8, sl: 1 }, svd: { name: 'SVD Dragunov', cost: 3500, mag: 10, res: 30, rate: 0.5, dmg: 70, rec: 1.6, auto: false, rt: 3, sl: 1 }, g3: { name: 'G3SG1', cost: 5000, mag: 20, res: 40, rate: 0.28, dmg: 58, rec: 1.3, auto: false, rt: 3.4, sl: 1 }, kar: { name: 'Kar98k', cost: 3000, mag: 5, res: 25, rate: 1.3, dmg: 105, rec: 1.8, auto: false, rt: 3.6, sl: 1 }, m82: { name: 'Barrett M82', cost: 6500, mag: 5, res: 15, rate: 0.95, dmg: 150, rec: 3, auto: false, rt: 4.2, sl: 1 } });
Object.assign(WPN.awp, { bolt: true, zoom: 20 });
Object.assign(WPN.scout, { bolt: true, zoom: 28 });
Object.assign(WPN.svd, { zoom: 24 });
Object.assign(WPN.g3, { zoom: 22 });
Object.assign(WPN.kar, { bolt: true, zoom: 26 });
Object.assign(WPN.m82, { zoom: 14 });
for (const k of ['awp', 'scout', 'svd', 'g3', 'kar', 'm82']) {
  WPN[k].snp = true;
  WPN[k].at = 'snp';
}
WPN.knife = { name: 'Knife', cost: 0, mag: 1, res: 0, rate: 0.5, dmg: 55, rec: 0, auto: true, rt: 0, sl: 3, melee: true, at: 'none' };
export const SHOP = [['Pistols', ['glock', 'deagle']], ['Shotguns', ['m3']], ['Sub-machine guns', ['mp5', 'p90']], ['Rifles', ['rifle', 'm4', 'awp']], ['Equipment', ['kev', 'he', 'fl', 'sm']]];
export const EQ = { kev: { name: 'Kevlar vest', cost: 650 }, he: { name: 'HE grenade', cost: 300 }, fl: { name: 'Flashbang', cost: 200 }, sm: { name: 'Smoke grenade', cost: 300 } };
export const LADDER = ['m3', 'mp5', 'p90', 'rifle', 'm4', 'awp', 'glock', 'deagle', 'pistol', 'knife'];
export const LW1 = ['pistol', 'glock', 'mp5', 'm3', 'rifle', 'deagle', 'mp5', 'scout'];
export const LW2 = ['m4', 'rifle', 'p90', 'awp', 'mp5', 'm3', 'deagle', 'm4', 'svd', 'kar', 'g3', 'm82', 'scout'];
