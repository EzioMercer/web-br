import { player, playerBody } from './state';
import type { Vec3 } from '../types';

/** The player's eye position. */
export const eyePos = (): Vec3 => [playerBody.x, playerBody.y + player.eyeHeight, playerBody.z];
