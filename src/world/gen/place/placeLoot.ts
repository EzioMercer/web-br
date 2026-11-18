import { gen } from '../state';

export const placeLoot = (x: number, z: number, y: number, t?: number) => gen.loot.push([x, z, y, t || 1]);
