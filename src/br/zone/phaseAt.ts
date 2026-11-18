import { schedule } from './state';
import type { Circle } from '../../types';
import type { ZonePhase } from './types';

export const phaseAt = (t: number): { phase: ZonePhase; stage: number; timeLeft: number; next: Circle | null } => {
  let acc = 0;

  for (let i = 0; i < schedule.stages.length; i++) {
    const q = schedule.stages[i];

    if (t < acc + q.hold) {
      return { phase: 'hold', stage: i + 1, timeLeft: acc + q.hold - t, next: q.to };
    }

    if (t < acc + q.hold + q.shrink) {
      return { phase: 'shrink', stage: i + 1, timeLeft: acc + q.hold + q.shrink - t, next: q.to };
    }

    acc += q.hold + q.shrink;
  }

  return { phase: 'final', stage: schedule.stages.length, timeLeft: 0, next: null };
};
