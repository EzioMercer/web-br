/** The inventory panel (Tab). */
export const inventory = {
  /** Open: the mouse drives an on-screen cursor instead of the view. */
  open: false,
  /** Cursor position (CSS px), kept between openings. Negative until first placed. */
  x: -1,
  y: 0,
  /** Optic slot being dragged (see `opticAt`), if any. */
  drag: null as string | null,
};
