/** Looks up a HUD element by id. The ids are all defined in index.html, so a miss is a bug. */
export const byId = <T extends HTMLElement = HTMLElement>(id: string): T => {
  const el = document.getElementById(id);
  if (!el) {
    throw new Error(`Missing element #${id}`);
  }
  return el as T;
};

/** 2D context of a canvas (always available for a plain canvas). */
export const ctx2d = (c: HTMLCanvasElement) => c.getContext('2d')!;

/** The WebGL canvas. */
export const glCanvas = byId<HTMLCanvasElement>('c');
