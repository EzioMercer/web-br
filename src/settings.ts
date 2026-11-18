import { DIFFICULTIES } from './weapons';
import type { Difficulty } from './types';

/** User settings, saved in localStorage. */
export const settings = {
  difficulty: DIFFICULTIES.normal as Difficulty,
  /** Mouse sensitivity multiplier. */
  sensitivity: 1,
  footstepVolume: 0.6,
};

const SAVE_KEY = 'web-br.settings';

export const loadSettings = () => {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY) || '{}') as { sens?: number; vol?: number; diff?: string };
    if (typeof s.sens === 'number') {
      settings.sensitivity = s.sens;
    }
    if (typeof s.vol === 'number') {
      settings.footstepVolume = s.vol;
    }
    if (s.diff && DIFFICULTIES[s.diff]) {
      settings.difficulty = DIFFICULTIES[s.diff];
    }
  } catch { /* Storage unavailable: keep the defaults. */ }
};

export const saveSettings = () => {
  try {
    const diff = Object.keys(DIFFICULTIES).find(k => DIFFICULTIES[k] === settings.difficulty);
    localStorage.setItem(SAVE_KEY, JSON.stringify({ sens: settings.sensitivity, vol: settings.footstepVolume, diff }));
  } catch { /* Storage unavailable: settings last for this page only. */ }
};
