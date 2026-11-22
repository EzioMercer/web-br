import type { Body, Velocity } from '../types';

/** Health, armor, view angles and recoil of the player. */
export const player = {
  health: 100,
  armor: 0,
  dead: false,
  yaw: 0,
  pitch: 0,
  /** Current eye height (m), eased between standing, crouching and sliding. */
  eyeHeight: 1.62,
  /** Recoil offsets added to the view. */
  recoilPitch: 0,
  recoilYaw: 0,
};

/** The player's body (feet position) and velocity. */
export const playerBody: Required<Body> = { x: 0, y: 0, z: 26, onGround: true, height: 1.8 };

export const playerVel: Velocity = { x: 0, y: 0, z: 0 };

/** Medkits and Kevlar vests carried: picked up by walking over them, used with 7 and 8 or a click in the inventory. */
export const supplies = { medkits: 0, vests: 0 };
