import type { Face } from '../../types';
import type { genWorld } from './genWorld';

/** Wall opening centred at `center` along the wall, `width` wide. */
export interface Opening {
  center: number;
  width: number;
  type: 'door' | 'window' | 'gate';
  /** Window sill height. */
  sill?: number;
  /** Window top height. */
  top?: number;
  /** Door (or gate) height. */
  doorHeight?: number;
  color?: number;
}

/** Window style for the walls of a shell. */
export interface ShellWindow {
  width: number;
  sill: number;
  top: number;
}

/** Optional building parameters. */
export interface BuildOpts {
  color?: number;
  roofColor?: number;
  /** Loot tier. */
  tier?: number;
  height?: number;
  /** Gate width and height. */
  gateWidth?: number;
  gateHeight?: number;
  /** Outer size of a tower. */
  size?: number;
  face?: Face;
  /** Footprint kind. */
  footprintKind?: string;
}

export type GeneratedWorld = ReturnType<typeof genWorld>;
