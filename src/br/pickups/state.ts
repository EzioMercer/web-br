import type { Pickup } from '../../types';

export const pickups: Pickup[] = [];

/** The pickup E would swap for. */
export const looting = {
  swapTarget: null as Pickup | null,
  /** Pickup or door prompt for the HUD. */
  prompt: '',
};
