import { audio } from './state';

/** Creates the audio context on first use and resumes it (browsers start it suspended until a click). */
export const unlockAudio = () => {
  if (!audio.ctx) {
    try {
      audio.ctx = new (window.AudioContext
        || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    } catch { /* No Web Audio: the game runs silently. */ }
  }

  if (audio.ctx && audio.ctx.state === 'suspended') {
    audio.ctx.resume();
  }
};
