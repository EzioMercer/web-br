import { randRange } from './randRange';

export const randInt = (a: number, b: number) => Math.floor(randRange(a, b + 1));
