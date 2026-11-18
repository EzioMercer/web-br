import { loadout } from './state';

export const canAim = () => !!(loadout.weapon.sniper || !loadout.weapon.melee);
