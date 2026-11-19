import { OpticId } from '../types';

interface Optic {
  name: string;
  /** Short name. */
  shortName: string;
  fov: number;
  sensitivity: number;
}

export const OPTICS: Record<OpticId, Optic> = {
  [OpticId.RedDot]: { name: 'Red dot sight', shortName: 'Red dot', fov: 60, sensitivity: 0.85 },
  [OpticId.Holographic]: { name: 'Holographic sight', shortName: 'Holo', fov: 56, sensitivity: 0.8 },
  [OpticId.Scope2x]: { name: '2x scope', shortName: '2x', fov: 38, sensitivity: 0.6 },
  [OpticId.Scope4x]: { name: '4x ACOG scope', shortName: '4x', fov: 22, sensitivity: 0.4 },
};

export const OPTIC_IDS: OpticId[] = [OpticId.RedDot, OpticId.Holographic, OpticId.Scope2x, OpticId.Scope4x];
