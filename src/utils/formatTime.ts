import { pad2 } from './pad2';

/** Seconds as m:ss. */
export const formatTime = (s: number) => {
  const v = Math.max(0, Math.ceil(s));

  return Math.floor(v / 60) + ':' + pad2(v % 60);
};
