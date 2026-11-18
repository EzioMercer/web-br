import { setPlaying } from '../input/setPlaying';
import { input } from '../input/state';
import { byId } from '../utils/byId';

export const showMenu = () => {
  input.inMenu = true;
  setPlaying(false);
  byId('menu').style.display = 'flex';
};
