/** Noise buffers by length and fade, a few variants each, rotated. */
const cache = new Map<string, { list: AudioBuffer[]; next: number }>();

/** Variants per length: repeats of one buffer would sound alike, a few rotated do not. */
const VARIANTS = 4;

/**
 * A buffer of `n` samples of white noise fading out as (1 - t)^`fade`. Made once per length and reused: filling a
 * new buffer for every shot and footstep cost time and memory.
 */
export const noiseBuffer = (ctx: AudioContext, n: number, fade: number) => {
  const k = n + ':' + fade;
  let c = cache.get(k);

  if (!c) {
    c = { list: [], next: 0 };
    cache.set(k, c);
  }

  if (c.list.length < VARIANTS) {
    const b = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = b.getChannelData(0);

    for (let i = 0; i < n; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, fade);
    }

    c.list.push(b);
    return b;
  }

  c.next = (c.next + 1) % VARIANTS;
  return c.list[c.next];
};
