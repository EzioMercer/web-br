import { bearingTo } from '../../player/bearingTo';
import { writeDom } from '../../utils/dom/writeDom';
import { SHOT_MARK_RADIUS, SOUND_MARK_LIFE, SOUND_MARK_RADIUS, soundMarks } from './state';

/**
 * Ages the sound marks and turns each one towards its sound, so it stays right as the player turns. A mark stays
 * bright for the first part of its life, then fades out.
 */
export const drawSoundMarks = (dt: number) => {
  for (const m of soundMarks) {
    if (m.age >= SOUND_MARK_LIFE) {
      writeDom(m.el, 'opacity', '0');
      continue;
    }

    m.age += dt;

    const t = m.age / SOUND_MARK_LIFE;
    const deg = Math.round(bearingTo(m.x, m.z) * 57.2958);

    writeDom(m.el, 'opacity', t >= 1 ? '0' : (m.strength * Math.min(1, (1 - t) * 2.2)).toFixed(2));
    writeDom(
      m.el,
      'transform',
      'rotate(' + deg + 'deg) translateY(-' + (m.shot ? SHOT_MARK_RADIUS : SOUND_MARK_RADIUS) + 'px)',
    );
  }
};
