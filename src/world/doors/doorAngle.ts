import { Axis } from '../../types';
import type { Door } from '../../types';

/** Yaw of door `d`'s pivot for its current open amount: the panel turns from the opening toward its side. */
export const doorAngle = (d: Door) => {
  const a = d.openAmount * d.maxOpen[d.side < 0 ? 0 : 1] * Math.PI / 2;
  const along = -d.hinge * Math.cos(a);
  const out = d.side * Math.sin(a);
  const dx = d.axis === Axis.X ? along : out;
  const dz = d.axis === Axis.X ? out : along;

  // a group's local +x points along (cos y, -sin y) in the x-z plane
  return Math.atan2(-dz, dx);
};
