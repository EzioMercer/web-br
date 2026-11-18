import { byId } from '../utils/byId';

/** Adds a line to the kill feed for 4 s. */

export const feedMessage = (t: string) => {
  const d = document.createElement('div');

  d.textContent = t;
  byId('kf').appendChild(d);
  setTimeout(() => d.remove(), 4000);
};
