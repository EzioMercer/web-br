import { DIFFICULTIES } from '../data/difficulties';
import { graphics } from '../graphics/state';
import { GraphicsPreset, ShadowQuality, ViewDistance } from '../graphics/types';
import type { GraphicsOptions } from '../graphics/types';
import { SAVE_KEY, settings } from './state';

type Saved = {
  sens?: number;
  vol?: number;
  diff?: string;
  gfx?: { preset?: string; custom?: Partial<GraphicsOptions> };
};

const isIn = <T extends string>(e: Record<string, T>, v: unknown): v is T => Object.values(e).includes(v as T);

export const loadSettings = () => {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY) || '{}') as Saved;

    if (typeof s.sens === 'number') {
      settings.sensitivity = s.sens;
    }

    if (typeof s.vol === 'number') {
      settings.footstepVolume = s.vol;
    }

    if (s.diff && DIFFICULTIES[s.diff]) {
      settings.difficulty = DIFFICULTIES[s.diff];
    }

    if (isIn(GraphicsPreset, s.gfx?.preset)) {
      graphics.preset = s.gfx.preset;
    }

    const c = s.gfx?.custom;

    if (c) {
      if (typeof c.resolution === 'number') {
        graphics.custom.resolution = Math.min(1, Math.max(0.5, c.resolution));
      }

      if (isIn(ViewDistance, c.viewDistance)) {
        graphics.custom.viewDistance = c.viewDistance;
      }

      if (isIn(ShadowQuality, c.shadows)) {
        graphics.custom.shadows = c.shadows;
      }

      if (typeof c.antialias === 'boolean') {
        graphics.custom.antialias = c.antialias;
      }
    }
  } catch { /* Storage unavailable: keep the defaults. */ }
};
