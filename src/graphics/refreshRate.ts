import { input } from '../input/state';

/** Frame intervals (ms) measured in the menu, where nothing heavy is drawn. */
const intervals: number[] = [];

let last = 0;

let rate = 0;

/**
 * Notes a frame of the render loop at `now`. In the menu frames come as fast as the browser allows, so their rate is
 * the most frames per second the game can show on this screen.
 */
export const noteFrame = (now: number) => {
  const dt = now - last;

  last = now;

  if (!input.inMenu || dt <= 0 || dt > 100) {
    return;
  }

  intervals.push(dt);

  if (intervals.length >= 120) {
    const s = [...intervals].sort((a, b) => a - b);

    rate = Math.round(1000 / s[s.length >> 1]);
    intervals.length = 0;
  }
};

/** Frames per second the browser gives the game (its screen's refresh rate), 0 until measured. */
export const refreshRate = () => rate;
