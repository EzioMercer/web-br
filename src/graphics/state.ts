import { TIERS } from './tiers';
import { GraphicsPreset } from './types';
import type { GraphicsOptions, QualityTier } from './types';

/** Graphics settings (saved with the other settings) and what Auto detected for this device. */
export const graphics = {
  preset: GraphicsPreset.Auto as GraphicsPreset,
  /** The player's own options, used by the Custom preset. */
  custom: { ...TIERS[GraphicsPreset.High] } as GraphicsOptions,
  /** The tier Auto uses: the device guess, lowered in game if the frame rate stays low. */
  autoTier: GraphicsPreset.Medium as QualityTier,
};
