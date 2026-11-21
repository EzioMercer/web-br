import { graphics } from './state';
import { TIERS } from './tiers';
import { GraphicsPreset } from './types';
import type { GraphicsOptions } from './types';

/** The graphics options in effect for the selected preset. */
export const currentOptions = (): GraphicsOptions => {
  switch (graphics.preset) {
    case GraphicsPreset.Auto:
      return TIERS[graphics.autoTier];

    case GraphicsPreset.Custom:
      return graphics.custom;

    default:
      return TIERS[graphics.preset];
  }
};
