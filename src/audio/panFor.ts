import { bearingTo } from '../player/bearingTo';

/**
 * Stereo pan for a sound at (x, z): full right when it is to the player's right, centred ahead or behind. Kept short
 * of 1 so both ears still hear it, as with real hearing.
 */
export const panFor = (x: number, z: number) => Math.sin(bearingTo(x, z)) * 0.85;
