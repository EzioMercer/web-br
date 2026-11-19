import { ZonePhase } from './types';
import type { Circle, ZoneStage } from '../../types';

/** The current safe zone, its schedule phase, stage number, seconds left in the phase and the next circle. */
export const zone: Circle & { phase: ZonePhase; stage: number; timeLeft: number; next: Circle | null } = {
  cx: 0,
  cz: 0,
  radius: 999,
  phase: ZonePhase.Final,
  stage: 0,
  timeLeft: 0,
  next: null,
};

/** Zone schedule of the current match and when it started. */
export const schedule = { startTime: 0, stages: [] as ZoneStage[] };
