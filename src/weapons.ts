import type { Difficulty, GrenadeId, OpticId, Weapon } from './types';

export interface Optic {
  n: string;
  /** Short name. */
  s: string;
  fov: number;
  sens: number;
}

export const OPT: Record<OpticId, Optic> = {
  rd: { n: 'Red dot sight', s: 'Red dot', fov: 60, sens: 0.85 },
  ho: { n: 'Holographic sight', s: 'Holo', fov: 56, sens: 0.8 },
  x2: { n: '2x scope', s: '2x', fov: 38, sens: 0.6 },
  x4: { n: '4x ACOG scope', s: '4x', fov: 22, sens: 0.4 },
};
export const OPTK: OpticId[] = ['rd', 'ho', 'x2', 'x4'];
export const NC: Record<GrenadeId, number> = { he: 0x3c5a3a, fl: 0xd8d8d8, sm: 0x7a8288 };

export const WPN: Record<string, Weapon> = {
  pistol: { name: 'USP', mag: 12, res: 36, rate: 0.17, dmg: 34, rec: 0.8, auto: false, rt: 1.9, sl: 2, at: 'pst' },
  glock: { name: 'Glock 18', mag: 20, res: 40, rate: 0.12, dmg: 26, rec: 0.7, auto: false, rt: 2.2, sl: 2, at: 'pst' },
  deagle: { name: 'Desert Eagle', mag: 7, res: 35, rate: 0.3, dmg: 62, rec: 2.2, auto: false, rt: 2.2, sl: 2, at: 'pst' },
  m3: { name: 'M3 Shotgun', mag: 8, res: 32, rate: 0.9, dmg: 16, pel: 8, rec: 2, auto: false, rt: 2.6, sl: 1, at: 'shl' },
  mp5: { name: 'MP5', mag: 30, res: 120, rate: 0.075, dmg: 20, rec: 0.7, auto: true, rt: 2.3, sl: 1, at: 'smg' },
  p90: { name: 'P90', mag: 50, res: 100, rate: 0.07, dmg: 21, rec: 0.7, auto: true, rt: 3, sl: 1, at: 'smg' },
  rifle: { name: 'AK-47', mag: 30, res: 90, rate: 0.1, dmg: 28, rec: 1, auto: true, rt: 2.4, sl: 1, at: 'rif' },
  m4: { name: 'M4A1', mag: 30, res: 90, rate: 0.09, dmg: 25, rec: 0.8, auto: true, rt: 2.4, sl: 1, at: 'rif' },
  awp: { name: 'AWP', mag: 10, res: 30, rate: 1.45, dmg: 115, rec: 2, auto: false, rt: 3.2, sl: 1, at: 'snp', bolt: true, zoom: 20, snp: true },
  scout: { name: 'Scout', mag: 10, res: 30, rate: 1.25, dmg: 80, rec: 1.4, auto: false, rt: 2.8, sl: 1, bolt: true, zoom: 28, snp: true, at: 'snp' },
  svd: { name: 'SVD Dragunov', mag: 10, res: 30, rate: 0.5, dmg: 70, rec: 1.6, auto: false, rt: 3, sl: 1, zoom: 24, snp: true, at: 'snp' },
  g3: { name: 'G3SG1', mag: 20, res: 40, rate: 0.28, dmg: 58, rec: 1.3, auto: false, rt: 3.4, sl: 1, zoom: 22, snp: true, at: 'snp' },
  kar: { name: 'Kar98k', mag: 5, res: 25, rate: 1.3, dmg: 105, rec: 1.8, auto: false, rt: 3.6, sl: 1, bolt: true, zoom: 26, snp: true, at: 'snp' },
  m82: { name: 'Barrett M82', mag: 5, res: 15, rate: 0.95, dmg: 150, rec: 3, auto: false, rt: 4.2, sl: 1, zoom: 14, snp: true, at: 'snp' },
  knife: { name: 'Knife', mag: 1, res: 0, rate: 0.5, dmg: 55, rec: 0, auto: true, rt: 0, sl: 3, melee: true, at: 'none' },
};

export const DIFF: Record<string, Difficulty> = {
  easy: { n: 'Easy', acc: 0.7, react: 1.2, dmg: 0.7, spd: 0.9, hp: 1, cool: 1.3, fov: 0.8, mem: 1 },
  normal: { n: 'Normal', acc: 1.5, react: 0.8, dmg: 1.1, spd: 1.05, hp: 1, cool: 0.85, fov: 1.2, mem: 1.5 },
  hard: { n: 'Hard', acc: 2.2, react: 0.5, dmg: 1.4, spd: 1.2, hp: 1.3, cool: 0.7, fov: 1.8, mem: 2.2 },
  insane: { n: 'Insane', acc: 3, react: 0.25, dmg: 1.8, spd: 1.35, hp: 1.6, cool: 0.55, fov: 4, mem: 3 },
};

/** Battle Royale loot tables (tier 1 and tier 2). */
export const LW1 = ['pistol', 'glock', 'mp5', 'm3', 'rifle', 'deagle', 'mp5', 'scout'];
export const LW2 = ['m4', 'rifle', 'p90', 'awp', 'mp5', 'm3', 'deagle', 'm4', 'svd', 'kar', 'g3', 'm82', 'scout'];
