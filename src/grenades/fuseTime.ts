import { GrenadeId } from '../types';

/** Seconds from throw to detonation. A smoke grenade goes off as soon as it settles; this is only its upper limit. */
export const fuseTime = (t: GrenadeId) => {
  return t === GrenadeId.Smoke ? 6 : 1.8;
};
