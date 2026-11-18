import { phaseAt } from './phaseAt';
import { zone } from './state';

export const applyZonePhase = (t: number) => {
  const zp = phaseAt(t);

  zone.phase = zp.phase;
  zone.stage = zp.stage;
  zone.timeLeft = zp.timeLeft;
  zone.next = zp.next;
};
