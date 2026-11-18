import { rand } from './rand';

export const pick = <T>(a: T[]) => a[(rand() * a.length) | 0];
