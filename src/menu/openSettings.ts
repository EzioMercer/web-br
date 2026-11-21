import { byId } from '../utils/byId';
import { showGpu } from './showGpu';

export const openSettings = (v: boolean) => {
  if (v) {
    showGpu();
  }

  byId('settings').classList.toggle('on', v);
};
