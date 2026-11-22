/** The inventory panel (Tab). */
export const inventory = {
  open: false,
  /** Alt held with the panel open: the mouse drives an on-screen cursor instead of the view. */
  cursor: false,
  /** Cursor position (CSS px), kept between openings. Negative until first placed. */
  x: -1,
  y: 0,
  /** Slot whose item is being dragged (see `itemAt`), if any. */
  drag: null as string | null,
};
