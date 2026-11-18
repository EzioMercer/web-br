export const makeNoise = (seed: number) => {
  const hash = (i: number, j: number) => {
    let h = Math.imul(i, 374761393) ^ Math.imul(j, 668265263) ^ Math.imul(seed, 1274126177);

    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };

  const smooth = (t: number) => t * t * (3 - 2 * t);

  const n2 = (x: number, y: number) => {
    const i = Math.floor(x);
    const j = Math.floor(y);
    const u = smooth(x - i);
    const v = smooth(y - j);
    const a = hash(i, j);
    const b = hash(i + 1, j);
    const c = hash(i, j + 1);
    const d = hash(i + 1, j + 1);

    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };

  const fbm = (x: number, y: number, o: number) => {
    let s = 0;
    let a = 0.5;
    let f = 1;
    let t = 0;

    for (let k = 0; k < o; k++) {
      s += a * n2(x * f, y * f);
      t += a;
      a *= 0.5;
      f *= 2.03;
    }

    return s / t;
  };

  return { n2, fbm };
};
