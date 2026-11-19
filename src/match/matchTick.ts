import { zoneTick } from '../br/zone/zoneTick';
import { clock } from '../sim/state';
import { newMatch } from './newMatch';
import { match } from './state';
import { Phase } from '../types';

/** Advances the match: zone while live, the countdown before it, and the next match after it ends. */
export const matchTick = (dt: number) => {
  if (match.phase === Phase.Live) {
    zoneTick(dt);
  } else if (match.phase === Phase.Start) {
    if (clock.time >= match.phaseEnd) {
      match.phase = Phase.Live;
    }
  } else if (clock.time >= match.phaseEnd) {
    newMatch();
  }
};
