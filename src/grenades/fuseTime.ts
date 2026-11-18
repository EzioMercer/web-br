import type { GrenadeId } from '../types';

export const fuseTime = (t: GrenadeId) => {
  return t === 'sm' ? 1.3 : 1.6;
};
