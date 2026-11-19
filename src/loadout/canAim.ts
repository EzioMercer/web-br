import { loadout } from './state';

export const canAim = () => Boolean(loadout.weapon.sniper || !loadout.weapon.melee);
