import type { Body, Door } from '../../types';

/** If door `d` is closed, makes it swing open away from `who`. */
export const swingAwayFrom = (d: Door, who: Body) => {
  if (d.openAmount < 0.02) {
    const side = d.axis === 'x' ? Math.sign(who.z - d.z) || 1 : Math.sign(who.x - d.x) || 1;

    d.swingDir = d.axis === 'x' ? side : -side;
  }
};
