import { GrenadeId } from '../types';

export const fuseTime = (t: GrenadeId) => {
  return t === GrenadeId.Smoke ? 1.3 : 1.6;
};
