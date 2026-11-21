import { gpuName } from './gpuName';
import { isDedicatedGpu } from './isDedicatedGpu';
import { isSoftwareGpu } from './isSoftwareGpu';
import { GraphicsPreset } from './types';
import type { QualityTier } from './types';

/** Guesses the quality tier this device can run from its GPU name, CPU cores, memory and whether it is a phone. */
export const detectTier = (): QualityTier => {
  const gpu = gpuName().toLowerCase();
  const cores = navigator.hardwareConcurrency || 4;
  const memory = (navigator as { deviceMemory?: number }).deviceMemory ?? 8;
  const mobile = matchMedia('(pointer: coarse)').matches && navigator.maxTouchPoints > 0;

  // No GPU: the browser draws on the CPU.
  if (isSoftwareGpu(gpu)) {
    return GraphicsPreset.Low;
  }

  if (mobile) {
    // Recent high-end phone and tablet GPUs manage Medium; the rest stay on Low.
    const strong = /apple gpu|adreno.*\b(7[3-9]\d|8\d\d)\b|mali-g7[1-9]|immortalis|xclipse/.test(gpu);

    return strong && memory >= 4 ? GraphicsPreset.Medium : GraphicsPreset.Low;
  }

  if (cores <= 2 || memory <= 2) {
    return GraphicsPreset.Low;
  }

  // Dedicated graphics cards and Apple silicon.
  if (isDedicatedGpu(gpu)) {
    return GraphicsPreset.High;
  }

  // Integrated graphics (Intel, AMD APUs) or a GPU the browser does not name.
  return GraphicsPreset.Medium;
};
