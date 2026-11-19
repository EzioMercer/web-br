import { GrenadeId } from '../types';

export const GRENADE_NAMES: Record<GrenadeId, string> = {
  [GrenadeId.HighExplosive]: 'HE grenade',
  [GrenadeId.Flashbang]: 'Flashbang',
  [GrenadeId.Smoke]: 'Smoke grenade',
};

export const GRENADE_COLORS: Record<GrenadeId, number> = {
  [GrenadeId.HighExplosive]: 0x3c5a3a,
  [GrenadeId.Flashbang]: 0xd8d8d8,
  [GrenadeId.Smoke]: 0x7a8288,
};
