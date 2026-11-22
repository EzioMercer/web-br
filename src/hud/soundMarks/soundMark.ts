import { player } from '../../player/state';
import { settings } from '../../settings/state';
import { byId } from '../../utils/byId';
import { SOUND_MARK_LIFE, soundMarks } from './state';

/** More sounds at once than this replace the oldest mark. */
const POOL = 8;

const STEP_ICON = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M8.2 2.5c1.9 0 3 2.3 2.8 5.3-.1 2-1 3.5'
  + '-3 3.5S5 9.8 5 7.6C5 4.7 6.3 2.5 8.2 2.5zM5.3 12.6l5.3.4c.1 2-.9 3.4-2.7 3.4-1.7 0-2.7-1.4-2.6-3.8zM15.8 7.5c1.9'
  + ' 0 3.2 2.2 3.2 5.1 0 2.2-1 3.7-3 3.7s-2.9-1.5-3-3.5c-.2-3 .9-5.3 2.8-5.3zM13.4 18l5.3-.4c.1 2.4-.9 3.8-2.6 3.8-1.8'
  + ' 0-2.8-1.4-2.7-3.4z"/></svg>';

const SHOT_ICON = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 1l2.2 6.3L20.5 5l-3.3 5.6L23 12l-5.8 1.4'
  + 'L20.5 19l-6.3-2.3L12 23l-2.2-6.3L3.5 19l3.3-5.6L1 12l5.8-1.4L3.5 5l6.3 2.3z"/></svg>';

/**
 * Shows which way a sound at (x, z) came from, with a mark around the crosshair (`shot`: a gunshot, otherwise a
 * footstep), as loud as `strength` (0..1). The mark of the same source and kind moves rather than a new one being
 * added, so a running bot leaves one mark, not a trail.
 */
export const soundMark = (x: number, z: number, shot: boolean, strength: number, src: object | null) => {
  // nothing to turn towards once the player is out: the bots walking round the body would only clutter the screen
  if (!settings.soundMarks || player.dead) {
    return;
  }

  if (!soundMarks.length) {
    const box = byId('snd');

    for (let i = 0; i < POOL; i++) {
      const el = document.createElement('i');

      box.appendChild(el);
      soundMarks.push({ el, src: null, shot: false, x: 0, z: 0, age: SOUND_MARK_LIFE, strength: 0 });
    }
  }

  let m = soundMarks[0];

  for (const q of soundMarks) {
    if (src && q.src === src && q.shot === shot && q.age < SOUND_MARK_LIFE) {
      m = q;
      break;
    }

    if (q.age > m.age) {
      m = q;
    }
  }

  if (m.shot !== shot || !m.el.firstChild) {
    m.el.innerHTML = shot ? SHOT_ICON : STEP_ICON;
    m.el.className = shot ? 'shot' : '';
  }

  m.src = src;
  m.shot = shot;
  m.x = x;
  m.z = z;
  m.age = 0;
  m.strength = Math.max(0.6, Math.min(1, strength));
};
