import { keys } from '../../input/state';
import { setCursor } from './setCursor';
import { inventory } from './state';

/**
 * Opens or closes the inventory. The mouse keeps turning the view until Alt is held (see `setCursor`), so opening it
 * with Alt already down brings the cursor up straight away.
 */
export const openInventory = (on: boolean) => {
  inventory.open = on;
  setCursor(Boolean(keys.AltLeft || keys.AltRight));
};
