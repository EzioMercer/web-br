import { DIFFICULTIES } from '../data/difficulties';
import type { Difficulty } from '../types';

/** User settings, saved in localStorage. */
export const settings = {
  difficulty: DIFFICULTIES.normal as Difficulty,
  /** Mouse sensitivity multiplier. */
  sensitivity: 1,
  footstepVolume: 0.6,
  /** Frame rate counter in the corner of the screen. */
  showFps: false,
  /** Frames per second at most (30 or 60), or 0 for as many as the browser gives (its screen's refresh rate). */
  fpsLimit: 0,
};

export const SAVE_KEY = 'web-br.settings';
