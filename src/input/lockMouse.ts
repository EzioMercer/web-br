import { glCanvas } from '../render/glCanvas';
import { setPlaying } from './setPlaying';
import { input } from './state';

// The game only runs while the mouse is locked (pointerlockchange -> setPlaying). If the browser refuses the lock
// (e.g. re-clicking right after Esc), the pause overlay stays up and the next click retries.
export const lockMouse = () => {
  const fail = (e: unknown) => {
    console.warn('Pointer lock refused:', (e instanceof Error && e.message) || e);

    if (!input.inMenu) {
      setPlaying(false);
    }
  };

  try {
    const p = glCanvas.requestPointerLock();

    if (p && p.catch) {
      p.catch(fail);
    }
  } catch (e) {
    fail(e);
  }
};
