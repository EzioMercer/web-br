import { DIFFICULTIES } from '../data/difficulties';
import { SAVE_KEY, settings } from './state';

export const saveSettings = () => {
  try {
    const diff = Object.keys(DIFFICULTIES).find(k => DIFFICULTIES[k] === settings.difficulty);

    localStorage.setItem(SAVE_KEY, JSON.stringify({ sens: settings.sensitivity, vol: settings.footstepVolume, diff }));
  } catch { /* Storage unavailable: settings last for this page only. */ }
};
