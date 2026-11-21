import { GraphicsPreset, ShadowQuality, ViewDistance } from './types';
import type { GraphicsOptions, QualityTier } from './types';

/** The options each quality preset sets. */
export const TIERS: Record<QualityTier, GraphicsOptions> = {
  [GraphicsPreset.Low]: {
    resolution: 0.7,
    viewDistance: ViewDistance.Near,
    shadows: ShadowQuality.Off,
    antialias: false,
  },
  [GraphicsPreset.Medium]: {
    resolution: 0.85,
    viewDistance: ViewDistance.Medium,
    shadows: ShadowQuality.Low,
    antialias: true,
  },
  [GraphicsPreset.High]: {
    resolution: 1,
    viewDistance: ViewDistance.Far,
    shadows: ShadowQuality.High,
    antialias: true,
  },
};

/** Lowest first: Auto steps down this list when the frame rate stays low. */
export const TIER_ORDER: QualityTier[] = [GraphicsPreset.Low, GraphicsPreset.Medium, GraphicsPreset.High];

/** Fog start and end (m) for each view distance; nothing is drawn past the end. */
export const VIEW_DISTANCES: Record<ViewDistance, { near: number; far: number }> = {
  [ViewDistance.Near]: { near: 90, far: 420 },
  [ViewDistance.Medium]: { near: 130, far: 620 },
  [ViewDistance.Far]: { near: 160, far: 820 },
};

/** Shadow map size (texels) and the radius around the player (m) that gets shadows. */
export const SHADOW_SETTINGS: Record<Exclude<ShadowQuality, ShadowQuality.Off>, { size: number; radius: number }> = {
  [ShadowQuality.Low]: { size: 1024, radius: 40 },
  [ShadowQuality.High]: { size: 2048, radius: 70 },
};
