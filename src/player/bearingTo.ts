import { player, playerBody } from './state';

/** Direction of the point (x, z) from the player, in radians clockwise from where the player looks (0: ahead). */
export const bearingTo = (x: number, z: number) => Math.atan2(x - playerBody.x, -(z - playerBody.z)) + player.yaw;
