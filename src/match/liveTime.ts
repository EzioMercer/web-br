import { schedule } from '../br/zone/state';
import { clock } from '../sim/state';

/** Seconds since the current match went live (0 during the countdown). */
export const liveTime = () => schedule.startTime ? clock.time - schedule.startTime : 0;
