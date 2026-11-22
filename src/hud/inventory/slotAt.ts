/** The inventory slot (its `data-slot` key, as in `itemAt`) under screen point (x, y), if any. */
export const slotAt = (x: number, y: number) => {
  for (const el of document.querySelectorAll<HTMLElement>('#inv [data-slot]')) {
    const r = el.getBoundingClientRect();

    if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
      return el.dataset.slot!;
    }
  }

  return null;
};
