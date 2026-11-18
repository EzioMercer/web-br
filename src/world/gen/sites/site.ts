import { SITES } from '../../terrain/constants';

/** Site by name, with its ground height (set by `genTerrain`). */
export const site = (n: string) => {
  const s = SITES.find(q => q.name === n)!;

  return { ...s, groundY: s.groundY! };
};
