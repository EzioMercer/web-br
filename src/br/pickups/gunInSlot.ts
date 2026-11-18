import { carriedGuns } from '../../loadout/carriedGuns';

/** The n-th gun carried. */
export const gunInSlot = (n: number) => {
  return carriedGuns()[n - 1];
};
