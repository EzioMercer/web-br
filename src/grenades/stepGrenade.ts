import { insideBox } from '../physics/insideBox';
import { floorY } from '../world/level/floorY';
import type { Grenade } from './types';

/** Moves a grenade one step, bouncing off walls and the floor. Returns true if it touched something. */
export const stepGrenade = (n: Omit<Grenade, 'type' | 'mesh' | 'fuseAt'>, dt: number) => {
  let fl = false;

  n.vy -= 18 * dt;

  let nx = n.x + n.vx * dt;

  if (insideBox(nx, n.y, n.z)) {
    n.vx *= -0.45;
    nx = n.x;
    fl = true;
  }

  n.x = nx;

  let nz = n.z + n.vz * dt;

  if (insideBox(n.x, n.y, nz)) {
    n.vz *= -0.45;
    nz = n.z;
    fl = true;
  }

  n.z = nz;

  let ny = n.y + n.vy * dt;

  if (ny < floorY(n.x, n.z) + 0.07 || insideBox(n.x, ny, n.z)) {
    n.vy *= -0.4;
    n.vx *= 0.8;
    n.vz *= 0.8;
    ny = Math.max(n.y, floorY(n.x, n.z) + 0.07);

    if (Math.abs(n.vy) < 0.5) {
      n.vy = 0;
    }

    fl = true;
  }

  n.y = ny;
  return fl;
};
