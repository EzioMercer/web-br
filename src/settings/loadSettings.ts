import { DIFFICULTIES } from '../data/difficulties';
import { SAVE_KEY, settings } from './state';

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
