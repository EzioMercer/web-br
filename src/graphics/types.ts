/** Graphics quality preset. Auto picks Low, Medium or High for the device; Custom uses the player's own options. */
export enum GraphicsPreset {
  Auto = 'auto',
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Custom = 'custom',
}

/** A preset Auto can pick. */
export type QualityTier = GraphicsPreset.Low | GraphicsPreset.Medium | GraphicsPreset.High;

/** How far the world is drawn before it fades into the fog. */
export enum ViewDistance {
  Near = 'near',
  Medium = 'medium',
  Far = 'far',
}

export enum ShadowQuality {
  Off = 'off',
  Low = 'low',
  High = 'high',
}

export type GraphicsOptions = {
  /** Render resolution as a fraction of the screen's (0.5..1). */
  resolution: number;
  viewDistance: ViewDistance;
  shadows: ShadowQuality;
  antialias: boolean;
};
