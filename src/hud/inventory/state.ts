/** The inventory panel (Tab). */
export const inventory = {
  open: false,
  /** Ctrl held with the panel open: the mouse drives an on-screen cursor instead of the view. */
  cursor: false,
  /** Cursor position (CSS px). */
  x: 0,
  y: 0,
  /** Optic slot being dragged (see `opticAt`), if any. */
  drag: null as string | null,
};
