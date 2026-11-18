import { byId } from '../utils/byId';

export const openSettings = (v: boolean) => {
  byId('settings').classList.toggle('on', v);
};
