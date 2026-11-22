/** Throw speed at full power (m/s). */
export const THROW_SPEED = 21;

/** Softest throw, as a share of full power: a toss of a few metres. */
export const MIN_THROW_POWER = 0.2;

/** Power change per mouse wheel notch while aiming a throw. */
export const THROW_POWER_STEP = 0.1;

/** A smoke grenade goes off once it has landed and slowed below this speed (m/s). */
export const SMOKE_SETTLE_SPEED = 0.3;

/** Puffs in a smoke cloud. */
export const SMOKE_PUFFS = 36;

/** Numbers stored per puff: home offset x, y, z, half-size, turn, spin, delay, shade. */
export const PUFF_STRIDE = 8;

/** How long the canister pours out new puffs (s); each then takes `SMOKE_SPREAD` to drift out to its place. */
export const SMOKE_POUR = 1.6;

export const SMOKE_SPREAD = 1.8;

/** Lifetime of a smoke cloud (s), and the fade at its end. */
export const SMOKE_LIFE = 16;

export const SMOKE_FADE = 3;

/** Radius of the cloud when fully out (m): it blocks sight within it, and the screen greys over inside it. */
export const SMOKE_RADIUS = 3.6;
