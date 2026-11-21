import { setPlaying } from '../input/setPlaying';
import { input } from '../input/state';
import { byId } from '../utils/byId';
import { offline } from '../offline/state';

export const showMenu = () => {
  // a new version arrived during the match: load it now
  if (offline.updateReady) {
    location.reload();
    return;
  }

  input.inMenu = true;
  setPlaying(false);
  byId('menu').style.display = 'flex';
};
