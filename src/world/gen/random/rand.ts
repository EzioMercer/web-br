import { gen } from '../state';

export const rand = () => {
  gen.seed = (Math.imul(gen.seed, 1664525) + 1013904223) >>> 0;
  return gen.seed / 4294967296;
};
