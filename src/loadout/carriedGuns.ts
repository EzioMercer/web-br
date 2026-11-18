import { loadout } from './state';

/** Weapons carried, except the knife. */
export const carriedGuns = () => Object.keys(loadout.owned).filter(k => k !== 'knife');
