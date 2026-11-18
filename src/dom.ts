/** Looks up a HUD element by id. The ids are all defined in index.html, so a miss is a bug. */
export const $ = (id: string): HTMLElement => {
  const el = document.getElementById(id);
  if (!el) {
    throw new Error(`Missing element #${id}`);
  }
  return el;
};

/** The WebGL canvas. */
export const cv = $('c') as HTMLCanvasElement;
