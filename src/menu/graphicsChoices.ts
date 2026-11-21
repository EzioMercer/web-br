import { GraphicsPreset, ShadowQuality, ViewDistance } from '../graphics/types';

/** Buttons of the Graphics tab: value and label. */
export const PRESET_CHOICES: [GraphicsPreset, string][] = [
  [GraphicsPreset.Auto, 'Auto'],
  [GraphicsPreset.Low, 'Low'],
  [GraphicsPreset.Medium, 'Medium'],
  [GraphicsPreset.High, 'High'],
  [GraphicsPreset.Custom, 'Custom'],
];

export const VIEW_CHOICES: [ViewDistance, string][] = [
  [ViewDistance.Near, 'Near'],
  [ViewDistance.Medium, 'Medium'],
  [ViewDistance.Far, 'Far'],
];

export const SHADOW_CHOICES: [ShadowQuality, string][] = [
  [ShadowQuality.Off, 'Off'],
  [ShadowQuality.Low, 'Low'],
  [ShadowQuality.High, 'High'],
];

export const ANTIALIAS_CHOICES: [boolean, string][] = [
  [false, 'Off'],
  [true, 'On'],
];
