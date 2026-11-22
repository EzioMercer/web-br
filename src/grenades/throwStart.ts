import { player, playerBody } from '../player/state';
import { THROW_SPEED } from './constants';
import { grenadeThrow } from './state';
import type { GrenadeBody } from './types';

/**
 * Fills `o` with where a throw starts and how fast it goes. The direction follows the crosshair, tilted up about 10°
 * when looking level and less towards straight up or down (as Counter-Strike does), so a level throw arcs instead of
 * flying flat. The speed is the throw's strength. It starts at the hand (a little to the right and low, where the
 * grenade is held) and does not depend on how you are moving, so the preview is steady while you strafe.
 */
export const throwStart = (o: GrenadeBody) => {
  const sp = THROW_SPEED * grenadeThrow.strength;
  const a = player.pitch + 0.17 * (1 - Math.abs(player.pitch) / (Math.PI / 2));
  const ca = Math.cos(a);
  const cp = Math.cos(player.pitch);
  const sy = Math.sin(player.yaw);
  const cy = Math.cos(player.yaw);

  o.x = playerBody.x - sy * cp * 0.35 + cy * 0.22;
  o.y = playerBody.y + player.eyeHeight - 0.17 + Math.sin(player.pitch) * 0.3;
  o.z = playerBody.z - cy * cp * 0.35 - sy * 0.22;
  o.vx = -sy * ca * sp;
  o.vy = Math.sin(a) * sp;
  o.vz = -cy * ca * sp;
  return o;
};
