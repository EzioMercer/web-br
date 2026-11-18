import { rand } from './rand';

export const randRange = (a: number, b: number) => a + rand() * (b - a);
