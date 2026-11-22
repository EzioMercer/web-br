/**
 * The `data-<attr>` value of the inventory element under screen point (x, y), if any: `slot` for optic slots (keys
 * as in `opticAt`), `use` for medkits and vests.
 */
export const hitAt = (x: number, y: number, attr: 'slot' | 'use') => {
  for (const el of document.querySelectorAll<HTMLElement>('#inv [data-' + attr + ']')) {
    const r = el.getBoundingClientRect();

    if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
      return el.dataset[attr]!;
    }
  }

  return null;
};
