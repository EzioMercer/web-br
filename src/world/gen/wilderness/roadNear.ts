import { gen } from '../state';

export const roadNear = (
  x: number,
  z: number,
) => gen.terrain.kind(x, z) === 6
  || gen.terrain.kind(x + 4, z) === 6
  || gen.terrain.kind(x - 4, z) === 6
  || gen.terrain.kind(x, z + 4) === 6
  || gen.terrain.kind(x, z - 4) === 6;
