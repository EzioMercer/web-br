import { DIFFICULTIES } from '../data/difficulties';
import type { Difficulty } from '../types';

/** User settings, saved in localStorage. */
export const settings = {
  difficulty: DIFFICULTIES.normal as Difficulty,
  /** Mouse sensitivity multiplier. */
  sensitivity: 1,
  footstepVolume: 0.6,
};

export const SAVE_KEY = 'web-br.settings';
