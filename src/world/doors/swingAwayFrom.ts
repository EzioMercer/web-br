import { Axis } from '../../types';
import type { Body, Door } from '../../types';

/** If door `d` is closed, makes it swing open away from `who`, unless only the other side has room for it. */
export const swingAwayFrom = (d: Door, who: Body) => {
  if (d.openAmount < 0.02) {
    const away = -(Math.sign(d.axis === Axis.X ? who.z - d.z : who.x - d.x) || 1);
    const room = d.maxOpen[away < 0 ? 0 : 1];
    const otherRoom = d.maxOpen[away < 0 ? 1 : 0];

    d.side = room >= 0.95 || room >= otherRoom ? away : -away;
  }
};
