import { player } from './state';
import type { Vec3 } from '../types';

/** Unit vector the player is looking along. */
export const viewDir = (): Vec3 => {
  const cp = Math.cos(player.pitch);

  return [-Math.sin(player.yaw) * cp, Math.sin(player.pitch), -Math.cos(player.yaw) * cp];
};
