import { input } from '../input/state';
import { settings } from '../settings/state';
import { byId } from '../utils/byId';
import { writeDom } from '../utils/dom/writeDom';

/** How often the counter refreshes (ms): every frame would be unreadable and rewrite the page each frame. */
const REFRESH = 500;

let since = 0;

let frames = 0;

/** Longest frame since the last refresh (ms). */
let worst = 0;

let last = 0;

/** The frame rate counter (Settings → Graphics → Show FPS): frames per second, average and longest frame time. */
export const updateFps = (now: number) => {
  const el = byId('fps');
  const on = settings.showFps && !input.inMenu;

  el.classList.toggle('on', on);

  const dt = now - last;

  last = now;

  if (!on) {
    since = now;
    frames = 0;
    worst = 0;
    return;
  }

  frames++;
  worst = Math.max(worst, dt);

  if (now - since < REFRESH) {
    return;
  }

  const fps = frames * 1000 / (now - since);

  writeDom(el, 'text', Math.round(fps) + ' FPS · ' + (1000 / fps).toFixed(1) + ' ms · max ' + worst.toFixed(0) + ' ms');
  since = now;
  frames = 0;
  worst = 0;
};
