import type { Pickup } from '../../types';

export const pickups: Pickup[] = [];

/** The pickup E would swap for, and the dropped pickup E would pick up. */
export const looting = {
  swapTarget: null as Pickup | null,
  takeTarget: null as Pickup | null,
  /** Pickup or door prompt for the HUD. */
  prompt: '',
};
