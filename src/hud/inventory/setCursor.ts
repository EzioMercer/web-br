import { inventory } from './state';

/**
 * Turns the inventory cursor on or off. It starts in the middle of the panel; turning it off drops anything being
 * dragged back where it came from.
 */
export const setCursor = (on: boolean) => {
  if (on && !inventory.cursor) {
    const r = document.getElementById('inv')!.getBoundingClientRect();

    inventory.x = r.left + r.width / 2;
    inventory.y = r.top + Math.min(r.height / 2, 200);
  }

  inventory.cursor = on;

  if (!on) {
    inventory.drag = null;
  }
};
