import { WEAPONS } from '../data/weapons';
import { player } from '../player/state';
import { clock } from '../sim/state';
import { loadout } from './state';
import { loadAmmo } from './loadAmmo';
import { stashAmmo } from './stashAmmo';
import type { WeaponId } from '../types';

export const switchWeapon = (id: WeaponId) => {
  if (!loadout.owned[id] || id === loadout.weaponId || player.dead) {
    return;
  }

  stashAmmo();
  loadout.weaponId = id;
  loadout.weapon = WEAPONS[id];
  loadAmmo(id);
  loadout.grenade = null;
  loadout.reloading = false;
  loadout.scoped = false;
  loadout.nextShotAt = Math.max(clock.time + 0.4, WEAPONS[id].boltAction ? loadout.boltCycleEnd : 0);
};
