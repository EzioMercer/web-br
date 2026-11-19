import { placeBox } from '../place/placeBox';
import { placeDoor } from '../place/placeDoor';
import { placeGlass } from '../place/placeGlass';
import { Axis } from '../../../types';
import { OpeningType } from '../types';
import type { Opening } from '../types';

/** Wall along `ax` at coordinate `c`, from `a` to `b`, with openings cut out of it. */
export const wall = (
  ax: Axis,
  c: number,
  a: number,
  b: number,
  Y: number,
  h: number,
  col: number,
  opsIn?: Opening[],
  thIn?: number,
) => {
  const th = thIn || 0.4;
  const ops = (opsIn || []).slice().sort((p, q) => p.center - q.center);
  let q = a;

  const seg = (u: number, v: number, yy: number, hh: number) => {
    if (v - u < 0.06 || hh < 0.05) {
      return;
    }

    const m = (u + v) / 2;
    const l = v - u;

    if (ax === Axis.X) {
      placeBox(m, c, l, th, hh, col, yy);
    } else {
      placeBox(c, m, th, l, hh, col, yy);
    }
  };

  for (const o of ops) {
    const u = o.center - o.width / 2;
    const v = o.center + o.width / 2;

    seg(q, u, Y, h);

    if (o.type === OpeningType.Window) {
      const s = o.sill ?? 0.9;
      const tp = o.top ?? 2.3;

      seg(u, v, Y, s);
      seg(u, v, Y + tp, h - tp);
      placeGlass(ax, c, o.center, o.width, Y + s, tp - s);
    } else {
      const dh = o.doorHeight ?? 2.3;

      seg(u, v, Y + dh, h - dh);

      if (o.type === OpeningType.Door) {
        placeDoor(ax, c, o.center, o.width, Y, dh, o.color);
      }
    }

    q = v;
  }

  seg(q, b, Y, h);
};
