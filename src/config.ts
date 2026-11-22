/** Player collision radius (m). */
export const PLAYER_RADIUS = 0.4;

/** Standing player height (m). */
export const PLAYER_HEIGHT = 1.8;

/** Fixed simulation step (s). */
export const SIM_STEP = 1 / 120;

/** Mouse sensitivity in radians per pixel, before the user multiplier. */
export const MOUSE_SENS = 0.0021;

/** Default vertical field of view (degrees). */
export const BASE_FOV = 75;

/** Water level (m). */
export const WATER_LEVEL = 0;

/** Bots in a match. */
export const BOT_COUNT = 19;

/** Render layer of the first-person weapon, drawn after the world so it never sinks into walls. */
export const VIEWMODEL_LAYER = 1;

/** Spare optics the player can carry without a gun to put them on. */
export const OPTIC_BAG_SLOTS = 5;

/** Medkits and Kevlar vests the player can carry. */
export const MAX_MEDKITS = 3;

export const MAX_VESTS = 2;

/** Health a medkit gives back. */
export const MEDKIT_HEAL = 50;

/** Grenades of each kind the player can carry. */
export const MAX_GRENADES = 2;
