import { clock, slide } from './state';

/** The player is in a slide. */
export const isSliding = () => {
  return clock.time < slide.end;
};
