/**
 * A number in [0, 1) fixed by the point (x, z) and `salt`. Seeded like `rand`, but it does not use up `rand`'s
 * sequence, so details added with it (a tree's size, say) leave everything generated afterwards where it was.
 */
export const hashRand = (x: number, z: number, salt: number) => {
  let h = Math.imul(Math.round(x * 64) ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(Math.round(z * 64) + salt, 0xc2b2ae35);

  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d);
  h = Math.imul(h ^ (h >>> 12), 0x297a2d39);
  return ((h ^ (h >>> 15)) >>> 0) / 4294967296;
};
