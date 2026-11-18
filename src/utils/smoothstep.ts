export const smoothstep = (a: number, b: number, u: number) => {
  const x = Math.min(1, Math.max(0, (u - a) / (b - a)));

  return x * x * (3 - 2 * x);
};
