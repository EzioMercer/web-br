import { player, playerBody } from '../player/state';
import { grenadeThrow } from './state';

// the throw starts at the hand (a little to the right and low, where the grenade is held) and does not depend on how
// you are moving, so the preview is steady while you strafe
export const throwStart = () => {
  const sp = grenadeThrow.lob ? 8 : 15;
  const cp = Math.cos(player.pitch);
  const sy = Math.sin(player.yaw);
  const cy = Math.cos(player.yaw);
  const d = [-sy * cp, Math.sin(player.pitch) + 0.2, -cy * cp];

  return {
    x: playerBody.x - sy * cp * 0.35 + cy * 0.22,
    y: playerBody.y + player.eyeHeight - 0.17 + Math.sin(player.pitch) * 0.3,
    z: playerBody.z - cy * cp * 0.35 - sy * 0.22,
    vx: d[0] * sp,
    vy: d[1] * sp,
    vz: d[2] * sp,
  };
};
