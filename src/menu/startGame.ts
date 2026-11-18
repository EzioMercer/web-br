import { unlockAudio } from '../audio/unlockAudio';
import { lockMouse } from '../input/lockMouse';
import { input } from '../input/state';
import { startMatch } from '../match/startMatch';
import { byId } from '../utils/byId';
import { openSettings } from './openSettings';

export const startGame = () => {
  openSettings(false);
  startMatch();
  input.inMenu = false;
  byId('menu').style.display = 'none';
  unlockAudio();
  lockMouse();
};
