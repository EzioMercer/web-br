import { zoneTick } from '../br/zone/zoneTick';
import { clock } from '../sim/state';
import { newMatch } from './newMatch';
import { match } from './state';

/** Advances the match: zone while live, the countdown before it, and the next match after it ends. */
export const matchTick = (dt: number) => {
  if (match.phase === 'live') {
    zoneTick(dt);
  } else if (match.phase === 'start') {
    if (clock.time >= match.phaseEnd) {
      match.phase = 'live';
    }
  } else if (clock.time >= match.phaseEnd) {
    newMatch();
  }
};
