import { SOUND_MARK_LIFE, soundMarks } from './state';

/** Hides every sound mark at once (a new round: the last round's sounds are gone). */
export const clearSoundMarks = () => {
  for (const m of soundMarks) {
    m.age = SOUND_MARK_LIFE;
    m.src = null;
  }
};
