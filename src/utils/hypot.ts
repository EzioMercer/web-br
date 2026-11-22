/**
 * Length of (x, y, z): Math.hypot without its cost. Chrome's Math.hypot allocates on every call, and the
 * simulation calls it thousands of times a second, which made the garbage collector run every couple of seconds.
 */
export const hypot = (x: number, y: number, z = 0) => Math.sqrt(x * x + y * y + z * z);
