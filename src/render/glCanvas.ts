import { byId } from '../utils/byId';

/** The WebGL canvas. Replaced (see createRenderer) when antialiasing is switched, so read it at use. */
export let glCanvas = byId<HTMLCanvasElement>('c');

/** Puts a fresh canvas in place of the current one: a canvas keeps the context options it was first created with. */
export const replaceGlCanvas = () => {
  const c = document.createElement('canvas');

  c.id = glCanvas.id;
  glCanvas.replaceWith(c);
  glCanvas = c;
};
