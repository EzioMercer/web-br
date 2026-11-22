/** Angle `a` (rad) brought into -pi..pi, so a difference of two headings is the shorter way round. */
export const wrapAngle = (a: number) => a - 2 * Math.PI * Math.round(a / (2 * Math.PI));
